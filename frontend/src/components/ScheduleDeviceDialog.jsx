import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const emptyForm = {
    action: "off",
    startTime: "",
    recurrence: "once",
};

const formatScheduleId = (schedule) => {
    if (!schedule?._id) return null;
    if (typeof schedule._id === "string") return schedule._id;
    return schedule._id.$oid ?? null;
};

const formatScheduleLabel = (schedule) => {
    const action = schedule.action === "on" ? "Turn on" : "Turn off";
    const recurrence = schedule.recurrence || "once";
    return `${action} — ${schedule.startTime} (${recurrence})`;
};

/**
 * @param {{ open: boolean, onClose: () => void, device: any }} props
 */
const ScheduleDeviceDialog = ({ open, onClose, device }) => {
    const [schedules, setSchedules] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ ...emptyForm });

    const deviceName = device?.deviceName ?? null;

    const fetchSchedules = async () => {
        if (!deviceName) return;
        setIsLoading(true);
        setError("");
        try {
            const response = await fetch(
                `/api/device/${encodeURIComponent(deviceName)}/schedules`,
            );
            if (!response.ok) throw new Error(`Failed to load schedules: ${response.status}`);
            const data = await response.json();
            setSchedules(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to load schedules.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open && deviceName) {
            setFormData({ ...emptyForm });
            fetchSchedules();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, deviceName]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) setError("");
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!deviceName) return;
        if (!formData.startTime) {
            setError("Start time is required.");
            return;
        }
        setIsSubmitting(true);
        setError("");
        try {
            const response = await fetch(
                `/api/device/${encodeURIComponent(deviceName)}/schedules`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                },
            );
            if (!response.ok) throw new Error(`Failed to create schedule: ${response.status}`);
            setFormData({ ...emptyForm });
            await fetchSchedules();
        } catch (err) {
            setError(err instanceof Error && err.message ? err.message : "Failed to create schedule.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (scheduleId) => {
        if (!scheduleId) return;
        setError("");
        // Optimistic remove
        const previous = schedules;
        setSchedules((current) => current.filter((s) => formatScheduleId(s) !== scheduleId));
        try {
            const response = await fetch(`/api/schedule/${encodeURIComponent(scheduleId)}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error(`Failed to delete schedule: ${response.status}`);
        } catch (err) {
            setSchedules(previous);
            setError(err instanceof Error && err.message ? err.message : "Failed to delete schedule.");
        }
    };

    const handleDialogClose = () => {
        if (isSubmitting) return;
        setError("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Schedule for {deviceName ?? "device"}
            </DialogTitle>
            <DialogContent dividers>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Existing schedules
                </Typography>

                {isLoading ? (
                    <Stack alignItems="center" sx={{ py: 2 }}>
                        <CircularProgress size={24} />
                    </Stack>
                ) : schedules.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        No schedules yet.
                    </Typography>
                ) : (
                    <List dense sx={{ mb: 1 }}>
                        {schedules.map((schedule) => {
                            const id = formatScheduleId(schedule);
                            return (
                                <ListItem
                                    key={id}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="delete schedule"
                                            onClick={() => handleDelete(id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText primary={formatScheduleLabel(schedule)} />
                                </ListItem>
                            );
                        })}
                    </List>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Add schedule
                </Typography>
                <Stack component="form" id="schedule-form" onSubmit={handleSubmit} spacing={2}>
                    <FormControl fullWidth required>
                        <InputLabel id="schedule-action-label">Action</InputLabel>
                        <Select
                            labelId="schedule-action-label"
                            label="Action"
                            name="action"
                            value={formData.action}
                            onChange={handleChange}
                        >
                            <MenuItem value="on">Turn on</MenuItem>
                            <MenuItem value="off">Turn off</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        name="startTime"
                        label="Start time"
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={handleChange}
                        fullWidth
                        required
                        slotProps={{ inputLabel: { shrink: true } }}
                    />

                    <FormControl fullWidth required>
                        <InputLabel id="schedule-recurrence-label">Recurrence</InputLabel>
                        <Select
                            labelId="schedule-recurrence-label"
                            label="Recurrence"
                            name="recurrence"
                            value={formData.recurrence}
                            onChange={handleChange}
                        >
                            <MenuItem value="once">Once</MenuItem>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDialogClose} disabled={isSubmitting}>
                    Close
                </Button>
                <Button
                    type="submit"
                    form="schedule-form"
                    variant="contained"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Adding..." : "Add schedule"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

ScheduleDeviceDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    device: PropTypes.object,
};

export default ScheduleDeviceDialog;
