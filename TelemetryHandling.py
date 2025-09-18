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
        def rotate(xy, *, angle):
            rot_mat = np.array([
                [np.cos(angle), np.sin(angle)],
                [-np.sin(angle), np.cos(angle)]
            ])
            return np.matmul(xy, rot_mat)

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
        circuit_info = session.get_circuit_info()
        car_Tel = lando.get_car_data()
        pos_data = lando.get_pos_data()

        # Track info
        track = pos_data.loc[:, ('X', 'Y')].to_numpy()
        track_angle = circuit_info.rotation / 180 * np.pi
        rotated_track = rotate(track, angle=track_angle)

        # Weather (single row from session.weather_data)
        lap_weather = lando.get_weather_data()
        weather = lap_weather.tolist()
        # Flatten and convert to native types
        weather = [
            float(x) if isinstance(x, (np.float32, np.float64))
            else int(x) if isinstance(x, (np.int32, np.int64))
            else bool(x) if isinstance(x, (np.bool_,))
            else x
            for x in weather[1:]
        ]

        # Car telemetry
        rpm = car_Tel['RPM']
        Speed = car_Tel['Speed']
        gear = car_Tel['nGear']
        throttle = car_Tel['Throttle']
        brake = car_Tel['Brake']
        times = car_Tel['Time']

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
                        "type": "init",
                        "weather": weather,
                        "track": rotated_track.tolist(),
                        "data": data
                    }
                else:
                    payload = {"type": "update", "data": data}

                # --- Send to MATLAB ---
                json_str = json.dumps(payload) + "\n"
                conn.sendall(json_str.encode("utf-8"))

                # --- Receive processed data from MATLAB ---
                response = conn.recv(4096)
                if not response:
                    print("MATLAB disconnected.")
                    break
                processed = response.decode("utf-8").strip()

                # Forward to FastAPI websocket
                await ws.send(processed)

                # Simulate real-time interval
                await asyncio.sleep(diff.total_seconds())

        server_socket.close()


if __name__ == "__main__":
    asyncio.run(run())
