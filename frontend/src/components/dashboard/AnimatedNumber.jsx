/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";

const DURATION_MS = 700;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

const formatValue = (n, decimals) =>
    Number.isFinite(n)
        ? n.toLocaleString(undefined, {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
          })
        : "0";

const AnimatedNumber = ({ value, decimals = 1 }) => {
    const target = Number.isFinite(value) ? value : 0;
    const [display, setDisplay] = useState(target);
    const fromRef = useRef(target);
    const rafRef = useRef(0);
    const startRef = useRef(0);

    useEffect(() => {
        cancelAnimationFrame(rafRef.current);
        const from = fromRef.current;
        const to = target;
        if (from === to) {
            setDisplay(to);
            return;
        }
        startRef.current = performance.now();
        const step = (now) => {
            const t = Math.min(1, (now - startRef.current) / DURATION_MS);
            const eased = easeOutCubic(t);
            const current = from + (to - from) * eased;
            setDisplay(current);
            if (t < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                fromRef.current = to;
            }
        };
        rafRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(rafRef.current);
    }, [target]);

    return <>{formatValue(display, decimals)}</>;
};

export default AnimatedNumber;
