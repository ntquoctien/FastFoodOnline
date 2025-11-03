import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/frontend_assets/assets";

const formatOrderCode = (id) => {
  if (!id || typeof id !== "string") return "Order";
  return `Order #${id.slice(-6).toUpperCase()}`;
};

const formatDate = (timestamp) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildStatusClass = (status = "pending") =>
  status.toLowerCase().replace(/\s+/g, "-");

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [cancelForm, setCancelForm] = useState({ orderId: null, reason: "" });
  const [cancelling, setCancelling] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/v2/orders/me`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  const confirmReceipt = async (orderId) => {
    if (!orderId) return;
    try {
      setConfirming(orderId);
      const response = await axios.patch(
        `${url}/api/v2/orders/${orderId}/confirm-receipt`,
        {},
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Thanks for confirming your delivery!");
        fetchOrders();
      } else {
        toast.error(response.data?.message || "Unable to confirm order right now");
      }
    } catch (error) {
      console.error("Order confirm receipt failed", error);
      toast.error("Unable to confirm order right now");
    } finally {
      setConfirming(null);
    }
  };

  const startCancel = (orderId) => {
    setCancelForm((prev) =>
      prev.orderId === orderId ? { orderId: null, reason: "" } : { orderId, reason: "" }
    );
  };

  const submitCancellation = async () => {
    if (!cancelForm.orderId) return;
    const trimmed = cancelForm.reason.trim();
    if (!trimmed) {
      toast.error("Please share a short reason for cancelling.");
      return;
    }
    try {
      setCancelling(cancelForm.orderId);
      const response = await axios.patch(
        `${url}/api/v2/orders/${cancelForm.orderId}/cancel`,
        { reason: trimmed },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Order cancelled successfully.");
        setCancelForm({ orderId: null, reason: "" });
        fetchOrders();
      } else {
        toast.error(response.data?.message || "Unable to cancel this order right now.");
      }
    } catch (error) {
      console.error("Order cancel failed", error);
      toast.error("Unable to cancel this order right now.");
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="my-orders">
      <div className="my-orders-header">
        <h2>My Orders</h2>
        <p>Track delivery progress and review the details of recent meals.</p>
      </div>
      <div className="my-orders-list">
        {orders.length === 0 ? (
          <div className="my-orders-empty">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <h3>{loading ? "Loading orders..." : "No orders yet"}</h3>
              <p>
                Orders will appear here once you place an order. Hungry? Explore the
                menu and add some dishes to your cart.
              </p>
            </div>
          </div>
        ) : (
          orders.map((order) => {
            const statusLabel = (order.status || "Pending").toString();
            const statusKey = buildStatusClass(statusLabel);
            const placedDate = formatDate(order.createdAt);
            const cancelledDate = order.cancelledAt ? formatDate(order.cancelledAt) : null;
            const canonicalStatus = (order.status || "").toLowerCase();
            const canConfirmArrival = ["in_transit"].includes(canonicalStatus);
            const isDelivered = canonicalStatus === "delivered";
            const canCancel = ["pending", "confirmed", "preparing"].includes(
              canonicalStatus
            );
            const isConfirming = confirming === order._id;
            const isCancelling = cancelling === order._id;
            const isFormVisible = cancelForm.orderId === order._id;

            return (
              <article key={order._id} className="order-card">
                <header className="order-card-header">
                  <div className="order-card-meta">
                    <p className="order-code">{formatOrderCode(order._id)}</p>
                    {placedDate && <p className="order-date">{placedDate}</p>}
                  </div>
                  <span className={`order-status status-${statusKey}`}>
                    {statusLabel}
                  </span>
                </header>
                <div className="order-card-body">
                  <div className="order-items">
                    {(order.items || []).map((item, index) => {
                      const itemKey =
                        item.foodVariantId ||
                        item.variantId ||
                        `${order._id}-${index}`;
                      return (
                        <div key={itemKey} className="order-item-row">
                          <p className="order-item-title">{item.title}</p>
                          <p className="order-item-meta">
                            {item.size ? `${item.size} ` : ""}
                            x{item.quantity}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="order-summary">
                    <p className="order-total-label">Total Paid</p>
                    <p className="order-total-amount">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </p>
                    <p className="order-items-count">
                      {order.items?.length || 0}{" "}
                      {(order.items?.length || 0) === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
                <footer className="order-card-footer">
                  <div className="order-actions">
                    <button type="button" className="order-action" onClick={fetchOrders}>
                      Refresh status
                    </button>
                    {canCancel && (
                      <button
                        type="button"
                        className="order-action order-cancel"
                        onClick={() => startCancel(order._id)}
                        disabled={isCancelling}
                      >
                        {isFormVisible ? "Close" : "Cancel order"}
                      </button>
                    )}
                    {canConfirmArrival && (
                      <button
                        type="button"
                        className="order-action order-confirm"
                        onClick={() => confirmReceipt(order._id)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? "Marking..." : "Mark as received"}
                      </button>
                    )}
                  </div>
                  {isFormVisible && (
                    <div className="order-cancel-form">
                      <label htmlFor={`cancel-reason-${order._id}`}>
                        Tell us why you need to cancel:
                      </label>
                      <textarea
                        id={`cancel-reason-${order._id}`}
                        className="order-cancel-textarea"
                        placeholder="Short note for the restaurant..."
                        value={cancelForm.reason}
                        onChange={(event) =>
                          setCancelForm((prev) => ({
                            ...prev,
                            reason: event.target.value,
                          }))
                        }
                        maxLength={500}
                        rows={3}
                      />
                      <div className="order-cancel-form-actions">
                        <button
                          type="button"
                          className="order-action order-cancel confirm"
                          onClick={submitCancellation}
                          disabled={isCancelling}
                        >
                          {isCancelling ? "Cancelling..." : "Confirm cancellation"}
                        </button>
                        <button
                          type="button"
                          className="order-action neutral"
                          onClick={() => setCancelForm({ orderId: null, reason: "" })}
                          disabled={isCancelling}
                        >
                          Keep order
                        </button>
                      </div>
                    </div>
                  )}
                  {isDelivered && (
                    <span className="order-delivered-note">
                      Thanks for letting us know this order arrived safely.
                    </span>
                  )}
                  {canonicalStatus === "cancelled" && (
                    <div className="order-cancelled-info">
                      <p>
                        <strong>Cancelled</strong>
                        {cancelledDate ? ` · ${cancelledDate}` : ""}
                      </p>
                      {order.cancellationReason && (
                        <p className="order-cancelled-reason">
                          Reason: {order.cancellationReason}
                        </p>
                      )}
                    </div>
                  )}
                </footer>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;
