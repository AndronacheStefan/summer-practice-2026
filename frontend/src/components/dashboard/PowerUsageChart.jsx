/* eslint-disable react/prop-types */
import { Box, Paper, Typography } from "@mui/material";
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

const ORANGE = "#ed6c02";
const GREEN = "#2e7d32";

const formatKwh = (n) =>
    Number.isFinite(n)
        ? `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh`
        : "0 kWh";

const DualTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <Paper elevation={3} sx={{ px: 1.5, py: 1, minWidth: 160 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            {payload.map((entry) => (
                <Box
                    key={entry.dataKey}
                    sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
                >
                    <Typography variant="body2" sx={{ color: entry.color, fontWeight: 500 }}>
                        {entry.name}
                    </Typography>
                    <Typography variant="body2">{formatKwh(entry.value)}</Typography>
                </Box>
            ))}
        </Paper>
    );
};

const PowerUsageChart = ({ data }) => {
    return (
        <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="savedGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={GREEN} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                    tick={{ fontSize: 12 }}
                    label={{
                        value: "kWh",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 12 },
                    }}
                />
                <Tooltip content={<DualTooltip />} />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="consumption"
                    name="Consumption"
                    stroke={ORANGE}
                    fill="url(#usageGradient)"
                    strokeWidth={2}
                />
                <Area
                    type="monotone"
                    dataKey="energySaved"
                    name="Energy Saved"
                    stroke={GREEN}
                    fill="url(#savedGradient)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default PowerUsageChart;
