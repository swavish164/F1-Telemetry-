import React, { useEffect, useRef } from "react";
import { addMessageConsole } from "./consoleMessages";  

var prev = false

export function ThrottleBar({throttle}) {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "black",
      borderRadius: "10px",
      display: "flex",
      alignItems: "flex-end"
    }}>
      <div style={{
        width: "100%",
        height: `${throttle}%`,
        background: "green",
        transition: "height 0.2s ease"
      }} />
    </div>
  );
}


export function TelemetryConsole({ messages, scaleFactor }) {
  const consoleEndRef = useRef(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div style={{ fontSize: 15 * scaleFactor }}>
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>
            <p
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: msg }}
            />
          </li>
        ))}
      </ul>
      <div ref={consoleEndRef} />
    </div>
  );
}


export function DRSBool(DRS){
  if(DRS > 8){
    if(prev === false){
      addMessageConsole('DRS <span style="color: lime; font-weight: bold;">enabled</span>');
      prev = true
    }
    return true 
  }
  else{
    if(prev === true){
      addMessageConsole('DRS <span style="color: red; font-weight: bold;">disabled</span>');
      prev = false
    }
    return false
  }
} 

export function ParseSectorInput(input) {
  const parts = input
    .split(/[,\s]+/) // split by comma or whitespace
    .map(v => parseFloat(v.trim()))
    .filter(v => !isNaN(v));

  if (parts.length !== 3) {
    return { valid: false, data: [] };
  }

  return { valid: true, data: parts };
}

export function CalculateSectorColour(time,delta,expected){
  if(time >= delta){
    return "purple";
  }else if(time >= expected){
    return "green";
  }else{
    return "red";
  };
};

export function SectorTimings({sectorTimes,deltaTimes,expectedTimes,overallTime}){
  let sectorOne = [0,'gray']
  let sectorTwo = [0,'gray']
  let sectorThree = [0,'gray']

  if (!Array.isArray(sectorTimes) || sectorTimes.length < 3) {
    return [sectorOne, sectorTwo, sectorThree];
  }
  for(let i=0;i < 3;i++){
    switch(i){
      case 0:
        if(sectorTimes[0] < overallTime){
          sectorOne[0] = sectorTimes[0]
          sectorOne[1] = CalculateSectorColour(sectorTimes[0],deltaTimes[0],expectedTimes[0])
        }
        else{
          sectorOne[0] = overallTime
          i = 3
        }
        break;
      case 1:
        if(sectorTimes[0] + sectorTimes[1] < overallTime){
          sectorTwo[0] = sectorTimes[1]
          sectorTwo[1] = CalculateSectorColour(sectorTimes[1],deltaTimes[1],expectedTimes[1])
        }
        else{
          sectorTwo[0] = (overallTime - sectorTimes[0]).toFixed(2)
          i=3
        }

        break;
      case 2:
        if(sectorTimes[0] + sectorTimes[1] + sectorTimes[2] < overallTime){
          sectorThree[0] = sectorTimes[2]
          sectorThree[1] = CalculateSectorColour(sectorTimes[2],deltaTimes[2],expectedTimes[2])
        }
        else{
          sectorThree[0] = (overallTime - sectorTimes[0] - sectorTimes[1]).toFixed(2)
        }
        break;
      default:
        break;
    }
  }

  return [sectorOne,sectorTwo,sectorThree]
}

export function GetCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}


export function RotatePosition(point, angle){
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point[0] * cos - point[1] * sin,
    y: point[0] * sin + point[1] * cos
  }
}


