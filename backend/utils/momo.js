import crypto from "crypto";
import fetch from "node-fetch";

const isPlaceholder = (value = "") =>
  !value ||
  value.trim() === "" ||
  /^your[-_]/i.test(value) ||
  value.toUpperCase().includes("YOUR_MOMO");

const getConfig = () => {
  const {
    MOMO_PARTNER_CODE,
    MOMO_ACCESS_KEY,
    MOMO_SECRET_KEY,
    MOMO_ENDPOINT,
    MOMO_QUERY_ENDPOINT,
    MOMO_REDIRECT_URL,
    MOMO_IPN_URL,
    MOMO_REQUEST_TYPE,
    MOMO_LANG,
    MOMO_AUTO_CAPTURE,
    MOMO_PARTNER_NAME,
    MOMO_STORE_ID,
  } = process.env;

  if (
    isPlaceholder(MOMO_PARTNER_CODE) ||
    isPlaceholder(MOMO_ACCESS_KEY) ||
    isPlaceholder(MOMO_SECRET_KEY)
  ) {
    throw new Error("MOMO_CONFIG_INCOMPLETE");
  }

  return {
    partnerCode: MOMO_PARTNER_CODE,
    accessKey: MOMO_ACCESS_KEY,
    secretKey: MOMO_SECRET_KEY,
    createEndpoint:
      MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    queryEndpoint:
      MOMO_QUERY_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/query",
    redirectUrl: MOMO_REDIRECT_URL,
    ipnUrl: MOMO_IPN_URL,
    requestType: MOMO_REQUEST_TYPE || "captureWallet",
    lang: MOMO_LANG || "vi",
    autoCapture:
      MOMO_AUTO_CAPTURE !== undefined
        ? MOMO_AUTO_CAPTURE !== "false"
        : true,
    partnerName: MOMO_PARTNER_NAME || "FastFoodOnline",
    storeId: MOMO_STORE_ID || "FastFoodOnlineStore",
  };
};

const hmacSha256 = (key, data) =>
  crypto.createHmac("sha256", key).update(data).digest("hex");

export const createPayment = async ({
  orderId,
  amount,
  orderInfo,
  redirectUrl,
  ipnUrl,
  extraData = "",
}) => {
  const config = getConfig();

  const normalizedOrderId = String(orderId);
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("MOMO_INVALID_AMOUNT");
  }

  const requestId = `${config.partnerCode}-${Date.now()}`;
  const redirect = redirectUrl || config.redirectUrl;
  const ipn = ipnUrl || config.ipnUrl || "";

  const payload = {
    partnerCode: config.partnerCode,
    partnerName: config.partnerName,
    storeId: config.storeId,
    requestId,
    amount: String(Math.round(numericAmount)),
    orderId: normalizedOrderId,
    orderInfo: orderInfo || `Payment for order ${normalizedOrderId}`,
    redirectUrl: redirect,
    ipnUrl: ipn,
    lang: config.lang,
    requestType: config.requestType,
    extraData: extraData || "",
    autoCapture: config.autoCapture,
    orderGroupId: "",
  };

  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `amount=${payload.amount}`,
    `extraData=${payload.extraData}`,
    `ipnUrl=${ipn}`,
    `orderId=${payload.orderId}`,
    `orderInfo=${payload.orderInfo}`,
    `partnerCode=${config.partnerCode}`,
    `redirectUrl=${redirect}`,
    `requestId=${requestId}`,
    `requestType=${config.requestType}`,
  ].join("&");

  payload.signature = hmacSha256(config.secretKey, rawSignature);

  const response = await fetch(config.createEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      accessKey: config.accessKey,
      orderExpireTime: 600,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `MOMO_CREATE_FAILED:${response.status}:${text.slice(0, 200)}`
    );
  }

  const data = await response.json();
  return {
    data,
    requestId,
    payload,
  };
};

export const queryPaymentStatus = async ({ orderId, requestId }) => {
  const config = getConfig();
  const normalizedOrderId = String(orderId);
  if (!requestId) {
    throw new Error("MOMO_REQUEST_ID_REQUIRED");
  }

  const rawSignature = [
    `accessKey=${config.accessKey}`,
    `orderId=${normalizedOrderId}`,
    `partnerCode=${config.partnerCode}`,
    `requestId=${requestId}`,
  ].join("&");

  const signature = hmacSha256(config.secretKey, rawSignature);

  const response = await fetch(config.queryEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerCode: config.partnerCode,
      requestId,
      orderId: normalizedOrderId,
      lang: config.lang,
      signature,
      accessKey: config.accessKey,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `MOMO_QUERY_FAILED:${response.status}:${text.slice(0, 200)}`
    );
  }

  return response.json();
};

export default {
  createPayment,
  queryPaymentStatus,
};
