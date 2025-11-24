import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const statusOptions = ["available", "busy", "offline", "maintenance"];
const statusBadgeMap = {
  available: "badge bg-success-subtle text-success",
  busy: "badge bg-warning-subtle text-warning",
  offline: "badge bg-secondary-subtle text-secondary",
  maintenance: "badge bg-info-subtle text-info",
};

const isLocalId = (value) => String(value || "").startsWith("local-");

const Shippers = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [drones, setDrones] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [form, setForm] = useState({
    branchId: "",
    maxPayloadKg: "3",
  });
  const [saving, setSaving] = useState(false);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingDrone, setEditingDrone] = useState(null);
  const [editForm, setEditForm] = useState({
    code: "",
    branchId: "",
    maxPayloadKg: "",
    batteryLevel: "",
    status: "available",
    lastKnownLat: "",
    lastKnownLng: "",
  });

  const filteredDrones = useMemo(() => {
    if (branchFilter === "all") return drones;
    return drones.filter(
      (drone) =>
        String(drone.branchId?._id || drone.branchId || "") === branchFilter
    );
  }, [drones, branchFilter]);

  const fetchDrones = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/drones`, {
        headers: { token },
      });
      if (response.data?.success) {
        setDrones(response.data.data || []);
        setEndpointAvailable(true);
      } else {
        toast.error(response.data?.message || "Failed to load drones");
      }
    } catch (error) {
      console.error("Drone list failed", error);
      toast.error("Unable to fetch drones");
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
      console.warn("Failed to load branches for drones", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranches();
      fetchDrones();
    }
  }, [token]);

  const updateStatus = async (droneId, status) => {
    if (!endpointAvailable || String(droneId).startsWith("local-")) {
      setDrones((prev) =>
        prev.map((drone) =>
          drone._id === droneId ? { ...drone, status } : drone
        )
      );
      toast.success("Status updated");
      return;
    }
    try {
      const response = await axios.patch(
        `${url}/api/v2/drones/${droneId}/status`,
        { status },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Status updated");
        fetchDrones();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Drone update failed", error);
      toast.error("Unable to update status");
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resolveBranchName = (drone) => {
    if (!drone) return "Unassigned";
    if (drone.branchId?.name) return drone.branchId.name;
    const branchId =
      (drone.branchId && drone.branchId._id) || drone.branchId || "";
    if (!branchId) return "Unassigned";
    return (
      branches.find((branch) => branch._id === branchId)?.name || "Unassigned"
    );
  };

  const openEdit = (drone) => {
    if (!drone) return;
    setEditingDrone(drone);
    setEditForm({
      code: drone.code || "",
      branchId: drone.branchId?._id || drone.branchId || "",
      maxPayloadKg: drone.maxPayloadKg ?? "",
      batteryLevel: drone.batteryLevel ?? "",
      status: drone.status || "available",
      lastKnownLat: drone.lastKnownLat ?? "",
      lastKnownLng: drone.lastKnownLng ?? "",
    });
  };

  const closeEdit = () => {
    setEditingDrone(null);
    setEditForm({
      code: "",
      branchId: "",
      maxPayloadKg: "",
      batteryLevel: "",
      status: "available",
      lastKnownLat: "",
      lastKnownLng: "",
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingDrone) return;
    try {
      const response = await axios.patch(
        `${url}/api/v2/drones/${editingDrone._id}`,
        {
          code: editForm.code,
          branchId: editForm.branchId,
          maxPayloadKg: Number(editForm.maxPayloadKg),
          batteryLevel: Number(editForm.batteryLevel),
          status: editForm.status,
          lastKnownLat: editForm.lastKnownLat,
          lastKnownLng: editForm.lastKnownLng,
        },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Drone updated");
        closeEdit();
        fetchDrones();
      } else {
        toast.error(response.data?.message || "Unable to update drone");
      }
    } catch (error) {
      console.error("Update drone failed", error);
      toast.error("Unable to update drone");
    }
  };

  const deleteShipper = async (drone) => {
    const confirmed = window.confirm(
      `Delete drone ${drone?.code || ""}?`
    );
    if (!confirmed) return;
    const droneId = drone._id;
    setDeletingId(droneId);
    try {
      const response = await axios.delete(`${url}/api/v2/drones/${droneId}`, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Drone deleted");
        fetchDrones();
      } else {
        toast.error(response.data?.message || "Unable to delete drone");
      }
    } catch (error) {
      console.error("Delete drone failed", error);
      toast.error("Unable to delete drone");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (saving) return;
    const payload = {
      branchId: form.branchId,
      maxPayloadKg: Number(form.maxPayloadKg),
    };

    if (!payload.branchId) {
      toast.error("Select a branch for this drone");
      return;
    }
    if (!Number.isFinite(payload.maxPayloadKg) || payload.maxPayloadKg <= 0) {
      toast.error("Enter a valid max payload (kg)");
      return;
    }
    setSaving(true);
    try {
      const response = await axios.post(`${url}/api/v2/drones`, payload, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Drone created");
        fetchDrones();
        setEndpointAvailable(true);
      } else {
        toast.error(response.data?.message || "Unable to create drone");
      }
    } catch (error) {
      console.error("Create drone failed", error);
      const message =
        error.response?.data?.message || error.message || "Unable to create drone";
      toast.error(message);
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
            Monitor delivery drones by branch and update their availability.
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
          Drone API unavailable. Local preview only.
        </div>
      ) : null}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-1">Add drone</h5>
              <small className="text-muted">
                Seed a new drone for a branch (1 unit).
              </small>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate} className="d-flex flex-column gap-3">
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
                  {saving ? "Creating..." : "Add drone"}
                </button>
                <div>
                  <label className="form-label mb-1">Max payload (kg)</label>
                  <input
                    className="form-control"
                    name="maxPayloadKg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.maxPayloadKg}
                    onChange={handleFormChange}
                  />
                </div>
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
              ) : filteredDrones.length === 0 ? (
                <p className="text-muted mb-0">No drones for this branch yet.</p>
              ) : (
                <div className="list-group list-group-flush">
                  {filteredDrones.map((drone) => (
                    <div
                      key={drone._id}
                      className="list-group-item px-0 py-3 d-flex flex-column gap-3"
                    >
                      <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between">
                        <div className="d-flex gap-3">
                          <div className="avatar bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center">
                            {drone.code?.slice(0, 2)?.toUpperCase() || "DR"}
                          </div>
                          <div>
                            <h6 className="mb-1">{drone.code || "Unnamed drone"}</h6>
                            <small className="text-muted">
                              Battery: {drone.batteryLevel ?? 0}%
                              {" · "}Payload: {drone.maxPayloadKg ?? 0} kg
                            </small>
                          </div>
                        </div>
                        <div className="text-muted small">
                          <strong>Branch:</strong> {resolveBranchName(drone)}
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-xl-row gap-2 align-items-xl-center justify-content-between">
                        <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
                          <span className={statusBadgeMap[drone.status] || statusBadgeMap.available}>
                            {drone.status}
                          </span>
                          <select
                            className="form-select form-select-sm"
                            value={drone.status}
                            onChange={(event) => updateStatus(drone._id, event.target.value)}
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
                            onClick={() => openEdit(drone)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={deletingId === drone._id}
                            onClick={() => deleteShipper(drone)}
                          >
                            Delete
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
      {editingDrone ? (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={closeEdit}>
            <div
              className="modal-dialog"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-content border-0 rounded-4">
                <div className="modal-header border-0">
                  <div>
                    <h5 className="mb-1">Edit drone</h5>
                    <small className="text-muted">
                      Update details for {editingDrone.code}
                    </small>
                  </div>
                  <button type="button" className="btn-close" onClick={closeEdit} />
                </div>
                <form onSubmit={submitEdit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Code</label>
                      <input
                        className="form-control"
                        name="code"
                        value={editForm.code}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-select"
                        name="branchId"
                        value={editForm.branchId}
                        onChange={handleEditChange}
                        required
                      >
                        {branches.map((branch) => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label">Max payload (kg)</label>
                        <input
                          className="form-control"
                          name="maxPayloadKg"
                          type="number"
                          min="0"
                          step="0.1"
                          value={editForm.maxPayloadKg}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label">Battery (%)</label>
                        <input
                          className="form-control"
                          name="batteryLevel"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={editForm.batteryLevel}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-3">
                        <label className="form-label">Last known lat</label>
                        <input
                          className="form-control"
                          name="lastKnownLat"
                          type="number"
                          step="0.000001"
                          value={editForm.lastKnownLat}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col-6 mb-3">
                        <label className="form-label">Last known lng</label>
                        <input
                          className="form-control"
                          name="lastKnownLng"
                          type="number"
                          step="0.000001"
                          value={editForm.lastKnownLng}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="mb-0">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        name="status"
                        value={editForm.status}
                        onChange={handleEditChange}
                      >
                        {statusOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={closeEdit}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Save changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeEdit} />
        </>
      ) : null}
    </div>
  );
};

export default Shippers;
