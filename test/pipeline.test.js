import test from "node:test";
import assert from "node:assert/strict";
import { enrichEmergencyEvent, processAlert } from "../companion/pipeline.js";

const event = { version: "FROZ1", type: "ALERT", sequence: 8, deviceUptimeMs: 400 };

test("enriches an alert with GPS and observation time", async () => {
  const payload = await enrichEmergencyEvent(
    event,
    async () => ({ latitude: -33.45, longitude: -70.66, accuracyMeters: 5 }),
    () => new Date("2026-09-21T12:00:00.000Z"),
  );
  assert.equal(payload.deviceSequence, 8);
  assert.equal(payload.location.latitude, -33.45);
  assert.equal(payload.observedAt, "2026-09-21T12:00:00.000Z");
});

test("acknowledges firmware only after the API accepts the alert", async () => {
  const writes = [];
  const result = await processAlert(event, {
    endpoint: "https://example.test/alerts",
    getLocation: async () => ({ latitude: 40.44, longitude: -79.99 }),
    fetchImpl: async () => ({ ok: true, json: async () => ({ id: "alert-8" }) }),
    writeBluetooth: async (value) => writes.push(value),
  });
  assert.equal(result.receipt.id, "alert-8");
  assert.deepEqual(writes, ["ACK,8\n"]);
});

test("does not acknowledge firmware when dispatch fails", async () => {
  const writes = [];
  await assert.rejects(() => processAlert(event, {
    endpoint: "https://example.test/alerts",
    getLocation: async () => ({ latitude: 40.44, longitude: -79.99 }),
    fetchImpl: async () => ({ ok: false, status: 503 }),
    writeBluetooth: async (value) => writes.push(value),
  }));
  assert.deepEqual(writes, []);
});
