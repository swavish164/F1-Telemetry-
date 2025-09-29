import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';

import trackChart from "./TrackChart";
import windCompass from "./windChart";


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

  return (
    <div class = "parent">
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Telemetry Data</h1>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

      {/* Track Graph */}
      <></>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Track Layout</h2>
        <div class="div1"> 
        <div style={{ height: '200px' }}><canvas ref={trackChart} id="trackChart" /></div>
        </div>
        <div class="div2"> 
        {telemetryData.weather &&(
        <div style={{ height: '400px', width: '20%', padding:'80%' }}>
          <div><strong>Air Temp:</strong> {telemetryData.weather.airTemp}°C</div>
          <div><strong>Pressure:</strong> {telemetryData.weather.pressure}hPa</div>
          <div><strong>Rainfall:</strong><i class={telemetryData.weather.icon}></i></div>
          <div><strong>Humidity:</strong> {telemetryData.weather.humidity}%</div>
          <div><strong>Track Temp:</strong> {telemetryData.weather.trackTemp}°C</div>
          <div style={{ height: '200px' }}><canvas ref={windCompass} id="windCompass" /></div>
        </div>
        )}
        </div>
      </div>
      {/* Main bit*/}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="div3"> 
        <div style={{ height: '200px' }}><canvas ref={speedGraph} id="speedGraph" /></div>
        </div>
        <div class="div4"> 
        <div style={{ height: '100px' }}><canvas ref={throttleGraph} id="throttleGraph" /></div>
        </div>
        <div class="div5"> 
        <div style={{ height: '200px' }}><canvas ref={gforceCircle} id="gforceCricle" /></div>
        </div>
        <div class="div6"> 
        <div style={{ height: '200px' }}><canvas ref={lapData} id="tyreData" /></div>
        </div>
        <div class="div7"> 
        <div style={{ height: '200px' }}><canvas ref={tyreData} id="tyreData" /></div>
        </div>
      </div>

      {/* Lap Data */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Telemetry</h2>
        <div><strong>Time:</strong> {telemetryData.current.Time}°C</div>
      </div>
    </div>
    </div>
    
  );
};

export default TelemetryView;

/*
<div class="parent">
<div class="div1"> </div>
<div class="div2"> </div>
<div class="div3"> </div>
<div class="div4"> </div>
<div class="div5"> </div>
<div class="div6"> </div>
<div class="div7"> </div>
</div>

*/
