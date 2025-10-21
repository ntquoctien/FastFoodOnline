import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./Shippers.css";

const statusOptions = ["available", "busy", "inactive"];
const vehicleOptions = [
  { value: "drone", label: "Drone" },
  { value: "bike", label: "Bike" },
  { value: "scooter", label: "Scooter" },
];

const Shippers = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [shippers, setShippers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    email: "",
    branchId: "",
    vehicleType: "drone",
  });
  const [saving, setSaving] = useState(false);
  const [endpointAvailable, setEndpointAvailable] = useState(true);

  const filteredShippers = useMemo(() => {
    if (branchFilter === "all") return shippers;
    return shippers.filter(
      (shipper) =>
        String(shipper.branchId?._id || shipper.branchId || "") === branchFilter
    );
  }, [shippers, branchFilter]);

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/shippers`, {
        headers: { token },
      });
      if (response.data?.success) {
        setShippers(response.data.data || []);
        setEndpointAvailable(true);
      } else {
        toast.error(response.data?.message || "Failed to load shippers");
      }
    } catch (error) {
      console.error("Shipper list failed", error);
      toast.error("Unable to fetch shippers");
      setEndpointAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/branches`, {
        headers: { token },
      });
      if (response.data?.success) {
        const list = response.data.data?.branches || [];
        setBranches(list);
        setForm((prev) => ({
          ...prev,
          branchId: prev.branchId || list[0]?._id || "",
        }));
      }
    } catch (error) {
      console.warn("Failed to load branches for shippers", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranches();
      fetchShippers();
    }
  }, [token]);

  const updateStatus = async (shipperId, status) => {
    if (!endpointAvailable || String(shipperId).startsWith("local-")) {
      setShippers((prev) =>
        prev.map((shipper) =>
          shipper._id === shipperId ? { ...shipper, status } : shipper
        )
      );
      toast.success("Status updated");
      return;
    }
    try {
      const response = await axios.patch(
        `${url}/api/v2/shippers/${shipperId}/status`,
        { status },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Status updated");
        fetchShippers();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Shipper update failed", error);
      toast.error("Unable to update status");
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.branchId) {
      toast.error("Select a branch for this shipper");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      branchId: form.branchId,
      vehicleType: form.vehicleType,
    };
    if (!endpointAvailable) {
      setShippers((prev) => [
        {
          _id: `local-${Date.now()}`,
          userId: { name: payload.name, email: payload.email },
          branchId: branches.find((branch) => branch._id === payload.branchId),
          vehicleType: payload.vehicleType,
          status: "available",
        },
        ...prev,
      ]);
      toast.success("Drone shipper added (local preview)");
      setSaving(false);
      setForm((prev) => ({ ...prev, name: "", email: "" }));
      return;
    }
    try {
      const response = await axios.post(`${url}/api/v2/shippers`, payload, {
        headers: { token },
      });
      if (response.data?.success) {
        const tempPassword = response.data?.temporaryPassword;
        toast.success(
          tempPassword
            ? `Drone shipper created. Temporary password: ${tempPassword}`
            : "Drone shipper created"
        );
        fetchShippers();
        setEndpointAvailable(true);
        setForm((prev) => ({ ...prev, name: "", email: "" }));
      } else {
        toast.error(response.data?.message || "Unable to create shipper");
      }
    } catch (error) {
      console.error("Create shipper failed", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Unable to create shipper";
      if (error.response) {
        toast.error(message);
      } else {
        toast.info("API unavailable. Added shipper locally for preview.");
        setShippers((prev) => [
          {
            _id: `local-${Date.now()}`,
            userId: { name: payload.name, email: payload.email },
            branchId: branches.find((branch) => branch._id === payload.branchId),
            vehicleType: payload.vehicleType,
            status: "available",
          },
          ...prev,
        ]);
        setForm((prev) => ({ ...prev, name: "", email: "" }));
        setEndpointAvailable(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="shippers-page">
      <header className="shippers-header">
        <div>
          <h2>Delivery Fleet</h2>
          <p>Manage drone pilots and assign them to the right branches.</p>
        </div>
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
        >
          <option value="all">All branches</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </header>

      {!endpointAvailable ? (
        <div className="shippers-banner">
          Creating shippers requires backend support. Entries added here are stored
          temporarily for UI preview.
        </div>
      ) : null}

      <div className="shippers-layout">
        <section className="shippers-form-card">
          <h3>Add drone shipper</h3>
          <form onSubmit={handleCreate}>
            <label>
              <span>Name</span>
              <input
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="Eg. Alex Nguyen"
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                placeholder="pilot@example.com"
                required
              />
            </label>
            <label>
              <span>Branch</span>
              <select
                name="branchId"
                value={form.branchId}
                onChange={handleFormChange}
              >
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Vehicle</span>
              <select
                name="vehicleType"
                value={form.vehicleType}
                onChange={handleFormChange}
              >
                {vehicleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Add shipper"}
            </button>
          </form>
        </section>

        <section className="shippers-list">
          {loading ? (
            <div className="shippers-empty">Loading fleet...</div>
          ) : filteredShippers.length === 0 ? (
            <div className="shippers-empty">No shippers for this branch yet.</div>
          ) : (
            filteredShippers.map((shipper) => (
              <article key={shipper._id} className="shippers-card">
                <div className="shippers-card-main">
                  <div className="shippers-avatar">
                    {shipper.userId?.name?.[0]?.toUpperCase() || "D"}
                  </div>
                  <div>
                    <h4>{shipper.userId?.name || "Unnamed pilot"}</h4>
                    <p>{shipper.userId?.email}</p>
                  </div>
                </div>
                <div className="shippers-card-info">
                  <p>
                    <strong>Branch:</strong>{" "}
                    {shipper.branchId?.name ||
                      branches.find((branch) => branch._id === shipper.branchId)?.name ||
                      "Unassigned"}
                  </p>
                  <p>
                    <strong>Vehicle:</strong> {shipper.vehicleType || "—"}
                  </p>
                </div>
                <div className="shippers-card-actions">
                  <span className={`shippers-status status-${shipper.status}`}>
                    {shipper.status}
                  </span>
                  <select
                    value={shipper.status}
                    onChange={(event) => updateStatus(shipper._id, event.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default Shippers;
