import { acknowledgementFor } from "./protocol.js";

function validCoordinates(location) {
  return Number.isFinite(location?.latitude)
    && Number.isFinite(location?.longitude)
    && Math.abs(location.latitude) <= 90
    && Math.abs(location.longitude) <= 180;
}

export async function enrichEmergencyEvent(event, getLocation, now = () => new Date()) {
  const location = await getLocation();
  if (!validCoordinates(location)) throw new Error("A valid GPS location is required");

  return {
    protocol: event.version,
    eventType: "limb_preservation_emergency",
    deviceSequence: event.sequence,
    deviceUptimeMs: event.deviceUptimeMs,
    observedAt: now().toISOString(),
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracyMeters: Number.isFinite(location.accuracyMeters) ? location.accuracyMeters : null,
    },
  };
}

export async function dispatchEmergencyAlert(payload, options) {
  const { endpoint, fetchImpl = fetch, signal } = options;
  if (!endpoint) throw new Error("Emergency API endpoint is required");

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) throw new Error(`Emergency API returned ${response.status}`);
  return response.json();
}

export async function processAlert(event, adapters) {
  const payload = await enrichEmergencyEvent(event, adapters.getLocation, adapters.now);
  const receipt = await dispatchEmergencyAlert(payload, {
    endpoint: adapters.endpoint,
    fetchImpl: adapters.fetchImpl,
    signal: adapters.signal,
  });
  await adapters.writeBluetooth(acknowledgementFor(event));
  return { payload, receipt };
}
