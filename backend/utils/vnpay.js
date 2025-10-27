import crypto from "crypto";

const getConfig = () => {
  const {
    VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET,
    VNPAY_RETURN_URL,
    VNPAY_PAY_URL,
    VNPAY_VERSION,
    VNPAY_LOCALE,
    VNPAY_ORDER_TYPE,
    VNPAY_DEFAULT_BANK,
    VNPAY_EXPIRE_MINUTES,
  } = process.env;

  if (!VNPAY_TMN_CODE || !VNPAY_HASH_SECRET || !VNPAY_RETURN_URL) {
    throw new Error("VNPAY_CONFIG_INCOMPLETE");
  }

  return {
    tmnCode: VNPAY_TMN_CODE,
    hashSecret: VNPAY_HASH_SECRET,
    returnUrl: VNPAY_RETURN_URL,
    payUrl:
      VNPAY_PAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    version: VNPAY_VERSION || "2.1.0",
    locale: VNPAY_LOCALE || "vn",
    orderType: VNPAY_ORDER_TYPE || "other",
    bankCode: VNPAY_DEFAULT_BANK || undefined,
    expireMinutes: Number(VNPAY_EXPIRE_MINUTES || 15),
  };
};

const toVnpayAmount = (amount) => {
  const numericAmount = Number(amount || 0);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("VNPAY_INVALID_AMOUNT");
  }
  return Math.round(numericAmount * 100);
};

const formatDate = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

const buildSignData = (params) => {
  const sortedKeys = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== "")
    .sort();

  return sortedKeys
    .map((key) => `${key}=${encodeURIComponent(params[key])}`)
    .join("&");
};

export const createPaymentUrl = ({
  orderId,
  amount,
  orderInfo,
  ipAddress,
  extraParams = {},
} = {}) => {
  const config = getConfig();
  const vnp_Params = {
    vnp_Version: config.version,
    vnp_Command: "pay",
    vnp_TmnCode: config.tmnCode,
    vnp_Amount: toVnpayAmount(amount),
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo || `Payment for order ${orderId}`,
    vnp_OrderType: config.orderType,
    vnp_Locale: config.locale,
    vnp_ReturnUrl: config.returnUrl,
    vnp_IpAddr: ipAddress || "127.0.0.1",
    vnp_CreateDate: formatDate(new Date()),
    ...extraParams,
  };

  if (config.bankCode) {
    vnp_Params.vnp_BankCode = config.bankCode;
  }

  if (config.expireMinutes > 0) {
    const expireDate = new Date(Date.now() + config.expireMinutes * 60 * 1000);
    vnp_Params.vnp_ExpireDate = formatDate(expireDate);
  }

  const signData = buildSignData(vnp_Params);
  const secureHash = crypto
    .createHmac("sha512", config.hashSecret)
    .update(signData)
    .digest("hex");

  const paymentUrl = `${config.payUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  return {
    paymentUrl,
    secureHash,
    params: vnp_Params,
  };
};

export const verifyReturnParams = (query = {}) => {
  const config = getConfig();
  const receivedSecureHash = query.vnp_SecureHash;

  if (!receivedSecureHash) {
    return {
      isValid: false,
      message: "Missing VNPAY secure hash",
      data: query,
    };
  }

  const vnp_Params = { ...query };
  delete vnp_Params.vnp_SecureHash;
  delete vnp_Params.vnp_SecureHashType;

  const signData = buildSignData(vnp_Params);
  const calculatedHash = crypto
    .createHmac("sha512", config.hashSecret)
    .update(signData)
    .digest("hex");

  const isValid =
    calculatedHash.toLowerCase() === receivedSecureHash.toLowerCase();

  return {
    isValid,
    data: vnp_Params,
    secureHash: receivedSecureHash,
    calculatedHash,
  };
};

export default {
  createPaymentUrl,
  verifyReturnParams,
};


