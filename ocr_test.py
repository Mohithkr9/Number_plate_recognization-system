import cv2
import easyocr

print("====================================")
print("   SMART PARKING - NUMBER PLATE OCR")
print("====================================")

# Load captured image
image = cv2.imread("plate_capture.jpg")

if image is None:
    print("❌ plate_capture.jpg not found")
    exit()

print("✅ Image loaded")

# Convert to grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Improve contrast
gray = cv2.equalizeHist(gray)

# Enlarge image
processed = cv2.resize(
    gray,
    None,
    fx=2,
    fy=2,
    interpolation=cv2.INTER_CUBIC
)

# Save processed image
cv2.imwrite("plate_processed.jpg", processed)

print("✅ Image processed")
print("Starting EasyOCR...")

# Start EasyOCR
reader = easyocr.Reader(['en'], gpu=False)

print("Reading number plate...")

# Only allow letters and numbers
results = reader.readtext(
    processed,
    detail=1,
    paragraph=False,
    allowlist="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
)

print("\nDetected text:")

if not results:
    print("❌ No text detected")
    exit()

# Collect detected text
detected_parts = []

for result in results:
    text = result[1]
    confidence = result[2]

    print(
        f"Text: {text} | "
        f"Confidence: {confidence:.2f}"
    )

    # Remove spaces
    text = text.replace(" ", "").upper()

    detected_parts.append(text)

# Combine all detected parts
detected_plate = "".join(detected_parts)

print("\n====================================")
print("🚗 DETECTED NUMBER PLATE")
print("====================================")
print(detected_plate)
print("====================================")