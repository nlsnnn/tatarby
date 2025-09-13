import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import styles from "./Repet.module.css";
import { useStores } from "../../stores/RootStoreContext.jsx";

const topics = [
    "Расскажите о своём любимом фильме и почему он вам нравится.",
    "Поделитесь воспоминаниями о самом ярком событии этого года.",
    "Опишите свой идеальный день от утра до вечера.",
    "Расскажите о хобби, которое вас полностью увлекает.",
    "Какая книга или статья недавно произвела на вас впечатление?"
];

const Repet = observer(() => {
    const [input, setInput] = useState("");
    const [recording, setRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const { chat } = useStores();
    const chatEndRef = useRef(null);

    // При монтировании добавляем начальную тему
    useEffect(() => {
        const randomTopic = topics[Math.floor(Math.random() * topics.length)];
        chat.addBotMessage(randomTopic);
    }, [chat]);

    // Скроллим к последнему сообщению
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat.messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        chat.addMessage(input);
        setInput("");
    };

    const handleAudioClick = async () => {
        if (recording) {
            // Останавливаем запись
            mediaRecorderRef.current.stop();
        } else {
            // Запрашиваем доступ к микрофону
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = e => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const audioUrl = URL.createObjectURL(audioBlob);

                // Добавляем сообщение с аудио
                chat.addMessage({
                    id: Date.now(),
                    type: "user",
                    audio: audioUrl,
                    text: "" // текст можно оставить пустым
                });

                setRecording(false);
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        }
    };

    return (
        <div className={styles.repetPage}>
            <div className={styles.chatContainer}>
                {chat.messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`${styles.message} ${
                            msg.type === "user" ? styles.userMsg : styles.botMsg
                        }`}
                    >
                        {msg.text && <span>{msg.text}</span>}
                        {msg.audio && (
                            <audio controls src={msg.audio} style={{ marginTop: "8px" }} />
                        )}
                    </div>
                ))}
                <div ref={chatEndRef}></div>
            </div>

            <div className={styles.inputContainer}>
                <input
                    type="text"
                    placeholder="Напишите сообщение..."
                    className={styles.chatInput}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button className={styles.audioBtn} onClick={handleAudioClick}>
                    {recording ? "Стоп" : <img className={styles.micro} src="/icons/mice.png" alt="micro"/>}
                </button>
                <button className={styles.sendBtn} onClick={handleSend}>
                    Отправить
                </button>
            </div>
        </div>
    );
});

export default Repet;
