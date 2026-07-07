import { Box, Card, CardContent, Container, Grid, Typography } from "@mui/material";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";

const steps = [
    {
        icon: <LibraryAddIcon sx={{ fontSize: 60 }} />,
        title: "Onboard Device",
        description: "Onboard the hardware with all the details.",
    },
    {
        icon: <EventRepeatIcon sx={{ fontSize: 60 }} />,
        title: "Schedule",
        description: "You can customize your own power off and on times.",
    },
    {
        icon: <EnergySavingsLeafIcon sx={{ fontSize: 60 }} />,
        title: "Save Energy",
        description: "That's it! Onboard, schedule and save power!",
    },
];

function Home() {
    return (
        <Box>
            <Box
                sx={{
                    height: "40vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    textAlign: "center",
                    px: 2,
                }}
            >
                <Typography variant="h1" fontWeight="bold" gutterBottom>
                    Smart Energy Saving
                </Typography>
                <Typography variant="h2">
                    Let&apos;s start saving power!
                </Typography>
            </Box>

            <Container sx={{ py: 6 }}>
                <Grid container spacing={4} justifyContent="center">
                    {steps.map(({ icon, title, description }) => (
                        <Grid item xs={12} sm={6} md={4} key={title}>
                            <Card
                                elevation={3}
                                sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    textAlign: "center",
                                    p: 2,
                                }}
                            >
                                <CardContent>
                                    <Box sx={{ mb: 2, color: "primary.main" }}>{icon}</Box>
                                    <Typography variant="h5" fontWeight="medium" gutterBottom>
                                        {title}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>
        </Box>
    );
}

export default Home;
