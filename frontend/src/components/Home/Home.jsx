// Home.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.css';

const Home = () => {
    return (
        <main className={`${styles.home} container`} aria-labelledby="home-title">
            {/* HERO */}
            <section className={styles.hero}>
                <h1 id="home-title" className={styles.title}>
                    Современный тренажёр татарской речи
                </h1>

                <p className={styles.subtitle}>
                    Говорите свободно: наш веб-компаньон записывает вашу речь, анализирует произношение
                    и помогает отточить каждое слово. Простые шаги — заметный результат.
                </p>

                <div className={styles.actions}>
                    <Link
                        to="/repet"
                        className={`${styles.btnCustom} ${styles.primaryBtn}`}
                        aria-label="Попробовать"
                    >
                        Попробовать
                    </Link>
                </div>
            </section>

            {/* FEATURES */}
            <section className={styles.features} aria-label="Преимущества">
                <article className={styles.card}>
                    <div className={styles.cardHeader}>Анализ произношения</div>
                    <div className={styles.cardBody}>
                        Запишите речь и получите разбор: акценты, звуки, интонация.
                    </div>
                </article>

                <article className={styles.card}>
                    <div className={styles.cardHeader}>Персональные тренировки</div>
                    <div className={styles.cardBody}>
                        Алгоритм подбирает задания под ваш уровень и отслеживает прогресс.
                    </div>
                </article>

                <article className={styles.card}>
                    <div className={styles.cardHeader}>Интерактивная обратная связь</div>
                    <div className={styles.cardBody}>
                        Ошибки подсвечиваются прямо в упражнении, есть пошаговые советы.
                    </div>
                </article>
            </section>
        </main>
    );
};

export default Home;
