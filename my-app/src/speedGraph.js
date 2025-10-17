import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function SpeedGraph({ speed }){
    const chartRef = useRef(null);
    const chartInstance = useRef(null)

    useEffect(() => {
        if (!speed){
            return;
        }
        if(chartInstance.current){
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext("2d")

        chartInstance.current = new Chart(ctx, {
        type: "line",
        data: {
            datasets: [{
            label: '',
            data: speed,
            backgroundColor: 'red',
            borderColor: 'red',
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
                //}
            },
            y: {
                display: false
            }
            },
        }
        });
    }, [speed]);

    return <canvas ref={chartRef} />;
}

export default SpeedGraph;