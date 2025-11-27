import fetch from "node-fetch";
import { setTimeout as delay } from "node:timers/promises";

// MapTiler geocoding helper.
// Env:
//  - MAPTILER_KEY (required)
//  - MAPTILER_BASE_URL (optional, default: https://api.maptiler.com/geocoding)
//  - GEOCODER_TIMEOUT_MS (optional, default: 5000)
//  - GEOCODER_LANGUAGE (optional, default: vi)
//  - GEOCODER_COUNTRY (optional, default: vn)

const getBaseUrl = () =>
  process.env.MAPTILER_BASE_URL ||
  "https://api.maptiler.com/geocoding";
const getTimeout = () =>
  Number(process.env.GEOCODER_TIMEOUT_MS || 5000) || 5000;
const getLanguage = () => process.env.GEOCODER_LANGUAGE || "vi";
const getCountry = () => process.env.GEOCODER_COUNTRY || "vn";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const buildFullAddress = (addressObj) => {
  if (typeof addressObj === "string") return addressObj;
  const parts = [
    addressObj?.street,
    addressObj?.ward,
    addressObj?.district,
    addressObj?.city,
    addressObj?.country || "Vietnam",
  ]
    .map((p) => (p || "").trim())
    .filter(Boolean);
  return parts.join(", ");
};

export const resolveAddress = async (addressInput) => {
  const fullText = buildFullAddress(addressInput);
  if (!fullText) return null;

  const key = process.env.MAPTILER_KEY;
  if (!key) {
    console.warn("MAPTILER_KEY is missing, geocoding skipped");
    return null;
  }

  const timeoutMs = getTimeout();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = encodeURIComponent(fullText);
    const url = `${getBaseUrl()}/${encoded}.json?key=${key}&language=${getLanguage()}&country=${getCountry()}&limit=1`;

    const res = await (globalThis.fetch || fetch)(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("Geocode HTTP error", res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    const feature = Array.isArray(data?.features) ? data.features[0] : null;
    const coords = feature?.geometry?.coordinates;
    const lng = toNumber(coords?.[0]);
    const lat = toNumber(coords?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng, fullText };
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("Geocode request timed out");
      return null;
    }
    console.error("Geocode error", error);
    await delay(50);
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

export default { resolveAddress, buildFullAddress };
