import "../App.css";
import LibraryAddIcon from "@mui/icons-material/LibraryAdd";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";

function Home() {
    return (
        <div className="home-container">
            <div className="welcome">
                <span className="welcome-text">Smart Energy Saving</span>
                <span>Let&#39;s start saving power!</span>
            </div>

            <div className="steps">
                <div className="step-container">
                    <LibraryAddIcon  sx={{ fontSize: 60 }}/>
                    <span className="step-title">Onboard Device</span>
                    <span className="step-description">
                        Onboard the hardware with all the details.
                    </span>
                </div>

                <div className="step-container">
                    <EventRepeatIcon sx={{ fontSize: 60 }}/>
                    <span className="step-title">Schedule</span>
                    <span className="step-description">
                        You can customize your own power off and on times.
                    </span>
                </div>

                <div className="step-container">
                    <EnergySavingsLeafIcon sx={{ fontSize: 60 }}/>
                    <span className="step-title">Save energy</span>
                    <span className="step-description">
                        That&#39;s it! Onboard, schedule and save power!
                    </span>
                </div>
            </div>
        </div>
    );
}

export default Home;
