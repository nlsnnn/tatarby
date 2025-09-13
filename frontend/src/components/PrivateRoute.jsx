import { Navigate } from "react-router-dom";
import { useStores } from "../stores/RootStoreContext.jsx";

export default function PrivateRoute({ children, role }) {
    const { token } = useStores();

    // тут можно реально парсить JWT и проверять роль
    const isAdmin = token.token?.includes("admin");

    if (!token.isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (role === "admin" && !isAdmin) {
        return <Navigate to="/" />;
    }

    return children;
}
