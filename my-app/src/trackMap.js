import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import {RotatePosition} from "./tools.js"

function TrackChart({trackData,driverColour,currentPos,trackRotation}){
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
        const rotatedCurrentPos = currentPos ? RotatePosition(currentPos, trackRotation) : null;

        chartInstance.current = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [
                            {
                    label: "car",
                    data: rotatedCurrentPos ? [{ x: rotatedCurrentPos.x, y: rotatedCurrentPos.y }] : [],
                    backgroundColor: driverColour || "red",
                    pointRadius: 4,
                    showLine: false,
                },{
                    label: 'track',
                    data: trackData.map(point => ({x: point[0], y: point[1]})),
                    backgroundColor: driverColour,
                    borderColor: 'gray',
                    borderWidth: 5,
                    pointRadius: 0,
                    showLine: true,
                    fill: false
                },
    ],
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
                plugins: {
                    tooltip: {
                        enabled: false
                    },
                    legend: {
                        display: false
                    }
                },
                animation: {
                        duration: 0 
                    },
                transitions: {
                    active: {
                        animation: {
                            duration: 0
                        }
                    }
                },
            }
            });
    }, [trackData, driverColour,currentPos,trackRotation]);

    useEffect(() => {
    if (!chartInstance.current || !currentPos) return;

    const carDataset = chartInstance.current.data.datasets[0];
    const rotatedCurrentPos = RotatePosition(currentPos, trackRotation);
    carDataset.data = [{ x: rotatedCurrentPos.x, y: rotatedCurrentPos.y }];

    chartInstance.current.update("none");
}, [currentPos,trackRotation]);

    return <canvas ref={chartRef} />;
}

export default TrackChart;