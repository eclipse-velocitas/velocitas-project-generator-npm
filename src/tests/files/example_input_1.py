# VSS imports the playground. In production, the config can be updated to use the real VSS API
from ACME_Car_EV_v01 import Vehicle
from dashboard import SmartPhone, CarDash

vehicle = Vehicle()

def on_wiper_position_changed(position: float):
    print("Listener was triggered")
    print("Wiper is moving")
    SmartPhone.set_text(f"Wiper is finished and will return to {position}")
    CarDash.set_text(f"Wiper is finished and will return to {position}")
    if position >= vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get():
        CarDash.set_text(f"Wiper {position} reached")

vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.subscribe(on_wiper_position_changed)
print("Wiper output Listener was registered")

def on_wiper_start(WipeMode):
    print("---------Wiper movement triggered------------")
    #print(f"{vehicle.Body.Windshield.Front.Wiping.System.Mode.WIPE}")
    #print(f"{WipeMode}-----")
    print(f"Wiping Mode: {vehicle.Body.Windshield.Front.Wiping.System.Mode.get()}")
    if WipeMode == "WIPE":
        WiperTarget = vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.get()
        print(f"Wiping Target: {WiperTarget}")
        ActualPosition = vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get()
        steps = 1
        if ActualPosition < WiperTarget:
            steps = vehicle.Body.Windshield.Front.Wiping.System.Frequency.get() /10
        if ActualPosition > WiperTarget:
            steps = vehicle.Body.Windshield.Front.Wiping.System.Frequency.get() / 10 * -1
        while ActualPosition != WiperTarget:
            vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.set(ActualPosition)
            print(f"Acutal wiper Pos: {vehicle.Body.Windshield.Front.Wiping.System.ActualPosition.get()} Target: {WiperTarget}")
            ActualPosition += steps
            #time sleep
        print("Finished Movement")

vehicle.Body.Windshield.Front.Wiping.System.Mode.subscribe(on_wiper_start)

# Turn wiper on
print("Turn Wipers to Rain Sensor")
vehicle.Body.Windshield.Front.Wiping.Mode.set(vehicle.Body.Windshield.Front.Wiping.Mode.RAIN_SENSOR)
print("Start moving Wiper to Service position")
vehicle.Body.Windshield.Front.Wiping.System.Frequency.set(45)

print("Wiping 3 times")
wipingCounter = 0
wipingTimes = 3
while wipingCounter <= wipingTimes:
    print("set Wiper to End position")
    vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(90)
    print("Start Wiper movement to End position")
    vehicle.Body.Windshield.Front.Wiping.System.Mode.set(vehicle.Body.Windshield.Front.Wiping.System.Mode.WIPE)
    print("set Wiper to 0 position")
    vehicle.Body.Windshield.Front.Wiping.System.TargetPosition.set(0)
    print("Start Wiper movement to 0 position")
    vehicle.Body.Windshield.Front.Wiping.System.Mode.set(vehicle.Body.Windshield.Front.Wiping.System.Mode.WIPE)
    wipingCounter += 1
print("Finished Wiping")
