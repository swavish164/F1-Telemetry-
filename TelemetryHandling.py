import matplotlib.pyplot as plt
import numpy as np
import fastf1
import loadSession

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
time = car_Tel['Time']


weather_data = session.weather_data

lap_weather = weather_data.merge(car_Tel[['Time']], on='Time')

air_temp = lap_weather['AirTemp']
track_temp = lap_weather['TrackTemp']
humidity = lap_weather['Humidity']
wind_speed = lap_weather['WindSpeed']

x = pos_data['X']
y = pos_data['Y']

plt.figure(figsize=(10, 8))
plt.plot(x, y, label='Lando Norris Lap Path')
plt.xlabel('X Position')
plt.ylabel('Y Position')
plt.title('Car Position Around Track')
plt.legend()
plt.show()
