import React, { useContext, useEffect, useMemo, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const {
    getTotalCartAmount,
    token,
    cartItems,
    url,
    variantMap,
    setCartItems,
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
  const [cardInfo, setCardInfo] = useState({
    name: "",
    number: "",
    expiry: "",
    cvc: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const paymentOptions = [
    {
      id: "cash",
      title: "Cash on delivery",
      description: "Pay directly to the courier when your food arrives.",
      badge: "CA",
    },
    {
      id: "visa",
      title: "Visa (demo)",
      description: "Simulate a card payment with test card details.",
      badge: "VI",
    },
  ];

  const totalAmount = useMemo(() => getTotalCartAmount(), [cartItems, variantMap]);
  const deliveryFee = totalAmount === 0 ? 0 : 2;

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCardChange = (event) => {
    const { name, value } = event.target;
    setCardInfo((prev) => ({ ...prev, [name]: value }));
  };

  const buildOrderPayload = () =>
    Object.entries(cartItems)
      .filter(([, quantity]) => quantity > 0)
      .map(([variantId, quantity]) => {
        const variant = variantMap[variantId];
        if (!variant) return null;
        return { variantId, quantity };
      })
      .filter(Boolean);

  const placeOrder = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const orderItems = buildOrderPayload();
    if (!orderItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    const branchIds = new Set(
      orderItems
        .map((item) => variantMap[item.variantId]?.branchId)
        .filter(Boolean)
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

    if (paymentMethod === "visa") {
      const missingCardField = Object.entries(cardInfo).find(([, value]) => !value.trim());
      if (missingCardField) {
        toast.error("Please fill in all card details");
        return;
      }
    }

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
          toast.success("Order confirmed - cash on delivery");
          setCartItems({});
          navigate("/myorders");
        } else {
          toast.error(paymentResponse.data.message || "Unable to confirm payment");
        }
      } else {
        const initResponse = await axios.post(
          `${url}/api/v2/orders/pay/stripe`,
          {
            orderId,
            amount,
            card: cardInfo,
          },
          { headers: { token } }
        );
        if (!initResponse.data.success) {
          toast.error(initResponse.data.message || "Unable to initiate payment");
          setSubmitting(false);
          return;
        }
        const clientSecret = initResponse.data.data?.clientSecret;
        const paymentResponse = await axios.post(
          `${url}/api/v2/orders/confirm-payment`,
          {
            orderId,
            provider: "visa",
            transactionId: clientSecret,
            amount,
          },
          { headers: { token } }
        );
        if (paymentResponse.data.success) {
          toast.success("Payment simulated successfully");
          setCartItems({});
          navigate("/myorders");
        } else {
          toast.error(paymentResponse.data.message || "Payment confirmation failed");
        }
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
          {paymentMethod === "visa" && (
            <div className="card-fields">
              <input
                name="name"
                value={cardInfo.name}
                onChange={handleCardChange}
                type="text"
                placeholder="Name on card"
              />
              <input
                name="number"
                value={cardInfo.number}
                onChange={handleCardChange}
                type="text"
                placeholder="Card number"
              />
              <div className="multi-fields">
                <input
                  name="expiry"
                  value={cardInfo.expiry}
                  onChange={handleCardChange}
                  type="text"
                  placeholder="MM/YY"
                />
                <input
                  name="cvc"
                  value={cardInfo.cvc}
                  onChange={handleCardChange}
                  type="text"
                  placeholder="CVC"
                />
              </div>
              <small>This is a simulated payment flow. No real charge will be made.</small>
            </div>
          )}
        </div>
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${totalAmount.toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${deliveryFee.toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${(totalAmount + deliveryFee).toFixed(2)}</b>
            </div>
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? "Processing..." : "Confirm Order"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
