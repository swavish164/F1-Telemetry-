import matplotlib.pyplot as plt
import numpy as np
import fastf1
import loadSession
import time
import socket
import json
import pandas as pd

host = '127.0.0.1'
port = 65432
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((host, port))
server_socket.listen(1)
print(f"Connection {host}:{port}")

conn,addr = server_socket.accept()
conn_file = conn.makefile('r')


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

try:
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
            json_str = json.dumps(data) + "\n"
            # Send to MATLAB
            conn.sendall(json_str.encode('utf-8'))
            time.sleep(diff.total_seconds())

            response_line = conn_file.readline()
            if response_line:
                processed_data = json.loads(response_line)
                print("Received from MATLAB:", processed_data)

    
finally:
    conn.close()
    conn_file.close()
    server_socket.close