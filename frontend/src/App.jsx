import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Devices from "./pages/Devices";
import AddDeviceForm from "./components/AddDeviceForm";
import ManageUsers from "./pages/ManageUsers";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { SidebarLayout } from "./pages/SidebarLayout";
import { CssBaseline } from "@mui/material";

function App() {
    return (
        <>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    {/* Authenticated pages: redirect to /login when not signed in. */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<SidebarLayout />}>
                            <Route path="/home" element={<Home />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/devices" element={<Devices />} />
                            <Route path="/add-device" element={<AddDeviceForm />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/manage-users" element={<ManageUsers />} />
                        </Route>
                    </Route>
                    {/* Public routes. */}
                    <Route path="/" element={<Login />} />
                    <Route path="login" element={<Login />} />
                </Routes>
            </BrowserRouter>
        </>
    );
}

export default App;
