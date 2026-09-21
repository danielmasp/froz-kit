#pragma once

#include <Arduino.h>

namespace EmergencyProtocol {
constexpr char kVersion[] = "FROZ1";

inline void writeAlert(Stream &stream, uint32_t sequence, unsigned long uptimeMs) {
  stream.print(kVersion);
  stream.print(F(",ALERT,"));
  stream.print(sequence);
  stream.print(',');
  stream.println(uptimeMs);
}

inline bool isAckFor(const String &line, uint32_t sequence) {
  String expected = F("ACK,");
  expected += sequence;
  return line == expected;
}
}
