import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Snackbar,
    Stack,
    Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import LockResetIcon from "@mui/icons-material/LockReset";
import PageHeader from "../components/PageHeader";
import EditProfileForm from "../components/EditProfileForm";
import ChangePasswordForm from "../components/ChangePasswordForm";
import { apiFetch } from "../api";

const InfoRow = ({ label, value }) => (
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
        <Typography variant="body2" color="text.secondary">
            {label}
        </Typography>
        <Box sx={{ textAlign: "right" }}>{value}</Box>
    </Stack>
);

InfoRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
};

function Profile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

    const showToast = (severity, message) => setToast({ open: true, severity, message });
    const closeToast = (_event, reason) => {
        if (reason === "clickaway") return;
        setToast((current) => ({ ...current, open: false }));
    };

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            // apiFetch attaches the token and redirects to /login on a 401.
            const response = await apiFetch("/api/profile");
            if (!response.ok) {
                throw new Error(`Failed to load profile: ${response.status}`);
            }
            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load profile.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleEditSuccess = (updated) => {
        setProfile(updated);
        // Keep the sidebar name in sync with the saved profile.
        if (updated?.name) sessionStorage.setItem("name", updated.name);
        showToast("success", "Profile updated.");
    };

    const handlePasswordSuccess = () => {
        showToast("success", "Password changed.");
    };

    const isAdmin = profile?.role === "admin";

    return (
        <Container maxWidth={false} disableGutters>
            <PageHeader title="Profile" breadcrumbItems={["Home", "Profile"]} />

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                    <CircularProgress />
                </Box>
            )}

            {!loading && error && !profile && (
                <Alert
                    severity="error"
                    sx={{ mt: 2, maxWidth: 560 }}
                    action={
                        <Button color="inherit" size="small" onClick={fetchProfile}>
                            Retry
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            {!loading && profile && (
                <Card elevation={3} sx={{ mt: 2, maxWidth: 560 }}>
                    <CardContent sx={{ p: 3 }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ width: 64, height: 64, fontSize: 28, bgcolor: "primary.main" }}>
                                {(profile.name || profile.username || "U").charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h5" noWrap>
                                    {profile.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap>
                                    @{profile.username}
                                </Typography>
                            </Box>
                            <Box sx={{ flexGrow: 1 }} />
                            <Chip
                                label={profile.role}
                                color={isAdmin ? "primary" : "default"}
                                sx={{ textTransform: "capitalize" }}
                            />
                        </Stack>

                        <Divider sx={{ my: 3 }} />

                        <Stack spacing={2}>
                            <InfoRow
                                label="Username"
                                value={<Typography variant="body1">{profile.username}</Typography>}
                            />
                            <InfoRow
                                label="Role"
                                value={
                                    <Chip
                                        size="small"
                                        label={profile.role}
                                        color={isAdmin ? "primary" : "default"}
                                        sx={{ textTransform: "capitalize" }}
                                    />
                                }
                            />
                            <InfoRow
                                label="Site"
                                value={<Typography variant="body1">{profile.site || "—"}</Typography>}
                            />
                            <InfoRow
                                label="Group"
                                value={<Typography variant="body1">{profile.group || "—"}</Typography>}
                            />
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                            <Button
                                variant="contained"
                                startIcon={<EditIcon />}
                                onClick={() => setIsEditOpen(true)}
                            >
                                Edit profile
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<LockResetIcon />}
                                onClick={() => setIsPasswordOpen(true)}
                            >
                                Change password
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            )}

            <EditProfileForm
                open={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSuccess={handleEditSuccess}
                profile={profile}
            />

            <ChangePasswordForm
                open={isPasswordOpen}
                onClose={() => setIsPasswordOpen(false)}
                onSuccess={handlePasswordSuccess}
            />

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={closeToast}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            >
                <Alert
                    onClose={closeToast}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default Profile;
