import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Alert,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from "@mui/material";
import DockedDialog from "./DockedDialog";
import { apiFetch } from "../api";

const MIN_PASSWORD_LENGTH = 6;

const emptyForm = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess?: () => void }} props
 */
const ChangePasswordForm = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({ ...emptyForm });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setFormData({ ...emptyForm });
            setError("");
        }
    }, [open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) setError("");
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const handleDialogClose = () => {
        if (isSubmitting) return;
        setError("");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmNewPassword } = formData;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setError("All fields are required.");
            return;
        }
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setError("New password and confirmation do not match.");
            return;
        }
        if (newPassword === currentPassword) {
            setError("New password must be different from the current password.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await apiFetch("/api/profile/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || `Request failed: ${response.status}`);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to change password.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DockedDialog open={open} onClose={handleDialogClose}>
            <DialogTitle>Change Password</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stack
                    component="form"
                    id="change-password-form"
                    onSubmit={handleSubmit}
                    spacing={2}
                    sx={{ mt: 1, width: { xs: "100%", sm: 360 } }}
                >
                    <TextField
                        name="currentPassword"
                        label="Current Password"
                        type="password"
                        autoComplete="current-password"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                    <TextField
                        name="newPassword"
                        label="New Password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.newPassword}
                        onChange={handleChange}
                        fullWidth
                        required
                        helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
                    />
                    <TextField
                        name="confirmNewPassword"
                        label="Confirm New Password"
                        type="password"
                        autoComplete="new-password"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        fullWidth
                        required
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" form="change-password-form" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Update Password"}
                </Button>
            </DialogActions>
        </DockedDialog>
    );
};

ChangePasswordForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
};

export default ChangePasswordForm;
