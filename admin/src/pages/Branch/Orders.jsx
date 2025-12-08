import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";
import { toast } from "react-toastify";

const statusMeta = {
  CREATED: { label: "Đơn mới", badge: "badge bg-secondary-subtle text-secondary" },
  WAITING_FOR_DRONE: {
    label: "Chờ drone",
    badge: "badge bg-warning-subtle text-warning",
  },
  ASSIGNED: { label: "Đã gán", badge: "badge bg-info-subtle text-info" },
  PREPARING: { label: "Đang chuẩn bị", badge: "badge bg-warning-subtle text-warning" },
  DELIVERING: {
    label: "Đang giao drone",
    badge: "badge bg-success-subtle text-success",
  },
  ARRIVED: { label: "Drone đã đến", badge: "badge bg-primary-subtle text-primary" },
  COMPLETED: { label: "Hoàn thành", badge: "badge bg-success-subtle text-success" },
};

const FILTERS = {
  all: { label: "Tất cả", statuses: null },
  new: { label: "Đơn mới", statuses: ["CREATED", "WAITING_FOR_DRONE", "ASSIGNED"] },
  preparing: { label: "Đang chuẩn bị", statuses: ["PREPARING"] },
  delivering: { label: "Đang giao", statuses: ["DELIVERING", "ARRIVED"] },
  completed: { label: "Hoàn thành", statuses: ["COMPLETED"] },
};

const normaliseStatus = (status) => (status || "").toString().toUpperCase();
const toId = (value) =>
  value && typeof value === "object" && value._id
    ? value._id
    : value || "";

const resolveCustomerName = (order) =>
  order?.userId?.name ||
  order?.userId?.email ||
  "KhA­ch hAÿng";

const resolveCustomerPhone = (order) => order?.userId?.phone || "-";

const formatAddress = (address = {}) =>
  address.fullText ||
  [address.street, address.ward, address.district, address.city, address.country]
    .filter(Boolean)
    .join(", ");

const resolveCustomerAddress = (order = {}) =>
  order.customerAddress?.fullText ||
  formatAddress(order.customerAddress || {}) ||
  // LEGACY FALLBACK - TODO: remove when legacy address is retired
  order.address?.fullText ||
  formatAddress(order.address || {}) ||
  "-";

const BranchOrders = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [actionsUnavailable, setActionsUnavailable] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const handleCloseDetail = () => {
    setSelectedOrder(null);
    setSelectedOrderId(null);
    setDetailOrder(null);
    setDetailError("");
    setDetailLoading(false);
  };

  const applyOrderUpdate = (updated) => {
    if (!updated?._id) return;
    setOrders((prev) =>
      prev.map((order) => (order._id === updated._id ? { ...order, ...updated } : order))
    );
    if (selectedOrder?._id === updated._id) {
      setSelectedOrder((prev) => ({ ...prev, ...updated }));
    }
    if (detailOrder?._id === updated._id) {
      setDetailOrder((prev) => ({ ...prev, ...updated }));
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/orders`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Branch orders fetch failed", error);
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!selectedOrderId) {
        setDetailOrder(null);
        setDetailError("");
        return;
      }
      setDetailLoading(true);
      setDetailError("");
      try {
        const response = await axios.get(`${url}/api/v2/orders/${selectedOrderId}`, {
          headers: { token },
        });
        if (response.data?.success) {
          setDetailOrder(response.data.data);
          applyOrderUpdate(response.data.data);
        } else {
          setDetailError(response.data?.message || "Unable to load order detail");
        }
      } catch (error) {
        console.error("Load branch order detail failed", error);
        setDetailError(error.response?.data?.message || "Unable to load order detail");
      } finally {
        setDetailLoading(false);
      }
    };
    loadDetail();
  }, [selectedOrderId, token, url]);

  const filteredOrders = useMemo(() => {
    const allowed = FILTERS[filter].statuses;
    if (!allowed) return orders;
    return orders.filter((order) => allowed.includes(normaliseStatus(order.status)));
  }, [orders, filter]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleString();
  };

  const withActionLoading = (orderId, fn) => async () => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      await fn();
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  const showRequestError = (error, fallbackMessage) => {
    if (error?.response?.data?.message) {
      toast.error(error.response.data.message);
      return;
    }
    if (error?.response?.status === 404) {
      toast.error("Không tìm thấy đơn hoặc endpoint chưa sẵn sàng");
      setActionsUnavailable(true);
      return;
    }
    toast.error(fallbackMessage);
  };

  const acceptOrder = (orderId) =>
    withActionLoading(orderId, async () => {
      const confirmed = window.confirm("Xác nhận nhận đơn và bắt đầu chuẩn bị?");
      if (!confirmed) return;
      try {
        const response = await axios.post(
          `${url}/api/v2/orders/${orderId}/accept`,
          {},
          { headers: { token } }
        );
        const baseOrder = orders.find((o) => o._id === orderId) || selectedOrder || {};
        if (response.data?.success) {
          const updated = response.data.data || { ...baseOrder, _id: orderId, status: "PREPARING" };
          applyOrderUpdate(updated);
          toast.success("Đã chuyển đơn sang trạng thái Đang chuẩn bị");
        } else {
          toast.error(response.data?.message || "Không thể nhận đơn");
        }
      } catch (error) {
        console.error("Accept order failed", error);
        showRequestError(error, "Không thể nhận đơn, vui lòng thử lại");
        fetchOrders();
      }
    });

  const markReadyToShip = (orderId) =>
    withActionLoading(orderId, async () => {
      const confirmed = window.confirm("Đơn đã sẵn sàng để giao bằng drone?");
      if (!confirmed) return;
      try {
        const response = await axios.post(
          `${url}/api/v2/orders/${orderId}/ready-to-ship`,
          {},
          { headers: { token } }
        );
        const baseOrder = orders.find((o) => o._id === orderId) || selectedOrder || {};
        if (response.data?.success) {
          const updated = response.data.data || { ...baseOrder, _id: orderId, status: "DELIVERING" };
          applyOrderUpdate(updated);
          toast.success("Drone đang giao hàng");
        } else {
          toast.error(response.data?.message || "Không thể chuyển trạng thái giao drone");
        }
      } catch (error) {
        console.error("Ready-to-ship failed", error);
        showRequestError(error, "Không thể cập nhật trạng thái giao drone");
        fetchOrders();
      }
    });

  const markArrived = (order) =>
    withActionLoading(order._id, async () => {
      try {
        const response = await axios.post(
          `${url}/api/v2/missions/${order.missionId}/mark-arrived`,
          {},
          { headers: { token } }
        );
        const baseOrder = orders.find((o) => o._id === order._id) || order || {};
        if (response.data?.success) {
          const updated = response.data.data?.order || response.data.data || { ...baseOrder, status: "ARRIVED" };
          applyOrderUpdate(updated);
          toast.success("Đã đánh dấu drone đã đến điểm giao");
        } else {
          toast.error(response.data?.message || "Không thể đánh dấu đã đến");
        }
      } catch (error) {
        console.error("Mark arrived failed", error);
        showRequestError(error, "Không thể đánh dấu drone đã đến");
        fetchOrders();
      }
    });

  const renderStatusBadge = (status) => {
    const key = normaliseStatus(status);
    const meta = statusMeta[key];
    if (!meta) {
      return <span className="badge bg-secondary-subtle text-secondary">{status || "-"}</span>;
    }
    return <span className={meta.badge}>{meta.label}</span>;
  };

  const renderActionButtons = (order) => {
    const status = normaliseStatus(order.status);
    const isBusy = Boolean(actionLoading[order._id]);
    const canAccept = ["ASSIGNED", "WAITING_FOR_DRONE", "CREATED"].includes(status);
    const canReady =
      order.deliveryMethod === "drone" &&
      status === "PREPARING" &&
      Boolean(order.missionId);
    const canMarkArrived =
      status === "DELIVERING" && Boolean(order.missionId) && !actionsUnavailable;

    if (!canAccept && !canReady && !canMarkArrived) {
      if (status === "DELIVERING") {
        return (
          <div className="d-flex flex-column align-items-end gap-1">
            <span className="text-success">
              Đang giao bằng drone{order.etaMinutes ? ` (ETA: ${order.etaMinutes} phút)` : ""}
            </span>
            {order.missionId ? (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                disabled={Boolean(actionLoading[order._id])}
                onClick={markArrived(order)}
              >
                {actionLoading[order._id] ? "Đang xử lý..." : "Drone đã đến điểm giao"}
              </button>
            ) : null}
          </div>
        );
      }
      if (status === "ARRIVED") {
        return <span className="text-primary">Drone đã đến điểm giao (chờ khách)</span>;
      }
      if (status === "COMPLETED") {
        return <span className="text-muted">Hoàn thành</span>;
      }
      return null;
    }

    return (
      <div className="d-flex gap-2 flex-wrap justify-content-end">
        {actionsUnavailable ? (
          <small className="text-muted">
            Thao tác chưa khả dụng (backend chưa hỗ trợ endpoint).
          </small>
        ) : null}
        {canAccept && (
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={isBusy || actionsUnavailable}
            onClick={acceptOrder(order._id)}
          >
            {isBusy ? "Đang xử lý..." : "Nhận đơn / Bắt đầu chuẩn bị"}
          </button>
        )}
        {canReady && (
          <button
            type="button"
            className="btn btn-sm btn-outline-success"
            disabled={isBusy || actionsUnavailable}
            onClick={markReadyToShip(order._id)}
          >
            {isBusy ? "Đang xử lý..." : "Món đã sẵn sàng / Giao bằng drone"}
          </button>
        )}
        {canMarkArrived && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={Boolean(actionLoading[order._id])}
            onClick={markArrived(order)}
          >
            {actionLoading[order._id] ? "Đang xử lý..." : "Drone đã đến điểm giao"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-4">
        <h3 className="mb-1">Branch orders</h3>
        <p className="text-muted mb-0">
          Snapshot of recent orders handled by this branch.
        </p>
      </div>

      <div className="mb-3">
        <div className="btn-group">
          {Object.entries(FILTERS).map(([key, meta]) => (
            <button
              key={key}
              type="button"
              className={`btn btn-outline-primary${filter === key ? " active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            No orders found for this branch.
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            Không có đơn ở trạng thái đã chọn.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th className="text-end">Tổng</th>
                  <th>Thanh toán</th>
                  <th>Phương thức</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setSelectedOrder(order);
                      setSelectedOrderId(order._id);
                    }}
                  >
                    <td className="fw-semibold">#{order._id.slice(-6)}</td>
                    <td className="fw-semibold">{resolveCustomerName(order)}</td>
                    <td className="fw-semibold text-end">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="text-muted text-uppercase small">
                      {order.paymentStatus || "unpaid"}
                    </td>
                    <td>
                      <span
                        className={
                          order.deliveryMethod === "drone"
                            ? "badge bg-info-subtle text-info"
                            : "badge bg-secondary-subtle text-secondary"
                        }
                      >
                        {order.deliveryMethod || "N/A"}
                      </span>
                    </td>
                    <td>{renderStatusBadge(order.status)}</td>
                    <td className="text-muted">
                      {order.etaMinutes ? `${order.etaMinutes} phút` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedOrderId ? (
        <div className="card border rounded-4 mt-3">
          <div className="card-header border-0 d-flex justify-content-between align-items-start">
            <div>
              <h5 className="mb-1">
                #{(detailOrder?.code || selectedOrder?._id || "").toString().slice(-6).toUpperCase()}
              </h5>
              <small className="text-muted">{formatDate(detailOrder?.createdAt || selectedOrder?.createdAt)}</small>
              <div className="mt-2">{renderStatusBadge(detailOrder?.status || selectedOrder?.status)}</div>
            </div>
            <button
              type="button"
              className="btn btn-light btn-sm"
              onClick={handleCloseDetail}
            >
              Đóng
            </button>
          </div>
          <div className="card-body">
            {detailLoading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="mb-0">Loading order...</p>
              </div>
            ) : detailError ? (
              <div className="text-center py-5 text-danger">
                Failed to load order detail: {detailError}
              </div>
            ) : (
              <>
            <div className="row g-3 mb-3">
              <div className="col-md-4">
                <p className="text-muted mb-1">Khách hàng</p>
                <p className="fw-semibold mb-0">
                  {resolveCustomerName(detailOrder || selectedOrder || {})}
                </p>
                <p className="text-muted mb-0">
                  {resolveCustomerPhone(detailOrder || selectedOrder || {})}
                </p>
                <p className="text-muted mb-0">
                  {resolveCustomerAddress(detailOrder || selectedOrder || {})}
                </p>
              </div>
              <div className="col-md-4">
                <p className="text-muted mb-1">Thanh toán</p>
                <p className="fw-semibold mb-0">
                  {detailOrder?.paymentStatus || selectedOrder?.paymentStatus || "unpaid"}
                </p>
                <p className="text-muted mb-0">
                  {detailOrder?.paymentMethod ||
                    detailOrder?.deliveryMethod ||
                    selectedOrder?.paymentMethod ||
                    selectedOrder?.deliveryMethod ||
                    "-"}
                </p>
                {detailOrder?.etaMinutes || selectedOrder?.etaMinutes ? (
                  <p className="text-muted mb-0">
                    ETA: {detailOrder?.etaMinutes || selectedOrder?.etaMinutes} phút
                  </p>
                ) : null}
                {detailOrder?.droneId || selectedOrder?.droneId ? (
                  <p className="text-muted mb-0">
                    Drone:{" "}
                    {detailOrder?.droneId?.name ||
                      detailOrder?.droneId?.code ||
                      toId(detailOrder?.droneId || selectedOrder?.droneId)}
                  </p>
                ) : null}
                {detailOrder?.missionId || selectedOrder?.missionId ? (
                  <p className="text-muted mb-0">
                    Mission: {toId(detailOrder?.missionId || selectedOrder?.missionId)}
                  </p>
                ) : null}
              </div>
              <div className="col-md-4">
                <p className="text-muted mb-1">Tổng cộng</p>
                <p className="display-6 mb-0">
                  {formatCurrency(detailOrder?.totalAmount || selectedOrder?.totalAmount || 0)}
                </p>
              </div>
            </div>
            <div className="mb-3">
              <h6>Items</h6>
              {Array.isArray((detailOrder || selectedOrder)?.items) &&
              (detailOrder || selectedOrder)?.items.length ? (
                <ul className="list-group list-group-flush">
                  {(detailOrder?.items || selectedOrder?.items || []).map((item, idx) => (
                    <li
                      key={`${selectedOrder?._id || detailOrder?._id}-${item.foodVariantId || idx}`}
                      className="list-group-item px-0 d-flex align-items-center justify-content-between gap-3"
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || ""}
                          width={48}
                          height={48}
                          className="rounded"
                        />
                      ) : null}
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{item.title || "Item"}</div>
                        <small className="text-muted">
                          {item.size ? `${item.size} • ` : ""}
                          x{item.quantity || 0}
                        </small>
                      </div>
                      <div className="text-end">
                        <div className="text-muted small">
                          {formatCurrency(item.unitPrice || item.totalPrice || 0)}
                        </div>
                        <div className="fw-semibold">
                          {formatCurrency(item.totalPrice || 0)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0">No items</p>
              )}
            </div>
            {Array.isArray((detailOrder || selectedOrder)?.timeline) &&
            (detailOrder || selectedOrder)?.timeline.length ? (
              <div className="mb-3">
                <h6>Timeline</h6>
                <ul className="list-group list-group-flush">
                  {(detailOrder?.timeline || selectedOrder?.timeline || []).map((event, index) => (
                    <li
                      key={`${selectedOrder?._id || detailOrder?._id}-timeline-${index}`}
                      className="list-group-item px-0 d-flex justify-content-between"
                    >
                      <span>{renderStatusBadge(event.status)}</span>
                      <span className="text-muted">{formatDate(event.at)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="d-flex flex-wrap gap-2">
              {renderActionButtons(detailOrder || selectedOrder)}
            </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BranchOrders;
