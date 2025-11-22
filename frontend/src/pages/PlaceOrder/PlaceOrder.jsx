import React, { useContext, useEffect, useMemo, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/frontend_assets/assets";
import { formatCurrency } from "../../utils/currency";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const {
    getTotalCartAmount,
    token,
    cartItems,
    url,
    variantMap,
    setCartItems,
    branches,
  } = useContext(StoreContext);

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [submitting, setSubmitting] = useState(false);
  const paymentOptions = [
    {
      id: "cash",
      title: "Cash on delivery",
      description: "Pay directly to the courier when your food arrives.",
      badge: "CA",
    },
    {
      id: "stripe",
      title: "Credit / Debit Card",
      description: "Pay securely using international cards processed by Stripe.",
      badge: "CC",
    },
    {
      id: "momo",
      title: "MoMo E-wallet",
      description: "Fast checkout with the MoMo wallet and QR support.",
      badge: "MO",
    },
    {
      id: "vnpay",
      title: "VNPAY QR",
      description: "Pay instantly via VNPAY QR / mobile app.",
      badge: "VN",
    },
  ];

  const totalAmount = useMemo(() => getTotalCartAmount(), [cartItems, variantMap]);
  const deliveryFee = totalAmount === 0 ? 0 : 2;

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const branchLookup = useMemo(() => {
    const lookup = {};
    (branches || []).forEach((branch) => {
      lookup[String(branch._id)] = branch.name;
    });
    return lookup;
  }, [branches]);

  const checkoutItems = useMemo(() => {
    const resolveImage = (value) => {
      if (!value) return assets.placeholder_image;
      if (/^https?:\/\//i.test(value)) return value;
      const cleaned = String(value).replace(/^\/+/, "");
      return `${url}/images/${cleaned}`;
    };

    return Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([variantId, quantity]) => {
        const variant = variantMap[variantId];
        if (!variant) return null;
        const branchId = variant.branchId ? String(variant.branchId) : null;
        const imageSrc = resolveImage(variant.foodImage);
        return {
          variantId,
          quantity,
          branchId,
          name: variant.foodName || variant.name || "Món ăn",
          size: variant.size,
          price: variant.price,
          total: (variant.price || 0) * quantity,
          description: variant.foodDescription || variant.description || "",
          branchName:
            variant.branchName || (branchId ? branchLookup[branchId] : ""),
          image: imageSrc,
        };
      })
      .filter(Boolean);
  }, [cartItems, variantMap, branchLookup, url]);

  const activeBranchName = useMemo(() => {
    if (!checkoutItems.length) return "";
    return (
      checkoutItems[0].branchName ||
      (checkoutItems[0].branchId
        ? branchLookup[checkoutItems[0].branchId]
        : "")
    );
  }, [checkoutItems, branchLookup]);

  const placeOrder = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (!checkoutItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    const branchIds = new Set(
      checkoutItems.map((item) => item.branchId).filter(Boolean)
    );
    if (branchIds.size === 0) {
      toast.error("Unable to determine serving branch");
      return;
    }
    if (branchIds.size > 1) {
      toast.error("Please group cart items by branch before checkout");
      return;
    }
    const [branchId] = Array.from(branchIds);
    const orderItems = checkoutItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    setSubmitting(true);
    try {
      const orderResponse = await axios.post(
        `${url}/api/v2/orders`,
        {
          branchId,
          items: orderItems,
          address: data,
        },
        { headers: { token } }
      );
      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.message || "Unable to create order");
        setSubmitting(false);
        return;
      }

      const orderId = orderResponse.data.data._id;
      const amount = totalAmount + deliveryFee;

      if (paymentMethod === "cash") {
        const paymentResponse = await axios.post(
          `${url}/api/v2/orders/confirm-payment`,
          {
            orderId,
            provider: "cash",
            transactionId: `cash-${Date.now()}`,
            amount,
          },
          { headers: { token } }
        );
        if (paymentResponse.data.success) {
          sessionStorage.removeItem("pendingOrderId");
          toast.success("Order confirmed - cash on delivery");
          setCartItems({});
          navigate("/myorders");
        } else {
          toast.error(paymentResponse.data.message || "Unable to confirm payment");
        }
      } else if (paymentMethod === "stripe") {
        const initResponse = await axios.post(
          `${url}/api/v2/orders/pay/stripe`,
          {
            orderId,
            amount,
          },
          { headers: { token } }
        );
        if (!initResponse.data.success) {
          toast.error(initResponse.data.message || "Unable to initiate Stripe payment");
          return;
        }
        const checkoutUrl = initResponse.data.data?.checkoutUrl;
        if (!checkoutUrl) {
          toast.error("Stripe checkout URL not received");
          return;
        }
        sessionStorage.setItem("pendingOrderId", orderId);
        toast.info("Redirecting to Stripe...", { autoClose: 1500 });
        window.location.href = checkoutUrl;
        return;
      } else if (paymentMethod === "momo") {
        const initResponse = await axios.post(
          `${url}/api/v2/orders/pay/momo`,
          {
            orderId,
            amount,
          },
          { headers: { token } }
        );
        if (!initResponse.data.success) {
          toast.error(initResponse.data.message || "Unable to initiate MoMo payment");
          return;
        }
        const payUrl = initResponse.data.data?.payUrl;
        if (!payUrl) {
          toast.error("MoMo payment URL not received");
          return;
        }
        sessionStorage.setItem("pendingOrderId", orderId);
        toast.info("Redirecting to MoMo...", { autoClose: 1500 });
        window.location.href = payUrl;
        return;
      } else {
        const initResponse = await axios.post(
          `${url}/api/v2/orders/pay/vnpay`,
          {
            orderId,
            amount,
          },
          { headers: { token } }
        );
        if (!initResponse.data.success) {
          toast.error(initResponse.data.message || "Unable to initiate payment");
          return;
        }
        const paymentUrl = initResponse.data.data?.paymentUrl;
        if (!paymentUrl) {
          toast.error("Payment URL not received");
          return;
        }
        sessionStorage.setItem("pendingOrderId", orderId);
        toast.info("Redirecting to VNPAY...", { autoClose: 1500 });
        window.location.href = paymentUrl;
        return;
      }
    } catch (error) {
      console.error("Checkout failed", error);
      toast.error("Unable to complete checkout");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/cart");
    } else if (totalAmount === 0) {
      toast.error("Your cart is empty");
      navigate("/cart");
    }
  }, [token, totalAmount, navigate]);

  return (
    <form className="place-order" onSubmit={placeOrder}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input
            required
            name="firstName"
            value={data.firstName}
            onChange={onChangeHandler}
            type="text"
            placeholder="First name"
          />
          <input
            required
            name="lastName"
            value={data.lastName}
            onChange={onChangeHandler}
            type="text"
            placeholder="Last name"
          />
        </div>
        <input
          required
          name="email"
          value={data.email}
          onChange={onChangeHandler}
          type="email"
          placeholder="Email Address"
        />
        <input
          required
          name="street"
          value={data.street}
          onChange={onChangeHandler}
          type="text"
          placeholder="Street"
        />
        <div className="multi-fields">
          <input
            required
            name="city"
            value={data.city}
            onChange={onChangeHandler}
            type="text"
            placeholder="City"
          />
          <input
            required
            name="state"
            value={data.state}
            onChange={onChangeHandler}
            type="text"
            placeholder="State"
          />
        </div>
        <div className="multi-fields">
          <input
            required
            name="zipcode"
            value={data.zipcode}
            onChange={onChangeHandler}
            type="text"
            placeholder="Zip Code"
          />
          <input
            required
            name="country"
            value={data.country}
            onChange={onChangeHandler}
            type="text"
            placeholder="Country"
          />
        </div>
        <input
          required
          name="phone"
          value={data.phone}
          onChange={onChangeHandler}
          type="text"
          placeholder="Phone"
        />
        <div className="payment-method">
          <p className="title">Payment Method</p>
          <div className="payment-method-options">
            {paymentOptions.map((option) => (
              <label
                key={option.id}
                htmlFor={`payment-${option.id}`}
                className={`payment-option ${paymentMethod === option.id ? "selected" : ""}`}
              >
                <input
                  id={`payment-${option.id}`}
                  type="radio"
                  name="payment"
                  value={option.id}
                  checked={paymentMethod === option.id}
                  onChange={() => setPaymentMethod(option.id)}
                />
                <span className="payment-option-badge">{option.badge}</span>
                <span className="payment-option-content">
                  <span className="payment-option-title">{option.title}</span>
                  <span className="payment-option-description">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="place-order-right">
        <div className="order-summary">
          <div className="order-summary-header">
            <h2>Đơn hàng của bạn</h2>
            {activeBranchName && checkoutItems.length > 0 && (
              <span className="order-summary-branch">
                Giao từ: <strong>{activeBranchName}</strong>
              </span>
            )}
          </div>

          <div className="order-summary-list">
            {checkoutItems.length === 0 ? (
              <p className="order-summary-empty">
                Giỏ hàng của bạn đang trống. Hãy thêm món trước khi thanh toán.
              </p>
            ) : (
              checkoutItems.map((item) => (
                <div className="order-summary-item" key={item.variantId}>
                  <div className="order-summary-item-media">
                    <img src={item.image} alt={item.name} />
                    <span className="order-summary-quantity">
                      x{item.quantity}
                    </span>
                  </div>
                  <div className="order-summary-item-content">
                    <div className="order-summary-item-title">
                      <span>{item.name}</span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                    <div className="order-summary-item-meta">
                      {item.size && (
                        <span className="order-summary-item-badge">
                          Size {item.size}
                        </span>
                      )}
                      {item.branchName && (
                        <span className="order-summary-item-badge muted">
                          {item.branchName}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="order-summary-item-desc">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="order-summary-totals">
            <div className="order-summary-row">
              <span>Tạm tính</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="order-summary-row">
              <span>Phí giao hàng</span>
              <span>{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="order-summary-row order-summary-row-total">
              <span>Tổng cộng</span>
              <span>{formatCurrency(totalAmount + deliveryFee)}</span>
            </div>
            <button
              type="submit"
              className="order-summary-action"
              disabled={submitting || checkoutItems.length === 0}
            >
              {submitting ? "Đang xử lý..." : "Xác nhận đặt món"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;

