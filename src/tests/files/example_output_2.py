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

import random
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

class Dog:
    def isSad(self):
        l_mood = self.mood()
        return (l_mood, l_mood in ["Sad", "Crying"])

    def mood(self):
        return random.choice([
            "Happy",
            "Sad",
            "Crying",
            "Frightened",
            "Excited"
        ])

class TestApp(VehicleApp):


    def __init__(self, vehicle_client: Vehicle):
        super().__init__()
        self.Vehicle = vehicle_client

    async def on_start(self):
        await self.Vehicle.Cabin.Sunroof.Switch.set(self.Vehicle.Cabin.Sunroof.Switch.CLOSE)

        dog = Dog()
        dog_mood, dog_is_sad = dog.isSad()


        if dog_is_sad:
            await self.Vehicle.Cabin.Sunroof.Switch.set(self.Vehicle.Cabin.Sunroof.Switch.OPEN)
        else:
            await self.Vehicle.Cabin.Sunroof.Switch.set(self.Vehicle.Cabin.Sunroof.Switch.CLOSE)

        logger.info("INFO: 	 Is dog sad? {dog_is_sad}")
        await self.publish_mqtt_event("SmartPhone", json.dumps({"result": {"message": f"""Dog is {dog_mood} Sunroof: {await self.Vehicle.Cabin.Sunroof.Switch.get()}"""}}))

        logger.info("INFO: 	 What is Sunroof's Status? {await self.Vehicle.Cabin.Sunroof.Switch.get()}")



async def main():


    logger.info("Starting TestApp...")
    vehicle_app = TestApp(vehicle)
    await vehicle_app.run()


LOOP = asyncio.get_event_loop()
LOOP.add_signal_handler(signal.SIGTERM, LOOP.stop)
LOOP.run_until_complete(main())
LOOP.close()
