import React, { useEffect, useState, useRef } from "react";
import Chart from 'chart.js/auto';

import WindCompassChart from "./windChart";
import TrackChart  from "./trackMap.js";
import GForceChart from "./gForceGraph.js";
import RPMGraph from "./RPMGraph.js";
import SpeedGraph from "./speedGraph.js";
import {ThrottleBar,ParseSectorInput,GetCurrentTime,SectorTimings} from "./tools.js";

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
        setTimeout(() => {
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current?.send("ping");
          }
        }, 1000);
      };

      ws.current.onmessage = (event) => {
        //console.log("Raw message received:", event.data);
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
          if (!ws.current || ws.current?.readyState === WebSocket.CLOSED) {
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
      const [airTemp, pressure, rainfall, humidity, trackTemp, windDirection, windSpeed] = parsed.data || [];
      const weatherData = {
        airTemp,
        humidity,
        pressure,
        icon: rainfall ? "fa-solid fa-cloud-showers-heavy" : "fas fa-sun",
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
        //TrackMessages: parsed.data?.Messages,
        //SessionStatus: parsed.data?.SessionStatus
      };
      
      setTelemetryData(prev => ({
        ...prev,
        current: telemetry
      }));
    } 
  };
  useEffect(() => {
  connectWebSocket();
  return () => ws.current && ws.current?.close();
}, []);

const sectorTimesCalculations = SectorTimings({sectorTimes: telemetryData.current?.SectorTimes || [], 
  deltaTimes: [deltaPaceS1,deltaPaceS2,deltaPaceS3], 
  expectedTimes: [expectedPaceS1,expectedPaceS2,expectedPaceS3], 
  overallTime: telemetryData.current?.Time})

  return (
    <div class = "parent">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>

      {/* Track Graph */}
        <div className="div1"> 
          <div style={{ height: '100%' }}><TrackChart trackData={trackPoints} driverColour={driverColour} currentPos = {telemetryData.current?.PosData}/></div>
        </div>
        <div className="div2"> 
        <div style={{ height: '50%'}}>
          <div><strong>Air Temp:</strong> {telemetryData.weather?.airTemp}°C</div>
          <div><strong>Pressure:</strong> {telemetryData.weather?.pressure}hPa</div>
          <div><strong>Rainfall:</strong><i class={telemetryData.weather?.icon}></i></div>
          <div><strong>Humidity:</strong> {telemetryData.weather?.humidity}%</div>
          <div><strong>Track Temp:</strong> {telemetryData.weather?.trackTemp}°C</div>
        </div>
        <div style={{ height: '50%' }}><WindCompassChart windDirection = {telemetryData.weather?.windDirection} windSpeed = {telemetryData.weather?.windSpeed}/></div>
      </div>
      {/* Main bit*/}
        <div className="div3"> 
          <div style={{ height: "100%" }}><SpeedGraph speed = {telemetryData.current?.Speed} time = {telemetryData.current?.Time}/></div>
        </div>
  
        <div className="div4">
          <ThrottleBar throttle={telemetryData.current?.Throttle || 0} />
        </div>
        <div className="div5" style = {{
          backgroundColor: telemetryData.current?.Brake ? "red" : "green"
        }}>  
        </div>
        <div className="div6"> 
          <div style={{ height: "100%" }}><RPMGraph RPM = {telemetryData.current?.RPM} time = {telemetryData.current?.Time}/></div>
        </div>
        <div className="div7"> 
          <div style={{ height: '100%' }}><GForceChart gForce = {telemetryData.current?.Gforce} gForceAngle = {telemetryData.current?.GforceAngle} /></div>
        </div>
        <div className="div8"> 
          <div>
          <div style = {{display: 'flex',alignItems: 'center',gap:'100px',fontSize: 30,padding: 10}}>
          <p><strong>Gear:</strong> {telemetryData.current?.Gear}</p>
          <p><strong>Speed: </strong> {telemetryData.current?.Speed} km/h </p>
          <p><strong>DRS:</strong> {telemetryData.current?.DRS ? "Active" : "Off" } </p>
          </div>
          </div>
        
        </div>
        <div className = "div12">
          <div style = {{display: 'flex',alignItems: 'center',gap:'100px',fontSize: 30,padding: 10}}>
          <p><strong>Tyre compound:</strong> {telemetryData.current?.TyreCompound} </p>
          <p><strong>Tyre Age:</strong> {telemetryData.current?.TyreAge} </p>
          </div>
        </div>
        <div className="div9"> 
            <div style = {{display: 'flex',alignItems: 'center',gap:'45px',fontSize: 30,padding: 8}}>
          <strong>Sector 1:</strong> <p style={{color: sectorTimesCalculations[0][1]}}>{sectorTimesCalculations[0][0]}</p>
          <strong>Sector 2:</strong> <p style={{color: sectorTimesCalculations[1][1]}}>{sectorTimesCalculations[1][0]}</p>
          <strong>Sector 3:</strong> <p style={{color: sectorTimesCalculations[2][1]}}>{sectorTimesCalculations[2][0]}</p>
          </div>
          <button className="open-button" onClick={() => setExpectedOpen(true)}>Change Expected</button>
          <button className="open-button" onClick={() => setDeltaOpen(true)}>Change Delta</button>
        
        </div>
        <div className = "div10">
          <p>Console</p>
          <div style = {{fontSize: 20}}>
            <ul>
              <li><p>{GetCurrentTime()}: Comment1</p></li>
              <li><p>{GetCurrentTime()}: Comment2</p></li>
              <li><p>{GetCurrentTime()}: Comment2</p></li>
            </ul>
          </div>
        </div>
        <div className = "div11">
          <div style = {{display: 'flex',alignItems: 'center',gap:'100px',fontSize: 30,padding: 10}}>
            <p>Lap: </p>
            <p>Lap Status: </p>
            <p><strong>Time:</strong> {telemetryData.current?.Time} </p>
          </div>
          <p><strong>Session Status:</strong> {telemetryData.current?.SessionStatus}</p>
        </div>
      {/* Popup Forms */}
      {expectedOpen && (
        <div className="form-popup">
          <form className="form-container" onSubmit={(e) => {
                e.preventDefault();
                const result = ParseSectorInput(expectedInput);

                if (result.valid) { 
                  setExpectedPaceS1(((result.data))[0]);
                  setExpectedPaceS2(((result.data))[1]);
                  setExpectedPaceS3(((result.data))[2]);
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
                  setDeltaPaceS1(((result.data))[0]);
                  setDeltaPaceS2(((result.data))[1]);
                  setDeltaPaceS3(((result.data))[2]);
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
    
  );
};

export default TelemetryView;

