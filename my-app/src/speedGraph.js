import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function SpeedGraph({ speed, time }){
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    const dataHistory = useRef([]);

    useEffect(() => {
        if (!speed || !time) {
            return;
        }
        dataHistory.current.push({ x: time, y: speed });

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
                            beginAtZero: true,
                            display: false
                        }
                    }
                }
            });
        } else {

            chartInstance.current.data.datasets[0].data = dataHistory.current;
            chartInstance.current.update('none');
        }

    }, [speed, time]); 

useEffect(() => {
    return () => {
    dataHistory.current = [];
    };
}, []);

    return <canvas ref={chartRef} />;
}

export default SpeedGraph;