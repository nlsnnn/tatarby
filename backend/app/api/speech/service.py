import aiohttp
import pandas as pd
from fastapi import HTTPException, UploadFile
from datasets import load_dataset
from gradio_client.client import Client

from app.core.config import settings
from app.core.schemas.speech import RecognizeResponse


tat_ru = pd.read_excel(settings.datasets.tat_ru).to_dict(orient="records")
ru_tat = pd.read_excel(settings.datasets.ru_tat).to_dict(orient="records")

monocorpus = load_dataset(settings.hugging_face.monocorpus)["train"].select(range(1000))
parallel_corpus = load_dataset(settings.hugging_face.parallel_corpus)["train"].select(
    range(1000)
)


class SpeechService:
    @staticmethod
    async def recognize(file: UploadFile):
        try:
            audio = await file.read()
            data = await SpeechService._request(
                "post",
                url=settings.tat_soft.recognize_url,
                data={"file": audio},
            )
            recognized_text = data.get("text", "")

            feedback, structure = SpeechService._parse_text(recognized_text)
            print(f'{feedback=}, {structure=}')

            return RecognizeResponse(text=recognized_text, feedback=feedback, structure=structure)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        

    async def check_text(text: str):
        try:
            feedback, structure = SpeechService._parse_text(text)
            return RecognizeResponse(text=text, feedback=feedback, structure=structure)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        

    async def synthesize(text: str, speaker: str = "alsu"):
        try:
            data = await SpeechService._request("get", settings.tat_soft.synthesize_url, params={"speaker": speaker, "text": text})
            base64_audio = data.get("wav_base64")
            return {"audio": base64_audio}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


    async def translate(text: str, direction: str = "rus2tat"):
        try:
            client = Client(settings.tat_soft.translate_url)
            translated = client.predict(lang=direction, text=text, api_name="/translate_interface")
            return {"translated": translated}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        

    def _parse_text(text: str):
        words = text.split()
        feedback = []
        structure = {"sentence": []}    
        monocorpus_words = set(item["txt"].lower() for item in monocorpus)
        for word in words:
            found = False
            for entry in tat_ru:
                if word.lower() == entry["Lexem"].lower():
                    structure["sentence"].append(
                        {
                            "word": word,
                            "type": entry["Comment"],
                            "translation": entry["Translation"].replace("\n", ""),
                        }
                    )
                    found = True
                    break
            if not found:
                if word.lower() in monocorpus_words:
                    structure["sentence"].append(
                        {
                            "word": word,
                            "type": "слово",
                            "translation": "Найдено в корпусе",
                        }
                    )
                else:
                    feedback.append(f"Слово '{word}' не найдено. Проверь произношение.")

        for entry in parallel_corpus:
            if entry["tat"].lower() == text.lower():
                structure["sentence"].append(
                    {"word": text, "type": "фраза", "translation": entry["ru"]}
                )
                break

        if not feedback:
            feedback = ["Фраза корректна!"]
        return "; ".join(feedback), structure


    async def _request(method: str, url: str, params: dict = {}, data: dict = ()):
        async with aiohttp.ClientSession() as client:
            response = await client.request(
                method=method, url=url, params=params, data=data
            )
            data = await response.json()
            return data
