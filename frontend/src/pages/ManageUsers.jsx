import { useState, useEffect, useMemo } from "react";
import {
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Divider,
    Box,
    Grid,
    Container,
} from "@mui/material";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import PageHeader from "../components/PageHeader";
import { apiFetch } from "../api";

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("user");
    const [site, setSite] = useState("");
    const [group, setGroup] = useState("");
    const [message, setMessage] = useState("");

    const fetchData = async () => {
        try {
            const response = await apiFetch("/api/users");
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const columns = useMemo(
        () => [
            { accessorKey: "name", header: "Name" },
            { accessorKey: "username", header: "Username" },
            { accessorKey: "role", header: "Role" },
            { accessorKey: "site", header: "Site" },
            { accessorKey: "group", header: "Group" },
        ],
        [],
    );

    const table = useMaterialReactTable({
        columns,
        data: users,
        muiTablePaperProps: {
            elevation: 0,
        },
    });

    /** @param {any} e */
    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            const response = await apiFetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, username, password, role, site, group }),
            });

            const data = await response.json();
            setMessage(data.message);
            setName("");
            setUsername("");
            setPassword("");
            setRole("user");
            setSite("");
            setGroup("");
            fetchData(); // Refresh user data after registration
        } catch (error) {
            console.error("Error registering user:", error);
        }
    };

    return (
        <Container maxWidth={false} disableGutters>
            <PageHeader title="Manage Users" breadcrumbItems={["Home", "Manage Users"]} />

            <MaterialReactTable table={table} />

            <Divider />

            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Register User
                </Typography>

                <form onSubmit={handleRegister}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                label="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <TextField
                                fullWidth
                                type="password"
                                label="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select value={role} onChange={(e) => setRole(e.target.value)} required>
                                    <MenuItem value="user">User</MenuItem>
                                    <MenuItem value="admin">Admin</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Site</InputLabel>
                                <Select value={site} onChange={(e) => setSite(e.target.value)} required>
                                    <MenuItem value="Romania">Romania</MenuItem>
                                    <MenuItem value="India">India</MenuItem>
                                    <MenuItem value="Poland">Poland</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>Group</InputLabel>
                                <Select value={group} onChange={(e) => setGroup(e.target.value)} required>
                                    <MenuItem value="group1">Group 1</MenuItem>
                                    <MenuItem value="group2">Group 2</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={12}>
                            <Button type="submit" variant="contained" color="primary">
                                Register
                            </Button>
                        </Grid>
                    </Grid>
                </form>
            </Box>

            {message && (
                <Typography variant="body1" gutterBottom>
                    {message}
                </Typography>
            )}
        </Container>
    );
};

export default ManageUsers;
