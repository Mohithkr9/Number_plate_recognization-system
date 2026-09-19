#include <WiFi.h>
#include <HTTPClient.h>

// =====================================================
// 1. WIFI
// =====================================================

const char* ssid = "AIET";
const char* password = "nandu1234";

// =====================================================
// 2. AIRTABLE
// =====================================================

const char* AIRTABLE_TOKEN = "patonNHFlI2tk3iRS.c1d7c5f15942e5717c1d3fd3d7c13213c4a762e4dd57dd655e44cba3130581bb";
const char* BASE_ID = "appWhAZEQegXTWIjR";
const char* TABLE_NAME = "ParkingSlots";

// =====================================================
// 3. ULTRASONIC SENSOR PINS
// =====================================================

const int trigPins[4] = {
  5,   // S1
  17,  // S2
  16,  // S3
  4    // S4
};

const int echoPins[4] = {
  18,  // S1
  19,  // S2
  21,  // S3
  22   // S4
};

// =====================================================
// 4. LED PINS
// =====================================================

const int greenLED[4] = {
  13,  // S1
  14,  // S2
  26,  // S3
  33   // S4
};

const int redLED[4] = {
  12,  // S1
  27,  // S2
  25,  // S3
  32   // S4
};

// =====================================================
// 5. EXACT AIRTABLE RECORD IDs
// CITY CENTER MALL
// =====================================================

String recordIDs[4] = {
  "reca4sLmlvo9LW90S",   // S1 -> Slot 1
  "recTFuR3dEt1rOfbw",   // S2 -> Slot 2
  "recPcybu3iKGJsXZA",   // S3 -> Slot 3
  "rec0RFDmnaRJCZbRy"    // S4 -> Slot 4
};

// =====================================================
// 6. SENSOR STATE
// =====================================================

// false = AVAILABLE
// true  = OCCUPIED

bool previousOccupied[4] = {
  false,
  false,
  false,
  false
};

bool firstReading = true;

// =====================================================
// 7. READ DISTANCE
// =====================================================

float readDistance(int trigPin, int echoPin) {

  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0) {
    return 999.0;
  }

  float distance = duration * 0.0343 / 2.0;

  return distance;
}

// =====================================================
// 8. UPDATE AIRTABLE
// =====================================================

void updateSlot(int index, bool occupied) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi disconnected!");

    return;
  }

  HTTPClient http;

  String url =
    "https://api.airtable.com/v0/" +
    String(BASE_ID) +
    "/" +
    String(TABLE_NAME) +
    "/" +
    recordIDs[index];

  http.begin(url);

  http.addHeader(
    "Authorization",
    "Bearer " + String(AIRTABLE_TOKEN)
  );

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  String json;

  // =================================================
  // CAR ENTERED
  // =================================================

  if (occupied) {

    json =
      "{\"fields\":{"
      "\"statusCode\":0,"
      "\"status\":\"OCCUPIED\""
      "}}";

    Serial.println();
    Serial.println("======================================");
    Serial.println("🚗 CAR DETECTED");
    Serial.println("======================================");
    Serial.print("Sensor : S");
    Serial.println(index + 1);

    Serial.print("Slot   : ");
    Serial.println(index + 1);

    Serial.println("Status : OCCUPIED");
    Serial.println("Webcam will be triggered by Python.");
    Serial.println("======================================");
  }

  // =================================================
  // CAR LEFT
  // =================================================

  else {

    json =
      "{\"fields\":{"
      "\"statusCode\":1,"
      "\"status\":\"AVAILABLE\","
      "\"vehicleNumber\":\"\""
      "}}";

    Serial.println();
    Serial.println("======================================");
    Serial.println("🅿️ SLOT AVAILABLE");
    Serial.println("======================================");
    Serial.print("Sensor : S");
    Serial.println(index + 1);

    Serial.print("Slot   : ");
    Serial.println(index + 1);

    Serial.println("Status : AVAILABLE");
    Serial.println("Vehicle number cleared.");
    Serial.println("======================================");
  }

  int httpCode = http.PATCH(json);

  Serial.print("Airtable HTTP Code: ");
  Serial.println(httpCode);

  if (httpCode > 0) {

    String response = http.getString();

    Serial.println("Airtable Response:");
    Serial.println(response);

  } else {

    Serial.println("❌ Airtable update failed.");
  }

  http.end();
}

// =====================================================
// 9. CHECK FOR STATUS CHANGES
// =====================================================

void processStatusChanges(bool currentOccupied[4]) {

  for (int i = 0; i < 4; i++) {

    // Ignore first reading so the system doesn't
    // suddenly trigger the webcam when starting.

    if (firstReading) {

      previousOccupied[i] = currentOccupied[i];

      continue;
    }

    // =================================================
    // AVAILABLE -> OCCUPIED
    // =================================================

    if (!previousOccupied[i] && currentOccupied[i]) {

      updateSlot(i, true);
    }

    // =================================================
    // OCCUPIED -> AVAILABLE
    // =================================================

    if (previousOccupied[i] && !currentOccupied[i]) {

      updateSlot(i, false);
    }

    previousOccupied[i] = currentOccupied[i];
  }

  firstReading = false;
}

// =====================================================
// 10. READ ALL SENSORS
// =====================================================

void readAllSensors() {

  bool currentOccupied[4];

  Serial.println();
  Serial.println("--------------------------------------");

  for (int i = 0; i < 4; i++) {

    float distance =
      readDistance(
        trigPins[i],
        echoPins[i]
      );

    // ================================================
    // OCCUPIED CONDITION
    // ================================================
    //
    // Object between 2 cm and 12 cm
    // = OCCUPIED
    //
    // Otherwise = AVAILABLE

    if (distance > 2 && distance < 12) {

      currentOccupied[i] = true;

    } else {

      currentOccupied[i] = false;
    }

    Serial.print("S");
    Serial.print(i + 1);

    Serial.print(" | Distance: ");

    Serial.print(distance);

    Serial.print(" cm | ");

    if (currentOccupied[i]) {

      Serial.println("OCCUPIED");

      digitalWrite(
        greenLED[i],
        LOW
      );

      digitalWrite(
        redLED[i],
        HIGH
      );

    } else {

      Serial.println("AVAILABLE");

      digitalWrite(
        greenLED[i],
        HIGH
      );

      digitalWrite(
        redLED[i],
        LOW
      );
    }
  }

  Serial.println("--------------------------------------");

  processStatusChanges(currentOccupied);
}

// =====================================================
// 11. SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("======================================");
  Serial.println("     SMART PARKING ESP32");
  Serial.println("======================================");

  // ===================================================
  // SENSOR + LED PIN SETUP
  // ===================================================

  for (int i = 0; i < 4; i++) {

    pinMode(
      trigPins[i],
      OUTPUT
    );

    pinMode(
      echoPins[i],
      INPUT
    );

    pinMode(
      greenLED[i],
      OUTPUT
    );

    pinMode(
      redLED[i],
      OUTPUT
    );

    digitalWrite(
      greenLED[i],
      HIGH
    );

    digitalWrite(
      redLED[i],
      LOW
    );
  }

  // ===================================================
  // WIFI
  // ===================================================

  Serial.println();
  Serial.println("Connecting to WiFi...");

  WiFi.begin(
    ssid,
    password
  );

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  Serial.println("✅ WiFi Connected!");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // ===================================================
  // SLOT MAPPING
  // ===================================================

  Serial.println();
  Serial.println("Airtable Slot Mapping:");
  Serial.println();

  Serial.println(
    "S1 -> CITY CENTER MALL -> Slot 1"
  );

  Serial.println(
    "S2 -> CITY CENTER MALL -> Slot 2"
  );

  Serial.println(
    "S3 -> CITY CENTER MALL -> Slot 3"
  );

  Serial.println(
    "S4 -> CITY CENTER MALL -> Slot 4"
  );

  Serial.println();

  Serial.println("Starting sensor monitoring...");
}

// =====================================================
// 12. LOOP
// =====================================================

void loop() {

  readAllSensors();

  delay(1000);
}