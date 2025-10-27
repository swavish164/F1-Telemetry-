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
        if(gForceAngle <0){
            gForceAngle = 360 + gForceAngle
        }
        const createGForceVector = (angle, force) => {
                    const coneWidth = 5;
                    const data = new Array(360).fill(0);
                    const normalisedBearing = Math.round(angle % 360);
                    for (let offset = -coneWidth; offset <= coneWidth; offset++) {
                        const index = (normalisedBearing + offset + 360) % 360;
                        data[index] = force;
                    }
                    return data;
                    };
        
                const gForceVector = createGForceVector(gForceAngle, gForce);
                const ctx = chartRef.current.getContext('2d');

                const labels = Array.from({ length: 360 }, () => '');

        
                chartInstance.current = new Chart(ctx, {
                    type: 'radar',
                    data: {
                    labels: labels,
                    datasets: [{
                        data: gForceVector,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderColor: 'white',
                        pointRadius: 0,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                    },
                    options: {
                    responsive: true,
                    maintainAspectRatio: false,
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
                    plugins: {
                        legend: { display: false },
                    },
                    scales: {
                        r: {
                        beginAtZero: true,
                        max: 10, 
                        ticks: {
                            display: false
                        },
                        angleLines: {
                            color: 'rgba(255, 59, 25, 0.3)',
                            lineWidth: 0
                        },
                        grid: {
                            color: 'rgba(10, 224, 235, 0.2)',
                            circular: true
                        },
                        }
                    },
                    elements: {
                        line: {
                        borderWidth: 2
                        }
                    }
                    }
                });
    }, [gForce,gForceAngle]);

    return <canvas ref={chartRef} />;
}

export default GForceChart;