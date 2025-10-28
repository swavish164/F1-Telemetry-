import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function RPMGraph({ RPM, time }){
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const dataHistory = useRef([]);

    useEffect(() => {
        if (!RPM || !time) {
            return;
        }
        dataHistory.current.push({ x: time, y: RPM });

        const ctx = chartRef.current.getContext("2d");

        if (!chartInstance.current) {
            chartInstance.current = new Chart(ctx, {
                type: "line",
                data: {
                    datasets: [{
                        label: '',
                        data: dataHistory.current,
                        backgroundColor: 'rgba(255, 0, 0, 0.1)',
                        borderColor: 'red',
                        borderWidth: 2,
                        showLine: true,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.1
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
                            beginAt: 2000,
                            display: true,
                            ticks: {
                                stepSize: 1000
                            }
                        }
                    },
                    plugins: {
                    title: {
                        display: true,
                        text: 'RPM vs Time'
                    },
                    legend: {
                        display:false
                    }
                }
                }
            });
        } else {

            chartInstance.current.data.datasets[0].data = dataHistory.current;
            chartInstance.current.update('none');
        }

    }, [RPM, time]); 

useEffect(() => {
    return () => {
    dataHistory.current = [];
    };
}, []);

    return <canvas ref={chartRef} />;
}

export default RPMGraph;