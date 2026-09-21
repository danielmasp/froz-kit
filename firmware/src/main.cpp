#include <Arduino.h>
#include <SoftwareSerial.h>

#include "Config.h"
#include "EmergencyProtocol.h"

namespace {
SoftwareSerial bluetooth(FrozConfig::kBluetoothRxPin, FrozConfig::kBluetoothTxPin);

volatile bool emergencyRequested = false;
volatile unsigned long interruptAtMicros = 0;

enum class AlertState : uint8_t { Idle, AwaitingAck, Delivered, Failed };

AlertState alertState = AlertState::Idle;
uint32_t sequence = 0;
uint8_t attempt = 0;
unsigned long lastAcceptedInterrupt = 0;
unsigned long lastTransmissionMs = 0;
String incomingLine;

void emergencyInterrupt() {
  interruptAtMicros = micros();
  emergencyRequested = true;
}

void transmitAlert() {
  attempt += 1;
  lastTransmissionMs = millis();
  EmergencyProtocol::writeAlert(bluetooth, sequence, lastTransmissionMs);
  EmergencyProtocol::writeAlert(Serial, sequence, lastTransmissionMs);
  alertState = AlertState::AwaitingAck;
  digitalWrite(FrozConfig::kStatusLedPin, HIGH);
}

void acceptEmergencyRequest() {
  noInterrupts();
  const bool requested = emergencyRequested;
  const unsigned long capturedAt = interruptAtMicros;
  emergencyRequested = false;
  interrupts();

  if (!requested || capturedAt - lastAcceptedInterrupt < FrozConfig::kDebounceMicros) return;
  lastAcceptedInterrupt = capturedAt;

  sequence += 1;
  attempt = 0;
  alertState = AlertState::Idle;
  transmitAlert();
}

void consumeBluetoothInput() {
  while (bluetooth.available()) {
    const char value = static_cast<char>(bluetooth.read());
    if (value == '\r') continue;
    if (value != '\n') {
      if (incomingLine.length() < 48) incomingLine += value;
      continue;
    }

    if (EmergencyProtocol::isAckFor(incomingLine, sequence)) {
      alertState = AlertState::Delivered;
      digitalWrite(FrozConfig::kStatusLedPin, LOW);
      Serial.print(F("Alert delivered: "));
      Serial.println(sequence);
    }
    incomingLine = "";
  }
}

void handleRetry() {
  if (alertState != AlertState::AwaitingAck) return;
  if (millis() - lastTransmissionMs < FrozConfig::kAckTimeoutMs) return;

  if (attempt < FrozConfig::kMaxAttempts) {
    transmitAlert();
    return;
  }

  alertState = AlertState::Failed;
  Serial.print(F("Alert delivery failed: "));
  Serial.println(sequence);
}

void updateFailureIndicator() {
  if (alertState != AlertState::Failed) return;
  digitalWrite(FrozConfig::kStatusLedPin, (millis() / 250UL) % 2UL);
}
}

void setup() {
  pinMode(FrozConfig::kEmergencyButtonPin, INPUT_PULLUP);
  pinMode(FrozConfig::kStatusLedPin, OUTPUT);
  digitalWrite(FrozConfig::kStatusLedPin, LOW);

  Serial.begin(FrozConfig::kConsoleBaud);
  bluetooth.begin(FrozConfig::kBluetoothBaud);
  incomingLine.reserve(48);

  attachInterrupt(digitalPinToInterrupt(FrozConfig::kEmergencyButtonPin), emergencyInterrupt, FALLING);
  Serial.println(F("Froz-Kit firmware ready"));
}

void loop() {
  acceptEmergencyRequest();
  consumeBluetoothInput();
  handleRetry();
  updateFailureIndicator();
}
