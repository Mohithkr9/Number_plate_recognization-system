import requests
import time
import cv2
import easyocr
import re
import os


# ============================================================
# AIRTABLE SETTINGS
# ============================================================

AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb"
BASE_ID = "appWhAZEQegXTWIjR"
TABLE_NAME = "ParkingSlots"

AIRTABLE_URL = (
    f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}"
)

HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_TOKEN}",
    "Content-Type": "application/json"
}


# ============================================================
# CAMERA SETTINGS
# ============================================================

CAMERA_INDEX = 0

CAPTURE_FOLDER = os.path.join(
    os.path.dirname(__file__),
    "captured_plates"
)

os.makedirs(CAPTURE_FOLDER, exist_ok=True)

CAPTURE_FILE = os.path.join(
    CAPTURE_FOLDER,
    "latest_plate.jpg"
)


# ============================================================
# SENSOR SETTINGS
# ============================================================

SENSORS = ["S1", "S2", "S3", "S4"]


# ============================================================
# OCR
# ============================================================

print()
print("Loading EasyOCR...")
reader = easyocr.Reader(["en"], gpu=False)

print("EasyOCR ready.")


# ============================================================
# GET AIRTABLE RECORDS
# ============================================================

def get_airtable_records():

    try:

        response = requests.get(
            AIRTABLE_URL,
            headers=HEADERS,
            timeout=10
        )

        if response.status_code != 200:

            print(
                "Airtable GET error:",
                response.status_code
            )

            print(response.text)

            return []

        data = response.json()

        return data.get("records", [])

    except Exception as e:

        print("Airtable connection error:", e)

        return []


# ============================================================
# GET SENSOR STATUS
# ============================================================

def get_sensor_status(records):

    sensor_status = {}

    for sensor in SENSORS:
        sensor_status[sensor] = "AVAILABLE"


    for record in records:

        fields = record.get("fields", {})

        sensor_id = fields.get("sensorId")

        if not sensor_id:
            continue

        if sensor_id not in SENSORS:
            continue

        status = fields.get("status", "")

        status_code = fields.get("statusCode")

        if status == "OCCUPIED" or status_code == 0:

            sensor_status[sensor_id] = "OCCUPIED"

        else:

            sensor_status[sensor_id] = "AVAILABLE"


    return sensor_status


# ============================================================
# UPDATE VEHICLE NUMBER FOR ALL RECORDS OF SAME SENSOR
# ============================================================

def update_vehicle_number(sensor_id, vehicle_number):

    records = get_airtable_records()

    if not records:

        return False


    success_count = 0
    total_count = 0


    for record in records:

        fields = record.get("fields", {})

        record_sensor = fields.get("sensorId")

        if record_sensor != sensor_id:
            continue


        record_id = record.get("id")

        if not record_id:
            continue


        total_count += 1


        url = f"{AIRTABLE_URL}/{record_id}"


        data = {
            "fields": {
                "vehicleNumber": vehicle_number
            }
        }


        try:

            response = requests.patch(
                url,
                headers=HEADERS,
                json=data,
                timeout=10
            )


            if 200 <= response.status_code < 300:

                success_count += 1

                print(
                    f"Vehicle number updated: "
                    f"{record_id}"
                )

            else:

                print(
                    f"Vehicle update failed: "
                    f"{record_id}"
                )

                print(response.text)


        except Exception as e:

            print(
                "Vehicle number update error:",
                e
            )


    print()
    print(
        f"Vehicle number updated for "
        f"{success_count}/{total_count} records."
    )


    return success_count == total_count


# ============================================================
# CAMERA CAPTURE
# ============================================================

def capture_plate_image():

    print()
    print("======================================")
    print("        CAMERA STARTING")
    print("======================================")
    print()
    print("Show the vehicle number plate")
    print("in front of the webcam.")
    print()
    print("Press C to capture.")
    print("Press Q to cancel.")
    print()


    camera = cv2.VideoCapture(CAMERA_INDEX)


    if not camera.isOpened():

        print("ERROR: Webcam could not be opened.")

        return False


    while True:

        ret, frame = camera.read()


        if not ret:

            print("Could not read webcam.")

            break


        cv2.imshow(
            "Smart Parking - Number Plate Camera",
            frame
        )


        key = cv2.waitKey(1) & 0xFF


        if key == ord("c"):

            cv2.imwrite(
                CAPTURE_FILE,
                frame
            )

            print()
            print("Image captured!")

            print(
                "Saved:",
                CAPTURE_FILE
            )

            camera.release()

            cv2.destroyAllWindows()

            return True


        if key == ord("q"):

            print("Camera cancelled.")

            camera.release()

            cv2.destroyAllWindows()

            return False


    camera.release()

    cv2.destroyAllWindows()

    return False


# ============================================================
# CLEAN OCR TEXT
# ============================================================

def clean_text(text):

    text = text.upper()

    text = text.replace(" ", "")
    text = text.replace("-", "")
    text = text.replace(".", "")
    text = text.replace(":", "")
    text = text.replace("_", "")

    return text


# ============================================================
# OCR NUMBER PLATE
# ============================================================

def read_number_plate():

    print()
    print("======================================")
    print("        READING NUMBER PLATE")
    print("======================================")
    print()


    if not os.path.exists(CAPTURE_FILE):

        print("Captured image not found.")

        return None


    image = cv2.imread(CAPTURE_FILE)


    if image is None:

        print("Could not open captured image.")

        return None


    results = reader.readtext(
        image
    )


    if not results:

        print("No text detected.")

        return None


    all_text = ""

    print("OCR Results:")
    print()


    for result in results:

        text = result[1]
        confidence = result[2]

        cleaned = clean_text(text)

        print(
            f"Detected: {cleaned} "
            f"| Confidence: {confidence:.2f}"
        )

        all_text += cleaned


    print()
    print("Combined OCR text:")
    print(all_text)


    # --------------------------------------------------------
    # Indian vehicle number pattern
    #
    # Examples:
    # KA44M7095
    # KA01AB1234
    # KA05MN1234
    # --------------------------------------------------------

    pattern = r"[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{3,4}"


    match = re.search(
        pattern,
        all_text
    )


    if match:

        plate = match.group(0)

        print()
        print("======================================")
        print("   NUMBER PLATE DETECTED")
        print("======================================")
        print(plate)
        print()

        return plate


    # --------------------------------------------------------
    # Sometimes OCR separates the plate into pieces.
    # Try reading each OCR result individually.
    # --------------------------------------------------------

    for result in results:

        text = clean_text(result[1])


        match = re.search(
            pattern,
            text
        )


        if match:

            plate = match.group(0)

            print()
            print("NUMBER PLATE DETECTED")
            print(plate)

            return plate


    print()
    print("Number plate pattern not detected.")

    return None


# ============================================================
# PROCESS OCCUPIED EVENT
# ============================================================

def process_occupied(sensor_id):

    print()
    print("======================================")
    print("        CAR DETECTED")
    print("======================================")
    print()
    print("Sensor:", sensor_id)
    print()
    print("Opening webcam...")
    print()


    captured = capture_plate_image()


    if not captured:

        print()
        print("Camera capture failed.")
        print("Waiting for sensor changes...")

        return


    plate = read_number_plate()


    if plate is None:

        print()
        print("OCR could not detect a valid plate.")
        print("Vehicle number was NOT changed.")
        print()

        return


    print()
    print("Updating Airtable...")
    print()
    print(
        "Sensor:",
        sensor_id
    )

    print(
        "Vehicle Number:",
        plate
    )


    success = update_vehicle_number(
        sensor_id,
        plate
    )


    if success:

        print()
        print("======================================")
        print("       AIRTABLE UPDATE SUCCESS")
        print("======================================")
        print()
        print(
            "Sensor:",
            sensor_id
        )

        print(
            "Vehicle:",
            plate
        )

        print()
        print(
            "Website can now display:",
            plate
        )

    else:

        print()
        print("Some Airtable records could not be updated.")


# ============================================================
# MAIN PROGRAM
# ============================================================

def main():

    print()
    print("======================================")
    print("      SMART PARKING AUTO ANPR")
    print("======================================")
    print()

    print("Airtable:")
    print(AIRTABLE_URL)

    print()

    print("Sensor mapping:")
    print("S1 -> Slot 1 at ALL locations")
    print("S2 -> Slot 2 at ALL locations")
    print("S3 -> Slot 3 at ALL locations")
    print("S4 -> Slot 4 at ALL locations")

    print()


    # --------------------------------------------------------
    # INITIAL AIRTABLE STATUS
    # --------------------------------------------------------

    records = get_airtable_records()


    if not records:

        print("Could not read Airtable.")

        return


    previous_status = get_sensor_status(
        records
    )


    print("Initial status:")

    for sensor in SENSORS:

        print(
            f"{sensor} → "
            f"{previous_status[sensor]}"
        )


    print()
    print("Initial status loaded.")
    print("No webcam trigger on startup.")
    print()
    print("Checking Airtable every 1 second...")
    print()


    # --------------------------------------------------------
    # CONTINUOUS MONITORING
    # --------------------------------------------------------

    while True:

        try:

            records = get_airtable_records()


            if not records:

                time.sleep(1)

                continue


            current_status = get_sensor_status(
                records
            )


            print(
                f"S1:{current_status['S1']} | "
                f"S2:{current_status['S2']} | "
                f"S3:{current_status['S3']} | "
                f"S4:{current_status['S4']}"
            )


            # ------------------------------------------------
            # CHECK EACH SENSOR
            # ------------------------------------------------

            for sensor in SENSORS:

                old_status = previous_status[sensor]

                new_status = current_status[sensor]


                # --------------------------------------------
                # AVAILABLE → OCCUPIED
                # --------------------------------------------

                if (
                    old_status == "AVAILABLE"
                    and
                    new_status == "OCCUPIED"
                ):

                    print()
                    print(
                        f"{sensor}: "
                        f"AVAILABLE → OCCUPIED"
                    )

                    process_occupied(
                        sensor
                    )


                # --------------------------------------------
                # OCCUPIED → AVAILABLE
                # --------------------------------------------

                elif (
                    old_status == "OCCUPIED"
                    and
                    new_status == "AVAILABLE"
                ):

                    print()
                    print(
                        f"{sensor}: "
                        f"OCCUPIED → AVAILABLE"
                    )

                    print(
                        "Vehicle left."
                    )

                    print(
                        "Last vehicle number "
                        "is kept in Airtable."
                    )

                    print()


            # ------------------------------------------------
            # SAVE CURRENT STATUS
            # ------------------------------------------------

            previous_status = current_status


            # ------------------------------------------------
            # CHECK AGAIN AFTER 1 SECOND
            # ------------------------------------------------

            time.sleep(1)


        except KeyboardInterrupt:

            print()
            print("Program stopped.")

            break


        except Exception as e:

            print()
            print(
                "Unexpected error:",
                e
            )

            print(
                "Retrying in 1 second..."
            )

            time.sleep(1)


# ============================================================
# START
# ============================================================

if __name__ == "__main__":

    main()