import { useState, useEffect, useMemo } from "react";
import {
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
    Container,
    Snackbar,
    Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import AddDeviceForm from "../components/AddDeviceForm";
import EditDeviceForm from "../components/EditDeviceForm";
import ScheduleDeviceDialog from "../components/ScheduleDeviceDialog";
import PageHeader from "../components/PageHeader";
import { apiFetch } from "../api";

const DeviceTable = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [toast, setToast] = useState({ open: false, severity: "success", message: "" });

    const showToast = (severity, message) => {
        setToast({ open: true, severity, message });
    };

    const closeToast = (_event, reason) => {
        if (reason === "clickaway") return;
        setToast((current) => ({ ...current, open: false }));
    };

    const fetchDevices = async () => {
        try {
            const response = await apiFetch("/api/devices");
            if (!response.ok) {
                throw new Error(`Failed to fetch devices: ${response.status}`);
            }
            const data = await response.json();
            setDevices(data);
        } catch (error) {
            console.error("Error fetching devices:", error);
            showToast("error", "Failed to load devices.");
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleAction = (action, device) => {
        setSelectedDevice(device);
        switch (action) {
            case "schedule":
                setIsScheduleDialogOpen(true);
                break;
            case "edit":
                setIsEditDialogOpen(true);
                break;
            case "remove":
                setIsRemoveDialogOpen(true);
                break;
            default:
                break;
        }
    };

    const handleRemoveCancel = () => {
        if (isRemoving) return;
        setIsRemoveDialogOpen(false);
        setSelectedDevice(null);
    };

    const handleRemoveConfirm = async () => {
        if (!selectedDevice?.deviceName) return;
        const target = selectedDevice;
        setIsRemoving(true);
        // Optimistic remove
        const previous = devices;
        setDevices((current) =>
            current.filter((d) => d.deviceName !== target.deviceName),
        );
        try {
            const response = await apiFetch(
                `/api/device/${encodeURIComponent(target.deviceName)}`,
                { method: "DELETE" },
            );
            if (!response.ok) throw new Error(`Failed to delete device: ${response.status}`);
            showToast("success", `Removed "${target.deviceName}".`);
            setIsRemoveDialogOpen(false);
            setSelectedDevice(null);
        } catch (error) {
            console.error("Error removing device:", error);
            setDevices(previous);
            showToast("error", `Failed to remove "${target.deviceName}".`);
        } finally {
            setIsRemoving(false);
        }
    };

    const handleEditClose = () => {
        setIsEditDialogOpen(false);
        setSelectedDevice(null);
    };

    const handleEditSuccess = () => {
        showToast("success", "Device updated.");
        fetchDevices();
    };

    const handleScheduleClose = () => {
        setIsScheduleDialogOpen(false);
        setSelectedDevice(null);
    };

    const handleAddDialogOpen = () => {
        setIsAddDialogOpen(true);
    };

    const handleAddDialogClose = () => {
        setIsAddDialogOpen(false);
    };

    const handleAddDeviceSuccess = () => {
        showToast("success", "Device added.");
        fetchDevices();
    };

    const columns = useMemo(
        () => [
            { accessorKey: "deviceName", header: "Device Name" },
            { accessorKey: "deviceSlNo", header: "Serial Number" },
            { accessorKey: "deviceType", header: "Device Type" },
            { accessorKey: "hwType", header: "Hardware Type" },
            { accessorKey: "site", header: "Site" },
            { accessorKey: "group", header: "Group" },
            { accessorKey: "owner", header: "Owner" },
            {
                id: "connection",
                header: "Connection",
                accessorFn: (row) => {
                    const type = row.connectivityType || "-";
                    const ip = row.ip || "-";
                    const port = row.port || "-";
                    return `${type} | ${ip}:${port}`;
                },
            },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: devices,
        enableRowActions: true,
        positionActionsColumn: "last",
        muiTableContainerProps: {
        },
        muiTablePaperProps: {
            elevation: 0,
        },
        renderTopToolbarCustomActions: () => (
            <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDialogOpen}>
                Add Device
            </Button>
        ),
        renderRowActionMenuItems: ({ row, closeMenu }) => [
            <MenuItem
                key="schedule"
                onClick={() => {
                    closeMenu();
                    handleAction("schedule", row.original);
                }}
            >
                Schedule
            </MenuItem>,
            <MenuItem
                key="edit"
                onClick={() => {
                    closeMenu();
                    handleAction("edit", row.original);
                }}
            >
                Edit
            </MenuItem>,
            <MenuItem
                key="remove"
                onClick={() => {
                    closeMenu();
                    handleAction("remove", row.original);
                }}
            >
                Remove
            </MenuItem>,
        ],
    });

    return (
        <Container maxWidth={false} disableGutters>
            <PageHeader title="Devices" breadcrumbItems={["Home", "Devices"]} />
            <MaterialReactTable table={table} />

            <Dialog open={isRemoveDialogOpen} onClose={handleRemoveCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Remove device?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Remove device{" "}
                        <strong>{selectedDevice?.deviceName ?? ""}</strong>? This can't be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRemoveCancel} disabled={isRemoving}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRemoveConfirm}
                        color="error"
                        variant="contained"
                        disabled={isRemoving}
                    >
                        {isRemoving ? "Removing..." : "Remove"}
                    </Button>
                </DialogActions>
            </Dialog>

            <AddDeviceForm
                open={isAddDialogOpen}
                onClose={handleAddDialogClose}
                onSuccess={handleAddDeviceSuccess}
            />

            <EditDeviceForm
                open={isEditDialogOpen}
                onClose={handleEditClose}
                onSuccess={handleEditSuccess}
                device={selectedDevice}
            />

            <ScheduleDeviceDialog
                open={isScheduleDialogOpen}
                onClose={handleScheduleClose}
                device={selectedDevice}
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
};

export default DeviceTable;
