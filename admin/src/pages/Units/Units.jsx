import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const defaultForm = {
  type: "size",
  value: "",
  symbol: "",
  order: "",
  description: "",
  isActive: true,
};

const typeOptions = [
  { value: "size", label: "Size (S, M, L)" },
  { value: "weight", label: "Weight (g, kg)" },
  { value: "volume", label: "Volume (ml, l)" },
  { value: "quantity", label: "Quantity (piece, pack)" },
  { value: "combo", label: "Combo / set" },
];

const Units = ({ url }) => {
  const { token, role } = useContext(StoreContext);
  const isAdmin = role === "admin";
  const apiBaseUrl = useMemo(
    () => url || import.meta.env.VITE_API_URL || "http://localhost:4000",
    [url]
  );
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filteredUnits = useMemo(() => {
    if (showInactive) return units;
    return units.filter((unit) => unit.isActive);
  }, [units, showInactive]);

  const fetchUnits = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v2/units`, {
        headers: { token },
        params: { includeInactive: true },
      });
      if (response.data?.success) {
        setUnits(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Unable to load units");
      }
    } catch (error) {
      console.error("Fetch units failed", error);
      toast.error("Unable to load units");
    } finally {
      setLoading(false);
    }
  }, [token, apiBaseUrl, isAdmin]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  const openCreate = () => {
    setEditingUnit(null);
    setForm(defaultForm);
    setFormOpen(true);
  };

  const openEdit = (unit) => {
    setEditingUnit(unit);
    setForm({
      type: unit.type || "size",
      value: unit.value ?? "",
      symbol: unit.symbol || unit.label || "",
      order: unit.order ?? "",
      description: unit.description || "",
      isActive: unit.isActive,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingUnit(null);
    setForm(defaultForm);
  };

  const updateForm = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);

    const payload = {
      type: form.type,
      value: form.value === "" ? undefined : Number(form.value),
      symbol: form.symbol.trim(),
      order: form.order === "" ? undefined : Number(form.order),
      description: form.description.trim(),
      isActive: form.isActive,
    };

    const request = editingUnit
      ? axios.put(`${apiBaseUrl}/api/v2/units/${editingUnit._id}`, payload, {
          headers: { token },
        })
      : axios.post(`${apiBaseUrl}/api/v2/units`, payload, { headers: { token } });

    try {
      const response = await request;
      if (response.data?.success) {
        toast.success(editingUnit ? "Unit updated" : "Unit created");
        closeForm();
        fetchUnits();
      } else {
        toast.error(response.data?.message || "Unable to save unit");
      }
    } catch (error) {
      console.error("Save unit failed", error);
      toast.error("Unable to save unit");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (unit) => {
    if (!token) return;
    try {
      const response = await axios.put(
        `${apiBaseUrl}/api/v2/units/${unit._id}`,
        { isActive: !unit.isActive },
        { headers: { token } }
      );
      if (response.data?.success) {
        const updated = response.data.data;
        setUnits((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
        toast.success(updated.isActive ? "Unit activated" : "Unit archived");
      } else {
        toast.error(response.data?.message || "Unable to update status");
      }
    } catch (error) {
      console.error("Toggle unit status failed", error);
      toast.error("Unable to update status");
    }
  };

  const confirmDelete = (unit) => setDeleteTarget(unit);
  const cancelDelete = () => setDeleteTarget(null);

  const deleteUnit = async () => {
    if (!deleteTarget || !token) return;
    try {
      const response = await axios.delete(
        `${apiBaseUrl}/api/v2/units/${deleteTarget._id}`,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Unit deleted");
        setUnits((prev) => prev.filter((unit) => unit._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        toast.error(response.data?.message || "Unable to delete unit");
      }
    } catch (error) {
      console.error("Delete unit failed", error);
      toast.error("Unable to delete unit");
    }
  };

  const renderFormModal = () => {
    if (!formOpen) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          onClick={closeForm}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-centered"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-1">
                    {editingUnit ? "Edit measurement unit" : "New measurement unit"}
                  </h5>
                  <small className="text-muted">
                    Configure size/weight labels used when adding variants.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeForm}
                />
              </div>
              <form onSubmit={submitForm}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Type</label>
                      <select
                        className="form-select"
                        name="type"
                        value={form.type}
                        onChange={updateForm}
                        required
                        disabled={saving}
                      >
                        {typeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Symbol / label</label>
                      <input
                        className="form-control"
                        name="symbol"
                        value={form.symbol}
                        onChange={updateForm}
                        placeholder="E.g. S, M, L, 500ml, 250g"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">Numeric value</label>
                      <input
                        className="form-control"
                        name="value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.value}
                        onChange={updateForm}
                        placeholder="Used for sorting (e.g. 1 for S, 2 for M)"
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Order override (optional)
                      </label>
                      <input
                        className="form-control"
                        name="order"
                        type="number"
                        step="0.01"
                        value={form.order}
                        onChange={updateForm}
                        placeholder="Larger numbers appear first"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Description</label>
                      <textarea
                        className="form-control"
                        name="description"
                        value={form.description}
                        onChange={updateForm}
                        rows={3}
                        placeholder="Optional note (e.g. for drink sizes or portion guidance)"
                        disabled={saving}
                      />
                    </div>
                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="unit-active"
                          name="isActive"
                          checked={form.isActive}
                          onChange={updateForm}
                          disabled={saving}
                        />
                        <label className="form-check-label" htmlFor="unit-active">
                          Available for new menu items
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save unit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  const renderDeleteModal = () => {
    if (!deleteTarget) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="alertdialog"
          onClick={cancelDelete}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <h5 className="mb-0">Delete measurement unit</h5>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Remove <strong>{deleteTarget.label || deleteTarget.symbol}</strong>?{" "}
                  This might affect variant size/weight display.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={cancelDelete}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={deleteUnit}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  if (!isAdmin) {
    return (
      <div className="page-heading">
        <div className="page-title-headings">
          <h3>Measurement Units</h3>
          <p className="text-muted mb-0">
            You do not have permission to manage measurement units.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Measurement Units</h3>
          <p className="text-muted mb-0">
            Define size/weight labels (S, M, L, 500ml, 250g) for food variants.
          </p>
        </div>
        <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
          <div className="form-check form-switch mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id="units-show-inactive"
              checked={showInactive}
              onChange={(event) => setShowInactive(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="units-show-inactive">
              Show archived
            </label>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + New unit
          </button>
        </div>
      </div>

      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading units...</p>
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            {showInactive
              ? "No measurement units found."
              : "No active measurement units available."}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Label</th>
                  <th>Type</th>
                  <th>Value / Order</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnits.map((unit) => (
                  <tr key={unit._id}>
                    <td>
                      <div className="fw-semibold">{unit.label || unit.symbol}</div>
                      <small className="text-muted">{unit._id}</small>
                    </td>
                    <td className="text-capitalize">{unit.type}</td>
                    <td>
                      <div className="fw-semibold">
                        {unit.value ?? "—"} {unit.symbol}
                      </div>
                      <small className="text-muted">Order: {unit.order ?? "—"}</small>
                    </td>
                    <td className="text-muted">
                      {unit.description || "Không có mô tả"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn-sm ${
                          unit.isActive ? "btn-outline-success" : "btn-outline-secondary"
                        }`}
                        onClick={() => toggleStatus(unit)}
                      >
                        {unit.isActive ? "Selling" : "Not for sale"}
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => openEdit(unit)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => confirmDelete(unit)}
                        >
                          Delete
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

      {renderFormModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default Units;
