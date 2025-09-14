import aiohttp
import pandas as pd
from fastapi import HTTPException, UploadFile
from datasets import load_dataset
from gradio_client import Client
import re

from app.core.config import settings
from app.core.schemas.speech import RecognizeResponse

tat_ru = pd.read_excel(settings.datasets.tat_ru).to_dict(orient="records")
ru_tat = pd.read_excel(settings.datasets.ru_tat).to_dict(orient="records")

monocorpus = load_dataset(settings.hugging_face.monocorpus)["train"].select(
    range(15000)
)
parallel_corpus = load_dataset(settings.hugging_face.parallel_corpus)["train"].select(
    range(5000)
)

known_tatar_words = set()
for item in monocorpus:
    words = re.split(r"\W+", item["txt"].lower())
    known_tatar_words.update(word for word in words if word)
for item in parallel_corpus:
    words = re.split(r"\W+", item["tat"].lower())
    known_tatar_words.update(word for word in words if word)


def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


class SpeechService:
    @staticmethod
    async def recognize(file: UploadFile):
        audio = await file.read()
        data = await SpeechService._request(
            "post",
            url=settings.tat_soft.recognize_url,
            data={"file": audio},
            params={"model": "old_model", "punct_and_lang_models": "true"},
        )
        recognized_text = data.get("text", "")

        feedback, structure = SpeechService._parse_text(recognized_text)

        return RecognizeResponse(
            text=recognized_text, feedback=feedback, structure=structure
        )

    @staticmethod
    async def check_text(text: str):
        feedback, structure = SpeechService._parse_text(text)
        return RecognizeResponse(text=text, feedback=feedback, structure=structure)

    @staticmethod
    async def synthesize(text: str, speaker: str = "alsu"):
        try:
            data = await SpeechService._request(
                "get",
                settings.tat_soft.synthesize_url,
                params={"speaker": speaker, "text": text},
            )
            base64_audio = data.get("wav_base64")
            return {"audio": base64_audio}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    async def translate(text: str, direction: str = "rus2tat"):
        try:
            client = Client(settings.tat_soft.translate_url)
            translated = client.predict(
                lang=direction, text=text, api_name="/translate_interface"
            )
            verified = False
            for entry in parallel_corpus:
                if direction == "rus2tat" and entry["ru"].lower() == text.lower():
                    if entry["tat"].lower() == translated.lower():
                        verified = True
                    break
            return {"translated": translated, "verified": verified}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    def _parse_text(text: str):
        is_full_correct = False
        full_translation = ""
        for entry in parallel_corpus:
            if entry["tat"].lower() == text.lower():
                is_full_correct = True
                full_translation = entry["ru"]
                break
        if not is_full_correct:
            for item in monocorpus:
                if item["txt"].lower().strip() == text.lower().strip():
                    is_full_correct = True
                    break

        if is_full_correct:
            return (
                f"Фраза правильная! Перевод: {full_translation}"
                if full_translation
                else "Фраза правильная!",
                {
                    "sentence": [
                        {
                            "word": text,
                            "type": "Фраза",
                            "translation": full_translation,
                            "suffix": "",
                            "correct": True,
                        }
                    ]
                },
            )

        # Разбор по словам
        words = re.findall(r"\w+", text)
        feedback_parts = []
        structure = {"sentence": []}
        layout_map = {
            "э": "ә",
            "о": "ө",
            "у": "ү",
            "ы": "ы",
            "a": "а",
            "и": "и",
            "e": "ә",
            "я": "я",
            "х": "һ",
        }
        excluded_tags = ["<зоол.>", "<бот.>", "<муз.>", "<хим.>", "<физ.>", "<геол.>"]

        # Суффиксы
        pad_suffixes = [
            r"не$",
            r"ны$",
            r"га$",
            r"гә$",
            r"ка$",
            r"кә$",
            r"дан$",
            r"дән$",
            r"тан$",
            r"тән$",
            r"на$",
            r"нә$",
            r"да$",
            r"дә$",
            r"е$",
            r"ә$",
        ]
        plural_suffixes = [r"лар$", r"ләр$", r"нар$", r"нәр$"]
        verb_suffixes = [r"ам$", r"әм$", r"а$", r"ә$", r"ый$", r"и$", r"сың$", r"сең$"]
        poss_suffixes = [
            r"ым$",
            r"ем$",
            r"ы$",
            r"е$",
            r"ың$",
            r"ең$",
            r"ыбыз$",
            r"ебез$",
        ]
        suffixes = pad_suffixes + plural_suffixes + verb_suffixes + poss_suffixes

        num_errors = 0

        for word in words:
            original_word = word.lower()
            corrected_word = "".join(layout_map.get(c, c) for c in original_word)
            layout_error = original_word != corrected_word
            entry_match = None
            suffix = ""
            root = original_word

            # Приоритет: если полное слово в known_tatar_words
            found_full = (
                original_word in known_tatar_words
                or corrected_word in known_tatar_words
            )
            
            if found_full:
                # Попробуй найти перевод в словаре
                search_word = (
                    corrected_word
                    if corrected_word in known_tatar_words
                    else original_word
                )
                for entry in tat_ru:
                    if entry["Lexem"].lower() == search_word:
                        entry_match = entry
                        try:
                            if any(tag in entry_match["Comment"] for tag in excluded_tags):
                                entry_match = None
                        except Exception:
                            entry_match = entry
                        break
                type_ = entry_match["Comment"] if entry_match else "Слово из корпуса"
                translation = (
                    "Найдено в корпусе"
                    if not entry_match or isinstance(entry_match["Translation"], float)
                    else re.sub(
                        r'\[lang name="Tatar"\].*?\[/lang\]|Ex:.*|\(\<.*?\>\)|\{\{.*?\}\}|\d+\)',
                        "",
                        entry_match["Translation"],
                    )
                    .split("\n")[0]
                    .strip()
                )
                structure["sentence"].append(
                    {
                        "word": word,
                        "type": type_,
                        "translation": translation,
                        "suffix": "",
                        "correct": True,
                    }
                )
                if layout_error:
                    error_type = "раскладки"
                    structure["sentence"][-1]["type"] = f"Ошибка {error_type}"
                    structure["sentence"][-1]["correct"] = False
                    feedback_parts.append(
                        f"Ошибка {error_type} в '{word}': попробуй '{corrected_word}'."
                    )
                    num_errors += 1
                continue

            # Если не полное, разбирай суффикс на corrected_word
            root = corrected_word
            match = None
            for pat in suffixes:
                match = re.search(pat, root)
                if match:
                    suffix = match.group(0)
                    root = re.sub(pat, "", root)
                    break
            corrected_root = root
            found = False
            entry_match = None
            for entry in tat_ru:
                if corrected_root == entry["Lexem"].lower():
                    entry_match = entry
                    if any(tag in entry_match["Comment"] for tag in excluded_tags):
                        entry_match = None
                    else:
                        found = True
                    break

            # Для глаголов
            if (
                not found
                and suffix in verb_suffixes
                and root.endswith(("т", "р", "л", "н"))
            ):
                for verb_ending in ["у", "ы", "ү"]:
                    verb_root = root + verb_ending
                    for entry in tat_ru:
                        if verb_root == entry["Lexem"].lower():
                            entry_match = entry
                            if any(
                                tag in entry_match["Comment"] for tag in excluded_tags
                            ):
                                entry_match = None
                            else:
                                found = True
                            break
                    if found:
                        break

            if found:
                comment = re.sub(
                    r'\[lang name="Tatar"\].*?\[/lang\]', "", entry_match["Comment"]
                ).strip()
                translation = (
                    re.sub(
                        r'\[lang name="Tatar"\].*?\[/lang\]|Ex:.*|\(\<.*?\>\)|\{\{.*?\}\}|\d+\)',
                        "",
                        entry_match["Translation"],
                    )
                    .split("\n")[0]
                    .strip()
                )
                corrected_full = entry_match["Lexem"] + suffix
                structure["sentence"].append(
                    {
                        "word": word,
                        "type": comment,
                        "translation": translation,
                        "suffix": suffix if suffix else "Базовая форма",
                        "correct": True,
                    }
                )
                if layout_error:
                    error_type = "раскладки"
                    structure["sentence"][-1]["type"] = f"Ошибка {error_type}"
                    structure["sentence"][-1]["correct"] = False
                    feedback_parts.append(
                        f"Ошибка {error_type} в '{word}': попробуй '{corrected_full}'."
                    )
                    num_errors += 1
            else:
                # Опечатки с использованием known_tatar_words
                candidates = [
                    w
                    for w in known_tatar_words
                    if abs(len(w) - len(corrected_word)) <= 2
                ]
                if candidates:
                    closest = min(
                        candidates,
                        key=lambda w: levenshtein_distance(corrected_word, w),
                    )
                    distance = levenshtein_distance(corrected_word, closest)
                    if distance <= 1:  # Снижен порог для точности
                        error_type = "опечатки" if not layout_error else "раскладки"
                        num_errors += 1
                        structure["sentence"].append(
                            {
                                "word": word,
                                "type": f"Ошибка {error_type}",
                                "translation": "",
                                "suffix": "",
                                "correct": False,
                            }
                        )
                        feedback_parts.append(
                            f"В '{word}' ошибка {error_type}: попробуй '{closest}'."
                        )
                        continue

                num_errors += 1
                structure["sentence"].append(
                    {
                        "word": word,
                        "type": "Неизвестно",
                        "translation": "",
                        "suffix": suffix if suffix else "Базовая форма",
                        "correct": False,
                    }
                )
                feedback_parts.append(
                    f"'{word}' не похоже на татарское. Проверь или попробуй другое."
                )

        # Финальный feedback
        if not feedback_parts:
            feedback = "Отлично! Твоё предложение правильно."
        else:
            feedback = "\n".join(feedback_parts)
            if num_errors == len(words):
                feedback = (
                    "Это может быть не на татарском языке! Используй татарские слова и буквы, такие как ә, ө, ү, һ, ң, җ.\n"
                    + feedback
                )

        return feedback, structure

    @staticmethod
    def _explain_suffix(suffix: str) -> str:
        explanations = {
            "не": "Винительный падеж (төшем килеше) для прямого дополнения.",
            "ны": "Винительный падеж (төшем килеше) для прямого дополнения (твёрдый вариант).",
            "га": "Направительный падеж (күмәк килеше) для направления к чему-то (твёрдый).",
            "гә": "Направительный падеж (күмәк килеше) для направления (мягкий).",
            "дан": "Исходный падеж (чыгыш килеше) от чего-то (твёрдый).",
            "дән": "Исходный падеж (чыгыш килеше) от чего-то (мягкий).",
            "да": "Местный падеж (урнашу килеше) в/на/у (твёрдый).",
            "дә": "Местный падеж (урнашу килеше) в/на/у (мягкий).",
            "ам": "1-е лицо единственное число глагола (мин килеш).",
            "әм": "1-е лицо единственное число глагола (мин килеш, мягкий).",
            "лар": "Множественное число (күплек килеше).",
            "ләр": "Множественное число (күплек килеше, мягкий).",
            "нар": "Множественное число (күплек килеше).",
            "нәр": "Множественное число (күплек килеше, мягкий).",
            "ым": "Притяжательный суффикс 1-го лица (мин килеш).",
            "ем": "Притяжательный суффикс 1-го лица (мин килеш, мягкий).",
            "е": "Притяжательный или падежный суффикс (мягкий).",
            "ә": "Притяжательный или падежный суффикс (мягкий).",
        }
        return explanations.get(suffix, "Неизвестный суффикс. Проверь грамматику.")

    @staticmethod
    async def _request(method: str, url: str, params: dict = {}, data: dict = None):
        async with aiohttp.ClientSession() as session:
            async with session.request(
                method=method, url=url, params=params, data=data
            ) as response:
                return await response.json()
