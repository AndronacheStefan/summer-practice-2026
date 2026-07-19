/* eslint-disable react/prop-types */
import { Box, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";

const ChartCard = ({
    title,
    subtitle,
    action = null,
    loading = false,
    empty = false,
    emptyMessage = "No data for this period",
    height = 320,
    children,
    sx,
}) => {
    return (
        <Card elevation={2} sx={{ height: "100%", ...sx }}>
            <CardContent>
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                    spacing={1}
                    sx={{ mb: 2 }}
                >
                    <Box>
                        <Typography variant="h6" gutterBottom>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {action}
                </Stack>
                <Box sx={{ width: "100%", height, position: "relative" }}>
                    {loading ? (
                        <Skeleton variant="rectangular" width="100%" height={height} />
                    ) : empty ? (
                        <Box
                            sx={{
                                width: "100%",
                                height,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "text.secondary",
                            }}
                        >
                            <Typography variant="body2">{emptyMessage}</Typography>
                        </Box>
                    ) : (
                        children
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default ChartCard;
