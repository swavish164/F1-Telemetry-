import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

function WindCompassChart({windDirection, windSpeed}){
    const chartRef = useRef(null);
    const chartInstance = useRef(null)

    useEffect(() => {
        if (!windDirection || !windSpeed){
            return;
        }
        if(chartInstance.current){
            chartInstance.current.destroy();
        }

        const createWindVector = (bearing, speed) => {
            const data = new Array(360).fill(0);
            const normalisedBearing = bearing % 360;
            data[normalisedBearing] = speed;
            data[(normalisedBearing + 1) % 360] = speed;
            data[(normalisedBearing - 1 + 360) % 360] = speed;
            return data;
            };

        const windVector = createWindVector(windDirection, windSpeed);
        const ctx = chartRef.current.getContext('2d');
        const labels = Array.from({ length: 360 }, (_, i) => i='');

        chartInstance.current = new Chart(ctx, {
            type: 'radar',
            data: {
            labels: labels,
            datasets: [{
                data: windVector,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderColor: 'white',
                pointBackgroundColor: function(context) {
                const index = context.dataIndex;
                return index === windDirection % 360 ? '#FF6B6B' : 'transparent';
                },
                pointBorderColor: '#FF6B6B',
                pointRadius: 0,
                borderWidth: 2,
                fill: true,
                tension: 0.1
            }]
            },
            options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                        display: true,
                        text: 'Wind:'+windSpeed+'m/s '+windDirection+'°'
                    }
                //tooltip: {
                //callbacks: {
                  //  title: function(tooltipItems) {
                    //if (tooltipItems[0].parsed.r > 0) {
                      //  const bearing = tooltipItems[0].dataIndex;
                        //const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                        //const directionIndex = Math.round(bearing / 22.5) % 16;
                        //return `${directions[directionIndex]} (${bearing}°)`;
                    //}
                    //return '';
                    //},
                    //label: function(context) {
                    //if (context.parsed.r > 0) {
                        //return `Wind Speed: ${context.parsed.r} m/s`;
                    //}
                    //return '';
                    //}
                //}
                //}
            },
            scales: {
                r: {
                beginAtZero: true,
                max: 15, 
                ticks: {
                    display: false
                },
                grid: {
                    color: 'rgba(200, 200, 200, 0.2)',
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
    }, [windDirection, windSpeed]);

    return <canvas ref={chartRef} />;
}

export default WindCompassChart;