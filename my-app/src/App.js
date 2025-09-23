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
      initializeChart(trackPoints);
    }
  }, [trackPoints, trackLength]);

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
        rainfall,
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


  const initializeChart = (trackData) => {
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


  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Telemetry Data</h1>
      

      {/* Track Graph */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Track Layout</h2>
        <div className="chart-container" style={{ height: '400px', width: '80%' }}>
          <canvas ref={chartRef} id="trackChart" />
        </div>
        <div style={{ height: '400px', width: '20%', padding:'80%' }}>
          <div><strong>Air Temp:</strong> {telemetryData.weather[0]}°C</div>
          <div><strong>Pressure:</strong> {telemetryData.weather[2]}hPa</div>
        </div>
      </div>

    </div>
  );
}

export default TelemetryView;

/*

      {telemetryData.weather && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Weather Conditions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><strong>Air Temp:</strong> {telemetryData.weather.airTemp}°C</div>
            <div><strong>Pressure:</strong> {telemetryData.weather.pressure}hPa</div>
            <div><strong>Rainfall:</strong> {telemetryData.weather.rainfall ? "Yes" : "No"}</div>
            <div><strong>Humidity:</strong> {telemetryData.weather.humidity}%</div>
            <div><strong>Track Temp:</strong> {telemetryData.weather.trackTemp}°C</div>
            <div><strong>Wind Speed:</strong> {telemetryData.weather.windSpeed}m/s</div>
            <div><strong>Wind Direction:</strong> {telemetryData.weather.windDirection}°</div>
          </div>
        </div>
      )}

      {telemetryData.current && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Current Telemetry</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><strong>RPM:</strong> {telemetryData.current.RPM}</div>
            <div><strong>Speed:</strong> {telemetryData.current.Speed} km/h</div>
            <div><strong>Gear:</strong> {telemetryData.current.Gear}</div>
            <div><strong>Throttle:</strong> {telemetryData.current.Throttle}%</div>
            <div><strong>Brake:</strong> {telemetryData.current.Brake}%</div>
            <div><strong>Time:</strong> {telemetryData.current.Time}s</div>
          </div>
        </div>
      )}
*/