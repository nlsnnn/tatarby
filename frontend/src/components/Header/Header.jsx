import { useState } from "react";
import { Link } from "react-router-dom";  // 👈 импортируем Link
import styles from "./Header.module.css";

export default function Header() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.logo}>Тат-Укыту</div>

                <nav className={`${styles.nav} ${menuOpen ? styles.open : ""}`}>
                    <Link to="/" className={styles.link}>
                        Главная
                    </Link>
                    <Link to="/repet" className={styles.link}>
                        Репетитор
                    </Link>
                    <Link to="/translate" className={styles.link}>
                        Переводчик
                    </Link>
                    <Link to="/profile" className={styles.link}>
                        Профиль
                    </Link>
                </nav>

                <button
                    className={styles.burger}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Меню"
                >
                    <span className={styles.burgerLine}></span>
                    <span className={styles.burgerLine}></span>
                    <span className={styles.burgerLine}></span>
                </button>
            </div>
        </header>
    );
}
