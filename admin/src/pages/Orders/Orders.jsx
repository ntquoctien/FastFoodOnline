import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";
import { useNavigate } from "react-router-dom";

const mapOrderStatusToLabel = (status) => {
  const value = (status || "").toString().toUpperCase();
  switch (value) {
    case "CREATED":
    case "WAITING_FOR_DRONE":
      return "Pending";
    case "ASSIGNED":
    case "PREPARING":
      return "Preparing";
    case "DELIVERING":
      return "In transit";
    case "ARRIVED":
      return "Arrived";
    case "COMPLETED":
      return "Delivered";
    case "CANCELED":
      return "Cancelled";
    default:
      return status || "Unknown";
  }
};

const statusBadgeMap = {
  CREATED: "badge bg-warning-subtle text-warning",
  WAITING_FOR_DRONE: "badge bg-warning-subtle text-warning",
  ASSIGNED: "badge bg-primary-subtle text-primary",
  PREPARING: "badge bg-primary-subtle text-primary",
  DELIVERING: "badge bg-info-subtle text-info",
  ARRIVED: "badge bg-info-subtle text-info",
  COMPLETED: "badge bg-success-subtle text-success",
  CANCELED: "badge bg-danger-subtle text-danger",
  default: "badge bg-light text-body-secondary",
};

const filterTabs = [
  { value: "in_progress", label: "In progress" },
  { value: "delivering", label: "In transit" },
  { value: "arrived", label: "Arrived" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const statusGroups = {
  in_progress: ["CREATED", "WAITING_FOR_DRONE", "ASSIGNED", "PREPARING"],
  delivering: ["DELIVERING"],
  arrived: ["ARRIVED"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELED"],
  all: [],
};

const toId = (value) =>
  value && typeof value === "object" && value._id ? value._id : value || "";

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const handleCloseDetail = () => {
    setDetailOrderId(null);
    setDetailOrder(null);
    setDetailError("");
    setDetailLoading(false);
  };
  const [statusFilter, setStatusFilter] = useState("in_progress");

  useEffect(() => {
    const fetchDetail = async () => {
      if (!detailOrderId) {
        setDetailOrder(null);
        setDetailError("");
        return;
      }
      setDetailLoading(true);
      setDetailError("");
      try {
        const response = await axios.get(`${url}/api/v2/orders/${detailOrderId}`, {
          headers: { token },
        });
        if (response.data?.success && response.data.data) {
          setDetailOrder(response.data.data);
        } else {
          setDetailError(response.data?.message || "Unable to load order");
        }
      } catch (error) {
        console.error("Load order detail failed", error);
        setDetailError(error.response?.data?.message || "Unable to load order");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [detailOrderId, token, url]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/v2/branches`, {
        headers: { token },
      });
      if (response.data?.success) {
        setBranches(response.data.data?.branches || []);
        if (response.data.data?.hubs) {
          setHubs(response.data.data.hubs || []);
        } else {
          fetchHubs();
        }
      }
    } catch (error) {
      console.warn("Failed to load branch options", error);
    }
  }, [token, url]);

  const fetchHubs = useCallback(async () => {
    try {
      const res = await axios.get(`${url}/api/v2/hubs`, { headers: { token } });
      if (res.data?.success) {
        setHubs(res.data.data || []);
      }
    } catch (error) {
      console.warn("Failed to load hubs", error);
    }
  }, [token, url]);

  const fetchAllOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/orders`, {
        headers: { token },
        params: branchFilter ? { branchId: branchFilter } : {},
      });
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Unable to load orders");
      }
    } catch (error) {
      console.error("Order fetch failed", error);
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  }, [token, url, branchFilter]);

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login as admin");
      navigate("/");
      return;
    }
    fetchBranches();
  }, [token, role, navigate, fetchBranches]);

  useEffect(() => {
    if (token && role === "admin") {
      fetchAllOrders();
    }
  }, [token, role, fetchAllOrders]);

  const branchNameMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(branch._id, branch.name));
    return map;
  }, [branches]);
  const hubNameMap = useMemo(() => {
    const map = new Map();
    hubs.forEach((hub) => map.set(hub._id, hub.name));
    return map;
  }, [hubs]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    const allowed = statusGroups[statusFilter] || [];
    return orders.filter((order) => {
      const current = (order.status || "").toUpperCase();
      return allowed.length ? allowed.includes(current) : true;
    });
  }, [orders, statusFilter]);

  const updateOrderStatusLocally = (orderId, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order._id === orderId ? { ...order, status } : order
      )
    );
  };

  const markMissionArrived = async (order) => {
    if (!order?.missionId) return;
    try {
      const response = await axios.post(
        `${url}/api/v2/missions/${order.missionId}/mark-arrived`,
        {},
        { headers: { token } }
      );
      if (response.data?.success) {
        updateOrderStatusLocally(order._id, "ARRIVED");
        toast.success("Marked drone arrived");
      } else {
        toast.error(response.data?.message || "Unable to mark arrived");
      }
    } catch (error) {
      console.error("Mark mission arrived failed", error);
      toast.error(
        error.response?.data?.message || "Unable to mark drone arrived"
      );
    }
  };

  const formatAddress = (address = {}) =>
    address.fullText ||
    [address.street, address.ward, address.district, address.city, address.country]
      .filter(Boolean)
      .join(", ");

  const formatDateTime = (timestamp) =>
    timestamp ? new Date(timestamp).toLocaleString() : "-";

  const renderStatusBadge = (status) => {
    const key = (status || "").toUpperCase();
    const className = statusBadgeMap[key] || statusBadgeMap.default;
    return <span className={className}>{mapOrderStatusToLabel(key)}</span>;
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-3">
        <h3 className="mb-1">Orders</h3>
        <p className="text-muted mb-0">
          Track fulfilment progress and assign delivery drones per branch.
        </p>
      </div>

      <div className="row g-3">
        <div className="col-12 col-xxl-7">
          <div className="card border rounded-4 mb-3">
            <div className="card-body d-flex flex-column flex-xl-row gap-3 align-items-xl-center justify-content-between">
              <div className="d-flex flex-column flex-md-row gap-2 w-100 w-xl-auto">
                <select
                  className="form-select"
                  value={branchFilter}
                  onChange={(event) => setBranchFilter(event.target.value)}
                >
                  <option value="">All branches</option>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    className={`btn btn-sm ${
                      statusFilter === tab.value
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setStatusFilter(tab.value)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card border rounded-4">
            {loading ? (
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted mb-0">Loading orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="card-body text-center py-5 text-muted">
                No orders for the selected filter. Keep an eye on new activity!
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead className="text-muted small text-uppercase">
                    <tr>
                      <th>Code</th>
                      <th>Customer</th>
                      <th>Branch</th>
                      <th className="text-end">Total</th>
                      <th>Payment</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>ETA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const branchName =
                        order.branchId?.name ||
                        branchNameMap.get(toId(order.branchId)) ||
                        toId(order.branchId) ||
                        "-";
                      const customerName =
                        order.contact?.name ||
                        order.customerAddress?.fullName ||
                        order.userId?.name ||
                        order.userId?.email ||
                        toId(order.userId) ||
                        "-";
                      return (
                        <tr
                          key={order._id}
                          style={{ cursor: "pointer" }}
                          onClick={() => setDetailOrderId(order._id)}
                        >
                          <td className="fw-semibold">#{order._id.slice(-6).toUpperCase()}</td>
                          <td className="fw-semibold">{customerName}</td>
                          <td className="text-muted">{branchName}</td>
                          <td className="fw-semibold text-end">{formatCurrency(order.totalAmount)}</td>
                          <td className="text-muted text-uppercase small">
                            {order.paymentStatus || "unpaid"}
                          </td>
                          <td className="text-muted small">{order.paymentMethod || order.deliveryMethod || "-"}</td>
                          <td>{renderStatusBadge(order.status)}</td>
                          <td className="text-muted">
                            {order.etaMinutes ? `${order.etaMinutes} min` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="col-12 col-xxl-5">
          <div className="card border rounded-4 h-100">
            <div className="card-body">
              {!detailOrderId ? (
                <p className="text-muted mb-0">Select an order to see details.</p>
              ) : detailLoading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p className="mb-0">Loading order...</p>
                </div>
              ) : detailError ? (
                <div className="text-center py-5 text-danger">
                  Failed to load order detail: {detailError}
                </div>
              ) : !detailOrder ? (
                <div className="text-center py-5 text-muted">No detail available.</div>
              ) : (
                <>
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div>
                      <h5 className="mb-1">
                        #{(detailOrder.code || detailOrder._id || "").toString().slice(-6).toUpperCase()}
                      </h5>
                      <small className="text-muted">
                        {formatDateTime(detailOrder.createdAt)}
                      </small>
                    </div>
                    <span
                      className={
                        statusBadgeMap[(detailOrder.status || "").toUpperCase()] || statusBadgeMap.default
                      }
                    >
                      {mapOrderStatusToLabel(detailOrder.status)}
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-uppercase text-muted small mb-1">Recipient</p>
                    <p className="fw-semibold mb-0">
                      {detailOrder.contact?.name ||
                        detailOrder.customerAddress?.fullName ||
                        detailOrder.userId?.name ||
                        detailOrder.userId?.email ||
                        toId(detailOrder.userId) ||
                        "-"}
                    </p>
                    <p className="text-muted mb-0">{detailOrder.contact?.phone || "-"}</p>
                    <p className="text-muted mb-0">
                      {detailOrder.customerAddress?.fullText ||
                        detailOrder.address?.fullText ||
                        formatAddress(detailOrder.customerAddress || detailOrder.address || {}) ||
                        "-"}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-uppercase text-muted small mb-1">Payment</p>
                    <p className="fw-semibold mb-0">{detailOrder.paymentStatus || "-"}</p>
                    <p className="text-muted mb-1">
                      Method: {detailOrder.paymentMethod || detailOrder.deliveryMethod || "-"}
                    </p>
                    <p className="text-muted mb-0">
                      Subtotal: {formatCurrency(detailOrder.subtotal || 0)} • Delivery:{" "}
                      {formatCurrency(detailOrder.deliveryFee || 0)}
                    </p>
                    <p className="fw-semibold mb-0">
                      Total: {formatCurrency(detailOrder.totalAmount || 0)}
                    </p>
                  </div>

                  <div className="mb-3">
                    <p className="text-uppercase text-muted small mb-1">Delivery</p>
                    <p className="mb-0 text-muted">Method: {detailOrder.deliveryMethod || "drone"}</p>
                    <p className="mb-0 text-muted">
                      Branch:{" "}
                      {detailOrder.branch?.name ||
                        branchNameMap.get(toId(detailOrder.branch || detailOrder.branchId)) ||
                        toId(detailOrder.branch || detailOrder.branchId) ||
                        "-"}
                    </p>
                    <p className="mb-0 text-muted">
                      Hub:{" "}
                      {detailOrder.hub?.name ||
                        hubNameMap.get(toId(detailOrder.hub || detailOrder.hubId)) ||
                        toId(detailOrder.hub || detailOrder.hubId) ||
                        "-"}
                    </p>
                    {detailOrder.etaMinutes ? (
                      <p className="mb-0 text-muted">ETA: {detailOrder.etaMinutes} minutes</p>
                    ) : null}
                    {detailOrder.droneId ? (
                      <p className="mb-0 text-muted">
                        Drone: {detailOrder.droneId?.name || detailOrder.droneId?.code || toId(detailOrder.droneId)}
                      </p>
                    ) : null}
                    {detailOrder.missionId ? (
                      <p className="mb-0 text-muted">
                        Mission: {toId(detailOrder.missionId)}
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    <h6 className="mb-2">Items</h6>
                    {Array.isArray(detailOrder.items) && detailOrder.items.length ? (
                      <ul className="list-group list-group-flush">
                        {detailOrder.items.map((item, idx) => {
                          const safeItem = item || {};
                          return (
                            <li
                              key={`${detailOrder._id}-${safeItem.foodVariantId || idx}`}
                              className="list-group-item px-0 d-flex align-items-center justify-content-between gap-3"
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold">{safeItem.title || "Item"}</div>
                                <small className="text-muted">
                                  {safeItem.size ? `${safeItem.size} • ` : ""}
                                  x{safeItem.quantity || 0}
                                </small>
                              </div>
                              <div className="text-end">
                                <div className="text-muted small">
                                  {formatCurrency(safeItem.unitPrice || safeItem.price || 0)}
                                </div>
                                <div className="fw-semibold">
                                  {formatCurrency(safeItem.totalPrice || 0)}
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No items</p>
                    )}
                  </div>

                  <div className="mb-3">
                    <h6 className="mb-2">Timeline</h6>
                    {Array.isArray(detailOrder.timeline) && detailOrder.timeline.length ? (
                      <ul className="list-group list-group-flush">
                        {detailOrder.timeline.map((event, index) => {
                          const safeEvent = event || {};
                          return (
                            <li
                              key={`${detailOrder._id}-timeline-${index}`}
                              className="list-group-item px-0 d-flex justify-content-between"
                            >
                              <span>{mapOrderStatusToLabel(safeEvent.status)}</span>
                              <span className="text-muted">{formatDateTime(safeEvent.at)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="text-muted mb-0">No timeline events</p>
                    )}
                  </div>

                  <button type="button" className="btn btn-light" onClick={handleCloseDetail}>
                    Close detail
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
