import cv2
import easyocr
import requests
import time
import re
import os

# ============================================================
# AIRTABLE CONFIGURATION
# ============================================================

AIRTABLE_API_KEY = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"

BASE_ID = "appWhAZEQegXTWIjR"
SLOTS_TABLE = "ParkingSlots"

AIRTABLE_URL = (
    f"https://api.airtable.com/v0/{BASE_ID}/{SLOTS_TABLE}"
)

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_API_KEY}",
    "Content-Type": "application/json"
}

# ============================================================
# SENSOR -> SLOT MAPPING
# ============================================================

SENSOR_SLOT = {
    "S1": "Slot 1",
    "S2": "Slot 2",
    "S3": "Slot 3",
    "S4": "Slot 4"
}

# ============================================================
# CAMERA / OCR SETTINGS
# ============================================================

CAMERA_INDEX = 0

# Wait before taking the first automatic photo
CAMERA_START_DELAY = 2

# Retry OCR every 5 seconds
OCR_RETRY_SECONDS = 5

# Folder for captured images
CAPTURE_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "ANPR",
    "captured_plates"
)

os.makedirs(CAPTURE_FOLDER, exist_ok=True)

LATEST_IMAGE = os.path.join(
    CAPTURE_FOLDER,
    "latest_plate.jpg"
)

# ============================================================
# OCR READER
# ============================================================

print()
print("Loading EasyOCR...")
print("Please wait...")
print()

reader = easyocr.Reader(
    ["en"],
    gpu=False
)

print("EasyOCR loaded successfully.")
print()


# ============================================================
# AIRTABLE - GET ALL RECORDS
# ============================================================

def get_all_slots():

    records = []
    offset = None

    while True:

        params = {}

        if offset:
            params["offset"] = offset

        try:

            response = requests.get(
                AIRTABLE_URL,
                headers=HEADERS,
                params=params,
                timeout=15
            )

            if response.status_code != 200:

                print(
                    "❌ Airtable read error:",
                    response.status_code
                )

                print(response.text)

                return records

            data = response.json()

            records.extend(
                data.get("records", [])
            )

            offset = data.get("offset")

            if not offset:
                break

        except Exception as e:

            print(
                "❌ Airtable connection error:",
                e
            )

            return records

    return records


# ============================================================
# NORMALIZE AIRTABLE VALUE
# ============================================================

def normalize_value(value):

    if value is None:
        return ""

    if isinstance(value, list):

        values = []

        for item in value:

            if isinstance(item, dict):

                if "id" in item:
                    values.append(str(item["id"]))

                elif "name" in item:
                    values.append(str(item["name"]))

            else:
                values.append(str(item))

        return ",".join(values)

    if isinstance(value, dict):

        if "id" in value:
            return str(value["id"])

        if "name" in value:
            return str(value["name"])

        return ""

    return str(value)


# ============================================================
# GET SENSOR FROM RECORD
# ============================================================

def get_sensor(fields):

    sensor = fields.get("sensorId")

    return normalize_value(sensor).strip().upper()


# ============================================================
# GET SLOT NUMBER
# ============================================================

def get_slot_number(fields, sensor):

    value = fields.get("slotNumber")

    value = normalize_value(value).strip()

    if value:
        return value

    return SENSOR_SLOT.get(
        sensor,
        "Unknown Slot"
    )


# ============================================================
# GET STATUS
# ============================================================

def get_status(fields):

    status = fields.get("status")

    status = normalize_value(status)

    status = status.strip().upper()

    if status:
        return status

    status_code = fields.get("statusCode")

    try:

        if int(status_code) == 1:
            return "AVAILABLE"

        if int(status_code) == 0:
            return "OCCUPIED"

    except:
        pass

    return "UNKNOWN"


# ============================================================
# DISPLAY CURRENT STATUS
# ============================================================

def display_status(records):

    print()
    print("======================================")
    print("     SMART PARKING AUTO MONITOR")
    print("======================================")
    print("Monitoring ALL sensors...")
    print("Press CTRL + C to stop.")
    print()

    sensor_status = {}

    for sensor in SENSOR_SLOT:

        sensor_status[sensor] = "AVAILABLE"

    for record in records:

        fields = record.get("fields", {})

        sensor = get_sensor(fields)

        if sensor not in SENSOR_SLOT:
            continue

        status = get_status(fields)

        if status == "OCCUPIED":
            sensor_status[sensor] = "OCCUPIED"

        elif status == "RESERVED":

            if sensor_status[sensor] != "OCCUPIED":
                sensor_status[sensor] = "RESERVED"

    for sensor in SENSOR_SLOT:

        slot = SENSOR_SLOT[sensor]

        status = sensor_status[sensor]

        if status == "AVAILABLE":

            print(
                f"📡 {sensor} | {slot} | 🟢 AVAILABLE"
            )

        elif status == "OCCUPIED":

            print(
                f"📡 {sensor} | {slot} | 🔴 OCCUPIED"
            )

        else:

            print(
                f"📡 {sensor} | {slot} | 🟡 {status}"
            )

    print()

    return sensor_status


# ============================================================
# GET OCCUPIED SENSORS
# ============================================================

def get_occupied_sensors(records):

    occupied = set()

    for record in records:

        fields = record.get("fields", {})

        sensor = get_sensor(fields)

        if sensor not in SENSOR_SLOT:
            continue

        status = get_status(fields)

        if status == "OCCUPIED":

            occupied.add(sensor)

    return occupied


# ============================================================
# CHECK WHETHER SENSOR IS STILL OCCUPIED
# ============================================================

def sensor_is_occupied(sensor):

    records = get_all_slots()

    for record in records:

        fields = record.get("fields", {})

        current_sensor = get_sensor(fields)

        if current_sensor != sensor:
            continue

        status = get_status(fields)

        if status == "OCCUPIED":

            return True

    return False


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_ocr_text(text):

    text = str(text).upper()

    # Remove spaces and symbols
    text = re.sub(
        r"[^A-Z0-9]",
        "",
        text
    )

    return text


# ============================================================
# EXTRACT NUMBER PLATE
# ============================================================

def extract_plate(results):

    detected_parts = []

    for result in results:

        try:

            text = result[1]

            confidence = float(result[2])

            cleaned = clean_ocr_text(text)

            if len(cleaned) >= 2:

                print(
                    f"Detected: {cleaned} | "
                    f"Confidence: {confidence:.2f}"
                )

                detected_parts.append(cleaned)

        except Exception:

            continue

    if not detected_parts:

        return ""

    # --------------------------------------------------------
    # Combine OCR parts
    # Example:
    # KA44
    # M7095
    # becomes:
    # KA44M7095
    # --------------------------------------------------------

    combined = "".join(detected_parts)

    combined = clean_ocr_text(combined)

    # Must contain both letters and numbers
    has_letters = bool(
        re.search(r"[A-Z]", combined)
    )

    has_numbers = bool(
        re.search(r"[0-9]", combined)
    )

    if not has_letters or not has_numbers:

        return ""

    # Reasonable plate length
    if len(combined) < 5:

        return ""

    if len(combined) > 12:

        combined = combined[:12]

    return combined


# ============================================================
# CAPTURE + OCR
# ============================================================

def capture_and_detect(sensor):

    print()
    print("======================================")
    print("🚗 VEHICLE DETECTED")
    print("======================================")

    print(
        f"📡 Sensor: {sensor}"
    )

    print(
        f"🅿️ {SENSOR_SLOT.get(sensor, 'Unknown Slot')}"
    )

    print(
        "🔴 Status: OCCUPIED"
    )

    print()

    print("📷 Opening camera automatically...")

    camera = cv2.VideoCapture(
        CAMERA_INDEX
    )

    if not camera.isOpened():

        print(
            "❌ Could not open webcam."
        )

        return ""

    time.sleep(
        CAMERA_START_DELAY
    )

    attempt = 0

    try:

        while True:

            attempt += 1

            print()
            print("--------------------------------------")
            print(
                f"📸 Capture attempt #{attempt}"
            )
            print("--------------------------------------")

            # ------------------------------------------------
            # Check whether vehicle is still present
            # ------------------------------------------------

            if not sensor_is_occupied(sensor):

                print()
                print(
                    f"🟢 {sensor} is AVAILABLE again."
                )

                print(
                    "Vehicle detection cancelled."
                )

                break

            # ------------------------------------------------
            # Read several frames to get a stable image
            # ------------------------------------------------

            frame = None

            for _ in range(10):

                ret, current_frame = camera.read()

                if ret:

                    frame = current_frame

                time.sleep(0.05)

            if frame is None:

                print(
                    "❌ Could not capture image."
                )

                print(
                    f"⏳ Retrying in "
                    f"{OCR_RETRY_SECONDS} seconds..."
                )

                time.sleep(
                    OCR_RETRY_SECONDS
                )

                continue

            # ------------------------------------------------
            # Save image automatically
            # ------------------------------------------------

            cv2.imwrite(
                LATEST_IMAGE,
                frame
            )

            print(
                f"✅ Image captured automatically."
            )

            print(
                f"Saved: {LATEST_IMAGE}"
            )

            # ------------------------------------------------
            # OCR
            # ------------------------------------------------

            print(
                "🔍 Running number plate OCR..."
            )

            try:

                results = reader.readtext(
                    frame
                )

            except Exception as e:

                print(
                    "❌ OCR error:",
                    e
                )

                results = []

            # ------------------------------------------------
            # Extract plate
            # ------------------------------------------------

            plate = extract_plate(
                results
            )

            if plate:

                print()
                print(
                    "======================================"
                )

                print(
                    "✅ NUMBER PLATE DETECTED"
                )

                print(
                    f"🚗 Vehicle Number: {plate}"
                )

                print(
                    "======================================"
                )

                return plate

            # ------------------------------------------------
            # No text detected
            # ------------------------------------------------

            print()
            print(
                "❌ Number plate not detected."
            )

            print(
                f"⏳ Retrying in "
                f"{OCR_RETRY_SECONDS} seconds..."
            )

            time.sleep(
                OCR_RETRY_SECONDS
            )

    finally:

        camera.release()

        cv2.destroyAllWindows()

        print(
            "📷 Camera closed."
        )

    return ""


# ============================================================
# UPDATE VEHICLE NUMBER
# ============================================================

def update_vehicle_number(
    sensor,
    vehicle_number
):

    print()
    print(
        "======================================"
    )

    print(
        "Updating Airtable..."
    )

    print(
        f"Sensor: {sensor}"
    )

    print(
        f"Vehicle Number: {vehicle_number}"
    )

    print(
        "======================================"
    )

    records = get_all_slots()

    matching_records = []

    for record in records:

        fields = record.get(
            "fields",
            {}
        )

        record_sensor = get_sensor(
            fields
        )

        if record_sensor == sensor:

            matching_records.append(
                record
            )

    if not matching_records:

        print(
            f"❌ No Airtable records found "
            f"for {sensor}"
        )

        return False

    success_count = 0

    # --------------------------------------------------------
    # Update all records using this sensor
    # --------------------------------------------------------

    for record in matching_records:

        record_id = record.get(
            "id"
        )

        fields = {
            "vehicleNumber": vehicle_number
        }

        url = (
            f"{AIRTABLE_URL}/"
            f"{record_id}"
        )

        try:

            response = requests.patch(
                url,
                headers=HEADERS,
                json={
                    "fields": fields
                },
                timeout=15
            )

            if response.status_code in (
                200,
                201
            ):

                success_count += 1

            else:

                print(
                    f"❌ Failed record "
                    f"{record_id}"
                )

                print(
                    response.text
                )

        except Exception as e:

            print(
                "❌ Airtable update error:",
                e
            )

    print()
    print(
        f"Vehicle number updated for "
        f"{success_count}/"
        f"{len(matching_records)} records."
    )

    if success_count == len(
        matching_records
    ):

        print(
            "✅ AIRTABLE UPDATE SUCCESS"
        )

        return True

    return False


# ============================================================
# MAIN MONITOR
# ============================================================

def main():

    print()
    print("======================================")
    print("     SMART PARKING AUTO MONITOR")
    print("======================================")
    print()
    print("Starting...")
    print()

    # --------------------------------------------------------
    # Remember sensors currently being processed
    # --------------------------------------------------------

    processing_sensors = set()

    # --------------------------------------------------------
    # Main loop
    # --------------------------------------------------------

    while True:

        try:

            records = get_all_slots()

            if not records:

                print(
                    "⚠️ No Airtable slot records found."
                )

                time.sleep(2)

                continue

            # ------------------------------------------------
            # Display current status
            # ------------------------------------------------

            sensor_status = display_status(
                records
            )

            # ------------------------------------------------
            # Find occupied sensors
            # ------------------------------------------------

            occupied_sensors = (
                get_occupied_sensors(
                    records
                )
            )

            # ------------------------------------------------
            # Find newly occupied sensors
            # ------------------------------------------------

            new_occupied = (
                occupied_sensors
                - processing_sensors
            )

            # ------------------------------------------------
            # Process each newly occupied sensor
            # ------------------------------------------------

            for sensor in sorted(
                new_occupied
            ):

                processing_sensors.add(
                    sensor
                )

                vehicle_number = (
                    capture_and_detect(
                        sensor
                    )
                )

                # --------------------------------------------
                # If OCR detected number
                # --------------------------------------------

                if vehicle_number:

                    update_vehicle_number(
                        sensor,
                        vehicle_number
                    )

                # --------------------------------------------
                # If sensor became available
                # --------------------------------------------

                else:

                    print()
                    print(
                        f"🟢 {sensor} processing finished."
                    )

            # ------------------------------------------------
            # Remove sensors that became available
            # ------------------------------------------------

            current_records = get_all_slots()

            current_occupied = (
                get_occupied_sensors(
                    current_records
                )
            )

            processing_sensors.intersection_update(
                current_occupied
            )

            # ------------------------------------------------
            # Wait before checking Airtable again
            # ------------------------------------------------

            time.sleep(2)

        except KeyboardInterrupt:

            print()
            print(
                "======================================"
            )

            print(
                "Monitoring stopped."
            )

            print(
                "======================================"
            )

            break

        except Exception as e:

            print()
            print(
                "❌ Unexpected error:",
                e
            )

            print(
                "⏳ Retrying in 2 seconds..."
            )

            time.sleep(2)


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()