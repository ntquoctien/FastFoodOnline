import fetch from "node-fetch";
import { setTimeout as delay } from "node:timers/promises";

// Simple geocoder using Nominatim (OpenStreetMap).
// Override via env:
//  - GEOCODER_BASE_URL (default: https://nominatim.openstreetmap.org/search)
//  - GEOCODER_USER_AGENT (default: FastFoodOnline-Geocoder/1.0)
//  - GEOCODER_TIMEOUT_MS (default: 5000)
const getBaseUrl = () =>
  process.env.GEOCODER_BASE_URL ||
  "https://nominatim.openstreetmap.org/search";
const getUserAgent = () =>
  process.env.GEOCODER_USER_AGENT || "FastFoodOnline-Geocoder/1.0";
const getTimeout = () =>
  Number(process.env.GEOCODER_TIMEOUT_MS || 5000) || 5000;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const resolveAddress = async (address) => {
  if (!address || typeof address !== "string") {
    return null;
  }

  const timeoutMs = getTimeout();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = new URL(getBaseUrl());
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const res = await (globalThis.fetch || fetch)(url.toString(), {
      method: "GET",
      headers: {
        "User-Agent": getUserAgent(),
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("Geocode HTTP error", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || !data.length) {
      return null;
    }

    const entry = data[0];
    const lat = toNumber(entry.lat);
    const lng = toNumber(entry.lon || entry.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return { lat, lng };
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("Geocode request timed out");
      return null;
    }
    console.error("Geocode error", error);
    // small backoff to avoid hammering the provider on repeated failures
    await delay(50);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export default { resolveAddress };
