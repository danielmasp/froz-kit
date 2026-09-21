import test from "node:test";
import assert from "node:assert/strict";
import { acknowledgementFor, LineBuffer, parseAlertFrame } from "../companion/protocol.js";

test("parses a complete alert frame", () => {
  assert.deepEqual(parseAlertFrame("FROZ1,ALERT,42,9012"), {
    version: "FROZ1",
    type: "ALERT",
    sequence: 42,
    deviceUptimeMs: 9012,
  });
});

test("buffers fragmented Bluetooth serial input", () => {
  const buffer = new LineBuffer();
  assert.deepEqual(buffer.push("FROZ1,AL"), []);
  assert.deepEqual(buffer.push("ERT,3,120\n")[0].sequence, 3);
});

test("rejects malformed and invalid frames", () => {
  assert.throws(() => parseAlertFrame("OTHER,ALERT,1,2"));
  assert.throws(() => parseAlertFrame("FROZ1,ALERT,-1,2"));
});

test("creates the firmware acknowledgement", () => {
  assert.equal(acknowledgementFor({ sequence: 7 }), "ACK,7\n");
});
