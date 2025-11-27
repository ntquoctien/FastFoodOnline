import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const statusOptions = [
  "AVAILABLE",
  "ASSIGNED",
  "EN_ROUTE_PICKUP",
  "DELIVERING",
  "RETURNING",
  "CHARGING",
  "MAINTENANCE",
];

const statusBadgeMap = {
  AVAILABLE: "badge bg-success-subtle text-success",
  ASSIGNED: "badge bg-primary-subtle text-primary",
  EN_ROUTE_PICKUP: "badge bg-info-subtle text-info",
  DELIVERING: "badge bg-info-subtle text-info",
  RETURNING: "badge bg-warning-subtle text-warning",
  CHARGING: "badge bg-secondary-subtle text-secondary",
  MAINTENANCE: "badge bg-danger-subtle text-danger",
};

const Drones = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [drones, setDrones] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hubFilter, setHubFilter] = useState("all");
  const [form, setForm] = useState({
    hubId: "",
    code: "",
    name: "",
    serialNumber: "",
    status: "AVAILABLE",
    batteryLevel: "100",
    speedKmh: "40",
    maxPayloadKg: "3",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [endpointAvailable, setEndpointAvailable] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [editingDrone, setEditingDrone] = useState(null);
  const [editForm, setEditForm] = useState({
    hubId: "",
    code: "",
    name: "",
    serialNumber: "",
    status: "AVAILABLE",
    batteryLevel: "",
    speedKmh: "",
    maxPayloadKg: "",
    isActive: true,
  });

  const filteredDrones = useMemo(() => {
    if (hubFilter === "all") return drones;
    return drones.filter(
      (drone) => String(drone.hubId?._id || drone.hubId || "") === hubFilter
    );
  }, [drones, hubFilter]);

  const fetchDrones = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/drones`, {
        headers: { token },
        params: hubFilter !== "all" && hubFilter ? { hubId: hubFilter } : undefined,
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

  const fetchHubs = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/hubs`, {
        headers: { token },
      });
      if (response.data?.success) {
        const list = response.data.data || [];
        setHubs(list);
        setForm((prev) => ({
          ...prev,
          hubId: prev.hubId || list[0]?._id || "",
        }));
        setEditForm((prev) => ({
          ...prev,
          hubId: prev.hubId || list[0]?._id || "",
        }));
      }
    } catch (error) {
      console.warn("Failed to load hubs for drones", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHubs();
      fetchDrones();
    }
  }, [token]);

  const hubName = (hubId) => {
    const id = String(hubId || "");
    return hubs.find((hub) => String(hub._id) === id)?.name || "Unassigned";
  };

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
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const openEdit = (drone) => {
    if (!drone) return;
    setEditingDrone(drone);
    setEditForm({
      hubId: drone.hubId?._id || drone.hubId || "",
      code: drone.code || "",
      name: drone.name || "",
      serialNumber: drone.serialNumber || "",
      maxPayloadKg: drone.maxPayloadKg ?? "",
      batteryLevel: drone.batteryLevel ?? "",
      speedKmh: drone.speedKmh ?? "",
      status: (drone.status || "AVAILABLE").toUpperCase(),
      isActive: drone.isActive !== false,
    });
  };

  const closeEdit = () => {
    setEditingDrone(null);
    setEditForm({
      hubId: "",
      code: "",
      name: "",
      serialNumber: "",
      maxPayloadKg: "",
      batteryLevel: "",
      speedKmh: "",
      status: "AVAILABLE",
      isActive: true,
    });
  };

  const handleEditChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingDrone) return;
    const payload = {
      hubId: editForm.hubId,
      code: editForm.code,
      name: editForm.name,
      serialNumber: editForm.serialNumber,
      maxPayloadKg: editForm.maxPayloadKg ? Number(editForm.maxPayloadKg) : undefined,
      batteryLevel: editForm.batteryLevel ? Number(editForm.batteryLevel) : undefined,
      speedKmh: editForm.speedKmh ? Number(editForm.speedKmh) : undefined,
      status: editForm.status,
      isActive: editForm.isActive,
    };
    try {
      const response = await axios.patch(
        `${url}/api/v2/drones/${editingDrone._id}`,
        payload,
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

  const deleteDrone = async (drone) => {
    const confirmed = window.confirm(`Delete drone ${drone?.code || ""}?`);
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
      hubId: form.hubId,
      code: form.code || undefined,
      name: form.name || undefined,
      serialNumber: form.serialNumber || undefined,
      maxPayloadKg: Number(form.maxPayloadKg),
      batteryLevel: form.batteryLevel ? Number(form.batteryLevel) : undefined,
      speedKmh: form.speedKmh ? Number(form.speedKmh) : undefined,
      status: form.status || "AVAILABLE",
      isActive: form.isActive,
    };

    if (!payload.hubId) {
      toast.error("Select a hub for this drone");
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
          <h3 className="mb-1">Drones</h3>
          <p className="text-muted mb-0">
            Manage delivery drones by hub and update their availability.
          </p>
        </div>
        <div className="w-100 w-lg-auto" style={{ maxWidth: "260px" }}>
          <select
            className="form-select"
            value={hubFilter}
            onChange={(event) => setHubFilter(event.target.value)}
          >
            <option value="all">All hubs</option>
            {hubs.map((hub) => (
              <option key={hub._id} value={hub._id}>
                {hub.name}
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
                Create a new drone and assign it to a hub.
              </small>
            </div>
            <div className="card-body">
              <form onSubmit={handleCreate} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Hub</label>
                  <select
                    className="form-select"
                    name="hubId"
                    value={form.hubId}
                    onChange={handleFormChange}
                  >
                    {hubs.map((hub) => (
                      <option key={hub._id} value={hub._id}>
                        {hub.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Code</label>
                  <input
                    className="form-control"
                    name="code"
                    value={form.code}
                    onChange={handleFormChange}
                    placeholder="Auto-generate if empty"
                  />
                </div>
                <div>
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="form-label">Serial number</label>
                  <input
                    className="form-control"
                    name="serialNumber"
                    value={form.serialNumber}
                    onChange={handleFormChange}
                    placeholder="Optional"
                  />
                </div>
                <div className="row">
                  <div className="col-6">
                    <label className="form-label">Max payload (kg)</label>
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
                  <div className="col-6">
                    <label className="form-label">Battery (%)</label>
                    <input
                      className="form-control"
                      name="batteryLevel"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={form.batteryLevel}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-6">
                    <label className="form-label">Speed (km/h)</label>
                    <input
                      className="form-control"
                      name="speedKmh"
                      type="number"
                      min="0"
                      step="1"
                      value={form.speedKmh}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={form.status}
                      onChange={handleFormChange}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="drone-active"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleFormChange}
                  />
                  <label className="form-check-label" htmlFor="drone-active">
                    Active
                  </label>
                </div>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating..." : "Add drone"}
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
              ) : filteredDrones.length === 0 ? (
                <p className="text-muted mb-0">No drones for this hub yet.</p>
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
                              Battery: {drone.batteryLevel ?? 0}% · Payload:{" "}
                              {drone.maxPayloadKg ?? 0} kg
                            </small>
                            <div className="text-muted small">
                              Hub: {hubName(drone.hubId?._id || drone.hubId)}
                            </div>
                          </div>
                        </div>
                        <div className="text-muted small d-flex flex-column align-items-start">
                          <span>Speed: {drone.speedKmh ?? "-"} km/h</span>
                          {drone.isActive === false ? (
                            <span className="badge bg-secondary-subtle text-secondary mt-1">Inactive</span>
                          ) : (
                            <span className="badge bg-success-subtle text-success mt-1">Active</span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-xl-row gap-2 align-items-xl-center justify-content-between">
                        <div className="d-flex flex-column flex-lg-row gap-2 align-items-lg-center">
                          <span
                            className={
                              statusBadgeMap[(drone.status || "").toUpperCase()] ||
                              statusBadgeMap.AVAILABLE
                            }
                          >
                            {(drone.status || "").toUpperCase()}
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
                            onClick={() => deleteDrone(drone)}
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
                      <label className="form-label">Hub</label>
                      <select
                        className="form-select"
                        name="hubId"
                        value={editForm.hubId}
                        onChange={handleEditChange}
                        required
                      >
                        {hubs.map((hub) => (
                          <option key={hub._id} value={hub._id}>
                            {hub.name}
                          </option>
                        ))}
                      </select>
                    </div>
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
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Serial number</label>
                      <input
                        className="form-control"
                        name="serialNumber"
                        value={editForm.serialNumber}
                        onChange={handleEditChange}
                        placeholder="Optional"
                      />
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
                        <label className="form-label">Speed (km/h)</label>
                        <input
                          className="form-control"
                          name="speedKmh"
                          type="number"
                          min="0"
                          step="1"
                          value={editForm.speedKmh}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col-6 mb-3">
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
                    <div className="form-check form-switch mb-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="edit-drone-active"
                        name="isActive"
                        checked={editForm.isActive}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                        }
                      />
                      <label className="form-check-label" htmlFor="edit-drone-active">
                        Active
                      </label>
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

export default Drones;
