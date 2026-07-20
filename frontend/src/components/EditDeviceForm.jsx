import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Alert,
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
} from "@mui/material";
import DockedDialog from "./DockedDialog";
import { apiFetch } from "../api";

const EDITABLE_FIELDS = [
    "deviceSlNo",
    "deviceType",
    "hwType",
    "site",
    "group",
    "owner",
    "connectivityType",
    "ip",
    "port",
    "loginUser",
    "password",
    "readCommunity",
    "writeCommunity",
];

const emptyForm = EDITABLE_FIELDS.reduce((acc, key) => {
    acc[key] = "";
    return acc;
}, {});

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess?: () => void, device: any }} props
 */
const EditDeviceForm = ({ open, onClose, onSuccess, device }) => {
    const [formData, setFormData] = useState({ ...emptyForm });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && device) {
            const seeded = { ...emptyForm };
            EDITABLE_FIELDS.forEach((key) => {
                seeded[key] = device[key] ?? "";
            });
            setFormData(seeded);
            setError("");
        }
    }, [open, device]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) setError("");
        setFormData({ ...formData, [name]: value });
    };

    const handleDialogClose = () => {
        if (isSubmitting) return;
        setError("");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!device?.deviceName) return;
        setIsSubmitting(true);
        setError("");

        try {
            const response = await apiFetch(
                `/api/device/${encodeURIComponent(device.deviceName)}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                },
            );

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to update device.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DockedDialog open={open} onClose={handleDialogClose}>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Stack component="form" id="edit-device-form" onSubmit={handleSubmit} direction="row" spacing={2}>
                    <Stack spacing={2} sx={{ mt: 1, width: 300 }}>
                        <TextField
                            label="Device Name"
                            value={device?.deviceName ?? ""}
                            fullWidth
                            disabled
                            helperText="Device name cannot be changed"
                        />

                        <TextField
                            name="deviceSlNo"
                            label="Device Serial Number"
                            value={formData.deviceSlNo}
                            onChange={handleChange}
                            fullWidth
                        />

                        <TextField
                            name="deviceType"
                            label="Device Type"
                            value={formData.deviceType}
                            onChange={handleChange}
                            fullWidth
                        />

                        <TextField
                            name="hwType"
                            label="Hardware Type"
                            value={formData.hwType}
                            onChange={handleChange}
                            fullWidth
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
                            required
                        />

                        <TextField
                            name="owner"
                            label="Owner"
                            value={formData.owner}
                            onChange={handleChange}
                            fullWidth
                        />
                    </Stack>

                    <Stack spacing={2} sx={{ mt: 1, width: 300 }}>
                        <TextField
                            name="ip"
                            label="IP Address"
                            value={formData.ip}
                            onChange={handleChange}
                            fullWidth
                        />

                        <TextField
                            name="port"
                            label="Port"
                            value={formData.port}
                            onChange={handleChange}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel id="edit-connectivity-type-label">Connectivity Type</InputLabel>
                            <Select
                                labelId="edit-connectivity-type-label"
                                label="Connectivity Type"
                                name="connectivityType"
                                value={formData.connectivityType}
                                onChange={handleChange}
                            >
                                <MenuItem value="">-</MenuItem>
                                <MenuItem value="ssh">SSH</MenuItem>
                                <MenuItem value="snmp">SNMP</MenuItem>
                            </Select>
                        </FormControl>

                        {formData.connectivityType === "ssh" && (
                            <>
                                <TextField
                                    name="loginUser"
                                    label="Login User"
                                    value={formData.loginUser}
                                    onChange={handleChange}
                                    fullWidth
                                />

                                <TextField
                                    name="password"
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </>
                        )}

                        {formData.connectivityType === "snmp" && (
                            <>
                                <TextField
                                    name="readCommunity"
                                    label="Read Community"
                                    value={formData.readCommunity}
                                    onChange={handleChange}
                                    fullWidth
                                />

                                <TextField
                                    name="writeCommunity"
                                    label="Write Community"
                                    value={formData.writeCommunity}
                                    onChange={handleChange}
                                    fullWidth
                                />
                            </>
                        )}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" form="edit-device-form" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save"}
                </Button>
            </DialogActions>
        </DockedDialog>
    );
};

EditDeviceForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
    device: PropTypes.object,
};

export default EditDeviceForm;
