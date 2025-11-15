import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
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

const statusBadgeMap = {
  pending: "badge bg-warning-subtle text-warning",
  confirmed: "badge bg-primary-subtle text-primary",
  preparing: "badge bg-primary-subtle text-primary",
  in_transit: "badge bg-info-subtle text-info",
  delivered: "badge bg-success-subtle text-success",
  cancelled: "badge bg-danger-subtle text-danger",
  default: "badge bg-light text-body-secondary",
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

  const renderStatusBadge = (status) => {
    const className = statusBadgeMap[status] || statusBadgeMap.default;
    return (
      <span className={className}>{statusLabels[status] || status}</span>
    );
  };

  const renderOrdersGrid = () => {
    if (loading) {
      return (
        <div className="card border rounded-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading orders...</p>
          </div>
        </div>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="card border rounded-4">
          <div className="card-body text-center py-5 text-muted">
            No orders for the selected filter. Keep an eye on new activity!
          </div>
        </div>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 row-cols-xxl-3 g-3">
        {filteredOrders.map((order) => {
          const branchName =
            order.branchId?.name ||
            branches.find((b) => b._id === order.branchId)?.name;
          return (
            <div className="col" key={order._id}>
              <div className="card border rounded-4 h-100">
                <div className="card-header border-0 d-flex justify-content-between align-items-start gap-3">
                  <div className="d-flex gap-3 align-items-center">
                    <img
                      src={assets.parcel_icon}
                      alt="Parcel"
                      width={40}
                      height={40}
                    />
                    <div>
                      <h5 className="mb-0">#{order._id.slice(-6).toUpperCase()}</h5>
                      <small className="text-muted">
                        {formatDateTime(order.createdAt)}
                      </small>
                    </div>
                  </div>
                  {renderStatusBadge(order.status)}
                </div>
                <div className="card-body pt-0 d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Branch</span>
                    <span className="fw-semibold">{branchName || "-"}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Recipient</span>
                    <span className="fw-semibold text-end">
                      {order.address?.firstName} {order.address?.lastName}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Total</span>
                    <span className="fw-semibold">
                      ${order.totalAmount?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Items</span>
                    <span className="fw-semibold">{order.items?.length || 0}</span>
                  </div>
                  {assignedLabel(order) ? (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Assigned drone</span>
                      <span className="fw-semibold">{assignedLabel(order)}</span>
                    </div>
                  ) : null}
                </div>
                <div className="card-footer border-0 d-flex flex-column gap-2">
                  <select
                    className="form-select form-select-sm"
                    value={order.status}
                    onChange={(event) =>
                      statusHandler(order, event.target.value)
                    }
                    disabled={
                      order.status === "delivered" ||
                      order.status === "cancelled"
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => setDetailOrderId(order._id)}
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!detailOrder) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          onClick={() => setDetailOrderId(null)}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-1">
                    Order #{detailOrder._id.slice(-6).toUpperCase()}
                  </h5>
                  <small className="text-muted">
                    {formatDateTime(detailOrder.createdAt)}
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDetailOrderId(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="border rounded-4 p-3 h-100">
                      <p className="text-uppercase text-muted small mb-1">
                        Recipient
                      </p>
                      <p className="fw-semibold mb-0">
                        {detailOrder.address?.firstName}{" "}
                        {detailOrder.address?.lastName}
                      </p>
                      <p className="text-muted mb-0">
                        {formatAddress(detailOrder.address)}
                      </p>
                      <p className="text-muted mb-0">
                        {detailOrder.address?.phone || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded-4 p-3 h-100">
                      <p className="text-uppercase text-muted small mb-1">
                        Branch
                      </p>
                      <p className="fw-semibold mb-3">
                        {branchNameMap.get(
                          detailOrder.branchId?._id || detailOrder.branchId
                        ) || "-"}
                      </p>
                      <p className="text-uppercase text-muted small mb-1">
                        Payment
                      </p>
                      <p className="fw-semibold mb-0">
                        {detailOrder.paymentStatus}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="border rounded-4 p-3 h-100">
                      <p className="text-uppercase text-muted small mb-1">
                        Totals
                      </p>
                      <p className="display-6 mb-0">
                        ${detailOrder.totalAmount?.toFixed(2) || "0.00"}
                      </p>
                      <p className="text-muted mb-0">
                        {detailOrder.items?.length || 0} items
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <h6>Items</h6>
                  <ul className="list-group list-group-flush">
                    {detailOrder.items.map((item) => (
                      <li
                        key={`${detailOrder._id}-${item.foodVariantId}`}
                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                      >
                        <span className="fw-semibold">{item.title}</span>
                        <span className="text-muted">
                          {item.size ? `${item.size} · ` : ""}
                          ×{item.quantity}
                        </span>
                        <span className="fw-semibold">
                          ${item.totalPrice?.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h6>Delivery timeline</h6>
                  <ul className="list-group list-group-flush">
                    {(detailOrder.timeline || []).map((event, index) => (
                      <li
                        key={`${detailOrder._id}-timeline-${index}`}
                        className="list-group-item d-flex justify-content-between px-0"
                      >
                        <span>{statusLabels[event.status] || event.status}</span>
                        <span className="text-muted">
                          {formatDateTime(event.at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setDetailOrderId(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    if (
                      ["delivered", "cancelled"].includes(detailOrder.status)
                    ) {
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
                  disabled={
                    detailOrder.status === "delivered" ||
                    detailOrder.status === "cancelled"
                  }
                >
                  Assign drone
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-3">
        <h3 className="mb-1">Orders</h3>
        <p className="text-muted mb-0">
          Track fulfilment progress and assign delivery drones per branch.
        </p>
      </div>

      <div className="card border rounded-4 mb-4">
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

      {renderOrdersGrid()}
      {renderDetailModal()}
    </div>
  );
};

export default Orders;
