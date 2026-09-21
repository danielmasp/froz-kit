const FRAME_VERSION = "FROZ1";

export class LineBuffer {
  constructor(maxLength = 96) {
    this.maxLength = maxLength;
    this.buffer = "";
  }

  push(chunk) {
    this.buffer += String(chunk);
    if (this.buffer.length > this.maxLength * 4) {
      this.buffer = this.buffer.slice(-this.maxLength);
    }

    const lines = this.buffer.split(/\r?\n/);
    this.buffer = lines.pop() || "";
    return lines.filter(Boolean).map(parseAlertFrame);
  }
}

export function parseAlertFrame(line) {
  const parts = String(line).trim().split(",");
  if (parts.length !== 4 || parts[0] !== FRAME_VERSION || parts[1] !== "ALERT") {
    throw new Error("Unsupported Froz-Kit frame");
  }
  const sequence = Number(parts[2]);
  const deviceUptimeMs = Number(parts[3]);
  if (!Number.isSafeInteger(sequence) || sequence < 1 || !Number.isSafeInteger(deviceUptimeMs) || deviceUptimeMs < 0) {
    throw new Error("Invalid Froz-Kit frame values");
  }
  return { version: FRAME_VERSION, type: "ALERT", sequence, deviceUptimeMs };
}

export function acknowledgementFor(event) {
  return `ACK,${event.sequence}\n`;
}
