import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Branches from "../Branches/Branches";
import { StoreContext } from "../../context/StoreContext";

const defaultFormValues = {
  name: "",
  description: "",
  phone: "",
  email: "",
  logoUrl: "",
  cuisine: "",
  policy: "",
  isActive: true,
};

const tabs = [
  { id: "overview", label: "General Info" },
  { id: "branches", label: "Branches" },
];

const formatTimestamp = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "-";
  }
};

const RestaurantSettings = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [formValues, setFormValues] = useState(defaultFormValues);

  const baselineValues = useMemo(() => {
    if (!restaurant) {
      return { ...defaultFormValues };
    }
    return {
      ...defaultFormValues,
      ...restaurant,
      isActive: restaurant.isActive ?? true,
    };
  }, [restaurant]);

  const loadSettings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/restaurant`, {
        headers: { token },
      });
      if (response.data.success) {
        const data = response.data.data || null;
        setRestaurant(data);
        setFormValues(
          data
            ? {
                ...defaultFormValues,
                ...data,
                isActive: data.isActive ?? true,
              }
            : { ...defaultFormValues }
        );
      } else {
        toast.error(response.data.message || "Failed to load restaurant settings");
      }
    } catch (error) {
      console.error("Fetch restaurant settings failed", error);
      toast.error("Unable to load restaurant settings");
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleReset = () => {
    setFormValues(baselineValues);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!token) return;
    setSaving(true);
    try {
      const response = await axios.put(
        `${url}/api/v2/restaurant`,
        { ...formValues },
        { headers: { token } }
      );
      if (response.data.success) {
        const data = response.data.data || null;
        setRestaurant(data);
        setFormValues(
          data
            ? {
                ...defaultFormValues,
                ...data,
                isActive: data.isActive ?? true,
              }
            : { ...defaultFormValues }
        );
        toast.success("Restaurant settings updated");
      } else {
        toast.error(response.data.message || "Failed to update restaurant");
      }
    } catch (error) {
      console.error("Update restaurant settings failed", error);
      const message =
        error.response?.data?.message || "Unable to update restaurant settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Restaurant Settings</h3>
          <p className="text-muted mb-0">Manage the brand profile and branch network.</p>
        </div>
        {formValues.logoUrl ? (
          <div className="rounded-4 border bg-white p-2" style={{ width: 96, height: 96 }}>
            <img
              src={formValues.logoUrl}
              alt={formValues.name || "Restaurant logo"}
              className="img-fluid w-100 h-100 object-fit-contain"
            />
          </div>
        ) : null}
      </div>

      <ul className="nav nav-pills gap-2 mb-4">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.id}>
            <button
              type="button"
              className={`nav-link${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {activeTab === "overview" ? (
        <div className="card border rounded-4">
          {loading ? (
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary mb-3" role="status" />
              <p className="text-muted mb-0">Loading settings...</p>
            </div>
          ) : (
            <form className="card-body d-flex flex-column gap-4" onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label">Restaurant name *</label>
                  <input
                    className="form-control"
                    name="name"
                    type="text"
                    value={formValues.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    name="email"
                    type="email"
                    value={formValues.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    name="phone"
                    type="text"
                    value={formValues.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Logo URL</label>
                  <input
                    className="form-control"
                    name="logoUrl"
                    type="url"
                    value={formValues.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://..."
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Cuisine</label>
                  <input
                    className="form-control"
                    name="cuisine"
                    type="text"
                    value={formValues.cuisine}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-12 col-md-6 d-flex align-items-center">
                  <div className="form-check form-switch mt-4">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isActive"
                      id="restaurant-active"
                      checked={Boolean(formValues.isActive)}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="restaurant-active">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formValues.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div>
                <label className="form-label">Policies</label>
                <textarea
                  className="form-control"
                  name="policy"
                  value={formValues.policy}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Refund policy, delivery commitments, etc."
                />
              </div>

              <div className="d-flex flex-column flex-lg-row gap-3 justify-content-between text-muted small">
                <span>
                  Created at: <strong>{formatTimestamp(restaurant?.createdAt)}</strong>
                </span>
                <span>
                  Updated at: <strong>{formatTimestamp(restaurant?.updatedAt)}</strong>
                </span>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-light" onClick={handleReset} disabled={saving}>
                  Reset
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Branches url={url} />
        </div>
      )}
    </div>
  );
};

export default RestaurantSettings;
