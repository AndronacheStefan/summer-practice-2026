import { useState } from "react";
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

const initialFormData = {
    deviceName: "",
    deviceSlNo: "",
    deviceType: "",
    hwType: "",
    site: "",
    group: "",
    owner: "",
    connectivityType: "",
    ip: "",
    port: "",
    loginUser: "",
    password: "",
    readCommunity: "",
    writeCommunity: "",
};

/**
 * @param {{ open: boolean, onClose: () => void, onSuccess?: (createdDevice: unknown) => void }} props
 */
const AddDeviceForm = ({ open, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        ...initialFormData,
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /** @param {{ target: { name: string, value: string } }} e */
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) setError("");
        setFormData({ ...formData, [name]: value });
    };

    const handleDialogClose = () => {
        if (isSubmitting) return;
        setError("");
        setFormData({ ...initialFormData });
        onClose();
    };

    /** @param {import('react').FormEvent<HTMLFormElement>} e */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const response = await apiFetch("/api/device", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            let createdDevice = null;
            try {
                createdDevice = await response.json();
            } catch {
                createdDevice = null;
            }

            setFormData({ ...initialFormData });
            if (onSuccess) {
                onSuccess(createdDevice);
            }
            onClose();
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message || "Failed to add device.");
            } else {
                setError("Failed to add device.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DockedDialog
            open={open}
            onClose={handleDialogClose}
        >
            <DialogTitle>Add Device</DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error">{error}</Alert>}
                <Stack component="form" id="add-device-form" onSubmit={handleSubmit} direction="row" spacing={2}>
                    <Stack spacing={2} sx={{ mt: 1, width: 300 }}>
                        <TextField
                            name="deviceName"
                            label="Device Name"
                            value={formData.deviceName}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            name="deviceSlNo"
                            label="Device Serial Number"
                            value={formData.deviceSlNo}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            name="deviceType"
                            label="Device Type"
                            value={formData.deviceType}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            name="hwType"
                            label="Hardware Type"
                            value={formData.hwType}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            name="site"
                            label="Site"
                            value={formData.site}
                            onChange={handleChange}
                            fullWidth
                            required
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
                            required
                        />
                    </Stack>

                    <Stack spacing={2} sx={{ mt: 1, width: 300 }}>
                        <TextField
                            name="ip"
                            label="IP Address"
                            value={formData.ip}
                            onChange={handleChange}
                            fullWidth
                            required
                        />

                        <TextField
                            name="port"
                            label="Port"
                            value={formData.port}
                            onChange={handleChange}
                            fullWidth
                            required
                        />
                        
                        <FormControl fullWidth required>
                            <InputLabel id="connectivity-type-label">Connectivity Type</InputLabel>
                            <Select
                                labelId="connectivity-type-label"
                                label="Connectivity Type"
                                name="connectivityType"
                                value={formData.connectivityType}
                                onChange={handleChange}
                            >
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
                                    required
                                />

                                <TextField
                                    name="password"
                                    label="Password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    fullWidth
                                    required
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
                                    required
                                />

                                <TextField
                                    name="writeCommunity"
                                    label="Write Community"
                                    value={formData.writeCommunity}
                                    onChange={handleChange}
                                    fullWidth
                                    required
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
                <Button type="submit" form="add-device-form" variant="contained" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
            </DialogActions>
        </DockedDialog>
    );
};

AddDeviceForm.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func,
};

export default AddDeviceForm;
