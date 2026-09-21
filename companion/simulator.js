import { LineBuffer } from "./protocol.js";
import { processAlert } from "./pipeline.js";

const parser = new LineBuffer();
const [event] = parser.push("FROZ1,ALERT,17,8421\n");

const result = await processAlert(event, {
  endpoint: "https://example.invalid/emergency-alerts",
  getLocation: async () => ({ latitude: -33.4489, longitude: -70.6693, accuracyMeters: 8 }),
  now: () => new Date("2026-09-21T12:00:00.000Z"),
  fetchImpl: async (_url, request) => ({ ok: true, json: async () => ({ accepted: true, body: JSON.parse(request.body) }) }),
  writeBluetooth: async (ack) => process.stdout.write(`Bluetooth → ${ack}`),
});

console.log(JSON.stringify(result, null, 2));
