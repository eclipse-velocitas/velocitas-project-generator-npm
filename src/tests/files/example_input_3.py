# Copyright (c) 2023 Contributors to the Eclipse Foundation
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0

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
