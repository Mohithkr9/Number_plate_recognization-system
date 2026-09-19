import cv2

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Camera could not be opened")
    exit()

print("✅ Camera started")
print("CLICK the camera window first.")
print("Press C to capture.")
print("Press Q to quit.")

while True:
    ret, frame = cap.read()

    if not ret:
        print("❌ Could not read camera")
        break

    cv2.imshow("Smart Parking Camera", frame)

    key = cv2.waitKey(30) & 0xFF

    if key == ord("c"):
        success = cv2.imwrite("plate_capture.jpg", frame)

        if success:
            print("✅ CAPTURED: plate_capture.jpg")
        else:
            print("❌ Could not save image")

    if key == ord("q"):
        print("Camera closed")
        break

cap.release()
cv2.destroyAllWindows()