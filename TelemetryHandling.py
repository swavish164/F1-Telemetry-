import json
import time
import socket
import asyncio
import websockets
import fastf1
import fastf1.plotting
import pandas as pd
import loadSession
import numpy as np


async def run():
    uri = "ws://localhost:8000/frontend"

    uri = "ws://localhost:8000/matlab"

    async with websockets.connect(uri) as ws:

        def rotate(xy, *, angle):
            rot_mat = np.array([
                [np.cos(angle), np.sin(angle)],
                [-np.sin(angle), np.cos(angle)]
            ])
            return np.matmul(xy, rot_mat)
        session = loadSession.session

        lando = session.laps.pick_drivers('4').pick_fastest()
        sessionStatus = session.session_status
        raceDirectorMessages = session._race_control_messages
        pos_data = lando.get_pos_data()
        track = pos_data.loc[:, ('X', 'Y')].to_numpy()
        circuit_info = session.get_circuit_info()
        track_angle = circuit_info.rotation / 180 * np.pi
        rotated_track = rotate(track, angle=track_angle)
        tyreCompound = lando['Compound']
        tyreLife = lando['TyreLife']
        lapStartTime = lando['LapStartTime']
        print(tyreLife)

        lap_weather = lando.get_weather_data()
        colour = fastf1.plotting.get_driver_color('NOR', session)
        weather = lap_weather.tolist()
        weather = [
            float(x) if isinstance(x, (np.float32, np.float64))
            else int(x) if isinstance(x, (np.int32, np.int64))
            else bool(x) if isinstance(x, (np.bool_,))
            else x
            for x in weather[1:]
        ]

        await ws.send(json.dumps({"type": "weather", "data": weather}))

        track_length = len(rotated_track)
        await ws.send(json.dumps({"type": "track_init", "length": track_length, "colour": colour, "rotation": track_angle}))

        for i in range(0, track_length, 10):
            chunk = rotated_track[i:i+10].tolist()
            await ws.send(json.dumps({"type": "track", "data": chunk}))

        await ws.send(json.dumps({"type": "Other data", "compound": tyreCompound, "life": tyreLife}))

        # MATLAB server
        host, port = '127.0.0.1', 65432
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.bind((host, port))
        server_socket.listen(1)
        print(f"Waiting for MATLAB on {host}:{port} ...")

        conn, addr = server_socket.accept()
        print("MATLAB connected:", addr)

        car_Tel = lando.get_car_data()

        # Car telemetry
        rpm = car_Tel['RPM']
        speed = car_Tel['Speed']
        gear = car_Tel['nGear']
        throttle = car_Tel['Throttle']
        brake = car_Tel['Brake']
        times = car_Tel['Time']
        drs = car_Tel['DRS']

        x = pos_data['X']
        y = pos_data['Y']
        z = pos_data['Z']

        sector1 = lando['Sector1Time']
        sector2 = lando['Sector2Time']
        sector3 = lando['Sector3Time']

        with conn:
            data = {
                'tyreCompound': tyreCompound,
                'weather': weather
            }

            payload = {"type": "initial", "data": data}
            json_str = json.dumps(payload) + "\n"
            conn.sendall(json_str.encode("utf-8"))

            time.sleep(1)

            for i in range(len(times) - 1):
                diff = times[i + 1] - times[i]

                data = {
                    'RPM': float(rpm.iloc[i]),
                    'Speed': float(speed.iloc[i]),
                    'Gear': float(gear.iloc[i]),
                    'Throttle': float(throttle.iloc[i]),
                    'Brake': float(brake.iloc[i]),
                    'Time': float(round(times.iloc[i].total_seconds(), 2)),
                    'PosData': [float(x.iloc[i]), float(y.iloc[i]), float(z.iloc[i])],
                    'DRS': float(drs.iloc[i]),
                }

                payload = {"type": "update", "data": data}

                # MATLAB ---
                json_str = json.dumps(payload) + "\n"
                conn.sendall(json_str.encode("utf-8"))

                # Receive MATLAB
                response = conn.recv(4096)
                if not response:
                    print("MATLAB disconnected.")
                    break
                received = response.decode("utf-8").strip()
                processed = json.loads(received)
                processed["data"]["TyreAge"] = float(tyreLife)
                processed["data"]["Sectors"] = [round(sector1.total_seconds(), 2),
                                                round(sector2.total_seconds(), 2), round(sector3.total_seconds(), 2)]

                # processed["Messages"] = raceDirectorMessages.iloc[i]
                # processed["SessionStatus"] = sessionStatus.iloc[i]

                # Forward to FastAPI websocket
                await ws.send(json.dumps(processed))

                await asyncio.sleep(diff.total_seconds())

        server_socket.close()


if __name__ == "__main__":
    asyncio.run(run())
