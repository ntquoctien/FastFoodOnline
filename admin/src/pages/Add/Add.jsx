import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./Add.css";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const DEFAULT_VARIANT = { size: "", price: "", isDefault: true };

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "$0.00";
  return `$${parsed.toFixed(2)}`;
};

const Add = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [image, setImage] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variants, setVariants] = useState([DEFAULT_VARIANT]);
  const [menuPreview, setMenuPreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewBranch, setPreviewBranch] = useState("all");
  const [branchScope, setBranchScope] = useState({
    mode: "all",
    selected: [],
  });
  const [inventoryModal, setInventoryModal] = useState(null);
  const [inventoryValues, setInventoryValues] = useState({});
  const [inventorySaving, setInventorySaving] = useState(false);

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      categoryId: categories[0]?._id || "",
    });
    setVariants([DEFAULT_VARIANT]);
    setImage(null);
  }, [categories]);

  const fetchMeta = useCallback(async () => {
    if (!token) return;
    setLoadingPreview(true);
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`, {
        headers: { token },
      });
      if (!response.data?.success) {
        toast.error(response.data?.message || "Failed to load menu data");
        return;
      }
      const { categories = [], branches = [], foods = [] } = response.data.data || {};
      setCategories(categories);
      setBranches(branches);
      setMenuPreview(Array.isArray(foods) ? foods : []);
      setBranchScope((prev) => {
        const nextSelected =
          prev.mode === "custom"
            ? prev.selected.filter((id) =>
                branches.some((branch) => branch._id === id)
              )
            : branches.map((branch) => branch._id);

        const sameLength = nextSelected.length === prev.selected.length;
        const sameContent =
          sameLength &&
          nextSelected.every((id, index) => id === prev.selected[index]);

        if (sameContent) {
          return prev;
        }

        return {
          ...prev,
          selected: nextSelected,
        };
      });
      const firstCategory = categories[0]?._id || "";
      setForm({
        name: "",
        description: "",
        categoryId: firstCategory,
      });
      setVariants([DEFAULT_VARIANT]);
      setImage(null);
    } catch (error) {
      console.error("Menu metadata fetch failed", error);
      toast.error("Unable to load menu data");
    } finally {
      setLoadingPreview(false);
    }
  }, [token, url]);

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login first");
      navigate("/");
      return;
    }
    fetchMeta();
  }, [token, role, fetchMeta, navigate]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateVariant = (index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index
          ? {
              ...variant,
              [field]:
                field === "price" ? value.replace(/[^0-9.]/g, "") : value,
            }
          : variant
      )
    );
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "",
        price: "",
        isDefault: false,
      },
    ]);
  };

  const removeVariantRow = (index) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((variant) => variant.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      return next;
    });
  };

  const setDefaultVariant = (index) => {
    setVariants((prev) =>
      prev.map((variant, i) => ({
        ...variant,
        isDefault: i === index,
      }))
    );
  };

  const handleScopeModeChange = (mode) => {
    setBranchScope({
      mode,
      selected:
        mode === "custom"
          ? []
          : branches.map((branch) => branch._id),
    });
  };

  const toggleBranchSelection = (branchId) => {
    setBranchScope((prev) => {
      const hasBranch = prev.selected.includes(branchId);
      const nextSelected = hasBranch
        ? prev.selected.filter((id) => id !== branchId)
        : [...prev.selected, branchId];
      return {
        ...prev,
        selected: nextSelected,
      };
    });
  };

  const activeBranchIds = useMemo(() => {
    if (branchScope.mode === "custom") {
      return branchScope.selected;
    }
    return branches.map((branch) => branch._id);
  }, [branchScope, branches]);

  const previewItems = useMemo(() => {
    if (previewBranch === "all") return menuPreview;
    return menuPreview.filter((food) =>
      (food.variants || []).some(
        (variant) => variant.branchId === previewBranch
      )
    );
  }, [menuPreview, previewBranch]);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedVariants = variants
      .map((variant) => ({
        ...variant,
        size: variant.size.trim(),
      }))
      .filter((variant) => variant.size && variant.price);

    if (!trimmedVariants.length) {
      toast.error("Please add at least one variant with size and price");
      return;
    }

    if (!activeBranchIds.length) {
      toast.error("Select at least one branch to publish this item");
      return;
    }

    const expandedVariants = [];
    trimmedVariants.forEach((variant) => {
      activeBranchIds.forEach((branchId, branchIndex) => {
        expandedVariants.push({
          size: variant.size,
          price: Number(variant.price),
          branchId,
          isDefault: variant.isDefault && branchIndex === 0,
        });
      });
    });

    if (!expandedVariants.some((variant) => variant.isDefault)) {
      expandedVariants[0].isDefault = true;
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("categoryId", form.categoryId);
    if (image) {
      formData.append("image", image);
    }
    formData.append("variants", JSON.stringify(expandedVariants));

    setSubmitting(true);
    try {
      const response = await axios.post(`${url}/api/v2/menu/foods`, formData, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Food item created");
        setModalOpen(false);
        await fetchMeta();
        const created = response.data.data;
        if (created?.variants?.length) {
          const initialValues = {};
          created.variants.forEach((variant) => {
            initialValues[variant._id] = "";
          });
          setInventoryModal({
            food: created,
            variants: created.variants,
          });
          setInventoryValues(initialValues);
        }
        resetForm();
      } else {
        toast.error(response.data?.message || "Could not create food");
      }
    } catch (error) {
      console.error("Create food failed", error);
      toast.error("Unable to create food item");
    } finally {
      setSubmitting(false);
    }
  };

  const branchNameMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => {
      map.set(branch._id, branch.name);
    });
    return map;
  }, [branches]);

  const renderVariantSummary = (variants = []) => {
    if (!variants.length) return "No variants";
    const groups = variants.reduce((acc, variant) => {
      const branchLabel =
        branchNameMap.get(variant.branchId) || variant.branchName || "Branch";
      if (!acc[branchLabel]) acc[branchLabel] = [];
      acc[branchLabel].push(
        `${variant.size} · ${formatCurrency(variant.price)}`
      );
      return acc;
    }, {});
    return Object.entries(groups)
      .map(([branchLabel, items]) => `${branchLabel}: ${items.join(", ")}`)
      .join(" | ");
  };

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div>
          <h2>Menu Builder</h2>
          <p>Launch new dishes and assign them to specific branches.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)}>
          + New Item
        </button>
      </header>

      <section className="catalog-feature-callout">
        <span className="catalog-badge">New</span>
        <div>
          <h3>Multi-branch publishing</h3>
          <p>
            Create a dish once and deploy it across selected branches or all
            locations in a single click.
          </p>
        </div>
      </section>

      <section className="catalog-preview">
        <div className="catalog-preview-header">
          <h3>Menu Overview</h3>
          <select
            value={previewBranch}
            onChange={(event) => setPreviewBranch(event.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        {loadingPreview ? (
          <div className="catalog-preview-empty">Loading menu...</div>
        ) : previewItems.length === 0 ? (
          <div className="catalog-preview-empty">
            No menu items for this view yet. Add your first dish!
          </div>
        ) : (
          <div className="catalog-preview-grid">
            {previewItems.map((food) => (
              <article key={food._id} className="catalog-preview-card">
                <div className="catalog-preview-card-header">
                  <h4>{food.name}</h4>
                  <span className="catalog-chip">{food.categoryName || "—"}</span>
                </div>
                <p className="catalog-preview-description">
                  {food.description || "No description available."}
                </p>
                <p className="catalog-preview-variants">
                  {renderVariantSummary(food.variants)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen ? (
        <div className="add-modal-overlay">
          <div className="add-modal">
            <header className="add-modal-header">
              <h3>Create Food Item</h3>
              <button
                type="button"
                className="add-modal-close"
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
              >
                &times;
              </button>
            </header>
            <form className="add-modal-form" onSubmit={onSubmitHandler}>
              <div className="add-modal-grid">
                <div className="add-modal-section">
                  <label htmlFor="upload-image" className="add-upload-label">
                    <span>Feature image</span>
                    <img
                      src={image ? URL.createObjectURL(image) : assets.upload_area}
                      alt="Upload"
                    />
                  </label>
                  <input
                    id="upload-image"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(event) => setImage(event.target.files?.[0] || null)}
                  />
                  <p className="add-upload-hint">
                    Recommended size: 1200x800px, JPG or PNG up to 3MB.
                  </p>
                </div>

                <div className="add-modal-section add-modal-fields">
                  <label>
                    <span>Product name</span>
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateForm}
                      placeholder="Eg. Spicy garlic ramen"
                      required
                    />
                  </label>
                  <label>
                    <span>Description</span>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={updateForm}
                      rows={4}
                      placeholder="Describe the dish and highlight ingredients."
                      required
                    />
                  </label>
                  <label className="add-category-label">
                    <span>Category</span>
                    <select
                      name="categoryId"
                      value={form.categoryId}
                      onChange={updateForm}
                      required
                    >
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="add-branch-scope">
                <p>Branch availability</p>
                <div className="add-branch-options">
                  <label>
                    <input
                      type="radio"
                      name="branch-scope"
                      value="all"
                      checked={branchScope.mode === "all"}
                      onChange={() => handleScopeModeChange("all")}
                    />
                    Apply to all branches
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="branch-scope"
                      value="custom"
                      checked={branchScope.mode === "custom"}
                      onChange={() => handleScopeModeChange("custom")}
                    />
                    Choose branches
                  </label>
                </div>
                {branchScope.mode === "custom" ? (
                  <div className="add-branch-checkboxes">
                    {branches.map((branch) => {
                      const checked = branchScope.selected.includes(branch._id);  const handleInventoryChange = (variantId, value) => {
    setInventoryValues((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const handleInventorySave = async () => {
    if (!inventoryModal) {
      return;
    }
    const entries = Object.entries(inventoryValues || {}).filter(
      ([, value]) => value !== "" && !Number.isNaN(Number(value))
    );
    if (entries.length === 0) {
      setInventoryModal(null);
      setInventoryValues({});
      return;
    }
    setInventorySaving(true);
    try {
      await Promise.all(
        entries.map(([variantId, value]) => {
          const variant = inventoryModal.variants.find(
            (item) => item._id === variantId
          );
          if (!variant) return null;
          return axios.post(`${url}/api/v2/inventory`,
            {
              branchId: variant.branchId,
              foodVariantId: variant._id,
              quantity: Number(value),
            },
            { headers: { token } }
          );
        })
      );
      toast.success("Inventory updated");
      setInventoryModal(null);
      setInventoryValues({});
      await fetchMeta();
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to set inventory");
    } finally {
      setInventorySaving(false);
    }
  };
  return (
                        <label key={branch._id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleBranchSelection(branch._id)}
                          />
                          {branch.name}
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="variant-section">
                <div className="variant-header">
                  <div>
                    <h4>Variants &amp; pricing</h4>
                    <p>Add sizes or portion options along with pricing.</p>
                  </div>
                  <button type="button" onClick={addVariantRow}>
                    + Add variant
                  </button>
                </div>
                {variants.map((variant, index) => (
                  <div key={`variant-${index}`} className="variant-row">
                    <input
                      type="text"
                      placeholder="Size / label"
                      value={variant.size}
                      onChange={(event) =>
                        updateVariant(index, "size", event.target.value)
                      }
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={variant.price}
                      onChange={(event) =>
                        updateVariant(index, "price", event.target.value)
                      }
                      required
                    />
                    <label className="variant-default">
                      <input
                        type="radio"
                        name="defaultVariant"
                        checked={variant.isDefault}
                        onChange={() => setDefaultVariant(index)}
                      />
                      Default
                    </label>
                    <button
                      type="button"
                      className="variant-remove"
                      onClick={() => removeVariantRow(index)}
                      disabled={variants.length === 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <footer className="add-modal-footer">
                <button
                  type="button"
                  className="add-secondary"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="add-primary" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish item"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}    </div>
  );
};

export default Add;









