import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./Translate.module.css";
import {apiSpeechUrl} from "../../constants.js";

const Translate = () => {
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState(() => {
        const saved = localStorage.getItem("translate_history");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (!input.trim()) {
            setOutput("");
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const { data } = await axios.post(`${apiSpeechUrl}/translate`, { text: input });
                setOutput(data.translated);

                const newRecord = { id: Date.now(), input, output: data.translated };
                const updatedHistory = [newRecord, ...history].slice(0, 10);
                setHistory(updatedHistory);
                localStorage.setItem("translate_history", JSON.stringify(updatedHistory));
            } catch (err) {
                console.error("Ошибка перевода:", err);
            } finally {
                setLoading(false);
            }
        }, 500); // debounce

        return () => clearTimeout(timer);
    }, [input]);

    const handleSpeak = async () => {
        if (!output) return;
        try {
            const { data } = await axios.post(`${apiSpeechUrl}/synthesize`, { text: output });
            if (data.audio) {
                const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
                audio.play();
            }
        } catch (err) {
            console.error("Ошибка озвучки:", err);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.translateBox}>
                <div className={styles.block}>
                    <div className={styles.label}>Русский</div>
                    <textarea
                        className={styles.input}
                        placeholder="Введите текст на русском..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>

                <div className={styles.block}>
                    <div className={styles.label}>Татарский</div>
                    <div className={styles.output}>
                        {loading ? "Переводим..." : output || "Здесь будет перевод"}
                        {output && (
                            <button className={styles.speakBtn} onClick={handleSpeak}>
                                🔊 Озвучить
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {history.length > 0 && (
                <div className={styles.history}>
                    <h3>История переводов</h3>
                    <ul>
                        {history.map((h) => (
                            <li key={h.id}>
                                <span className={styles.histInput}>{h.input}</span> →{" "}
                                <span className={styles.histOutput}>{h.output}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Translate;
