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

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess?: (profile: any) => void, profile: any }} props
 */
const EditProfileForm = ({ open, onClose, onSuccess, profile }) => {
    const [formData, setFormData] = useState({ name: "", site: "", group: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && profile) {
            setFormData({
                name: profile.name ?? "",
                site: profile.site ?? "",
                group: profile.group ?? "",
            });
            setError("");
        }
    }, [open, profile]);

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
        if (!formData.name.trim()) {
            setError("Name is required.");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            const response = await apiFetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    site: formData.site.trim(),
                    group: formData.group.trim(),
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || `Request failed: ${response.status}`);
            }

            if (onSuccess) onSuccess(data);
            onClose();
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to update profile.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DockedDialog open={open} onClose={handleDialogClose}>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stack
                    component="form"
                    id="edit-profile-form"
                    onSubmit={handleSubmit}
                    spacing={2}
                    sx={{ mt: 1, width: { xs: "100%", sm: 360 } }}
                >
                    <TextField
                        name="name"
                        label="Name"
                        value={formData.name}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={Boolean(error) && !formData.name.trim()}
                    />
                    <TextField
                        name="site"
                        label="Site"
                        value={formData.site}
                        onChange={handleChange}
                        fullWidth
                    />
                    <TextField
                        name="group"
                        label="Group"
                        value={formData.group}
                        onChange={handleChange}
                        fullWidth
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" form="edit-profile-form" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </DockedDialog>
    );
};

EditProfileForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    profile: PropTypes.object,
};

export default EditProfileForm;
