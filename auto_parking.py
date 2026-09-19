import requests
import time

# ==============================
# AIRTABLE SETTINGS
# ==============================

BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json"
}


# ==============================
# GET ALL PARKING SLOTS
# ==============================

def get_slots():

    response = requests.get(
        URL,
        headers=HEADERS
    )

    if response.status_code != 200:
        print("❌ Airtable error")
        print(response.text)
        return []

    return response.json().get("records", [])


# ==============================
# START
# ==============================

print("======================================")
print("     SMART PARKING AUTO MONITOR")
print("======================================")
print("Monitoring ALL locations and slots...")
print("Press CTRL + C to stop.")
print()


previous_status = {}


while True:

    records = get_slots()

    if not records:
        time.sleep(2)
        continue

    for record in records:

        record_id = record["id"]
        fields = record["fields"]

        location = fields.get(
            "locationId",
            "Unknown Location"
        )

        slot_number = fields.get(
            "slotNumber",
            "Unknown Slot"
        )

        status = fields.get(
            "status",
            "UNKNOWN"
        )

        # First time seeing this slot
        if record_id not in previous_status:

            previous_status[record_id] = status

            print(
                f"📍 {location} | "
                f"Slot {slot_number} | "
                f"{status}"
            )

            continue

        old_status = previous_status[record_id]

        # AVAILABLE → OCCUPIED
        if old_status == "AVAILABLE" and status == "OCCUPIED":

            print()
            print("🚗 ================================")
            print("       NEW CAR DETECTED")
            print("================================")
            print(f"📍 Location : {location}")
            print(f"🅿️ Slot     : {slot_number}")
            print("📷 Camera capture will happen here")
            print()

        # OCCUPIED → AVAILABLE
        if old_status == "OCCUPIED" and status == "AVAILABLE":

            print()
            print("🅿️ ================================")
            print("       SLOT AVAILABLE")
            print("================================")
            print(f"📍 Location : {location}")
            print(f"🅿️ Slot     : {slot_number}")
            print()

        previous_status[record_id] = status

    time.sleep(2)