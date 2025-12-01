import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/frontend_assets/assets";
import { formatCurrency } from "../../utils/currency";

const ORDER_STEPS = ["PREPARING", "DELIVERING", "ARRIVED", "COMPLETED"];

const formatOrderCode = (id) => {
  if (!id || typeof id !== "string") return "#------";
  return `#${id.slice(-6).toUpperCase()}`;
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

const mapOrderStatusLabel = (status) => {
  switch (status) {
    case "CREATED":
    case "WAITING_FOR_DRONE":
      return "Đang chờ drone";
    case "ASSIGNED":
      return "Đã gán drone";
    case "PREPARING":
      return "Nhà hàng đang chuẩn bị";
    case "DELIVERING":
      return "Đang giao bằng drone";
    case "ARRIVED":
      return "Drone đã tới điểm giao";
    case "COMPLETED":
      return "Đã hoàn thành";
    case "CANCELED":
    case "CANCELLED":
      return "Đã huỷ";
    default:
      return status;
  }
};

const buildStatusClass = (status = "pending") =>
  status.toString().toLowerCase().replace(/[\s_]+/g, "-");

const getStatusStepIndex = (status = "") => {
  const idx = ORDER_STEPS.indexOf(status.toUpperCase());
  return idx === -1 ? 0 : idx;
};

const formatEtaMinutes = (etaMinutes) => {
  if (etaMinutes === null || etaMinutes === undefined) return "Đang cập nhật ETA";
  if (etaMinutes <= 0) return "Đang hạ cánh";
  return `~${etaMinutes} phút`;
};

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
    if (!token) return;

    let isMounted = true;
    const fetchAndSet = async () => {
      try {
        const response = await axios.get(`${url}/api/v2/orders/me`, {
          headers: { token },
        });
        if (response.data.success && isMounted) {
          setOrders(response.data.data);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to refresh orders", error);
        }
      }
    };

    fetchOrders();
    const intervalId = setInterval(fetchAndSet, 15000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [token, url]);

  const confirmDelivery = async (orderId) => {
    if (!orderId) return;
    try {
      setConfirming(orderId);
      const response = await axios.post(
        `${url}/api/v2/orders/${orderId}/confirm-delivery`,
        {},
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Cảm ơn bạn đã xác nhận đơn hàng!");
        fetchOrders();
      } else {
        toast.error(response.data?.message || "Không thể xác nhận đơn hàng lúc này.");
      }
    } catch (error) {
      console.error("Order confirm delivery failed", error);
      toast.error("Không thể xác nhận đơn hàng lúc này.");
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
            const rawStatus = (order.status || "").toUpperCase();
            const statusLabel = mapOrderStatusLabel(rawStatus) || "Trạng thái";
            const statusKey = buildStatusClass(rawStatus || "pending");
            const placedDate = formatDate(order.createdAt);
            const cancelledDate = order.cancelledAt ? formatDate(order.cancelledAt) : null;
            const isCancelled = rawStatus === "CANCELED" || rawStatus === "CANCELLED";
            const isCompleted = rawStatus === "COMPLETED";
            const canConfirmDelivery = ["ARRIVED", "DELIVERING"].includes(rawStatus);
            const canCancel = ["CREATED", "WAITING_FOR_DRONE", "ASSIGNED", "PREPARING"].includes(
              rawStatus
            );
            const isConfirming = confirming === order._id;
            const isCancelling = cancelling === order._id;
            const isFormVisible = cancelForm.orderId === order._id;
            const progressIndex = getStatusStepIndex(rawStatus);
            const timeline = Array.isArray(order.timeline) ? order.timeline : [];
            const branchLabel =
              (order.branchId && (order.branchId.name || order.branchId)) || null;
            const hubLabel = (order.hubId && (order.hubId.name || order.hubId)) || null;
            const droneLabel =
              (order.droneId && (order.droneId.name || order.droneId)) || null;

            return (
              <article key={order._id} className="order-card">
                <header className="order-card-header">
                  <div className="order-card-meta">
                    <p className="order-code">{formatOrderCode(order._id)}</p>
                    {placedDate && <p className="order-date">Đặt lúc {placedDate}</p>}
                  </div>
                  <div className="order-header-right">
                    {order.etaMinutes !== undefined && (
                      <span className="order-eta-badge">
                        {formatEtaMinutes(order.etaMinutes)}
                      </span>
                    )}
                    <span className={`order-status status-${statusKey}`}>
                      {statusLabel}
                    </span>
                  </div>
                </header>

                <section className="order-journey">
                  <div className="order-journey-main">
                    <p className="muted-label">Trạng thái hiện tại</p>
                    <h4 className="journey-status-title">{statusLabel}</h4>
                    <p className="journey-eta">{formatEtaMinutes(order.etaMinutes)}</p>
                    <div className="order-progress-steps">
                      {ORDER_STEPS.map((step, index) => {
                        const isActive = index <= progressIndex;
                        return (
                          <div
                            key={step}
                            className={`order-step ${isActive ? "active" : ""}`}
                          >
                            <span className="order-step-dot" />
                            <p className="order-step-label">
                              {mapOrderStatusLabel(step)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="order-journey-meta">
                    <div className="order-meta-item">
                      <p className="order-meta-label">Địa chỉ giao</p>
                      <p className="order-meta-value">
                        {order.customerAddress?.fullText || "Đang cập nhật"}
                      </p>
                    </div>
                    <div className="order-meta-item">
                      <p className="order-meta-label">Thanh toán</p>
                      <p className="order-meta-value">
                        {(order.paymentMethod || "Chưa rõ").toString()} •{" "}
                        {order.paymentStatus || "Đang cập nhật"}
                      </p>
                    </div>
                    <div className="order-meta-chips">
                      {branchLabel && (
                        <span className="order-meta-chip">Chi nhánh: {branchLabel}</span>
                      )}
                      {hubLabel && <span className="order-meta-chip">Hub: {hubLabel}</span>}
                      {droneLabel && (
                        <span className="order-meta-chip">Drone: {droneLabel}</span>
                      )}
                      {order.missionId && (
                        <span className="order-meta-chip">Mission: {order.missionId}</span>
                      )}
                    </div>
                  </div>
                </section>

                <section className="order-timeline">
                  <div className="order-timeline-header">
                    <p className="muted-label">Cập nhật tiến trình</p>
                    {timeline.length > 0 && (
                      <span className="order-timeline-count">
                        {timeline.length} cập nhật
                      </span>
                    )}
                  </div>
                  {timeline.length === 0 ? (
                    <p className="order-timeline-empty">Chưa có cập nhật tiến trình.</p>
                  ) : (
                    timeline.map((entry, index) => {
                      const entryStatus = mapOrderStatusLabel(
                        (entry.status || "").toString().toUpperCase()
                      );
                      const entryDate = formatDate(entry.at);
                      const actor = entry.actor || entry.actorType;
                      return (
                        <div
                          key={`${entry.status || "status"}-${entry.at || index}`}
                          className="timeline-row"
                        >
                          <span className="timeline-dot" />
                          <div className="timeline-text">
                            <p className="timeline-status">{entryStatus}</p>
                            <p className="timeline-meta">
                              {entryDate ? entryDate : "Thời gian chưa rõ"}
                              {actor ? ` • ${actor}` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>

                <div className="order-card-body">
                  <div className="order-items-block">
                    <div className="order-items-header">
                      <p className="muted-label">Món ăn</p>
                      <p className="order-items-count">
                        {order.items?.length || 0} món
                      </p>
                    </div>
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
                              {item.size ? `${item.size} • ` : ""}
                              x{item.quantity}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="order-summary">
                    <p className="order-total-label">Tổng thanh toán</p>
                    <p className="order-total-amount">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="order-payment-status">
                      {order.paymentStatus || "Đang cập nhật"} với{" "}
                      {(order.paymentMethod || "").toString().toUpperCase() || "N/A"}
                    </p>
                  </div>
                </div>

                <footer className="order-card-footer">
                  <div className="order-actions">
                    <button type="button" className="order-action" onClick={fetchOrders}>
                      Làm mới trạng thái
                    </button>
                    {canCancel && !isCancelled && !isCompleted && (
                      <button
                        type="button"
                        className="order-action order-cancel"
                        onClick={() => startCancel(order._id)}
                        disabled={isCancelling}
                      >
                        {isFormVisible ? "Đóng" : "Huỷ đơn"}
                      </button>
                    )}
                    {canConfirmDelivery && !isCompleted && (
                      <button
                        type="button"
                        className="order-action order-confirm"
                        onClick={() => confirmDelivery(order._id)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? "Đang xác nhận..." : "Xác nhận đã nhận hàng"}
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
                  {isCompleted && (
                    <span className="order-delivered-note">
                      Cảm ơn bạn! Đơn hàng này đã được hoàn tất.
                    </span>
                  )}
                  {isCancelled && (
                    <div className="order-cancelled-info">
                      <p>
                        <strong>Cancelled</strong>
                        {cancelledDate ? ` at ${cancelledDate}` : ""}
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
