import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const statusLabels = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  in_transit: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusOptions = Object.entries(statusLabels).map(([value, label]) => ({
  value,
  label,
}));

const filterTabs = [
  { value: "in_progress", label: "In progress" },
  { value: "in_transit", label: "In transit" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const statusGroups = {
  in_progress: ["pending", "confirmed", "preparing"],
  in_transit: ["in_transit"],
  completed: ["delivered"],
  cancelled: ["cancelled"],
  all: [],
};

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchFilter, setBranchFilter] = useState("");
  const [shippers, setShippers] = useState([]);
  const [shipperEndpointAvailable, setShipperEndpointAvailable] = useState(true);
  const [assignments, setAssignments] = useState({});
  const [detailOrderId, setDetailOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("in_progress");

  const detailOrder = useMemo(
    () => orders.find((order) => order._id === detailOrderId) || null,
    [orders, detailOrderId]
  );

  const fetchBranches = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/v2/branches`, {
        headers: { token },
      });
      if (response.data?.success) {
        setBranches(response.data.data?.branches || []);
      }
    } catch (error) {
      console.warn("Failed to load branch options", error);
    }
  }, [token, url]);

  const fetchShippers = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/v2/shippers`, {
        headers: { token },
      });
      if (response.data?.success) {
        setShippers(response.data.data || []);
        setShipperEndpointAvailable(true);
      } else {
        setShippers([]);
      }
    } catch (error) {
      console.warn("Failed to load shippers", error);
      setShippers([]);
      setShipperEndpointAvailable(false);
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
    fetchShippers();
  }, [token, role, navigate, fetchBranches, fetchShippers]);

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

  const filteredOrders = useMemo(() => {
    if (statusFilter === "all") return orders;
    const allowed = statusGroups[statusFilter] || [];
    return orders.filter((order) =>
      allowed.length ? allowed.includes(order.status) : true
    );
  }, [orders, statusFilter]);

  const availableDroneForBranch = useCallback(
    (branchId) =>
      shippers.find(
        (shipper) =>
          shipper.status === "available" &&
          (shipper.vehicleType || "").toLowerCase() === "drone" &&
          String(shipper.branchId?._id || shipper.branchId || "") ===
            String(branchId || "")
      ),
    [shippers]
  );

  const assignDrone = useCallback(
    async (order) => {
      const branchId = order.branchId?._id || order.branchId;
      const selected = availableDroneForBranch(branchId);
      if (!selected) {
        return null;
      }
      if (shipperEndpointAvailable) {
        try {
          await axios.patch(
            `${url}/api/v2/shippers/${selected._id}/status`,
            { status: "busy" },
            { headers: { token } }
          );
        } catch (error) {
          console.warn("Unable to update shipper status via API", error);
          setShipperEndpointAvailable(false);
        }
      }
      setAssignments((prev) => ({ ...prev, [order._id]: selected._id }));
      setShippers((prev) =>
        prev.map((shipper) =>
          shipper._id === selected._id
            ? { ...shipper, status: "busy" }
            : shipper
        )
      );
      toast.success(
        `Drone ${selected.userId?.name || selected._id} assigned to order`
      );
      try {
        await axios.patch(
          `${url}/api/v2/orders/${order._id}/status`,
          { status: "in_transit" },
          { headers: { token } }
        );
        fetchAllOrders();
      } catch (error) {
        console.warn("Unable to mark order in transit", error);
      }
      return selected._id;
    },
    [
      availableDroneForBranch,
      shipperEndpointAvailable,
      token,
      url,
      fetchAllOrders,
    ]
  );

  const releaseDrone = useCallback(
    async (shipperId) => {
      if (!shipperId) return;
      if (shipperEndpointAvailable) {
        try {
          await axios.patch(
            `${url}/api/v2/shippers/${shipperId}/status`,
            { status: "available" },
            { headers: { token } }
          );
        } catch (error) {
          console.warn("Unable to release shipper via API", error);
          setShipperEndpointAvailable(false);
        }
      }
      setAssignments((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((orderId) => {
          if (next[orderId] === shipperId) {
            delete next[orderId];
          }
        });
        return next;
      });
      setShippers((prev) =>
        prev.map((shipper) =>
          shipper._id === shipperId
            ? { ...shipper, status: "available" }
            : shipper
        )
      );
    },
    [shipperEndpointAvailable, token]
  );

  const statusHandler = async (order, nextStatus) => {
    if (["delivered", "cancelled"].includes(order.status)) {
      toast.info("Finalised orders cannot be updated.");
      return;
    }
    if (nextStatus === order.status) return;

    let assignedShipperId = assignments[order._id];

    if (nextStatus === "delivered") {
      assignedShipperId = assignedShipperId || (await assignDrone(order));
      if (!assignedShipperId) {
        toast.error("No available drone for this branch");
        fetchAllOrders();
        return;
      }
    }

    try {
      const response = await axios.patch(
        `${url}/api/v2/orders/${order._id}/status`,
        { status: nextStatus },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Status updated");
        if (nextStatus === "delivered" && assignedShipperId) {
          await releaseDrone(assignedShipperId);
        }
        if (nextStatus === "cancelled" && assignments[order._id]) {
          await releaseDrone(assignments[order._id]);
        }
        fetchAllOrders();
        fetchShippers();
      } else {
        toast.error(response.data?.message || "Unable to update status");
        fetchAllOrders();
      }
    } catch (error) {
      console.error("Order status update failed", error);
      toast.error("Unable to update status");
      fetchAllOrders();
    }
  };

  const formatAddress = (address = {}) =>
    [address.street, address.city, address.state, address.country, address.zipcode]
      .filter(Boolean)
      .join(", ");

  const formatDateTime = (timestamp) =>
    timestamp ? new Date(timestamp).toLocaleString() : "-";

  const assignedLabel = (order) => {
    const shipperId = assignments[order._id];
    if (!shipperId) return null;
    const shipper = shippers.find((entry) => entry._id === shipperId) || null;
    if (!shipper) return null;
    return shipper.userId?.name || shipper.licensePlate || shipperId;
  };

  const renderFilterButton = (value, label) => (
    <button
      type="button"
      className={`orders-filter-button ${statusFilter === value ? "is-active" : ""}`}
      onClick={() => setStatusFilter(value)}
    >
      {label}
    </button>
  );

  return (
    <div className="orders-page">
      <header className="orders-header">
        <div>
          <h2>Orders</h2>
          <p>Track fulfilment progress and assign delivery drones per branch.</p>
        </div>
        <div className="orders-filters">
          <select
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
          <div className="orders-status-filters">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`orders-filter-button ${
                  statusFilter === tab.value ? "is-active" : ""
                }`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="orders-empty">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty">
          No orders for the selected filter. Keep an eye on new activity!
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const branchName =
              order.branchId?.name ||
              branches.find((b) => b._id === order.branchId)?.name;
            return (
              <article key={order._id} className="orders-card">
                <header className="orders-card-header">
                  <div className="orders-card-title">
                    <img src={assets.parcel_icon} alt="Parcel" />
                    <div>
                      <h3>#{order._id.slice(-6).toUpperCase()}</h3>
                      <p>{formatDateTime(order.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`orders-status status-${order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </header>
                <div className="orders-card-body">
                  <div className="orders-card-row">
                    <strong>Branch</strong>
                    <span>{branchName || "-"}</span>
                  </div>
                  <div className="orders-card-row">
                    <strong>Recipient</strong>
                    <span>
                      {order.address?.firstName} {order.address?.lastName}
                    </span>
                  </div>
                  <div className="orders-card-row">
                    <strong>Total</strong>
                    <span>${order.totalAmount?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="orders-card-row">
                    <strong>Items</strong>
                    <span>{order.items?.length || 0}</span>
                  </div>
                  {assignedLabel(order) ? (
                    <div className="orders-card-row">
                      <strong>Assigned drone</strong>
                      <span>{assignedLabel(order)}</span>
                    </div>
                  ) : null}
                </div>
                <footer className="orders-card-footer">
                  <select
                    value={order.status}
                    onChange={(event) => statusHandler(order, event.target.value)}
                    disabled={order.status === "delivered" || order.status === "cancelled"}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setDetailOrderId(order._id)}
                  >
                    View details
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {detailOrder ? (
        <div className="orders-detail-overlay" onClick={() => setDetailOrderId(null)}>
          <div
            className="orders-detail"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="orders-detail-header">
              <div>
                <h3>Order #{detailOrder._id.slice(-6).toUpperCase()}</h3>
                <p>{formatDateTime(detailOrder.createdAt)}</p>
              </div>
              <button type="button" onClick={() => setDetailOrderId(null)}>
                Close
              </button>
            </header>

            <section className="orders-detail-summary">
              <div>
                <span className="orders-summary-label">Recipient</span>
                <p>
                  {detailOrder.address?.firstName} {detailOrder.address?.lastName}
                </p>
                <p className="orders-summary-sub">{formatAddress(detailOrder.address)}</p>
                <p className="orders-summary-sub">{detailOrder.address?.phone || "-"}</p>
              </div>
              <div>
                <span className="orders-summary-label">Branch</span>
                <p>{branchNameMap.get(detailOrder.branchId?._id || detailOrder.branchId) || "-"}</p>
                <span className="orders-summary-label">Payment</span>
                <p className="orders-summary-sub">{detailOrder.paymentStatus}</p>
              </div>
              <div>
                <span className="orders-summary-label">Totals</span>
                <p className="orders-summary-total">
                  ${detailOrder.totalAmount?.toFixed(2) || "0.00"}
                </p>
                <p className="orders-summary-sub">
                  {detailOrder.items?.length || 0} items
                </p>
              </div>
            </section>

            <section className="orders-detail-section">
              <h4>Items</h4>
              <ul className="orders-items">
                {detailOrder.items.map((item) => (
                  <li key={`${detailOrder._id}-${item.foodVariantId}`}>
                    <span>{item.title}</span>
                    <span>
                      {item.size ? `${item.size} • ` : ""}
                      ×{item.quantity}
                    </span>
                    <span>${item.totalPrice?.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="orders-detail-section">
              <h4>Delivery timeline</h4>
              <ul className="orders-timeline">
                {(detailOrder.timeline || []).map((event, index) => (
                  <li key={`${detailOrder._id}-timeline-${index}`}>
                    <span>{statusLabels[event.status] || event.status}</span>
                    <span>{formatDateTime(event.at)}</span>
                  </li>
                ))}
              </ul>
            </section>

            <div className="orders-detail-actions">
              <button
                type="button"
                onClick={async () => {
                  if (["delivered", "cancelled"].includes(detailOrder.status)) {
                    toast.info("Finalised orders cannot be assigned.");
                    return;
                  }
                  const assigned = assignments[detailOrder._id];
                  if (assigned) {
                    toast.info("Drone already assigned to this order");
                    return;
                  }
                  const result = await assignDrone(detailOrder);
                  if (!result) {
                    toast.error("No available drone for this branch");
                  }
                }}
                disabled={detailOrder.status === "delivered" || detailOrder.status === "cancelled"}
              >
                Assign drone
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Orders;
