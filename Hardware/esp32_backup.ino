#include <WiFi.h>
#include <HTTPClient.h>

// WiFi
#define WIFI_SSID "-----------WIFI"
#define WIFI_PASSWORD "-----------PASSWORD"

// Airtable
#define AIRTABLE_API_KEY "YOUR_AIRTABLE_API_KEY"
#define AIRTABLE_BASE_ID "YOUR_AIRTABLE_BASE_ID"
#define AIRTABLE_TABLE_NAME "Parking"

// Ultrasonic pins
int trigPins[4] = {5, 17, 16, 4};
int echoPins[4] = {18, 19, 21, 22};

// LED pins
int greenLED[4] = {13, 14, 26, 33};
int redLED[4]   = {12, 27, 25, 32};

String recordId = ""; // Will be fetched in setup

float getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  return duration * 0.034 / 2;
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(trigPins[i], OUTPUT);
    pinMode(echoPins[i], INPUT);
    pinMode(greenLED[i], OUTPUT);
    pinMode(redLED[i], OUTPUT);
  }

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("WiFi Connected");

  // Fetch the record ID
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "https://api.airtable.com/v0/" + String(AIRTABLE_BASE_ID) + "/" + String(AIRTABLE_TABLE_NAME);
    http.begin(url);
    http.addHeader("Authorization", "Bearer " + String(AIRTABLE_API_KEY));

    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
      String payload = http.getString();
      // Parse JSON to get record ID (simple parsing)
      int idIndex = payload.indexOf("\"id\":\"") + 6;
      int idEnd = payload.indexOf("\"", idIndex);
      recordId = payload.substring(idIndex, idEnd);
      Serial.println("Record ID: " + recordId);
    } else {
      Serial.println("Error fetching record ID");
    }
    http.end();
  }
}

void loop() {
  if (recordId == "") {
    Serial.println("No record ID, skipping");
    delay(5000);
    return;
  }

  // Fetch current data
  int firebaseState[4] = {1, 1, 1, 1};
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "https://api.airtable.com/v0/" + String(AIRTABLE_BASE_ID) + "/" + String(AIRTABLE_TABLE_NAME) + "/" + recordId;
    http.begin(url);
    http.addHeader("Authorization", "Bearer " + String(AIRTABLE_API_KEY));

    int httpResponseCode = http.GET();
    if (httpResponseCode > 0) {
      String payload = http.getString();
      // Parse JSON for slot values (simple parsing)
      for (int i = 0; i < 4; i++) {
        String field = "\"slot" + String(i + 1) + "\":";
        int fieldIndex = payload.indexOf(field) + field.length();
        if (fieldIndex > field.length()) {
          firebaseState[i] = payload.substring(fieldIndex, payload.indexOf(",", fieldIndex)).toInt();
        }
      }
    }
    http.end();
  }

  for (int i = 0; i < 4; i++) {

    // -------- SENSOR CHECK --------
    float d = getDistance(trigPins[i], echoPins[i]);

    int sensorState;
    if (d > 2 && d < 12) {
      sensorState = 0; // occupied
    } else {
      sensorState = 1; // empty
    }

    int finalState;

    // -------- LOGIC PRIORITY --------
    if (sensorState == 0) {
      finalState = 0; // occupied overrides everything
    }
    else if (firebaseState[i] == 2) {
      finalState = 2; // reserved
    }
    else {
      finalState = 1; // available
    }

    // -------- LED CONTROL --------
    if (finalState == 1) {
      digitalWrite(greenLED[i], HIGH);
      digitalWrite(redLED[i], LOW);
    }
    else if (finalState == 0) {
      digitalWrite(greenLED[i], LOW);
      digitalWrite(redLED[i], HIGH);
    }
    else if (finalState == 2) {
      digitalWrite(greenLED[i], LOW);

      // Blink RED
      digitalWrite(redLED[i], HIGH);
      delay(300);
      digitalWrite(redLED[i], LOW);
      delay(300);
    }

    Serial.print("Slot ");
    Serial.print(i + 1);
    Serial.print(" = ");
    Serial.println(finalState);

    delay(100);
  }

  // Update Airtable with final states
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = "https://api.airtable.com/v0/" + String(AIRTABLE_BASE_ID) + "/" + String(AIRTABLE_TABLE_NAME) + "/" + recordId;
    http.begin(url);
    http.addHeader("Authorization", "Bearer " + String(AIRTABLE_API_KEY));
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{ \"fields\": {";
    for (int i = 0; i < 4; i++) {
      int finalState;
      float d = getDistance(trigPins[i], echoPins[i]);
      int sensorState = (d > 2 && d < 12) ? 0 : 1;
      if (sensorState == 0) {
        finalState = 0;
      } else if (firebaseState[i] == 2) {
        finalState = 2;
      } else {
        finalState = 1;
      }
      jsonPayload += "\"slot" + String(i + 1) + "\": " + String(finalState);
      if (i < 3) jsonPayload += ",";
    }
    jsonPayload += "} }";

    int httpResponseCode = http.PATCH(jsonPayload);
    if (httpResponseCode > 0) {
      Serial.println("Updated Airtable");
    } else {
      Serial.println("Error updating Airtable");
    }
    http.end();
  }

  Serial.println("----------------------");
  delay(5000); // Update every 5 seconds
}