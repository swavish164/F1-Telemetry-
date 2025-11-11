# F1-Telemetry-
A real-time Formula 1 telemetry visualisation system that streams live car data, processes it through MATLAB physics models, and renders the results on a dynamic React web dashboard.
This project uses Python, MATLAB, and React to calculate and display telemetry metrics such as speed, RPM, G-forces, tyre wear, and track position simulating real time.

# Overview
  ### Python backend
Collects car telemetry and weather data using the fastf1 library, processes it, and streams updates through both WebSocket (to the frontend) and TCP (to MATLAB).
  ### MATLAB physics engine
Receives telemetry updates, computes G-forces and tyre wear using physical equations, and returns processed data back to Python.
   ### React frontend
Displays all telemetry data, including live track position, speed, RPM, throttle/brake inputs, tyre degradation, and environmental conditions. Through interactive charts and visual indicators.

## Live Dashboard Features
   - Real-time speed, RPM, throttle, and brake monitoring
   - Dynamic G-force vector visualization
   - Track position map with live car updates
   - Tyre wear tracking per wheel
   - Weather and environmental telemetry
   - Sector time tracking and lap data console
