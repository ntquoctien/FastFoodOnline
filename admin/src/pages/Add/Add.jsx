import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

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
  const [form, setForm] = useState({ name: "", description: "", categoryId: "" });
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [variants, setVariants] = useState([DEFAULT_VARIANT]);
  const [menuPreview, setMenuPreview] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewBranch, setPreviewBranch] = useState("all");
  const [branchScope, setBranchScope] = useState({ mode: "all", selected: [] });
  const [inventoryModal, setInventoryModal] = useState(null);
  const [inventoryValues, setInventoryValues] = useState({});
  const [inventorySaving, setInventorySaving] = useState(false);

  const imagePreviewUrl = useMemo(() => {
    if (!image) return null;
    return URL.createObjectURL(image);
  }, [image]);

  useEffect(
    () => () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl]
  );

  const resetForm = useCallback(() => {
    setForm({
      name: "",
      description: "",
      categoryId: categories[0]?._id || "",
    });
    setVariants([DEFAULT_VARIANT]);
    setImage(null);
    setBranchScope({
      mode: "all",
      selected: branches.map((branch) => branch._id),
    });
  }, [categories, branches]);

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
      const payload = response.data.data || {};
      const nextCategories = payload.categories || [];
      const nextBranches = payload.branches || [];
      const foods = payload.foods || [];

      setCategories(nextCategories);
      setBranches(nextBranches);
      setMenuPreview(Array.isArray(foods) ? foods : []);
      setBranchScope((prev) => {
        const availableIds = nextBranches.map((branch) => branch._id);
        if (prev.mode === "custom") {
          const filtered = prev.selected.filter((id) => availableIds.includes(id));
          return {
            mode: "custom",
            selected: filtered,
          };
        }
        return {
          mode: "all",
          selected: availableIds,
        };
      });
      setForm((current) => ({
        ...current,
        categoryId: nextCategories[0]?._id || "",
      }));
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
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const addVariantRow = () => {
    setVariants((prev) => [...prev, { ...DEFAULT_VARIANT, isDefault: false }]);
  };

  const removeVariantRow = (index) => {
    setVariants((prev) => {
      if (prev.length === 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      if (!next.some((variant) => variant.isDefault)) {
        next[0].isDefault = true;
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
    if (mode === "all") {
      setBranchScope({
        mode: "all",
        selected: branches.map((branch) => branch._id),
      });
      return;
    }
    setBranchScope((prev) => ({
      mode: "custom",
      selected: prev.selected.length ? prev.selected : branches.map((branch) => branch._id),
    }));
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
      (food.variants || []).some((variant) => variant.branchId === previewBranch)
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

  const handleInventoryChange = (variantId, value) => {
    setInventoryValues((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const closeInventoryModal = () => {
    setInventoryModal(null);
    setInventoryValues({});
    setInventorySaving(false);
  };

  const handleInventorySave = async () => {
    if (!inventoryModal) {
      return;
    }
    const entries = Object.entries(inventoryValues || {}).filter(
      ([, value]) => value !== "" && !Number.isNaN(Number(value))
    );
    if (!entries.length) {
      closeInventoryModal();
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
          return axios.post(
            `${url}/api/v2/inventory`,
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
      closeInventoryModal();
      await fetchMeta();
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to set inventory");
      setInventorySaving(false);
    }
  };

  const renderCreationModal = () => {
    if (!modalOpen) return null;
    return (
      <>
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-0">Create Food Item</h5>
                  <small className="text-muted">
                    Configure the dish, variants, and branch availability.
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                />
              </div>
              <form onSubmit={onSubmitHandler}>
                <div className="modal-body">
                  <div className="row g-4">
                    <div className="col-12 col-lg-4">
                      <div className="border rounded-4 p-3 h-100">
                        <p className="text-uppercase text-muted small mb-2">
                          Feature image
                        </p>
                        <label
                          htmlFor="upload-image"
                          className="ratio ratio-4x3 border border-2 border-primary rounded-4 d-flex align-items-center justify-content-center bg-light text-center cursor-pointer"
                          style={{ minHeight: 180 }}
                        >
                          <img
                            src={imagePreviewUrl || assets.upload_area}
                            alt="Upload"
                            className="img-fluid object-fit-cover rounded-4"
                          />
                        </label>
                        <input
                          id="upload-image"
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(event) =>
                            setImage(event.target.files?.[0] || null)
                          }
                        />
                        <small className="text-muted d-block mt-2">
                          Recommended 1200×800px, JPG or PNG up to 3MB.
                        </small>
                      </div>
                    </div>
                    <div className="col-12 col-lg-8">
                      <div className="border rounded-4 p-3">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Product name
                          </label>
                          <input
                            className="form-control"
                            name="name"
                            value={form.name}
                            onChange={updateForm}
                            placeholder="Eg. Spicy garlic ramen"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">
                            Description
                          </label>
                          <textarea
                            className="form-control"
                            name="description"
                            value={form.description}
                            onChange={updateForm}
                            rows={4}
                            placeholder="Describe the dish and highlight ingredients."
                            required
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fw-semibold">
                            Category
                          </label>
                          <select
                            className="form-select"
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
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card border rounded-4 my-4">
                    <div className="card-body">
                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                        <div>
                          <h6 className="mb-1">Branch availability</h6>
                          <small className="text-muted">
                            Publish everywhere or target selected locations.
                          </small>
                        </div>
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="branch-scope"
                              id="branch-scope-all"
                              value="all"
                              checked={branchScope.mode === "all"}
                              onChange={() => handleScopeModeChange("all")}
                            />
                            <label
                              htmlFor="branch-scope-all"
                              className="form-check-label"
                            >
                              All branches
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="branch-scope"
                              id="branch-scope-custom"
                              value="custom"
                              checked={branchScope.mode === "custom"}
                              onChange={() => handleScopeModeChange("custom")}
                            />
                            <label
                              htmlFor="branch-scope-custom"
                              className="form-check-label"
                            >
                              Custom selection
                            </label>
                          </div>
                        </div>
                      </div>
                      {branchScope.mode === "custom" ? (
                        <div className="row row-cols-1 row-cols-md-2 g-2 mt-3">
                          {branches.map((branch) => (
                            <div key={branch._id} className="col">
                              <label className="form-check form-switch border rounded-3 px-3 py-2 d-flex align-items-center justify-content-between">
                                <span className="fw-semibold">{branch.name}</span>
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={branchScope.selected.includes(branch._id)}
                                  onChange={() => toggleBranchSelection(branch._id)}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="card border rounded-4">
                    <div className="card-body">
                      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
                        <div>
                          <h6 className="mb-1">Variants &amp; pricing</h6>
                          <small className="text-muted">
                            Add sizes or portion options along with pricing.
                          </small>
                        </div>
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={addVariantRow}
                        >
                          + Add variant
                        </button>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        {variants.map((variant, index) => (
                          <div
                            key={`variant-${index}`}
                            className="row g-3 align-items-end border rounded-4 p-3"
                          >
                            <div className="col-12 col-md-4">
                              <label className="form-label fw-semibold">
                                Size / label
                              </label>
                              <input
                                className="form-control"
                                type="text"
                                placeholder="Large, Combo, …"
                                value={variant.size}
                                onChange={(event) =>
                                  updateVariant(index, "size", event.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="col-12 col-md-3">
                              <label className="form-label fw-semibold">
                                Price
                              </label>
                              <input
                                className="form-control"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="15.00"
                                value={variant.price}
                                onChange={(event) =>
                                  updateVariant(index, "price", event.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="col-12 col-md-3">
                              <div className="form-check mt-4">
                                <input
                                  className="form-check-input"
                                  type="radio"
                                  name="defaultVariant"
                                  id={`variant-default-${index}`}
                                  checked={variant.isDefault}
                                  onChange={() => setDefaultVariant(index)}
                                />
                                <label
                                  className="form-check-label"
                                  htmlFor={`variant-default-${index}`}
                                >
                                  Default option
                                </label>
                              </div>
                            </div>
                            <div className="col-12 col-md-2 text-md-end">
                              <button
                                type="button"
                                className="btn btn-outline-danger mt-md-4 w-100"
                                onClick={() => removeVariantRow(index)}
                                disabled={variants.length === 1}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 justify-content-between flex-wrap">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => {
                      setModalOpen(false);
                      resetForm();
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Publishing..." : "Publish item"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
    );
  };

  const renderInventoryModal = () => {
    if (!inventoryModal) return null;
    return (
      <>
        <div className="modal fade show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-0">Set initial inventory</h5>
                  <small className="text-muted">
                    {inventoryModal.food?.name || "New item"}
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={closeInventoryModal} />
              </div>
              <div className="modal-body">
                {inventoryModal.variants.map((variant) => (
                  <div key={variant._id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{variant.size}</h6>
                        <small className="text-muted">
                          {branchNameMap.get(variant.branchId) || "Branch"} ·{" "}
                          {formatCurrency(variant.price)}
                        </small>
                      </div>
                      <div className="ms-3" style={{ minWidth: 140 }}>
                        <label className="form-label fw-semibold mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          value={inventoryValues[variant._id] ?? ""}
                          onChange={(event) =>
                            handleInventoryChange(variant._id, event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={closeInventoryModal}
                  disabled={inventorySaving}
                >
                  Skip
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleInventorySave}
                  disabled={inventorySaving}
                >
                  {inventorySaving ? "Saving..." : "Save inventory"}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show"></div>
      </>
    );
  };

  return (
    <>
      <div className="page-heading">
        <div className="page-title-headings mb-3">
          <div>
            <h3 className="mb-1">Menu Builder</h3>
            <p className="text-muted mb-0">
              Launch new dishes and assign them to specific branches.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            + New Item
          </button>
        </div>

        <div className="alert alert-primary d-flex align-items-center gap-3 rounded-4">
          <div className="avatar avatar-lg bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center">
            <i className="bi bi-stars"></i>
          </div>
          <div>
            <h6 className="mb-1">Multi-branch publishing</h6>
            <p className="mb-0 text-muted">
              Create a dish once and deploy it across selected branches or all locations in a
              single click.
            </p>
          </div>
        </div>

        <section className="card border rounded-4">
          <div className="card-header border-0 d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
            <div>
              <h5 className="mb-1">Menu overview</h5>
              <small className="text-muted">Filter by branch to review assignments.</small>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <select
                className="form-select"
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
              <button
                type="button"
                className="btn btn-light"
                onClick={fetchMeta}
                disabled={loadingPreview}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="card-body">
            {loadingPreview ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status" />
                <p className="text-muted mb-0">Loading menu…</p>
              </div>
            ) : previewItems.length === 0 ? (
              <div className="text-center py-5 text-muted">
                No menu items for this view yet. Add your first dish!
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
                {previewItems.map((food) => (
                  <div key={food._id} className="col">
                    <article className="border rounded-4 h-100 p-3">
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <h5 className="mb-0">{food.name}</h5>
                        <span className="badge bg-light text-primary">
                          {food.categoryName || "Uncategorized"}
                        </span>
                      </div>
                      <p className="text-muted mb-3">
                        {food.description || "No description available."}
                      </p>
                      <div className="small fw-semibold text-primary">
                        {renderVariantSummary(food.variants)}
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {renderCreationModal()}
      {renderInventoryModal()}
    </>
  );
};

export default Add;
