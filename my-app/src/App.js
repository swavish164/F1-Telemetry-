import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';


function TelemetryView() {
  const [trackLength,setTrackLength] = useState(null);
  const [driverColour,setDriverColour] = useState(null);
  const [trackPoints,setTrackPoints] = useState([]);
  const [messages, setMessages] = useState([]);
  const [telemetryData, setTelemetryData] = useState({
    weather: null,
    current: null,
    track: null
  });
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const windCompassRef = useRef(null);
  const windCompassInstance = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);


  useEffect(() => {
    if ((trackPoints.length === trackLength) && (trackPoints.length > 0)) {
      initialiseTrackChart(trackPoints);
    }
  }, [trackPoints, trackLength]);

    useEffect(() => {
    initialiseThrottleChart(telemetryData.current.Throttle);
  }, [telemetryData.current.Throttle]);

  useEffect(() => {
  if (telemetryData.weather) {
    initialiseWindCompass(telemetryData.weather.windDirection, telemetryData.weather.windSpeed);
  }
}, [telemetryData.weather]);

  const connectWebSocket = () => {
    try {
      setConnectionStatus('Connecting...');
      ws.current = new WebSocket("ws://localhost:8000/frontend");

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setConnectionStatus('Connected');
        // Don't send ping immediately, wait for connection to stabilize
        setTimeout(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("ping");
          }
        }, 1000);
      };

      ws.current.onmessage = (event) => {
        console.log("Raw message received:", event.data);
        
        // First, try to handle as JSON
        try {
          const parsed = JSON.parse(event.data);
          handleParsedMessage(parsed);
        } catch (error) {
          // If JSON parsing fails, check if it's a simple string message
          console.log(error)
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus('Error');
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // Attempt reconnection after 3 seconds
        setTimeout(() => {
          if (!ws.current || ws.current.readyState === WebSocket.CLOSED) {
            connectWebSocket();
          }
        }, 3000);
      };

    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      setConnectionStatus('Failed to connect');
    }
  };

  const handleParsedMessage = (parsed) => {
    
    if (parsed.type === "weather") {
      // Extract weather data
      const [airTemp, pressure, rainfall, humidity, trackTemp, windDirection, windSpeed] = parsed.data || [];
      const weatherData = {
        airTemp,
        humidity,
        pressure,
        icon: rainfall ? "fas fa-cloud-showers-heavy" : "fas fa-sun",
        trackTemp,
        windDirection,
        windSpeed,
      };
      setTelemetryData(prev => ({...prev, weather: weatherData}));
      
      
    }else if (parsed.type === "track_init") {
      setTrackLength(parsed.length);
      setTrackPoints([]);
      setDriverColour(parsed.colour);

      
    }else if (parsed.type === "track") {
      setTrackPoints(prevPoints => {
        const newPoints = [...prevPoints, ...parsed.data];
        return newPoints;
      });
      
    } else if (parsed.type === "update") {
      // Update only the telemetry data for updates
      const telemetry = {
        RPM: parsed.data?.RPM,
        Speed: parsed.data?.Speed,
        Gear: parsed.data?.Gear,
        Throttle: parsed.data?.Throttle,
        Brake: parsed.data?.Brake,
        Time: parsed.data?.Time,
        PosData: parsed.data?.PosData,
        Gforce: parsed.data?.Gforce,
        GforceAngle: parsed.data?.GforceAngle || parsed.data?.GforceDir
      };
      
      setTelemetryData(prev => ({
        ...prev,
        current: telemetry
      }));
    } 
    

  };


  const initialiseTrackChart = (trackData) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Check if trackData is valid
    if (!trackData || !Array.isArray(trackData) || trackData.length === 0) {
      console.error("Invalid track data:", trackData);
      return;
    }

    const ctx = chartRef.current.getContext('2d');
    
    
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
            //ticks: {
              //display: false
            //},
            //border: {
              //color: 'black',
              //width: 5
            //},
            //title: {
              //display: false,
              //text: 'X Position'
              display: false
            //}
          },
          y: {
            /*
            title: {
              display: false,
              text: 'Y Position'
            },
            ticks: {
              display: false
            },
            border: {
              color: 'black', 
              width: 5
            }
              */
            display: false
          }
        },
      }
    });
  };

const initialiseWindCompass = (windDirection, windSpeed) => {
  if (windCompassInstance.current) {
    windCompassInstance.current.destroy();
  }

  const createWindVector = (bearing, speed) => {
    const data = new Array(360).fill(0);
    const normalizedBearing = bearing % 360;
    data[normalizedBearing] = speed;
    data[(normalizedBearing + 1) % 360] = speed * 0.3;
    data[(normalizedBearing - 1 + 360) % 360] = speed * 0.3;
    return data;
  };

  const windVector = createWindVector(windDirection, windSpeed);
  const ctx = windCompassRef.current.getContext('2d');

  windCompassInstance.current = new Chart(ctx, {
    type: 'radar',
    data: {
      datasets: [{
        data: windVector,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderColor: 'white',
        pointBackgroundColor: function(context) {
          const index = context.dataIndex;
          return index === windDirection % 360 ? '#FF6B6B' : 'transparent';
        },
        pointBorderColor: '#FF6B6B',
        pointRadius: 4,
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
        tooltip: {
          callbacks: {
            title: function(tooltipItems) {
              if (tooltipItems[0].parsed.r > 0) {
                const bearing = tooltipItems[0].dataIndex;
                const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                const directionIndex = Math.round(bearing / 22.5) % 16;
                return `${directions[directionIndex]} (${bearing}°)`;
              }
              return '';
            },
            label: function(context) {
              if (context.parsed.r > 0) {
                return `Wind Speed: ${context.parsed.r} m/s`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 50, // Adjust based on your expected max wind speed
          ticks: {
            display: false
          },
          angleLines: {
            color: 'rgba(200, 200, 200, 0.3)',
            lineWidth: 1
          },
          grid: {
            color: 'rgba(200, 200, 200, 0.2)',
            circular: true
          },
          /*
          pointLabels: {
            display: true,
            centerPointLabels: true,
            callback: function(value, index) {
              const cardinalDirections = {
                0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 
                180: 'S', 225: 'SW', 270: 'W', 315: 'NW'
              };
              return cardinalDirections[index] || '';
            },
            font: {
              size: 12,
              weight: 'bold'
            },
            color: '#333'
          }
          */
        }
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          pointStyle: 'circle'
        }
      }
    }
  });
};


  const initialiseThrottleChart = (trackData) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Check if trackData is valid
    if (!trackData || !Array.isArray(trackData) || trackData.length === 0) {
      console.error("Invalid track data:", trackData);
      return;
    }

    const ctx = chartRef.current.getContext('2d');
    
    
    chartInstance.current = new Chart(ctx, {
      type: "line",
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
            //}
          },
          y: {
            display: false
          }
        },
      }
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Telemetry Data</h1>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

      {/* Track Graph */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Track Layout</h2>
        
        <div style={{ height: '200px' }}><canvas ref={windCompassRef} id="windCompass" /></div>
        {telemetryData.weather &&(
        <div style={{ height: '400px', width: '20%', padding:'80%' }}>
          <div><strong>Air Temp:</strong> {telemetryData.weather.airTemp}°C</div>
          <div><strong>Pressure:</strong> {telemetryData.weather.pressure}hPa</div>
          <div><strong>Rainfall:</strong><i class={telemetryData.weather.icon}></i></div>
          <div><strong>Humidity:</strong> {telemetryData.weather.humidity}%</div>
          <div><strong>Track Temp:</strong> {telemetryData.weather.trackTemp}°C</div>
          <div style={{ height: '200px' }}><canvas ref={windCompassRef} id="windCompass" /></div>
        </div>
        )}
      </div>
      {/* Track Graph */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Telemetry</h2>
        <div style={{ height: '200px' }}><canvas ref={speedGraph} id="speedGraph" /></div>
        <div style={{ height: '100px' }}><canvas ref={throttleGraph} id="throttleGraph" /></div>
        <div style={{ height: '100px' }}><canvas ref={brakeGraph} id="brakeGraph" /></div>
        <div style={{ height: '200px' }}><canvas ref={gforceCircle} id="gforceCricle" /></div>
        <div style={{ height: '200px' }}><canvas ref={tyreData} id="tyreData" /></div>
      </div>

      {/* Lap Data */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Telemetry</h2>
        <div><strong>Time:</strong> {telemetryData.current.Time}°C</div>
      </div>
    </div>
    
  );
}

export default TelemetryView;
