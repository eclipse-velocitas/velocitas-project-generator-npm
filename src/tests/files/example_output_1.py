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

# flake8: noqa: E501,B950 line too long
import asyncio
import json
import logging
import signal

from sdv.util.log import (  # type: ignore
    get_opentelemetry_log_factory,
    get_opentelemetry_log_format,
)
from sdv.vdb.subscriptions import DataPointReply
from sdv.vehicle_app import VehicleApp
from sdv_model import Vehicle, vehicle  # type: ignore

# Configure the VehicleApp logger with the necessary log config and level.
logging.setLogRecordFactory(get_opentelemetry_log_factory())
logging.basicConfig(format=get_opentelemetry_log_format())
logging.getLogger().setLevel("DEBUG")
logger = logging.getLogger(__name__)


class TestApp(VehicleApp):
    """Velocitas App for test."""

    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client
        self.WiperTarget = None
        self.ActualPosition = None
        self.steps = None
        self.wipingCounter = None
        self.wipingTimes = None

    async def on_start(self):
        await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.subscribe(self.on_wiper_position_changed)
        logger.info("Wiper output Listener was registered")

        await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.subscribe(self.on_wiper_start)

        logger.info("Turn Wipers to Rain Sensor")
        await self.Vehicle.Body.Windshield.Front.Wiping.Mode.set("RAIN_SENSOR")
        logger.info("Start moving Wiper to Service position")
        await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.set(45)

        logger.info("Wiping 3 times")
        self.wipingCounter = 0
        self.wipingTimes = 3
        while self.wipingCounter <= self.wipingTimes:
            logger.info("set Wiper to End position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(90)
            logger.info("Start Wiper movement to End position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.set("WIPE")
            logger.info("set Wiper to 0 position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(0)
            logger.info("Start Wiper movement to 0 position")
            await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.set("WIPE")
            self.wipingCounter += 1
        logger.info("Finished Wiping")

    async def on_wiper_position_changed(self, data: DataPointReply):
        position = data.get(self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition).value
        logger.info("Listener was triggered")
        logger.info("Wiper is moving")
        await self.publish_mqtt_event(
            "SmartPhone",
            json.dumps(
                {
                    "result": {
                        "message": f"""Wiper is finished and will return to {position}"""
                    }
                }
            ),
        )
        await self.publish_mqtt_event(
            "CarDash",
            json.dumps(
                {
                    "result": {
                        "message": f"""Wiper is finished and will return to {position}"""
                    }
                }
            ),
        )
        if position >= (await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get()).value:
            await self.publish_mqtt_event(
                "CarDash",
                json.dumps({"result": {"message": f"""Wiper {position} reached"""}}),
            )

    async def on_wiper_start(self, data: DataPointReply):
        WipeMode = data.get(self.Vehicle.Body.Windshield.Front.Wiping.System.Mode).value
        logger.info("---------Wiper movement triggered------------")
        logger.info("Wiping Mode: {(await self.Vehicle.Body.Windshield.Front.Wiping.System.Mode.get()).value}")
        if WipeMode == "WIPE":
            self.WiperTarget = (await self.Vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get()).value
            logger.info("Wiping Target: {self.WiperTarget}")
            self.ActualPosition = (await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get()).value
            self.steps = 1
            if self.ActualPosition < self.WiperTarget:
                self.steps = (await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.get()).value /10
            if self.ActualPosition > self.WiperTarget:
                self.steps = (await self.Vehicle.Body.Windshield.Front.Wiping.System.Frequency.get()).value / 10 * -1
            while self.ActualPosition != self.WiperTarget:
                await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.set(self.ActualPosition)
                logger.info("Acutal wiper Pos: {(await self.Vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get()).value} Target: {self.WiperTarget}")
                self.ActualPosition += self.steps
            logger.info("Finished Movement")


async def main():
    logger.info("Starting TestApp...")
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
