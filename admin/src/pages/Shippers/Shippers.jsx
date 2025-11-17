import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const statusOptions = ["available", "busy", "inactive"];
const DRONE_VEHICLE_TYPE = "drone";
const isLocalId = (value) => String(value || "").startsWith("local-");

const statusBadgeMap = {
  available: "badge bg-success-subtle text-success",
  busy: "badge bg-warning-subtle text-warning",
  inactive: "badge bg-secondary-subtle text-secondary",
};

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
  });
  const [saving, setSaving] = useState(false);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [editingShipper, setEditingShipper] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    branchId: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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

  const resolveBranchName = (shipper) => {
    if (!shipper) return "Unassigned";
    if (shipper.branchId?.name) return shipper.branchId.name;
    const branchId =
      (shipper.branchId && shipper.branchId._id) || shipper.branchId || "";
    if (!branchId) return "Unassigned";
    return (
      branches.find((branch) => branch._id === branchId)?.name || "Unassigned"
    );
  };

  const openEditShipper = (shipper) => {
    if (!shipper) return;
    const branchValue =
      shipper.branchId?._id || shipper.branchId || branches[0]?._id || "";
    setEditingShipper(shipper);
    setEditForm({
      name: shipper.userId?.name || "",
      email: shipper.userId?.email || "",
      branchId: branchValue,
    });
  };

  const closeEditShipper = () => {
    if (editSaving) return;
    setEditingShipper(null);
    setEditForm({
      name: "",
      email: "",
      branchId: "",
    });
  };

  const handleEditFormChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEditShipper = async (event) => {
    event.preventDefault();
    if (!editingShipper) return;
    if (!editForm.branchId) {
      toast.error("Select a branch for this shipper");
      return;
    }
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim().toLowerCase(),
      branchId: editForm.branchId,
    };
    if (!payload.name || !payload.email) {
      toast.error("Name and email are required");
      return;
    }
    const shipperId = editingShipper._id;
    if (!endpointAvailable || isLocalId(shipperId)) {
      setShippers((prev) =>
        prev.map((shipper) => {
          if (shipper._id !== shipperId) return shipper;
          const branchObject =
            branches.find((branch) => branch._id === payload.branchId) ||
            shipper.branchId;
          return {
            ...shipper,
            userId: {
              ...(shipper.userId || {}),
              name: payload.name,
              email: payload.email,
            },
            branchId: branchObject?._id ? branchObject : payload.branchId,
          };
        })
      );
      toast.success("Drone details updated (local preview)");
      closeEditShipper();
      return;
    }
    setEditSaving(true);
    try {
      const response = await axios.patch(
        `${url}/api/v2/shippers/${shipperId}`,
        payload,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Drone details updated");
        closeEditShipper();
        fetchShippers();
      } else {
        toast.error(response.data?.message || "Unable to update shipper");
      }
    } catch (error) {
      console.error("Update shipper failed", error);
      toast.error("Unable to update shipper");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteShipper = async (shipper) => {
    if (!shipper) return;
    const confirmed = window.confirm(
      `Xóa drone ${shipper.userId?.name || shipper.userId?.email || ""}?`
    );
    if (!confirmed) return;
    const shipperId = shipper._id;
    if (!endpointAvailable || isLocalId(shipperId)) {
      setShippers((prev) => prev.filter((entry) => entry._id !== shipperId));
      toast.success("Drone removed");
      return;
    }
    setDeletingId(shipperId);
    try {
      const response = await axios.delete(`${url}/api/v2/shippers/${shipperId}`, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Drone removed");
        fetchShippers();
      } else {
        toast.error(response.data?.message || "Unable to delete shipper");
      }
    } catch (error) {
      console.error("Delete shipper failed", error);
      toast.error("Unable to delete shipper");
    } finally {
      setDeletingId(null);
    }
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
      vehicleType: DRONE_VEHICLE_TYPE,
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
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Drone Fleet</h3>
          <p className="text-muted mb-0">
            Monitor delivery pilots by branch and update their availability.
          </p>
        </div>
        <div className="w-100 w-lg-auto" style={{ maxWidth: "260px" }}>
          <select
            className="form-select"
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
        </div>
      </div>

      {!endpointAvailable ? (
        <div className="alert alert-warning rounded-4" role="alert">
          Creating shippers requires backend support. Entries added here are stored temporarily for UI preview.
        </div>
      ) : null}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-1">Add drone shipper</h5>
              <small className="text-muted">
                Register a new delivery pilot for a branch.
              </small>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Eg. Alex Nguyen"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="pilot@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Branch</label>
                  <select
                    className="form-select"
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
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating..." : "Add shipper"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-0">Fleet</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p className="text-muted mb-0">Loading fleet...</p>
                </div>
              ) : filteredShippers.length === 0 ? (
                <p className="text-muted mb-0">No shippers for this branch yet.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredShippers.map((shipper) => (
                    <div
                      key={shipper._id}
                      className="list-group-item px-0 py-3 d-flex flex-column gap-3"
                    >
                      <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between">
                        <div className="d-flex gap-3">
                          <div className="avatar bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center">
                            {shipper.userId?.name?.[0]?.toUpperCase() || "D"}
                          </div>
                          <div>
                            <h6 className="mb-1">{shipper.userId?.name || "Unnamed pilot"}</h6>
                            <small className="text-muted">{shipper.userId?.email || "No email"}</small>
                          </div>
                        </div>
                        <div className="text-muted small">
                          <strong>Branch:</strong> {resolveBranchName(shipper)}
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-xl-row gap-2 align-items-xl-center justify-content-between">
                        <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
                          <span className={statusBadgeMap[shipper.status] || statusBadgeMap.available}>
                            {shipper.status}
                          </span>
                          <select
                            className="form-select form-select-sm"
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
                        <div className="d-flex flex-column flex-lg-row gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => openEditShipper(shipper)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={deletingId === shipper._id}
                            onClick={() => deleteShipper(shipper)}
                          >
                            {deletingId === shipper._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {editingShipper ? (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={closeEditShipper}>
            <div
              className="modal-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-content border-0 rounded-4">
                <div className="modal-header border-0">
                  <div>
                    <h5 className="mb-1">Edit drone</h5>
                    <small className="text-muted">
                      Update details for {editingShipper.userId?.name || editingShipper.userId?.email}
                    </small>
                  </div>
                  <button type="button" className="btn-close" onClick={closeEditShipper} />
                </div>
                <form onSubmit={submitEditShipper}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        name="email"
                        type="email"
                        value={editForm.email}
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-select"
                        name="branchId"
                        value={editForm.branchId}
                        onChange={handleEditFormChange}
                        required
                      >
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={closeEditShipper}
                      disabled={editSaving}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={editSaving}>
                      {editSaving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeEditShipper} />
        </>
      ) : null}
    </div>
  );
};

export default Shippers;
