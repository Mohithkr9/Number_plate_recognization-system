import requests

# ==============================
# AIRTABLE SETTINGS
# ==============================

BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

# Put your PAT here
AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

# We will test with CITY CENTER MALL - Slot 4
LOCATION_ID = "CITY CENTER MALL"
SLOT_NUMBER = 4

# Number plate detected by OCR
VEHICLE_NUMBER = "KA44M7095"


# ==============================
# FIND THE CORRECT SLOT
# ==============================

url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

headers = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json"
}

params = {
    "filterByFormula": (
        f"AND("
        f"{{locationId}}='{LOCATION_ID}',"
        f"{{slotNumber}}={SLOT_NUMBER}"
        f")"
    )
}

response = requests.get(
    url,
    headers=headers,
    params=params
)

print("================================")
print("   FINDING PARKING SLOT")
print("================================")

print("Status code:", response.status_code)

if response.status_code != 200:
    print("❌ Could not find slot")
    print(response.text)
    exit()

data = response.json()

if len(data.get("records", [])) == 0:
    print("❌ Slot not found")
    exit()

record = data["records"][0]

record_id = record["id"]

print("✅ Slot found")
print("Location:", LOCATION_ID)
print("Slot:", SLOT_NUMBER)
print("Record ID:", record_id)


# ==============================
# UPDATE VEHICLE NUMBER
# ==============================

update_url = f"{url}/{record_id}"

update_data = {
    "fields": {
        "vehicleNumber": VEHICLE_NUMBER
    }
}

update_response = requests.patch(
    update_url,
    headers=headers,
    json=update_data
)

print("================================")
print("   UPDATING VEHICLE NUMBER")
print("================================")

print("Status code:", update_response.status_code)

if update_response.status_code == 200:
    print("✅ Vehicle number saved successfully!")
    print("🚗 Number plate:", VEHICLE_NUMBER)
else:
    print("❌ Update failed")
    print(update_response.text)

print("================================")