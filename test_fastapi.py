from fastapi import WebSocket

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    import time
    import random
    while True:
        data = {
            "speed": random.randint(50, 300),
            "rpm": random.randint(5000, 15000)
        }
        await websocket.send_json(data)
        time.sleep(0.1)

"""
import React, { useEffect, useState } from "react";

function TelemetryPanelWS() {
  const [data, setData] = useState({speed:0, rpm:0});

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws");
    ws.onmessage = (event) => {
      const json = JSON.parse(event.data);
      setData(json);
    };
    return () => ws.close();
  }, []);

  return (
    <div>
      <h2>Telemetry Dashboard (WebSocket)</h2>
      <p>Speed: {data.speed} km/h</p>
      <p>RPM: {data.rpm}</p>
    </div>
  );
}

export default TelemetryPanelWS;

"""