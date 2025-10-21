import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import "./Branches.css";

const initialFormValues = {
  name: "",
  street: "",
  district: "",
  city: "",
  phone: "",
  latitude: "",
  longitude: "",
  isPrimary: false,
  managerName: "",
  managerEmail: "",
  managerPassword: "",
};

const formatAddress = (branch) =>
  [branch.street, branch.district, branch.city].filter(Boolean).join(", ");

const Branches = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [branches, setBranches] = useState([]);
  const [restaurantName, setRestaurantName] = useState("");
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
      street: branch.street || "",
      district: branch.district || "",
      city: branch.city || "",
      phone: branch.phone || "",
      latitude:
        branch.latitude === undefined || branch.latitude === null
          ? ""
          : String(branch.latitude),
      longitude:
        branch.longitude === undefined || branch.longitude === null
          ? ""
          : String(branch.longitude),
      isPrimary: Boolean(branch.isPrimary),
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
    const {
      managerName,
      managerEmail,
      managerPassword,
      ...branchFields
    } = formValues;
    const payload = { ...branchFields };
    if (managerName || managerEmail || managerPassword) {
      payload.manager = {
        name: managerName || undefined,
        email: managerEmail || undefined,
      };
      if (managerPassword) {
        payload.manager.password = managerPassword;
      }
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

  return (
    <div className="branches-page">
      <div className="branches-header">
        <div>
          <h2>Branches</h2>
          {restaurantName ? <p className="branches-restaurant">{restaurantName}</p> : null}
        </div>
        <button className="branches-add-btn" onClick={handleAddClick}>
          Add Branch
        </button>
      </div>

      <div className="branches-grid">
        <div className="branches-panel">
          <div className="branches-panel-header">
            <h3>Branch List</h3>
            {loading ? <span className="branches-status">Loading...</span> : null}
          </div>

          {showForm ? (
            <form className="branches-form" onSubmit={handleFormSubmit}>
              <div className="branches-form-row">
                <label htmlFor="branch-name">Name *</label>
                <input
                  id="branch-name"
                  name="name"
                  type="text"
                  value={formValues.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="branches-form-row">
                <label htmlFor="branch-street">Street</label>
                <input
                  id="branch-street"
                  name="street"
                  type="text"
                  value={formValues.street}
                  onChange={handleInputChange}
                />
              </div>
              <div className="branches-form-grid">
                <div className="branches-form-row">
                  <label htmlFor="branch-district">District</label>
                  <input
                    id="branch-district"
                    name="district"
                    type="text"
                    value={formValues.district}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="branches-form-row">
                  <label htmlFor="branch-city">City</label>
                  <input
                    id="branch-city"
                    name="city"
                    type="text"
                    value={formValues.city}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="branches-form-row">
                <label htmlFor="branch-phone">Phone</label>
                <input
                  id="branch-phone"
                  name="phone"
                  type="text"
                  value={formValues.phone}
                  onChange={handleInputChange}
                />
              </div>
              <div className="branches-form-grid">
                <div className="branches-form-row">
                  <label htmlFor="branch-latitude">Latitude</label>
                  <input
                    id="branch-latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formValues.latitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="branches-form-row">
                  <label htmlFor="branch-longitude">Longitude</label>
                  <input
                    id="branch-longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formValues.longitude}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="branches-form-divider" />
              <div className="branches-form-section">
                <h4>Branch access</h4>
                <p>Provide credentials for the branch manager account.</p>
              </div>
              <div className="branches-form-grid">
                <div className="branches-form-row">
                  <label htmlFor="branch-manager-name">Manager name</label>
                  <input
                    id="branch-manager-name"
                    name="managerName"
                    type="text"
                    value={formValues.managerName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="branches-form-row">
                  <label htmlFor="branch-manager-email">Manager email</label>
                  <input
                    id="branch-manager-email"
                    name="managerEmail"
                    type="email"
                    value={formValues.managerEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="branches-form-row">
                <label htmlFor="branch-manager-password">Temporary password</label>
                <input
                  id="branch-manager-password"
                  name="managerPassword"
                  type="text"
                  value={formValues.managerPassword}
                  onChange={handleInputChange}
                  placeholder={editingBranchId ? "Leave blank to keep current password" : ""}
                />
                <span className="branches-form-hint">
                  Password is required for new accounts. Leave empty when editing to keep the existing password.
                </span>
              </div>
              <label className="branches-form-checkbox">
                <input
                  type="checkbox"
                  name="isPrimary"
                  checked={formValues.isPrimary}
                  onChange={handleInputChange}
                />
                Primary branch
              </label>
              <div className="branches-form-actions">
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
                <button type="button" onClick={handleCancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="branches-table">
            <div className="branches-row branches-row-head">
              <span>Name</span>
              <span>Address</span>
              <span>Phone</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {!loading && branches.length === 0 ? (
              <div className="branches-empty">No branches yet</div>
            ) : (
              branches.map((branch) => (
                <div
                  key={branch._id}
                  className={`branches-row ${
                    branch._id === selectedBranchId ? "branches-row-selected" : ""
                  }`}
                  onClick={() => setSelectedBranchId(branch._id)}
                >
                  <span className="branches-row-name">
                    {branch.name}
                    {branch.isPrimary ? <span className="branches-badge">Primary</span> : null}
                  </span>
                  <span className="branches-row-address">
                    {formatAddress(branch) || "-"}
                  </span>
                  <span>{branch.phone || "-"}</span>
                  <span>{branch.isActive === false ? "Inactive" : "Active"}</span>
                  <span className="branches-row-actions">
                    <button
                      type="button"
                      onClick={(event) => handleEditClick(event, branch)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(event) => handleDeleteClick(event, branch)}
                      disabled={deletingId === branch._id}
                    >
                      {deletingId === branch._id ? "Removing..." : "Delete"}
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="branches-panel">
          <div className="branches-panel-header">
            <h3>
              {selectedBranch ? `Menu - ${selectedBranch.name}` : "Menu Preview"}
            </h3>
            {menuLoading ? <span className="branches-status">Loading...</span> : null}
          </div>
          {!selectedBranch ? (
            <p className="branches-empty">Select a branch to view its menu</p>
          ) : menuFoods.length === 0 && !menuLoading ? (
            <p className="branches-empty">No menu items for this branch</p>
          ) : (
            <div className="branches-menu-table">
              <div className="branches-menu-row branches-menu-head">
                <span>Category</span>
                <span>Food</span>
                <span>Variants</span>
              </div>
              {menuFoods.map((food) => (
                <div key={food._id} className="branches-menu-row">
                  <span>{food.categoryName || "-"}</span>
                  <span className="branches-menu-name">{food.name}</span>
                  <span className="branches-menu-variants">
                    {(food.variants || []).length === 0
                      ? "No variants"
                      : food.variants
                          .map((variant) => {
                            const price = Number(variant.price);
                            const formattedPrice = Number.isFinite(price)
                              ? `$${price.toFixed(2)}`
                              : "";
                            return [variant.size, formattedPrice]
                              .filter(Boolean)
                              .join(" - ");
                          })
                          .join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Branches;
