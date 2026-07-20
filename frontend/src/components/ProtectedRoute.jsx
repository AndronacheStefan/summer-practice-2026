import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../api";

/**
 * Route guard for authenticated pages. Renders the nested routes when a token is
 * present; otherwise redirects to /login and remembers the attempted location so
 * login can send the user back after a successful sign-in.
 *
 * This is a UX convenience only — the backend independently rejects unauthenticated
 * API requests with 401.
 */
export default function ProtectedRoute() {
    const location = useLocation();
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }
    return <Outlet />;
}
