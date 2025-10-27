import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Branches from "../Branches/Branches";
import { StoreContext } from "../../context/StoreContext";
import "./Restaurant.css";

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
    <div className="restaurant-page">
      <div className="restaurant-header">
        <div>
          <h2>Restaurant Settings</h2>
          <p>Manage the brand profile and branch network.</p>
        </div>
        {formValues.logoUrl ? (
          <div className="restaurant-logo">
            <img src={formValues.logoUrl} alt={formValues.name || "Restaurant logo"} />
          </div>
        ) : null}
      </div>

      <div className="restaurant-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`restaurant-tab${
              activeTab === tab.id ? " is-active" : ""
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="restaurant-content">
        {activeTab === "overview" ? (
          <div className="restaurant-panel">
            {loading ? (
              <div className="restaurant-status">Loading settings...</div>
            ) : (
              <form className="restaurant-form" onSubmit={handleSubmit}>
                <div className="restaurant-form-grid">
                  <div className="restaurant-form-row">
                    <label htmlFor="restaurant-name">Restaurant name *</label>
                    <input
                      id="restaurant-name"
                      name="name"
                      type="text"
                      value={formValues.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="restaurant-form-row">
                    <label htmlFor="restaurant-email">Email</label>
                    <input
                      id="restaurant-email"
                      name="email"
                      type="email"
                      value={formValues.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="restaurant-form-row">
                    <label htmlFor="restaurant-phone">Phone</label>
                    <input
                      id="restaurant-phone"
                      name="phone"
                      type="text"
                      value={formValues.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="restaurant-form-row">
                    <label htmlFor="restaurant-logo">Logo URL</label>
                    <input
                      id="restaurant-logo"
                      name="logoUrl"
                      type="url"
                      value={formValues.logoUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="restaurant-form-row">
                    <label htmlFor="restaurant-cuisine">Cuisine</label>
                    <input
                      id="restaurant-cuisine"
                      name="cuisine"
                      type="text"
                      value={formValues.cuisine}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="restaurant-form-row">
                    <label className="restaurant-checkbox">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={Boolean(formValues.isActive)}
                        onChange={handleInputChange}
                      />
                      Active
                    </label>
                  </div>
                </div>

                <div className="restaurant-form-row">
                  <label htmlFor="restaurant-description">Description</label>
                  <textarea
                    id="restaurant-description"
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="restaurant-form-row">
                  <label htmlFor="restaurant-policy">Policies</label>
                  <textarea
                    id="restaurant-policy"
                    name="policy"
                    value={formValues.policy}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Refund policy, delivery commitments, etc."
                  />
                </div>

                <div className="restaurant-meta">
                  <span>
                    Created at: <strong>{formatTimestamp(restaurant?.createdAt)}</strong>
                  </span>
                  <span>
                    Updated at: <strong>{formatTimestamp(restaurant?.updatedAt)}</strong>
                  </span>
                </div>

                <div className="restaurant-actions">
                  <button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                  <button
                    type="button"
                    className="restaurant-secondary"
                    onClick={handleReset}
                    disabled={saving}
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="restaurant-panel">
            <Branches url={url} />
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantSettings;
