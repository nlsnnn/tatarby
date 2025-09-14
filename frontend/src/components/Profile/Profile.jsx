import Streak from '../Streak/Streak';
import styles from './Profile.module.css';

const Profile = () => {
    return (
        <main className={`${styles.profile} container`} aria-labelledby="profile-title">
            {/* HEADER */}
            <section className={styles.header}>
                <img
                    src="https://static10.tgstat.ru/channels/_0/d8/d8f773401c7296ec94e60fdeaf2be419.jpg"
                    alt="Аватар пользователя"
                    className={styles.avatar}
                />
                <h1 id="profile-title" className={styles.name}>Айнур Шамсутдинов</h1>
                <p className={styles.email}>ainur.shamsutdinov@example.com</p>
            </section>


            {/* STREAK */}
            <Streak />

            {/* ACHIEVEMENTS */}
            <section className={styles.achievements} aria-label="Достижения">
                <h2 className={styles.sectionTitle}>Мои достижения</h2>
                <div className={styles.cards}>
                    <article className={styles.card}>
                        <img
                            src="https://scpfoundation.net/local--files/-/users/gYp-yx9gn3-GAcUGdLDdBbwcNOkH0bWUE1scIp_bmM42jIUFUCM39kL676unI7GHmkefDk9J.jpg"
                            alt="Первый шаг"
                            className={styles.cardImage}
                        />
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>Первый шаг</h3>
                            <p className={styles.cardDesc}>Вы успешно завершили первую тренировку!</p>
                        </div>
                    </article>

                    <article className={styles.card}>
                        <img
                            src="https://i.ytimg.com/vi/-VsH0yII1nA/maxresdefault.jpg"
                            alt="Произношение+"
                            className={styles.cardImage}
                        />
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>Произношение+</h3>
                            <p className={styles.cardDesc}>100 слов произнесены правильно — отличный результат!</p>
                        </div>
                    </article>

                    <article className={styles.card}>
                        <img
                            src="https://cs11.pikabu.ru/post_img/2019/01/03/5/og_og_1546501999228960638.jpg"
                            alt="Живой диалог"
                            className={styles.cardImage}
                        />
                        <div className={styles.cardContent}>
                            <h3 className={styles.cardTitle}>Живой диалог</h3>
                            <p className={styles.cardDesc}>Вы прошли первый разговорный сценарий и держали ритм!</p>
                        </div>
                    </article>
                </div>
            </section>
        </main>
    );
};

export default Profile;