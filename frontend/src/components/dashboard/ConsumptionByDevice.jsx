/* eslint-disable react/prop-types */
import { Box, Paper, Typography } from "@mui/material";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

const ORANGE = "#ed6c02";

const formatKwh = (n) =>
    Number.isFinite(n) ? `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : "0 kWh";

const DeviceTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const row = payload[0].payload;
    return (
        <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {row.type}
            </Typography>
            <Typography variant="body2" sx={{ color: ORANGE }}>
                {formatKwh(row.consumption)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {row.percentage}% of total
            </Typography>
        </Paper>
    );
};

const ConsumptionByDevice = ({ data, onBarClick }) => {
    const rows = data.slice(0, 8);
    const chartHeight = Math.max(220, rows.length * 34 + 40);
    return (
        <Box sx={{ width: "100%", height: chartHeight }}>
            <ResponsiveContainer>
                <BarChart
                    data={rows}
                    layout="vertical"
                    margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
                    barCategoryGap={8}
                >
                    <defs>
                        <linearGradient id="barOrange" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={ORANGE} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={ORANGE} stopOpacity={0.35} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={110}
                        tick={{ fontSize: 12 }}
                        interval={0}
                    />
                    <Tooltip content={<DeviceTooltip />} cursor={{ fill: "rgba(237,108,2,0.06)" }} />
                    <Bar
                        dataKey="consumption"
                        fill="url(#barOrange)"
                        radius={[4, 4, 4, 4]}
                        onClick={(entry) => onBarClick?.(entry)}
                        cursor="pointer"
                    >
                        {rows.map((r) => (
                            <Cell key={r.device_id} />
                        ))}
                        <LabelList
                            dataKey="consumption"
                            position="right"
                            formatter={(v) => formatKwh(v)}
                            style={{ fontSize: 12, fill: "#555" }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default ConsumptionByDevice;
