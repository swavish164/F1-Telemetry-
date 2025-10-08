import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';

import WindCompassChart from "./windChart";
import TackChart from "./trackMap";
import GForceChart from "my-app\\src\\gForceGraph.js";
import RPMGraph from "RPMGraph./";
import SpeedGraph from "speedGraph./";
import {ThrottleBar,ParseSectorInput,CalculateSectorColour} from "./tools.js";


function TelemetryView() {
  const [trackLength,setTrackLength] = useState(null);
  const [driverColour,setDriverColour] = useState(null);
  const [trackPoints,setTrackPoints] = useState([]);
  const [expectedOpen, setExpectedOpen] = useState(false);
  const [deltaOpen, setDeltaOpen] = useState(false);
  const [expectedPaceS3, setExpectedPaceS3] = useState("");
  const [expectedPaceS2, setExpectedPaceS2] = useState("");
  const [expectedPaceS1, setExpectedPaceS1] = useState("");
  const [expectedInput, setExpectedInput] = useState("");
  const [deltaInput, setDeltaInput] = useState("");
  const [deltaPaceS1, setDeltaPaceS1] = useState("");
  const [deltaPaceS2, setDeltaPaceS2] = useState("");
  const [deltaPaceS3, setDeltaPaceS3] = useState("");
  const [messages, setMessages] = useState([]);
  const [telemetryData, setTelemetryData] = useState({
    weather: null,
    current: null,
    track: null
  });
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const ws = useRef(null);

  const connectWebSocket = () => {
    try {
      setConnectionStatus('Connecting...');
      ws.current = new WebSocket("ws://localhost:8000/frontend");

      ws.current.onopen = () => {
        console.log("WebSocket connected successfully");
        setConnectionStatus('Connected');
        // Don't send ping immediately, wait for connection to stabilise
        setTimeout(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send("ping");
          }
        }, 1000);
      };

      ws.current.onmessage = (event) => {
        console.log("Raw message received:", event.data);
        
        try {
          const parsed = JSON.parse(event.data);
          handleParsedMessage(parsed);
        } catch (error) {
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
        GforceAngle: parsed.data?.GforceAngle || parsed.data?.GforceDir,
        DRS: parsed.data?.DRS,
        TyreCompound: parsed.data?.tyreCompound,
        TyreAge: parsed.data?.TyreAge,
        SectorTimes: parsed.data?.Sectors,
        TrackMessages: parsed.data?.Messages,
        SessionStatus: parsed.data?.SessionStatus
      };
      
      setTelemetryData(prev => ({
        ...prev,
        current: telemetry
      }));
    } 
  };
  useEffect(() => {
  connectWebSocket();
  return () => ws.current && ws.current.close();
}, []);

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
        <div style={{ height: '400px' }}><TackChart trackData={trackPoints} driverColour={driverColour} currentPos = {telemetryData.current.PosData}/></div>
        </div>
        <div class="div2"> 
        {telemetryData.weather &&(
        <div style={{ height: '400px'}}>
          <div><strong>Air Temp:</strong> {telemetryData.weather.airTemp}°C</div>
          <div><strong>Pressure:</strong> {telemetryData.weather.pressure}hPa</div>
          <div><strong>Rainfall:</strong><i class={telemetryData.weather.icon}></i></div>
          <div><strong>Humidity:</strong> {telemetryData.weather.humidity}%</div>
          <div><strong>Track Temp:</strong> {telemetryData.weather.trackTemp}°C</div>
          <div style={{ height: '200px' }}><WindCompassChart windDirection = {telemetryData.weather.windDirection} windSpeed = {telemetryData.weather.windSpeed}/></div>
        </div>
        )}
        </div>
      </div>
      {/* Main bit*/}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div class="div3"> 
        <div style={{ height: '200px' }}><SpeedGraph speed = {telemetryData.current.Speed}/></div>
        </div>
        <div class="div4"> 
        <div style={{ height: '100px' }}><RPMGraph throttle = {telemetryData.current.RPM}/></div>
        </div>
        <div class="div5">
          <throttleBar throttle={telemetryData.current?.Throttle || 0} />
        </div>
        <div class="div6"> 
            <div id="brakeLight" style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: telemetryData.current?.Brake ? "red" : "green"}}
            ></div>        
        </div>
        <div class="div7"> 
        <div style={{ height: '200px' }}><GForceChart gForce = {telemetryData.current.Gforce} gForceAngle = {telemetryData.current.GforceAngle} /></div>
        </div>
        <div class="div8"> 
          <div>
          <strong>Gear:</strong> {telemetryData.current?.Gear}
          <strong>Speed: </strong> {telemetryData.current?.Speed} km/h
          <strong>DRS:</strong> {telemetryData.current.DRS ? "Active" : "Off" }
          <strong>Tyre compound:</strong> {telemetryData.current.TyreCompound}
          <strong>Tyre Age:</strong> {telemetryData.current.TyreAge}
          </div>
        
        </div>
        <div class="div9"> 
          lap,lap status,
          <div>
          <strong>Time:</strong> {telemetryData.current.Time} 
          <strong>Session Status:</strong> {telemetryData.current.SessionStatus}
          <strong>Sector 1:</strong> <p style="color:calculateSectorColour(telemetryData.current.SectorTimes[1],deltaPaceS1,expectedPaceS1)">{telemetryData.current.SectorTimes[1]}</p>
          <strong>Sector 2:</strong> <p style="color:calculateSectorColour(telemetryData.current.SectorTimes[2],deltaPaceS2,expectedPaceS2)">{telemetryData.current.SectorTimes[2]}</p>
          <strong>Sector 3:</strong> <p style="color:calculateSectorColour(telemetryData.current.SectorTimes[3],deltaPaceS3,expectedPaceS3)">{telemetryData.current.SectorTimes[3]}</p>
          <button className="open-button" onClick={() => setExpectedOpen(true)}>Change Expected</button>
          <button className="open-button" onClick={() => setDeltaOpen(true)}>Change Delta</button>
          
          </div>
        </div>
      </div>
      {/* Popup Forms */}
      {expectedOpen && (
        <div className="form-popup">
          <form className="form-container" onSubmit={(e) => {
                e.preventDefault();
                const result = ParseSectorInput(expectedInput);

                if (result.valid) { 
                  setExpectedPaceS1(((result.data).split())[0]);
                  setExpectedPaceS2(((result.data).split())[1]);
                  setExpectedPaceS3(((result.data).split())[2]);
                  setExpectedOpen(false);
                } else {
                  alert("Please enter 3 valid sector times (e.g. 30.0 35.0 25.0)");
                }
              }}>
            <h1>Expected Pace</h1>
            <label><b>New Expected Pace</b></label>
            <input type="text" placeholder="Enter New Expected Pace For Each Sector (With Spaces)" onChange = {(e) => setExpectedInput(e.target.value)} required />
            <button type="submit" className="btn">Confirm</button>
            <button type="button" className="btn cancel" onClick={() => setExpectedOpen(false)}>Close</button>
          </form>
        </div>
      )}

      {deltaOpen && (
        <div className="form-popup">
          <form className="form-container" onSubmit={(e) => {
                e.preventDefault();
                const result = ParseSectorInput(deltaInput);

                if (result.valid) {
                  setDeltaPaceS1(((result.data).split())[0]);
                  setDeltaPaceS2(((result.data).split())[1]);
                  setDeltaPaceS3(((result.data).split())[2]);
                  setDeltaOpen(false);
                } else {
                  alert("Please enter 3 valid sector times (e.g. 30.0 35.0 25.0)");
                }
              }}>
            <h1>Delta Pace</h1>
            <label><b>New Delta Pace</b></label>
            <input type="text" placeholder="Enter New Delta Pace For Each Sector (With Spaces)" onChange = {(e) => setDeltaInput(e.target.value)} required />
            <button type="submit" className="btn">Confirm</button>
            <button type="button" className="btn cancel" onClick={() => setDeltaOpen(false)}>Close</button>
          </form>
        </div>
      )}       

    </div>
    </div>
    
  );
};

export default TelemetryView;

