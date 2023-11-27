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

import random
from ACME_Car_EV_v01 import Vehicle
from dashboard import SmartPhone

# ABC Example

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

# Instantiate the classes Dog and Vehicle
# Instantiate the vehicle and setup the initial state
vehicle = Vehicle()
vehicle.Cabin.Sunroof.Switch.set(vehicle.Cabin.Sunroof.Switch.CLOSE)

# Instantiate the dog and get the mood
dog = Dog()
dog_mood, dog_is_sad = dog.isSad()


if dog_is_sad:
    vehicle.Cabin.Sunroof.Switch.set(vehicle.Cabin.Sunroof.Switch.OPEN)
else:
    vehicle.Cabin.Sunroof.Switch.set(vehicle.Cabin.Sunroof.Switch.CLOSE)

print(f"INFO: 	 Is dog sad? {dog_is_sad}")
# Display message on the smartphone
SmartPhone.set_text(f"Dog is {dog_mood} Sunroof: {vehicle.Cabin.Sunroof.Switch.get()}")

print(f"INFO: 	 What is Sunroof's Status? {vehicle.Cabin.Sunroof.Switch.get()}")
