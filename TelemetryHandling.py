import matplotlib.pyplot as plt
import numpy as np
import fastf1
import loadSession
import time
import socket
import json

host = '127.0.0.1'
port = 65432
server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server_socket.bind((host, port))
server_socket.listen(1)
print(f"Connection {host}:{port}")

conn,addr = server_socket.accept()
#print("Connection from "+addr)


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

lap_weather = weather_data.merge(car_Tel[['Time']], on='Time')

air_temp = lap_weather['AirTemp']
track_temp = lap_weather['TrackTemp']
humidity = lap_weather['Humidity']
wind_speed = lap_weather['WindSpeed']

x = pos_data['X']
y = pos_data['Y']

current = 0

try:
    for i in range(len(times)):
        if i < len(times) - 1:
            diff = times[i+1] - times[i]
            data = {'RPM':float(rpm[i]), 'Speed':float(Speed[i]),'Gear':float(gear[i]),'Throttle':float(throttle[i]),'Brake': float(brake[i]),'Time':float(times[i].total_seconds())}
            message = json.dumps(data) +"\n"
            conn.sendall(message.encode('utf-8'))
            time.sleep(diff.total_seconds())

    
finally:
    conn.close()
    server_socket.close