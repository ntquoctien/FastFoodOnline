import fetch from "node-fetch";
import { setTimeout as delay } from "node:timers/promises";

// Geocoding helpers.
// Primary: MapTiler
// Fallbacks: OpenCage, GeoCode Earth (optional)
// Env:
//  - MAPTILER_KEY (required for primary)
//  - MAPTILER_BASE_URL (optional, default: https://api.maptiler.com/geocoding)
//  - OPENCAGE_KEY (optional fallback 1)
//  - GEOCODE_EARTH_KEY (optional fallback 2)
//  - GEOCODER_TIMEOUT_MS (optional, default: 5000)
//  - GEOCODER_LANGUAGE (optional, default: vi)
//  - GEOCODER_COUNTRY (optional, default: vn)

const getBaseUrl = () =>
  process.env.MAPTILER_BASE_URL ||
  "https://api.maptiler.com/geocoding";
const getTimeout = () =>
  Number(process.env.GEOCODER_TIMEOUT_MS || 5000) || 5000;
const getLanguage = () => process.env.GEOCODER_LANGUAGE || "vi";
const getCountry = () => (process.env.GEOCODER_COUNTRY || "vn").toLowerCase();
const getOpenCageKey = () => process.env.OPENCAGE_KEY;
const getGeoEarthKey = () =>
  process.env.GEOCODE_EARTH_KEY || process.env.GEOCODE_EARTH_API_KEY;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const fetchWithTimeout = async (url, { headers } = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getTimeout());
  try {
    const res = await (globalThis.fetch || fetch)(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(headers || {}),
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
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
  try {
    const maptilerResult = await (async () => {
      if (!key) {
        console.warn("MAPTILER_KEY is missing, skipping primary geocoder");
        return null;
      }
      try {
        const encoded = encodeURIComponent(fullText);
        const url = `${getBaseUrl()}/${encoded}.json?key=${key}&language=${getLanguage()}&country=${getCountry()}&limit=1`;
        const res = await fetchWithTimeout(url);
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
      } catch (err) {
        if (err.name === "AbortError") {
          console.warn("MapTiler geocode timed out");
        } else {
          console.warn("MapTiler geocode error", err);
        }
        return null;
      }
    })();

    if (maptilerResult) {
      return maptilerResult;
    }

    // Fallback: OpenCage
    const ocKey = getOpenCageKey();
    if (ocKey) {
      try {
        const ocParams = new URLSearchParams({
          key: ocKey,
          q: fullText,
          language: getLanguage(),
          countrycode: getCountry(),
          limit: "1",
        });
        const ocUrl = `https://api.opencagedata.com/geocode/v1/json?${ocParams.toString()}`;
        const ocRes = await fetchWithTimeout(ocUrl);
        if (!ocRes.ok) {
          console.warn("OpenCage HTTP error", ocRes.status, ocRes.statusText);
        } else {
          const ocData = await ocRes.json();
          const ocFeature = Array.isArray(ocData?.results) ? ocData.results[0] : null;
          const ocLng = toNumber(ocFeature?.geometry?.lng);
          const ocLat = toNumber(ocFeature?.geometry?.lat);
          if (Number.isFinite(ocLat) && Number.isFinite(ocLng)) {
            return { lat: ocLat, lng: ocLng, fullText };
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.warn("OpenCage geocode timed out");
        } else {
          console.warn("OpenCage geocode error", err);
        }
      }
    } else {
      console.warn("OpenCage fallback skipped: OPENCAGE_KEY missing");
    }

    // Fallback 2: GeoCode Earth
    const geKey = getGeoEarthKey();
    if (geKey) {
      try {
        const geParams = new URLSearchParams({
          api_key: geKey,
          text: fullText,
          size: "1",
          lang: getLanguage(),
        });
        const countryCode = getCountry();
        if (countryCode) {
          geParams.set("boundary.country", countryCode.toUpperCase());
        }
        const geUrl = `https://api.geocode.earth/v1/search?${geParams.toString()}`;
        const geRes = await fetchWithTimeout(geUrl);
        if (!geRes.ok) {
          console.warn("GeoCode Earth HTTP error", geRes.status, geRes.statusText);
        } else {
          const geData = await geRes.json();
          const geFeature = Array.isArray(geData?.features) ? geData.features[0] : null;
          const coords = geFeature?.geometry?.coordinates;
          const geLng = toNumber(coords?.[0]);
          const geLat = toNumber(coords?.[1]);
          if (Number.isFinite(geLat) && Number.isFinite(geLng)) {
            return { lat: geLat, lng: geLng, fullText };
          }
        }
      } catch (err) {
        if (err.name === "AbortError") {
          console.warn("GeoCode Earth geocode timed out");
        } else {
          console.warn("GeoCode Earth geocode error", err);
        }
      }
    } else {
      console.warn("GeoCode Earth fallback skipped: GEOCODE_EARTH_KEY missing");
    }

    return null;
  } catch (error) {
    console.error("Geocode error", error);
    await delay(50);
    return null;
  }
};

export default { resolveAddress, buildFullAddress };
