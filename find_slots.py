import requests

BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

# Put your existing Airtable token here locally
AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

URL = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}"
}

response = requests.get(URL, headers=HEADERS)

if response.status_code != 200:
    print("❌ Airtable error")
    print(response.text)
    exit()

records = response.json().get("records", [])

print()
print("==============================================")
print(" CITY CENTER MALL - AIRTABLE RECORD IDs")
print("==============================================")

for record in records:

    fields = record.get("fields", {})

    location = fields.get("locationId", "")
    slot = fields.get("slotNumber", "")
    sensor = fields.get("sensorId", "")
    status = fields.get("status", "")

    if location == "CITY CENTER MALL":

        print()
        print(f"Location : {location}")
        print(f"Slot     : {slot}")
        print(f"Sensor   : {sensor}")
        print(f"Status   : {status}")
        print(f"Record ID: {record['id']}")

print()
print("==============================================")