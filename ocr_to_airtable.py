import requests

# ==========================================
# SMART PARKING - OCR TO AIRTABLE
# ==========================================

BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

# IMPORTANT:
# Replace this with the SAME Airtable token
# you already use in auto_parking.py
AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json"
}


def get_slots():
    response = requests.get(URL, headers=HEADERS)

    if response.status_code != 200:
        print("❌ Could not read Airtable")
        print(response.text)
        return []

    return response.json().get("records", [])


def update_slot(record_id, vehicle_number):
    data = {
        "fields": {
            "status": "OCCUPIED",
            "statusCode": 0,
            "vehicleNumber": vehicle_number
        }
    }

    response = requests.patch(
        f"{URL}/{record_id}",
        headers=HEADERS,
        json=data
    )

    if response.status_code == 200:
        print()
        print("======================================")
        print("✅ AIRTABLE UPDATED")
        print("======================================")
        print("Vehicle Number :", vehicle_number)
        print("Status         : OCCUPIED")
        print("======================================")
        return True

    print("❌ Airtable update failed")
    print(response.text)
    return False


print("======================================")
print("   SMART PARKING - AIRTABLE UPDATE")
print("======================================")
print()

records = get_slots()

if not records:
    print("❌ No parking slots found.")
    exit()

print("Available parking slots:")
print()

valid_slots = []

for record in records:

    fields = record["fields"]

    location = fields.get(
        "locationId",
        "Unknown Location"
    )

    slot = fields.get(
        "slotNumber",
        "Unknown Slot"
    )

    status = fields.get(
        "status",
        "UNKNOWN"
    )

    if location != "Unknown Location" and slot != "Unknown Slot":

        valid_slots.append(record)

        print(
            f"{len(valid_slots)}. "
            f"{location} | "
            f"Slot {slot} | "
            f"{status}"
        )

print()

choice = input(
    "Enter the slot number from the list above: "
)

try:
    choice = int(choice)
except ValueError:
    print("❌ Please enter a valid number.")
    exit()

if choice < 1 or choice > len(valid_slots):
    print("❌ Invalid slot selection.")
    exit()

selected_record = valid_slots[choice - 1]

selected_fields = selected_record["fields"]

location = selected_fields.get(
    "locationId",
    "Unknown Location"
)

slot = selected_fields.get(
    "slotNumber",
    "Unknown Slot"
)

print()
print("Selected slot:")
print(
    f"📍 Location: {location}"
)
print(
    f"🅿️ Slot: {slot}"
)

print()

vehicle_number = input(
    "Enter detected vehicle number: "
).strip().upper()

if not vehicle_number:
    print("❌ Vehicle number cannot be empty.")
    exit()

print()
print("Updating Airtable...")

update_slot(
    selected_record["id"],
    vehicle_number
)