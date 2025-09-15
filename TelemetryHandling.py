import json
import time
import socket
import asyncio
import websockets
import fastf1
import pandas as pd
import loadSession
import numpy as np


async def run():
    # Connect to FastAPI websocket
    uri = "ws://localhost:8000/matlab"
    async with websockets.connect(uri) as ws:
        # --- Setup TCP server for MATLAB ---
        host, port = '127.0.0.1', 65432
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind((host, port))
        server_socket.listen(1)
        print(f"Waiting for MATLAB on {host}:{port} ...")

        conn, addr = server_socket.accept()
        print("MATLAB connected:", addr)

        # --- Load telemetry data from FastF1 ---
        session = loadSession.session
        lando = session.laps.pick_drivers('4').pick_fastest()

        car_Tel = lando.get_car_data()
        pos_data = lando.get_pos_data()
        lap_weather = lando.get_weather_data()
        # Merge weather + car telemetry

        # Extract arrays
        rpm = car_Tel['RPM']
        Speed = car_Tel['Speed']
        gear = car_Tel['nGear']
        throttle = car_Tel['Throttle']
        brake = car_Tel['Brake']
        times = car_Tel['Time']

        weather = lap_weather.tolist()
        weather = weather[1:]
        weather = [float(x) if isinstance(x, (np.float32, np.float64)) 
           else int(x) if isinstance(x, (np.int32, np.int64)) 
           else bool(x) if isinstance(x, (np.bool_,)) 
           else x for x in weather[1:]]

        x = pos_data['X']
        y = pos_data['Y']
        z = pos_data['Z']

        # --- Main loop ---
        with conn:
            for i in range(len(times) - 1):
                diff = times[i + 1] - times[i]

                # Build raw data
                data = {
                    'RPM': float(rpm.iloc[i]),
                    'Speed': float(Speed.iloc[i]),
                    'Gear': float(gear.iloc[i]),
                    'Throttle': float(throttle.iloc[i]),
                    'Brake': float(brake.iloc[i]),
                    'Time': float(times.iloc[i].total_seconds()),
                    'PosData': [float(x.iloc[i]), float(y.iloc[i]), float(z.iloc[i])]
                }
                if i == 0:
                    payload = {
                        "type":"init", "weather": weather, "data": data
                    }
                else:
                    payload = {"type":"update","data":data }
                # --- Send raw data to MATLAB ---
                json_str = json.dumps(payload) + "\n"
                conn.sendall(json_str.encode("utf-8"))

                # --- Receive processed data from MATLAB ---
                response = conn.recv(4096)
                if not response:
                    print("MATLAB disconnected.")
                    break
                processed = response.decode("utf-8").strip()

                # Forward to FastAPI websocket
                print("Processed data : " + processed)
                await asyncio.sleep(diff.total_seconds())
                await ws.send(processed)

                # Simulate real-time interval
                

        server_socket.close()


if __name__ == "__main__":
    asyncio.run(run())
