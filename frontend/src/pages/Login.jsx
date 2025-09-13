import { useStores } from "../stores/RootStoreContext.jsx";
import RepetPage from "./Repet.jsx";

export default function LoginPage() {
    const { token: { saveToken } } = useStores();

    const handleLogin = () => {
        // тут имитация логина
        saveToken("fake-jwt-token-with-role-admin");
    };

    return (
        <div>
            <h1>Логин</h1>
            <button onClick={handleLogin}>Войти</button>
        </div>
    );
}
