/* eslint-disable react/prop-types */
import { Paper, Typography } from "@mui/material";
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

const formatKwh = (n) =>
    Number.isFinite(n) ? `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} kWh` : "0 kWh";

const ProfileTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    return (
        <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
                {label}
            </Typography>
            <Typography variant="body2" sx={{ color: ORANGE }}>
                {formatKwh(payload[0].value)}
            </Typography>
        </Paper>
    );
};

const HourlyProfile = ({ data }) => {
    return (
        <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="hourlyOrange" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={ORANGE} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={1} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ProfileTooltip />} />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="consumption"
                    name="Avg. Consumption"
                    stroke={ORANGE}
                    fill="url(#hourlyOrange)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};

export default HourlyProfile;
