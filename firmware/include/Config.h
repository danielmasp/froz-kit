#pragma once

#include <Arduino.h>

namespace FrozConfig {
constexpr uint8_t kEmergencyButtonPin = 2;
constexpr uint8_t kStatusLedPin = LED_BUILTIN;
constexpr uint8_t kBluetoothRxPin = 10;
constexpr uint8_t kBluetoothTxPin = 11;

constexpr unsigned long kConsoleBaud = 9600;
constexpr unsigned long kBluetoothBaud = 9600;
constexpr unsigned long kDebounceMicros = 50000UL;
constexpr unsigned long kAckTimeoutMs = 1500UL;
constexpr uint8_t kMaxAttempts = 3;
}
