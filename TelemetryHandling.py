import matplotlib.pyplot as plt
import numpy as np
import fastf1
import loadSession

session = loadSession.session
lando = session.laps.pick_drivers('4').pick_fastest()

circuit_info = session.get_circuit_info()
tel = lando.get_telemetry()
car_Tel = lando.get_car_data()

rpm = car_Tel['RPM']
Speed = car_Tel['Speed']
gear = car_Tel['nGear']
throttle = car_Tel['Throttle']
brake = car_Tel['Brake']
print(rpm)