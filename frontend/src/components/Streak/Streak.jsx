import styles from './Streak.module.css';

const Streak = () => {
    const days = Array(30).fill().map((_, index) => ({
        id: index,
        active: Math.random() > 0.3,
        date: new Date(Date.now() - (29 - index) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }));

    return (
        <section className={styles.streak} aria-label="Активность">
            <h2 className={styles.sectionTitle}>Моя активность</h2>
            <div className={styles.grid}>
                {days.map((day) => (
                    <div
                        key={day.id}
                        className={`${styles.day} ${day.active ? styles.active : ''}`}
                        title={day.date}
                    ></div>
                ))}
            </div>
        </section>
    );
};

export default Streak;