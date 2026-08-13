/** Parsed LAN device stats (AxeOS / ESP-Miner / NerdQAxe dashboard). */
export type DeviceTelemetry = {
  tempC: number | null;
  vrTempC: number | null;
  powerW: number | null;
  voltageV: number | null;
  fanRpm: number | null;
  fanPercent: number | null;
};

export const EMPTY_DEVICE_TELEMETRY: DeviceTelemetry = {
  tempC: null,
  vrTempC: null,
  powerW: null,
  voltageV: null,
  fanRpm: null,
  fanPercent: null,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^0-9.eE+-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = finiteNumber(value);
    if (parsed != null) return parsed;
  }
  return null;
}

function pickFromArray(value: unknown): number | null {
  if (!Array.isArray(value)) return finiteNumber(value);
  const nums = value
    .map((entry) => finiteNumber(entry))
    .filter((entry): entry is number => entry != null && entry > 0);
  if (nums.length === 0) return null;
  return Math.max(...nums);
}

/** 0 / missing sensors → null so the UI never shows fake 0°C. */
function normalizeTemp(value: number | null): number | null {
  if (value == null || value <= 0 || value > 150) return null;
  return value;
}

/** AxeOS voltage is often millivolts when in the thousands. */
function normalizeVoltage(value: number | null): number | null {
  if (value == null || value <= 0) return null;
  if (value > 100) return value / 1000;
  return value;
}

/**
 * Home boards report watts (~5–40). A few firmwares use milliwatts.
 * Farm-class thousands of watts are left as-is when voltage looks like PSU rails.
 */
function normalizePower(value: number | null, voltageV: number | null): number | null {
  if (value == null || value <= 0) return null;
  if (value > 500 && (voltageV == null || voltageV < 30)) return value / 1000;
  return value;
}

function normalizeFanPercent(value: number | null): number | null {
  if (value == null || value < 0) return null;
  if (value === 0) return null;
  if (value <= 1) return value * 100;
  if (value <= 100) return value;
  return null;
}

function normalizeRpm(value: number | null): number | null {
  if (value == null || value <= 0) return null;
  // Duty cycle mis-labeled as rpm.
  if (value <= 100) return null;
  if (value > 30_000) return null;
  return value;
}

/**
 * Pull temps / power / fan from AxeOS `/api/system/info` and Nerd* `/api/v2/dashboard`.
 * Accepts both nested v2 objects and the flatter ESP-Miner system/info shape.
 */
export function parseDeviceTelemetry(
  infoRaw: unknown,
  dashRaw: unknown,
): DeviceTelemetry {
  const info = asRecord(infoRaw);
  const dash = asRecord(dashRaw);
  const thermal = asRecord(dash?.thermal) ?? asRecord(info?.thermal);
  const powerObj = asRecord(dash?.power) ?? asRecord(info?.power);
  const fans = asRecord(dash?.fans) ?? asRecord(info?.fans);
  const performance = asRecord(dash?.performance);

  const tempC = normalizeTemp(
    pickNumber(
      info?.temp,
      info?.asicTemp,
      info?.asic_temp,
      info?.temp2,
      thermal?.asicTemp,
      thermal?.temp,
      thermal?.asic_temp,
      dash?.temp,
      dash?.asicTemp,
    ),
  );
  const vrTempC = normalizeTemp(
    pickNumber(
      info?.vrTemp,
      info?.vr_temp,
      thermal?.vrTemp,
      thermal?.vr_temp,
      dash?.vrTemp,
    ),
  );

  const voltageV = normalizeVoltage(
    pickNumber(
      powerObj?.voltage,
      info?.voltage,
      dash?.voltage,
      performance?.voltage,
    ),
  );

  const powerW = normalizePower(
    pickNumber(
      powerObj?.power,
      powerObj?.watts,
      info?.power,
      dash?.power,
      performance?.power,
    ),
    voltageV,
  );

  const fanPercent = normalizeFanPercent(
    pickNumber(
      fans?.percent,
      fans?.speed,
      fans?.fanspeed,
      info?.fanspeed,
      info?.fanSpeed,
      dash?.fanspeed,
      dash?.fanSpeed,
    ),
  );

  const fanRpm = normalizeRpm(
    pickFromArray(fans?.rpm) ??
      pickNumber(
        info?.fanrpm,
        info?.fanRpm,
        info?.fan_rpm,
        dash?.fanrpm,
        dash?.fanRpm,
      ),
  );

  return {
    tempC,
    vrTempC,
    powerW,
    voltageV,
    fanRpm,
    fanPercent,
  };
}
