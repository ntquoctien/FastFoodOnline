import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";

const initialFormValues = {
  name: "",
  hubId: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  country: "Vietnam",
  phone: "",
  isPrimary: false,
  isActive: true,
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

const formatAddress = (branch) => {
  if (branch.address?.fullText) return branch.address.fullText;
  return [
    branch.address?.street,
    branch.address?.ward,
    branch.address?.district,
    branch.address?.city,
    branch.address?.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const Branches = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [branches, setBranches] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [menuFoods, setMenuFoods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState(initialFormValues);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch._id === selectedBranchId) || null,
    [branches, selectedBranchId]
  );

  const fetchBranches = useCallback(
    async (preferredBranchId) => {
      if (!token) return;
      setLoading(true);
      try {
      const response = await axios.get(`${url}/api/v2/branches`, {
        headers: { token },
      });
      if (response.data.success) {
        const payload = response.data.data || {};
        const list = payload.branches || [];
        setBranches(list);
        setRestaurantName(payload.restaurant?.name || "");
        if (payload.hubs) {
          setHubs(payload.hubs);
        } else {
          fetchHubs();
        }
        const branchIds = list.map((branch) => branch._id);
          setSelectedBranchId((current) => {
            const preferred =
              preferredBranchId && branchIds.includes(preferredBranchId)
                ? preferredBranchId
                : "";
            const currentValid =
              current && branchIds.includes(current) ? current : "";
            const fallback = list[0]?._id || "";
            const nextSelection = preferred || currentValid || fallback;
            return nextSelection === current ? current : nextSelection;
          });
          if (list.length === 0) {
            setMenuFoods([]);
          }
        } else {
          toast.error(response.data.message || "Failed to load branches");
        }
      } catch (error) {
        console.error("Branches fetch failed", error);
        toast.error("Unable to load branches");
      } finally {
        setLoading(false);
      }
    },
    [token, url]
  );

  const fetchMenu = useCallback(
    async (branchId) => {
      if (!branchId) {
        setMenuFoods([]);
        return;
      }
      setMenuLoading(true);
      try {
        const response = await axios.get(`${url}/api/v2/menu/default`, {
          params: { branchId },
        });
        if (response.data.success) {
          setMenuFoods(response.data.data?.foods || []);
        } else {
          toast.error(response.data.message || "Failed to load branch menu");
        }
      } catch (error) {
        console.error("Branch menu fetch failed", error);
        toast.error("Unable to load branch menu");
      } finally {
        setMenuLoading(false);
      }
    },
    [url]
  );

  const fetchHubs = async () => {
    try {
      const res = await axios.get(`${url}/api/v2/hubs`, { headers: { token } });
      if (res.data?.success) {
        setHubs(res.data.data || []);
        setFormValues((prev) => ({
          ...prev,
          hubId: prev.hubId || res.data.data?.[0]?._id || "",
        }));
      }
    } catch (error) {
      console.warn("Failed to load hubs", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchBranches();
    }
  }, [token, fetchBranches]);

  useEffect(() => {
    if (selectedBranchId) {
      fetchMenu(selectedBranchId);
    } else {
      setMenuFoods([]);
    }
  }, [selectedBranchId, fetchMenu]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddClick = () => {
    setEditingBranchId(null);
    setFormValues(initialFormValues);
    setShowForm(true);
  };

  const handleEditClick = (event, branch) => {
    event.stopPropagation();
    setEditingBranchId(branch._id);
    setFormValues({
      name: branch.name || "",
      hubId: branch.hubId?._id || branch.hubId || "",
      street: branch.address?.street || "",
      ward: branch.address?.ward || "",
      district: branch.address?.district || "",
      city: branch.address?.city || "",
      country: branch.address?.country || "Vietnam",
      phone: branch.phone || "",
      isPrimary: Boolean(branch.isPrimary),
      isActive: branch.isActive !== false,
      managerName: branch.manager?.name || "",
      managerEmail: branch.manager?.email || "",
      managerPassword: "",
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (event, branch) => {
    event.stopPropagation();
    if (!window.confirm(`Delete branch "${branch.name}"?`)) {
      return;
    }
    setDeletingId(branch._id);
    try {
      const response = await axios.delete(`${url}/api/v2/branches/${branch._id}`, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Branch removed");
        await fetchBranches();
      } else {
        toast.error(response.data.message || "Failed to delete branch");
      }
    } catch (error) {
      console.error("Branch delete failed", error);
      toast.error("Unable to delete branch");
    } finally {
      setDeletingId("");
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (!formValues.name.trim()) {
      toast.error("Branch name is required");
      return;
    }
    if (!formValues.hubId) {
      toast.error("Select a hub for this branch");
      return;
    }
    const {
      managerName,
      managerEmail,
      managerPassword,
      ...branchFields
    } = formValues;
    const isCreating = !editingBranchId;
    const payload = {
      ...branchFields,
      country: branchFields.country || "Vietnam",
    };
    const shouldCreateManager =
      isCreating && (managerName || managerEmail || managerPassword);
    if (shouldCreateManager) {
      if (!managerName || !managerEmail || !managerPassword) {
        toast.error("Manager name, email and password are required");
        return;
      }
      if (managerPassword.length < 8) {
        toast.error("Manager password must be at least 8 characters");
        return;
      }
      payload.manager = {
        name: managerName || undefined,
        email: managerEmail || undefined,
        password: managerPassword || undefined,
      };
    }
    if (payload.manager) {
      Object.keys(payload.manager).forEach((key) => {
        if (!payload.manager[key]) {
          delete payload.manager[key];
        }
      });
      if (Object.keys(payload.manager).length === 0) {
        delete payload.manager;
      }
    }
    setSaving(true);
    try {
      let response;
      if (editingBranchId) {
        response = await axios.put(
          `${url}/api/v2/branches/${editingBranchId}`,
          payload,
          { headers: { token } }
        );
      } else {
        response = await axios.post(`${url}/api/v2/branches`, payload, {
          headers: { token },
        });
      }

      if (response.data.success) {
        const nextSelectedId = editingBranchId
          ? editingBranchId
          : response.data.data?._id;
        toast.success(editingBranchId ? "Branch updated" : "Branch created");
        setShowForm(false);
        setFormValues(initialFormValues);
        setEditingBranchId(null);
        await fetchBranches(nextSelectedId);
      } else {
        const errorMessage = editingBranchId
          ? "Failed to update branch"
          : "Failed to create branch";
        toast.error(response.data.message || errorMessage);
      }
    } catch (error) {
      console.error("Branch save failed", error);
      toast.error("Unable to save branch");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setFormValues(initialFormValues);
    setEditingBranchId(null);
  };

  const renderBranchFormModal = () => {
    if (!showForm) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          onClick={handleCancelForm}
        >
          <div
            className="modal-dialog modal-lg modal-dialog-scrollable"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-1">
                    {editingBranchId ? "Edit branch" : "Add branch"}
                  </h5>
                  <small className="text-muted">
                    Configure branch details and manager access.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCancelForm}
                />
              </div>
              <form onSubmit={handleFormSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Name *</label>
                      <input
                        className="form-control"
                        name="name"
                        value={formValues.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Hub</label>
                      <select
                        className="form-select"
                        name="hubId"
                        value={formValues.hubId}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select hub</option>
                        {hubs.map((hub) => (
                          <option key={hub._id} value={hub._id}>
                            {hub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Street</label>
                      <input
                        className="form-control"
                        name="street"
                        value={formValues.street}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Ward</label>
                      <input
                        className="form-control"
                        name="ward"
                        value={formValues.ward}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">District</label>
                      <input
                        className="form-control"
                        name="district"
                        value={formValues.district}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">City</label>
                      <input
                        className="form-control"
                        name="city"
                        value={formValues.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Country</label>
                      <input
                        className="form-control"
                        name="country"
                        value={formValues.country}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        name="phone"
                        value={formValues.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="col-12 d-flex flex-wrap gap-3 align-items-center">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="branch-is-primary"
                          name="isPrimary"
                          checked={formValues.isPrimary}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="branch-is-primary">
                          Primary branch
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="branch-is-active"
                          name="isActive"
                          checked={formValues.isActive}
                          onChange={handleInputChange}
                        />
                        <label className="form-check-label" htmlFor="branch-is-active">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                  {!editingBranchId && (
                    <>
                      <hr className="my-4" />
                      <h6 className="mb-3">Branch access</h6>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Manager name</label>
                          <input
                            className="form-control"
                            name="managerName"
                            value={formValues.managerName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Manager email</label>
                          <input
                            className="form-control"
                            name="managerEmail"
                            type="email"
                            value={formValues.managerEmail}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Temporary password</label>
                          <input
                            className="form-control"
                            name="managerPassword"
                            type="text"
                            value={formValues.managerPassword}
                            onChange={handleInputChange}
                          />
                          <small className="text-muted">
                            Password is required to create the manager account (min 8 characters).
                          </small>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={handleCancelForm}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving
                      ? "Saving..."
                      : editingBranchId
                      ? "Update branch"
                      : "Create branch"}
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


  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Branches</h3>
          {restaurantName ? (
            <p className="text-muted mb-0">{restaurantName}</p>
          ) : (
            <p className="text-muted mb-0">
              Manage operating locations and branch access.
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={handleAddClick}>
          + Add branch
        </button>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Branch list</h5>
              {loading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
              ) : null}
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead className="text-muted small text-uppercase">
                  <tr>
                    <th>Name</th>
                    <th>Hub</th>
                    <th>Address</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && branches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-4">
                        No branches yet
                      </td>
                    </tr>
                  ) : (
                    branches.map((branch) => (
                      <tr
                        key={branch._id}
                        className={
                          branch._id === selectedBranchId ? "table-active" : ""
                        }
                        onClick={() => setSelectedBranchId(branch._id)}
                        role="button"
                      >
                        <td className="fw-semibold">
                          {branch.name}{" "}
                          {branch.isPrimary ? (
                            <span className="badge bg-primary-subtle text-primary ms-2">
                              Primary
                            </span>
                          ) : null}
                        </td>
                        <td className="text-muted">
                          {hubs.find((h) => h._id === (branch.hubId?._id || branch.hubId))
                            ?.name || "-"}
                        </td>
                        <td className="text-muted">
                          {formatAddress(branch) || "-"}
                        </td>
                        <td className="text-muted">{branch.phone || "-"}</td>
                        <td>
                          <span
                            className={
                              branch.isActive === false
                                ? "badge bg-danger-subtle text-danger"
                                : "badge bg-success-subtle text-success"
                            }
                          >
                            {branch.isActive === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={(event) => handleEditClick(event, branch)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={(event) => handleDeleteClick(event, branch)}
                              disabled={deletingId === branch._id}
                            >
                              {deletingId === branch._id ? "Removing..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                {selectedBranch ? `Menu · ${selectedBranch.name}` : "Menu preview"}
              </h5>
              {menuLoading ? (
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
              ) : null}
            </div>
            <div className="card-body">
              {!selectedBranch ? (
                <p className="text-muted mb-0">
                  Select a branch to view its assigned menu.
                </p>
              ) : menuFoods.length === 0 && !menuLoading ? (
                <p className="text-muted mb-0">
                  No menu items published for this branch.
                </p>
              ) : (
                <div className="list-group list-group-flush">
                  {menuFoods.map((food) => (
                    <div key={food._id} className="list-group-item px-0">
                      <div className="d-flex justify-content-between align-items-start gap-3">
                        <div>
                          <h6 className="mb-1">{food.name}</h6>
                          <small className="text-muted">
                            {food.categoryName || "Uncategorised"}
                          </small>
                        </div>
                        <div className="text-muted small text-end">
                          {(food.variants || []).length} variant
                          {(food.variants || []).length === 1 ? "" : "s"}
                        </div>
                      </div>
                      <p className="mb-0 text-muted small">
                        {(food.variants || []).length === 0
                          ? "No variants"
                          : food.variants
                              .map((variant) => {
                                const price = Number(variant.price);
                                const formattedPrice = Number.isFinite(price)
                                  ? formatCurrency(price)
                                  : "";
                                return [variant.size, formattedPrice]
                                  .filter(Boolean)
                                  .join(" · ");
                              })
                              .join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderBranchFormModal()}
    </div>
  );


};

export default Branches;

