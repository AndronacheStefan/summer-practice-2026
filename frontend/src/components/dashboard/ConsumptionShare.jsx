/* eslint-disable react/prop-types */
import { Box, Paper, Typography } from "@mui/material";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Orange/green theme extended with muted complementary tones
const PALETTE = [
    "#ed6c02", // primary orange
    "#2e7d32", // primary green
    "#f9a825", // amber
    "#6a994e", // olive green
    "#c47a2e", // muted orange-brown
    "#4b6a4e", // slate green
    "#e9b872", // pale amber
    "#8faa8b", // sage
];

const formatKwh = (n) =>
    Number.isFinite(n) ? `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} kWh` : "0 kWh";

const ShareTooltip = ({ active, payload }) => {
    if (!active || !payload || payload.length === 0) return null;
    const row = payload[0].payload;
    return (
        <Paper elevation={3} sx={{ px: 1.5, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {row.name}
            </Typography>
            <Typography variant="body2">{formatKwh(row.value)}</Typography>
            <Typography variant="caption" color="text.secondary">
                {row.percentage}%
            </Typography>
        </Paper>
    );
};

const ConsumptionShare = ({ data, total }) => {
    return (
        <Box sx={{ position: "relative", width: "100%", height: 320 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Tooltip content={<ShareTooltip />} />
                    <Legend verticalAlign="bottom" iconType="circle" />
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={2}
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <Box
                sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 60,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Total
                </Typography>
                <Typography variant="h6">{formatKwh(total)}</Typography>
            </Box>
        </Box>
    );
};

export default ConsumptionShare;
