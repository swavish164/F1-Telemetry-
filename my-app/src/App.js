import React, { useEffect, useState } from "react";

function App() {
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    // Connect to FastAPI websocket
    const ws = new WebSocket("ws://localhost:8000/frontend");

    ws.onopen = () => {
      console.log("Connected to FastAPI WebSocket");
      // Send keep-alive messages (backend expects receive_text)
      setInterval(() => {
        ws.send("ping");
      }, 5000);
    };

    ws.onmessage = (event) => {
      console.log("Received:", event.data);
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error("Invalid JSON:", err);
      }
    };

    ws.onclose = () => {
      console.log("Disconnected from WebSocket");
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Live Telemetry</h1>
      {telemetry ? (
        <pre>{JSON.stringify(telemetry, null, 2)}</pre>
      ) : (
        <p>Waiting for data...</p>
      )}
    </div>
  );
}

export default App;



