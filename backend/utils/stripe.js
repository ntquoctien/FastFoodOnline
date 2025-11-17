import Stripe from "stripe";

let stripeClient = null;
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif",
  "clp",
  "djf",
  "gnf",
  "jpy",
  "kmf",
  "krw",
  "mga",
  "pyg",
  "rwf",
  "ugx",
  "vnd",
  "vuv",
  "xaf",
  "xof",
  "xpf",
]);

const getStripeClient = () => {
  if (stripeClient) {
    return stripeClient;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || /^your[_-]?stripe_/i.test(secretKey) || secretKey.includes("YOUR_STRIPE_SECRET_KEY")) {
    throw new Error("STRIPE_CONFIG_INCOMPLETE");
  }
  stripeClient = new Stripe(secretKey);
  return stripeClient;
};

const normaliseCurrency = (currency) => {
  if (!currency) {
    return "vnd";
  }
  return String(currency).trim().toLowerCase();
};

const toStripeAmount = (amount, currency = "vnd") => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error("STRIPE_INVALID_AMOUNT");
  }
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    return Math.round(numeric);
  }
  return Math.round(numeric * 100);
};

export const createCheckoutSession = async ({
  amount,
  currency,
  successUrl,
  cancelUrl,
  metadata = {},
  customerEmail,
  description,
}) => {
  const stripe = getStripeClient();
  const normalizedCurrency = normaliseCurrency(currency);
  const unitAmount = toStripeAmount(amount, normalizedCurrency);
  const orderName =
    description ||
    metadata?.orderName ||
    (metadata?.orderId ? `Order ${metadata.orderId}` : "Order payment");
  const clientReferenceId =
    metadata?.orderId !== undefined && metadata.orderId !== null
      ? String(metadata.orderId)
      : undefined;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: normalizedCurrency,
          unit_amount: unitAmount,
          product_data: {
            name: orderName,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    customer_email: customerEmail,
    client_reference_id: clientReferenceId,
  });

  return session;
};

export const retrieveCheckoutSession = async (sessionId) => {
  if (!sessionId) {
    throw new Error("STRIPE_SESSION_REQUIRED");
  }
  const stripe = getStripeClient();
  return stripe.checkout.sessions.retrieve(sessionId);
};

export const retrievePaymentIntent = async (paymentIntentId) => {
  if (!paymentIntentId) {
    throw new Error("STRIPE_PAYMENT_INTENT_REQUIRED");
  }
  const stripe = getStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
};

export default {
  createCheckoutSession,
  retrieveCheckoutSession,
  retrievePaymentIntent,
};
