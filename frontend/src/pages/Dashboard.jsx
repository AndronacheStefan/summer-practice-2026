import { useEffect, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Container,
    Grid,
    Skeleton,
    Typography,
} from "@mui/material";
import DevicesIcon from "@mui/icons-material/Devices";
import BoltIcon from "@mui/icons-material/Bolt";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import PageHeader from "../components/PageHeader";

const formatKwh = (n) =>
    Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "0";

function Dashboard() {
    const [summary, setSummary] = useState(null);
    const [weekly, setWeekly] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [sRes, wRes] = await Promise.all([
                    fetch("/api/dashboard/summary"),
                    fetch("/api/dashboard/weekly"),
                ]);
                if (!sRes.ok) throw new Error(`summary ${sRes.status}`);
                if (!wRes.ok) throw new Error(`weekly ${wRes.status}`);
                const [s, w] = await Promise.all([sRes.json(), wRes.json()]);
                if (cancelled) return;
                setSummary(s);
                setWeekly(w?.days ?? []);
            } catch (e) {
                if (cancelled) return;
                console.error("Failed to load dashboard data", e);
                setError("Failed to load dashboard data.");
                setSummary({
                    registeredDevices: 0,
                    energySavedThisWeek: 0,
                    totalConsumptionThisWeek: 0,
                });
                setWeekly([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const stats = [
        {
            label: "Registered Devices",
            value: summary ? String(summary.registeredDevices ?? 0) : "0",
            unit: "devices",
            icon: <DevicesIcon sx={{ fontSize: 40 }} />,
            color: "primary.main",
        },
        {
            label: "Total Power Consumption",
            value: summary ? formatKwh(summary.totalConsumptionThisWeek) : "0",
            unit: "kWh this week",
            icon: <BoltIcon sx={{ fontSize: 40 }} />,
            color: "warning.main",
        },
        {
            label: "Energy Saved",
            value: summary ? formatKwh(summary.energySavedThisWeek) : "0",
            unit: "kWh this week",
            icon: <EnergySavingsLeafIcon sx={{ fontSize: 40 }} />,
            color: "success.main",
        },
    ];

    return (
        <Container maxWidth={false} disableGutters>
            <PageHeader title="Dashboard" breadcrumbItems={["Home", "Dashboard"]} />

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {stats.map(({ label, value, unit, icon, color }) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={label}>
                        <Card elevation={2} sx={{ height: "100%" }}>
                            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <Box sx={{ color }}>{icon}</Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {label}
                                    </Typography>
                                    {loading ? (
                                        <Skeleton variant="text" width={80} height={40} />
                                    ) : (
                                        <Typography variant="h4" component="p">
                                            {value}
                                        </Typography>
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {unit}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Card elevation={2} sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Power Usage This Week
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Daily consumption (kWh) across all registered devices
                    </Typography>
                    <Box sx={{ width: "100%", height: 320 }}>
                        {loading ? (
                            <Skeleton variant="rectangular" width="100%" height={320} />
                        ) : (
                            <ResponsiveContainer>
                                <AreaChart
                                    data={weekly ?? []}
                                    margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ed6c02" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ed6c02" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2e7d32" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#2e7d32" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="weekday" tick={{ fontSize: 12 }} />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        label={{
                                            value: "kWh",
                                            angle: -90,
                                            position: "insideLeft",
                                            style: { fontSize: 12 },
                                        }}
                                    />
                                    <Tooltip
                                        formatter={(value, name) => [
                                            `${Number(value).toLocaleString(undefined, {
                                                maximumFractionDigits: 1,
                                            })} kWh`,
                                            name,
                                        ]}
                                        labelFormatter={(label, payload) =>
                                            payload?.[0]?.payload?.date ?? label
                                        }
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="consumption"
                                        name="Consumption"
                                        stroke="#ed6c02"
                                        fill="url(#usageGradient)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="energySaved"
                                        name="Energy Saved"
                                        stroke="#2e7d32"
                                        fill="url(#savedGradient)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Dashboard;
