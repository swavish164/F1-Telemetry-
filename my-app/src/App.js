
/*import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
*/
import { useEffect, useState } from "react";

export default function TelemetryViewer() {
  const [telemetry, setTelemetry] = useState(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/frontend");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTelemetry(data);
    };

    socket.onopen = () => {
      console.log("Connected to FastAPI backend");
    };

    return () => socket.close();
  }, []);

  if (!telemetry) return <p>Waiting for data...</p>;

  return (
    <div>
      <h2>Live Telemetry</h2>
      <p>Speed: {telemetry.Speed} km/h</p>
      <p>RPM: {telemetry.RPM}</p>
      <p>G-Force: {telemetry.GForce?.toFixed(2)} g</p>
    </div>
  );
}


