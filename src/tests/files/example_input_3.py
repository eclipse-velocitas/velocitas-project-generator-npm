from sdv_model import Vehicle
import plugins
from browser import aio

print = plugins.Terminal.print
plugins.Terminal.reset()
vehicle = Vehicle()

REQUEST_TOPIC = "seatadjuster/setPosition/request"
RESPONSE_TOPIC = "seatadjuster/setPosition/response"
UPDATE_TOPIC = "seatadjuster/currentPosition"


async def on_seat_position_changed(position):
    message = "Seat position Updated"
    print(message)

print("Subscribe for position updates")
await vehicle.Cabin.Seat.Row1.Pos1.Position.subscribe(on_seat_position_changed)

# wait for few seconds
await aio.sleep(3)

position = 300
print("Set seat position if speed is ZERO")
vehicle_speed = await vehicle.Speed.get()
if vehicle_speed == 0:
    message = "Move seat to new position"
    await vehicle.Cabin.Seat.Row1.Pos1.Position.set(position)
else:
    message = "Not allowed to move seat, vehicle is moving!"

print(message)
