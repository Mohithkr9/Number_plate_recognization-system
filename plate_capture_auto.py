import cv2
import easyocr
import re

print("======================================")
print("   SMART PARKING - PLATE CAPTURE")
print("======================================")

# Start webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Camera could not be opened")
    exit()

print("✅ Camera started")
print()
print("Put the number plate in front of the webcam.")
print("Click the camera window first.")
print("Press C = Capture")
print("Press Q = Quit")
print()

print("Starting EasyOCR...")
reader = easyocr.Reader(['en'], gpu=False)
print("✅ EasyOCR ready")
print()

while True:

    ret, frame = cap.read()

    if not ret:
        print("❌ Could not read camera")
        break

    cv2.imshow(
        "Smart Parking - Number Plate Camera",
        frame
    )

    key = cv2.waitKey(30) & 0xFF

    # Capture image
    if key == ord("c"):

        print()
        print("📷 Capturing image...")

        cv2.imwrite(
            "latest_plate.jpg",
            frame
        )

        print("✅ Image saved: latest_plate.jpg")

        # Grayscale
        gray = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2GRAY
        )

        # Improve contrast
        gray = cv2.equalizeHist(gray)

        # Enlarge
        processed = cv2.resize(
            gray,
            None,
            fx=2,
            fy=2,
            interpolation=cv2.INTER_CUBIC
        )

        cv2.imwrite(
            "latest_plate_processed.jpg",
            processed
        )

        print("🔍 Reading number plate...")

        results = reader.readtext(
            processed,
            detail=1,
            paragraph=False,
            allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        )

        detected_parts = []

        for result in results:

            text = result[1]
            confidence = result[2]

            print(
                f"Detected: {text} | "
                f"Confidence: {confidence:.2f}"
            )

            text = text.replace(
                " ",
                ""
            ).upper()

            text = re.sub(
                r"[^A-Z0-9]",
                "",
                text
            )

            if text:
                detected_parts.append(text)

        if detected_parts:

            plate_number = "".join(
                detected_parts
            )

            print()
            print("======================================")
            print("🚗 NUMBER PLATE DETECTED")
            print("======================================")
            print(plate_number)
            print("======================================")
            print()

        else:

            print()
            print("❌ Number plate not detected")
            print()

    # Quit
    if key == ord("q"):

        print("Camera closed")
        break


cap.release()
cv2.destroyAllWindows()