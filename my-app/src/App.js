import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';

function TelemetryView() {
  const [messages, setMessages] = useState([]);
  const [telemetryData, setTelemetryData] = useState({
    weather: null,
    current: null
  });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Connect to FastAPI websocket
    const ws = new WebSocket("ws://localhost:8000/frontend");

    ws.onopen = () => {
      setInterval(() => ws.send("ping"), 5000);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        
        if (parsed.type === "init") {
          // Extract weather data
          const [airTemp, pressure, rainfall, humidity, trackTemp, windDirection, windSpeed] = parsed.weather;
          const track = parsed.track;
          const weatherData = {
            airTemp,
            humidity,
            pressure,
            rainfall,
            trackTemp,
            windDirection,
            windSpeed,
          };
          
          // Extract telemetry data
          const telemetry = {
            RPM: parsed.data.RPM,
            Speed: parsed.data.Speed,
            Gear: parsed.data.Gear,
            Throttle: parsed.data.Throttle,
            Brake: parsed.data.Brake,
            Time: parsed.data.Time,
            PosData: parsed.data.PosData,
            Gforce: parsed.data.Gforce,
            GforceAngle: parsed.data.GforceAngle || parsed.data.GforceDir
          };
          
          setTelemetryData({
            track: track,
            weather: weatherData,
            current: telemetry
          });
          
          // Initialize chart if track data is available
          if (track && chartRef.current) {
            initializeChart(track);
          }
          
        } else if (parsed.type === "update") {
          // Update only the telemetry data for updates
          const telemetry = {
            RPM: parsed.data.RPM,
            Speed: parsed.data.Speed,
            Gear: parsed.data.Gear,
            Throttle: parsed.data.Throttle,
            Brake: parsed.data.Brake,
            Time: parsed.data.Time,
            PosData: parsed.data.PosData,
            Gforce: parsed.data.Gforce,
            GforceAngle: parsed.data.GforceAngle || parsed.data.GforceDir
          };
          
          setTelemetryData(prev => ({
            ...prev,
            current: telemetry
          }));
        }
        
        // Always add to message history
        setMessages((prev) => [...prev, {
          ...parsed,
          timestamp: new Date().toISOString()
        }]);
        
        
      } catch (error) {
        console.error("Failed to parse message:", error);
        setMessages((prev) => [...prev, {
          raw: event.data,
          timestamp: new Date().toISOString(),
          error: true
        }]);
      }
    };

    ws.onclose = () => console.log("Disconnected from FastAPI");

    return () => {
      ws.close();
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  const initializeChart = (trackData) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Extract X and Y coordinates from track data
    const xData = trackData.map(point => point[0]);
    const yData = trackData.map(point => point[1]);

    chartInstance.current = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [{
          label: 'Track Layout',
          data: trackData.map(point => ({x: point[0], y: point[1]})),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          pointRadius: 2,
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
            title: {
              display: true,
              text: 'X Position'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Y Position'
            }
          }
        }
      }
    });
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Telemetry Data</h1>
      
      {/* Track Graph at the top */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Track Layout</h2>
        <div style={{ height: '400px', width: '100%' }}>
          <canvas ref={chartRef} id="trackChart" />
        </div>
      </div>

      {/* Weather Data Display */}
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

      {/* Current Telemetry Display */}
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
      
      {/* Raw Message History */}
    </div>
  );
}

export default TelemetryView;