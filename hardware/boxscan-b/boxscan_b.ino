/*
  ElektroPilot BoxScan B — firmware scaffold only.
  No real register polling, measurement, or mains interface is implemented.
  Do not connect to mains or a distribution board.
*/
#include <Arduino.h>

static const char* DEVICE_NAME = "BoxScan-B-prototype";

struct MeasurementRecord {
  const char* metric;
  float value;
  const char* unit;
  bool valid;
};

// Safe default: no measurements are asserted.
MeasurementRecord lastRecord = {"", 0.0f, "", false};

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(DEVICE_NAME);
  Serial.println("SCAFFOLD ONLY — no live measurements; no register polling enabled.");
  Serial.println("Select a supported meter and validate the protocol before implementation.");
}

void loop() {
  // Intentionally empty. Add protocol polling only after meter/register-map review.
  delay(1000);
}
