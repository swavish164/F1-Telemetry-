import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';

function TelemetryView() {
  const [trackLength] = useState(null)
  const [messages, setMessages,setTrackPoints] = useState([]);
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
    console.log("Parsed message:", parsed);
    
    if (parsed.type === "weather") {
      console.log("Init")
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
      
      
    }else if (parsed.type === "track_init") {
      trackLength() = parsed.length;
      setTrackPoints([]);

      
    }else if (parsed.type === "track") {
      const track = parsed.data
      setTrackPoints = setTrackPoints + track
      if(setTrackPoints.length == trackLength){
        initializeChart(setTrackPoints);
      }
      
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
      

      {/* Track Graph */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Track Layout</h2>
        <div style={{ height: '400px', width: '100%' }}>
          <canvas ref={chartRef} id="trackChart" />
        </div>
      </div>

      {/* Debug Information */}
      <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Debug Info</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><strong>Connection:</strong> {connectionStatus}</div>
          <div><strong>Track Data:</strong> {telemetryData.track ? `${telemetryData.track.length} points` : 'No data'}</div>
          <div><strong>Messages Received:</strong> {messages.length}</div>
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