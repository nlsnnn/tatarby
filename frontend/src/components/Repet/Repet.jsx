import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import axios from "axios";
import styles from "./Repet.module.css";
import { useStores } from "../../stores/RootStoreContext.jsx";
import { apiSpeechUrl } from "../../constants.js";

// Тема + словарь примеров
const topics = [
    {
        id: 1,
        text: "Расскажите о своём любимом фильме и почему он вам нравится.",
        examples: [
            "Минем иң яраткан фильмым – 'Кавказ таулары'. Ул гаҗәеп матур һәм мавыктыргыч.",
            "Фильмда геройларның дуслыгы һәм мәхәббәте күңелгә якын.",
            "Мин киноны беренче тапкыр караганда бик тәэсирләндем."
        ]
    },
    {
        id: 2,
        text: "Поделитесь воспоминаниями о самом ярком событии этого года.",
        examples: [
            "Быел минем өчен иң истә калырлык вакыйга – җәйге лагерьга бару.",
            "Мин конкурсларда катнаштым һәм бүләкләр алдым.",
            "Шәһәрдә узган фестиваль миңа бик ошады."
        ]
    },
    {
        id: 3,
        text: "Опишите свой идеальный день от утра до вечера.",
        examples: [
            "Мин иртән уянам, кофе эчәм һәм китап укыйм.",
            "Көндез паркта йөрергә яратам.",
            "Кич белән дуслар белән очрашу – иң яхшы тәмамлану."
        ]
    },
    {
        id: 4,
        text: "Расскажите о хобби, которое вас полностью увлекает.",
        examples: [
            "Мин рәсем ясарга бик яратам.",
            "Гитарада уйнау минем өчен күңел ачу.",
            "Китап укудан мин һәрвакыт рәхәт алам."
        ]
    },
    {
        id: 5,
        text: "Какая книга или статья недавно произвела на вас впечатление?",
        examples: [
            "Мин 'Мәхәббәт һәм мәхрүмият' китабын укыдым, ул бик тәэсирле.",
            "Мәкаләдә табигатьне саклау турында сөйләнде.",
            "Китап геройлары миңа бик якын булды."
        ]
    }
];

const blobToDataURL = (blob) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

const formatTime = (sec = 0) => {
    if (!sec || isNaN(sec)) return "0:00";
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    const m = Math.floor(sec / 60);
    return `${m}:${s}`;
};

const Repet = observer(() => {
    const [input, setInput] = useState("");
    const [recording, setRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [loading, setLoading] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const timerRef = useRef(null);
    const { chat } = useStores();
    const chatEndRef = useRef(null);

    useEffect(() => {
        if (chat.messages.length === 0) {
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            chat.addBotMessage({ text: randomTopic.text, fromTopic: true, topicId: randomTopic.id });
        }
    }, [chat]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages.length]);

    // === Отправка текстового сообщения ===
    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const msg = chat.addMessage(input);
        setInput("");
        setLoading(true);

        try {
            const { data } = await axios.post(`${apiSpeechUrl}/check-text`, { text: msg.text });
            chat.addBotMessage(data);
        } catch (e) {
            chat.addBotMessage({ text: "Ошибка соединения с сервером." });
        } finally {
            setLoading(false);
        }
    };

    // === Генерация примеров по теме ===
    const handleExample = (topicId) => {
        const topic = topics.find((t) => t.id === topicId);
        if (topic) {
            topic.examples.forEach((ex) => {
                chat.addBotMessage({ text: ex });
            });
        }
    };

    // === Отправка голосового сообщения ===
    const handleAudioClick = async () => {
        if (!("mediaDevices" in navigator)) {
            alert("Ваш браузер не поддерживает запись аудио.");
            return;
        }

        if (recording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                streamRef.current = stream;
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (e) => {
                    if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    try {
                        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                        const dataUrl = await blobToDataURL(audioBlob);
                        chat.addMessage({ audio: dataUrl, text: "" });

                        setLoading(true);
                        const formData = new FormData();
                        formData.append("file", audioBlob, "voice.webm");

                        const { data } = await axios.post(`${apiSpeechUrl}/recognize`, formData, {
                            headers: { "Content-Type": "multipart/form-data" }
                        });
                        chat.addBotMessage(data);
                    } catch (e) {
                        chat.addBotMessage({ text: "Ошибка при обработке аудио." });
                    } finally {
                        setLoading(false);
                        streamRef.current?.getTracks()?.forEach((t) => t.stop());
                        setRecording(false);
                        setRecordTime(0);
                    }
                };

                mediaRecorderRef.current.start();
                setRecording(true);
                setRecordTime(0);

                timerRef.current = setInterval(() => {
                    setRecordTime((prev) => prev + 1);
                }, 1000);
            } catch (err) {
                console.error("Could not start audio recording:", err);
                alert("Не удалось получить доступ к микрофону.");
            }
        }
    };

    const startNewChat = () => {
        chat.clearChat();
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        chat.addBotMessage({ text: randomTopic.text, fromTopic: true, topicId: randomTopic.id });
    };

    return (
        <div className={styles.repetPage}>
            <div className={styles.chatContainer}>
                {chat.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${msg.type === "user" ? styles.userMsg : styles.botMsg}`}
                    >
                        {msg.text && <div className={styles.textBlock}>{msg.text}</div>}
                        {msg.audio && (
                            <div className={styles.audioMessage}>
                                <audio controls src={msg.audio} />
                            </div>
                        )}
                        {msg.feedback && <div className={styles.feedback}>{msg.feedback}</div>}

                        {msg.fromTopic && (
                            <button
                                className={styles.exampleBtn}
                                onClick={() => handleExample(msg.topicId)}
                            >
                                Например
                            </button>
                        )}
                    </div>
                ))}

                {/* === Индикатор загрузки === */}
                {loading && (
                    <div className={`${styles.message} ${styles.botMsg}`}>
                        <div className={styles.typing}>
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}

                <div ref={chatEndRef} />


                <div ref={chatEndRef} />
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    className={styles.chatInput}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={loading}
                />

                <button
                    className={styles.audioBtn}
                    onClick={handleAudioClick}
                    disabled={loading}
                >
                    {!recording ? (
                        <img className={styles.micro} src="/icons/mice.png" alt="mic" />
                    ) : "■"}
                </button>

                {recording && (
                    <div className={styles.recordTimer}>{formatTime(recordTime)}</div>
                )}

                <button
                    className={styles.sendBtn}
                    onClick={handleSend}
                    disabled={loading}
                >
                    {loading ? "Ждем ответ..." : "Отправить"}
                </button>

                <button className={styles.clearBtn} onClick={startNewChat}>
                    Новый чат
                </button>
            </div>
        </div>
    );
});

export default Repet;
