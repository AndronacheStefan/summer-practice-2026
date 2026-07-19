/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export const RANGE_OPTIONS = [
    { value: "1h", label: "1H" },
    { value: "24h", label: "24H" },
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "1y", label: "1Y" },
];

const RangeSelector = ({ value, onChange, disabled = false }) => {
    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            size="small"
            color="warning"
            onChange={(_, next) => {
                if (next && next !== value) onChange(next);
            }}
            disabled={disabled}
            aria-label="time range"
        >
            {RANGE_OPTIONS.map(({ value: v, label }) => (
                <ToggleButton key={v} value={v} aria-label={label}>
                    {label}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};

export default RangeSelector;
