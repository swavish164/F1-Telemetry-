import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function GForceChart({gForce,gForceAngle}){
    const chartRef = useRef(null);
    const chartInstance = useRef(null)

    useEffect(() => {
        if (!gForce || !gForceAngle){
            return;
        }
        if(chartInstance.current){
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d")

        chartInstance.current = new Chart(ctx, {

        });
    }, [gForce,gForceAngle]);

    return <canvas ref={chartRef} />;
}

export default GForceChart;