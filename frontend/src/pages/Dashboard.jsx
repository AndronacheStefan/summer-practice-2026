import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    Container,
    Grid,
    Skeleton,
    Typography,
} from "@mui/material";
import DevicesIcon from "@mui/icons-material/Devices";
import BoltIcon from "@mui/icons-material/Bolt";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import PageHeader from "../components/PageHeader";
import AnimatedNumber from "../components/dashboard/AnimatedNumber";
import ChartCard from "../components/dashboard/ChartCard";
import ConsumptionByDevice from "../components/dashboard/ConsumptionByDevice";
import ConsumptionShare from "../components/dashboard/ConsumptionShare";
import HourlyProfile from "../components/dashboard/HourlyProfile";
import PowerUsageChart from "../components/dashboard/PowerUsageChart";
import RangeSelector from "../components/dashboard/RangeSelector";

const RANGE_UNIT = {
    "1h": "kWh this hour",
    "24h": "kWh today",
    "7d": "kWh this week",
    "30d": "kWh this month",
    "1y": "kWh this year",
};

const RANGE_SUBTITLE = {
    "1h": "Consumption in 5-minute intervals over the last hour",
    "24h": "Hourly consumption over the last 24 hours",
    "7d": "Daily consumption over the last 7 days",
    "30d": "Daily consumption over the last 30 days",
    "1y": "Monthly consumption over the last 12 months",
};

const fetchJson = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    return res.json();
};

const zipSeries = (labels, consumption, energySaved) =>
    (labels ?? []).map((label, i) => ({
        label,
        consumption: consumption?.[i] ?? 0,
        energySaved: energySaved?.[i] ?? 0,
    }));

function Dashboard() {
    const [range, setRange] = useState("7d");
    const [deviceFilter, setDeviceFilter] = useState(null); // { id, name }
    const [devicesCount, setDevicesCount] = useState(0);

    const [consumption, setConsumption] = useState(null);
    const [byDevice, setByDevice] = useState(null);
    const [hourly, setHourly] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchJson("/api/devices");
                if (cancelled) return;
                setDevicesCount(Array.isArray(list) ? list.length : 0);
            } catch {
                if (!cancelled) setDevicesCount(0);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({ range });
        if (deviceFilter?.id) params.set("device_id", deviceFilter.id);
        const qs = params.toString();

        const wantHourly = range !== "1h";
        const requests = [
            fetchJson(`/api/analytics/consumption?${qs}`),
            fetchJson(`/api/analytics/by-device?range=${encodeURIComponent(range)}`),
        ];
        if (wantHourly) {
            requests.push(fetchJson(`/api/analytics/hourly-profile?${qs}`));
        }

        Promise.all(requests)
            .then(([c, d, h]) => {
                if (cancelled) return;
                setConsumption(c);
                setByDevice(Array.isArray(d) ? d : []);
                setHourly(wantHourly ? h : null);
            })
            .catch((e) => {
                if (cancelled) return;
                console.error("Failed to load analytics", e);
                setError("Failed to load analytics.");
                setConsumption({
                    labels: [],
                    consumption: [],
                    energy_saved: [],
                    total_consumption: 0,
                    total_saved: 0,
                });
                setByDevice([]);
                setHourly(null);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [range, deviceFilter]);

    const chartData = useMemo(
        () =>
            zipSeries(
                consumption?.labels,
                consumption?.consumption,
                consumption?.energy_saved,
            ),
        [consumption],
    );

    const hourlyData = useMemo(
        () =>
            (hourly?.labels ?? []).map((label, i) => ({
                label,
                consumption: hourly?.consumption?.[i] ?? 0,
            })),
        [hourly],
    );

    const shareData = useMemo(() => {
        if (!byDevice) return [];
        const byType = new Map();
        for (const row of byDevice) {
            const key = row.type || "Unknown";
            byType.set(key, (byType.get(key) ?? 0) + (row.consumption ?? 0));
        }
        const total = Array.from(byType.values()).reduce((a, b) => a + b, 0) || 1;
        return Array.from(byType.entries())
            .map(([name, value]) => ({
                name,
                value: Number(value.toFixed(2)),
                percentage: Number(((value / total) * 100).toFixed(1)),
            }))
            .sort((a, b) => b.value - a.value);
    }, [byDevice]);

    const totalConsumption = consumption?.total_consumption ?? 0;
    const totalSaved = consumption?.total_saved ?? 0;

    const handleBarClick = useCallback((entry) => {
        if (!entry?.device_id) return;
        setDeviceFilter({ id: entry.device_id, name: entry.name });
    }, []);

    const clearDeviceFilter = () => setDeviceFilter(null);

    const consumptionEmpty = !loading && chartData.every((d) => !d.consumption && !d.energySaved);
    const byDeviceEmpty = !loading && (byDevice ?? []).length === 0;
    const shareEmpty = !loading && shareData.length === 0;
    const hourlyEmpty = !loading && hourlyData.every((d) => !d.consumption);

    const stats = [
        {
            label: "Registered Devices",
            value: devicesCount,
            unit: "devices",
            decimals: 0,
            icon: <DevicesIcon sx={{ fontSize: 40 }} />,
            color: "primary.main",
        },
        {
            label: "Total Power Consumption",
            value: totalConsumption,
            unit: RANGE_UNIT[range],
            decimals: 1,
            icon: <BoltIcon sx={{ fontSize: 40 }} />,
            color: "warning.main",
        },
        {
            label: "Energy Saved",
            value: totalSaved,
            unit: RANGE_UNIT[range],
            decimals: 1,
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
                {stats.map(({ label, value, unit, decimals, icon, color }) => (
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
                                            <AnimatedNumber value={value} decimals={decimals} />
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

            <Box sx={{ mt: 3 }}>
                <ChartCard
                    title={deviceFilter ? `Power Usage — ${deviceFilter.name}` : "Power Usage"}
                    subtitle={RANGE_SUBTITLE[range]}
                    loading={loading}
                    empty={consumptionEmpty}
                    action={
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                            {deviceFilter && (
                                <Chip
                                    label={`Filtered: ${deviceFilter.name}`}
                                    color="warning"
                                    variant="outlined"
                                    onDelete={clearDeviceFilter}
                                    size="small"
                                />
                            )}
                            <RangeSelector value={range} onChange={setRange} disabled={loading} />
                        </Box>
                    }
                >
                    <PowerUsageChart data={chartData} />
                </ChartCard>
            </Box>

            <Grid container spacing={3} sx={{ mt: 0 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <ChartCard
                        title="Consumption by Device"
                        subtitle="Top 8 devices for the selected range — click a bar to filter"
                        loading={loading}
                        empty={byDeviceEmpty}
                        height={320}
                    >
                        <ConsumptionByDevice
                            data={byDevice ?? []}
                            onBarClick={handleBarClick}
                        />
                    </ChartCard>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                    <ChartCard
                        title="Consumption Share"
                        subtitle="Distribution by device category"
                        loading={loading}
                        empty={shareEmpty}
                        height={320}
                    >
                        <ConsumptionShare
                            data={shareData}
                            total={shareData.reduce((a, b) => a + b.value, 0)}
                        />
                    </ChartCard>
                </Grid>

                {range !== "1h" && (
                    <Grid size={{ xs: 12 }}>
                        <ChartCard
                            title="Average Hourly Profile"
                            subtitle="Average consumption per hour of day for the selected range"
                            loading={loading}
                            empty={hourlyEmpty}
                            height={280}
                        >
                            <HourlyProfile data={hourlyData} />
                        </ChartCard>
                    </Grid>
                )}
            </Grid>
        </Container>
    );
}

export default Dashboard;
