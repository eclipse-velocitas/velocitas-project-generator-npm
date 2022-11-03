# Copyright (c) 2022 Robert Bosch GmbH and Microsoft Corporation
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



# pylint: disable=C0103, C0413, E1101

import asyncio
import json
import logging
import signal

from sdv.util.log import (  # type: ignore
    get_opentelemetry_log_factory,
    get_opentelemetry_log_format,
)
from sdv.vdb.subscriptions import DataPointReply
from sdv.vehicle_app import VehicleApp, subscribe_topic
from sdv_model import Vehicle, vehicle  # type: ignore

# Configure the VehicleApp logger with the necessary log config and level.
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(format=get_opentelemetry_log_format())
logging.getLogger().setLevel("DEBUG")
logger = logging.getLogger(__name__)



class TestApp(VehicleApp):


    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.subscribe(self.on_wiper_position_changed)
        logger.info("Wiper output Listener was registered")


        await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.subscribe(self.on_wiper_start)

        logger.info("Turn Wipers to Rain Sensor")
        await self.Vehicle.Body.Windshield.Front.Wiping.Mode.set(self.Vehicle.Body.Windshield.Front.Wiping.Mode.RAIN_SENSOR)
        logger.info("Start moving Wiper to Service position")
        await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.set(45)

        logger.info("Wiping 3 times")
        wipingCounter = 0
        wipingTimes = 3
        while wipingCounter <= wipingTimes:
            logger.info("set Wiper to End position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(90)
            logger.info("Start Wiper movement to End position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.set(self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.WIPE)
            logger.info("set Wiper to 0 position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(0)
            logger.info("Start Wiper movement to 0 position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.set(self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.WIPE)
            wipingCounter += 1
        logger.info("Finished Wiping")

    async def on_wiper_position_changed(self, data: DataPointReply):
        position = data.get(self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition).value
        logger.info("Listener was triggered")
        logger.info("Wiper is moving")
        await self.publish_mqtt_event("SmartPhone", json.dumps({"result": {"message": f"""Wiper is finished and will return to {position}"""}}))
        await self.publish_mqtt_event("CarDash", json.dumps({"result": {"message": f"""Wiper is finished and will return to {position}"""}}))
        if position >= await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get().value:
            await self.publish_mqtt_event("CarDash", json.dumps({"result": {"message": f"""Wiper {position} reached"""}}))

    async def on_wiper_start(self, data: DataPointReply):
        WipeMode = data.get(self.Vehicle.Body.Windshield.Front.Wiping.System.Mode).value
        logger.info("---------Wiper movement triggered------------")
        logger.info("Wiping Mode: {await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.get().value}")
        if WipeMode == "WIPE":
            WiperTarget = await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get().value
            logger.info("Wiping Target: {WiperTarget}")
            ActualPosition = await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get().value
            steps = 1
            if ActualPosition < WiperTarget:
                steps = await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.get().value /10
            if ActualPosition > WiperTarget:
                steps = await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.get().value / 10 * -1
            while ActualPosition != WiperTarget:
                await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.set(ActualPosition)
                logger.info("Acutal wiper Pos: {await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get().value} Target: {WiperTarget}")
                ActualPosition += steps
            logger.info("Finished Movement")

async def main():


    logger.info("Starting TestApp...")
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
