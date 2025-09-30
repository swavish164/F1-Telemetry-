import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function trackChart({trackData,driverColour}){
    const chartRef = useRef(null);
    const chartInstance = useRef(null)

    useEffect(() => {
        if (trackData.length === 0 || !trackData){
            return;
        }
        if(chartInstance.current){
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d")

        chartInstance.current = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [{
                    label: '',
                    data: trackData.map(point => ({x: point[0], y: point[1]})),
                    backgroundColor: driverColour,
                    borderColor: driverColour,
                    borderWidth: 5,
                    pointRadius: 0,
                    showLine: true,
                    fill: false
                }]
                },
                options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                    type: 'linear',
                    position: 'bottom',
                    display: false
                    },
                    y: {
                    display: false
                    }
                },
                }
            });
    }, [trackData, driverColour]);

    return <canvas ref={chartRef} />;
}

export default trackChart;