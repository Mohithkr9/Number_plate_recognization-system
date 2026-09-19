import requests

BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json"
}

# CITY CENTER MALL test slots
record_ids = [
    "reca4sLmlvo9LW90S",   # Slot 1
    "recTFuR3dEt1rOfbw",   # Slot 2
    "recPcybu3iKGJsXZA",   # Slot 3
    "rec0RFDmnaRJCZbRy"    # Slot 4
]

print("Resetting CITY CENTER MALL test slots...")
print()

for record_id in record_ids:

    data = {
        "fields": {
            "status": "AVAILABLE",
            "statusCode": 1,
            "vehicleNumber": ""
        }
    }

    response = requests.patch(
        f"{URL}/{record_id}",
        headers=HEADERS,
        json=data
    )

    if response.status_code == 200:
        print(f"✅ {record_id} → AVAILABLE")
    else:
        print(f"❌ Failed: {record_id}")
        print(response.text)

print()
print("======================================")
print("CITY CENTER MALL TEST SLOTS RESET")
print("======================================")