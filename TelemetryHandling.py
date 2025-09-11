import json
import time
import socket
import asyncio
import websockets
import fastf1
import pandas as pd
import loadSession


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
        weather_data = session.weather_data

        # Merge weather + car telemetry
        lap_weather = pd.merge_asof(
            car_Tel.sort_values('Time'),
            weather_data.sort_values('Time'),
            on='Time',
            direction='nearest'
        )

        # Extract arrays
        rpm = car_Tel['RPM']
        Speed = car_Tel['Speed']
        gear = car_Tel['nGear']
        throttle = car_Tel['Throttle']
        brake = car_Tel['Brake']
        times = car_Tel['Time']

        air_temp = lap_weather['AirTemp']
        track_temp = lap_weather['TrackTemp']
        humidity = lap_weather['Humidity']
        wind_speed = lap_weather['WindSpeed']

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
                    'Weather': [
                        float(air_temp.iloc[i]),
                        float(track_temp.iloc[i]),
                        float(humidity.iloc[i]),
                        float(wind_speed.iloc[i])
                    ],
                    'PosData': [float(x.iloc[i]), float(y.iloc[i]), float(z.iloc[i])]
                }

                # --- Send raw data to MATLAB ---
                json_str = json.dumps(data) + "\n"
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



"""
import  json, time, pandas as pd
import loadSession
import websockets, asyncio




async def run():
    uri = "ws://localhost:8000/matlab"
    async with websockets.connect(uri) as ws:
      session = loadSession.session
      lando = session.laps.pick_drivers('4').pick_fastest()

      circuit_info = session.get_circuit_info()
      tel = lando.get_telemetry()
      car_Tel = lando.get_car_data()
      pos_data = lando.get_pos_data()


      rpm = car_Tel['RPM']
      Speed = car_Tel['Speed']
      gear = car_Tel['nGear']
      throttle = car_Tel['Throttle']
      brake = car_Tel['Brake']
      times = car_Tel['Time']


      weather_data = session.weather_data

      lap_weather = pd.merge_asof(
            car_Tel.sort_values('Time'),
            weather_data.sort_values('Time'),
            on='Time',
            direction='nearest'
        )

      air_temp = lap_weather['AirTemp']
      track_temp = lap_weather['TrackTemp']
      humidity = lap_weather['Humidity']
      wind_speed = lap_weather['WindSpeed']

      x = pos_data['X']
      y = pos_data['Y']
      z = pos_data['Z']
      current = 0
      for i in range(len(times)):
        if i < len(times) - 1:
          diff = times[i+1] - times[i]
          data = {'RPM':float(rpm[i]),
              'Speed':float(Speed[i]),
              'Gear':float(gear[i]),
              'Throttle':float(throttle[i]),
              'Brake': float(brake[i]),
              'Time':float(times[i].total_seconds()),
              'Weather':[air_temp.iloc[i],track_temp.iloc[i],humidity.iloc[i],wind_speed.iloc[i]],
              'PosData': [x[i],y[i],z[i]]}
          await ws.send(json.dumps(data))
          await asyncio.sleep(diff.total_seconds())
asyncio.run(run())
"""
    
    