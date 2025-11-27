import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const emptyForm = {
  name: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  country: "Vietnam",
  serviceRadiusKm: "",
  isActive: true,
};

const Hubs = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const sortedHubs = useMemo(
    () =>
      [...hubs].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      ),
    [hubs]
  );

  const fetchHubs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/hubs`, {
        headers: { token },
      });
      if (response.data?.success) {
        setHubs(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Failed to load hubs");
      }
    } catch (error) {
      console.error("Failed to load hubs", error);
      toast.error("Unable to load hubs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchHubs();
    }
  }, [token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (hub) => {
    setEditingId(hub._id);
    setForm({
      name: hub.name || "",
      street: hub.address?.street || "",
      ward: hub.address?.ward || "",
      district: hub.address?.district || "",
      city: hub.address?.city || "",
      country: hub.address?.country || "Vietnam",
      serviceRadiusKm:
        hub.serviceRadiusKm === undefined || hub.serviceRadiusKm === null
          ? ""
          : String(hub.serviceRadiusKm),
      isActive: hub.isActive !== false,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      toast.error("Hub name is required");
      return;
    }
    const payload = {
      name: form.name.trim(),
      street: form.street.trim(),
      ward: form.ward.trim(),
      district: form.district.trim(),
      city: form.city.trim(),
      country: form.country.trim() || "Vietnam",
      serviceRadiusKm: form.serviceRadiusKm ? Number(form.serviceRadiusKm) : undefined,
      isActive: form.isActive,
    };
    setSaving(true);
    try {
      let response;
      if (editingId) {
        response = await axios.patch(`${url}/api/v2/hubs/${editingId}`, payload, {
          headers: { token },
        });
      } else {
        response = await axios.post(`${url}/api/v2/hubs`, payload, {
          headers: { token },
        });
      }
      if (response.data?.success) {
        toast.success(editingId ? "Hub updated" : "Hub created");
        resetForm();
        fetchHubs();
      } else {
        toast.error(response.data?.message || "Unable to save hub");
      }
    } catch (error) {
      console.error("Save hub failed", error);
      toast.error(error.response?.data?.message || "Unable to save hub");
    } finally {
      setSaving(false);
    }
  };

  const deleteHub = async (hubId, name) => {
    if (!window.confirm(`Delete hub "${name || hubId}"?`)) return;
    setDeletingId(hubId);
    try {
      const response = await axios.delete(`${url}/api/v2/hubs/${hubId}`, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Hub deleted");
        fetchHubs();
      } else {
        toast.error(response.data?.message || "Unable to delete hub");
      }
    } catch (error) {
      console.error("Delete hub failed", error);
      toast.error(error.response?.data?.message || "Unable to delete hub");
    } finally {
      setDeletingId(null);
    }
  };

  const formatAddress = (hub) =>
    [
      hub.address?.street,
      hub.address?.ward,
      hub.address?.district,
      hub.address?.city,
      hub.address?.country,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-4 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <h3 className="mb-1">Hubs</h3>
          <p className="text-muted mb-0">
            Manage drone hubs with structured address and service radius.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-1">{editingId ? "Edit hub" : "Add hub"}</h5>
              <small className="text-muted">
                Provide address details; GPS will be geocoded on the server.
              </small>
            </div>
            <div className="card-body">
              <form className="d-flex flex-column gap-3" onSubmit={submitForm}>
                <div>
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Street</label>
                  <input
                    className="form-control"
                    name="street"
                    value={form.street}
                    onChange={handleChange}
                  />
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">Ward</label>
                    <input
                      className="form-control"
                      name="ward"
                      value={form.ward}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">District</label>
                    <input
                      className="form-control"
                      name="district"
                      value={form.district}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">City</label>
                    <input
                      className="form-control"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Country</label>
                    <input
                      className="form-control"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="row g-2">
                  <div className="col-6">
                    <label className="form-label">Service radius (km)</label>
                    <input
                      className="form-control"
                      name="serviceRadiusKm"
                      type="number"
                      min="0"
                      step="0.1"
                      value={form.serviceRadiusKm}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-6 d-flex align-items-end">
                    <div className="form-check mt-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="hub-active"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="hub-active">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {editingId ? (
                    <button
                      type="button"
                      className="btn btn-light"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update hub" : "Create hub"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-0">Hubs</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p className="mb-0">Loading hubs...</p>
                </div>
              ) : sortedHubs.length === 0 ? (
                <p className="text-muted mb-0">No hubs created yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Address</th>
                        <th>Radius (km)</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedHubs.map((hub) => (
                        <tr key={hub._id}>
                          <td className="fw-semibold">{hub.name}</td>
                          <td>
                            {hub.address?.fullText || formatAddress(hub) || "-"}
                          </td>
                          <td>{hub.serviceRadiusKm ?? "-"}</td>
                          <td>
                            <span
                              className={
                                hub.isActive === false
                                  ? "badge bg-secondary-subtle text-secondary"
                                  : "badge bg-success-subtle text-success"
                              }
                            >
                              {hub.isActive === false ? "Inactive" : "Active"}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="btn-group">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleEdit(hub)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={deletingId === hub._id}
                                onClick={() => deleteHub(hub._id, hub.name)}
                              >
                                {deletingId === hub._id ? "Removing..." : "Delete"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hubs;

