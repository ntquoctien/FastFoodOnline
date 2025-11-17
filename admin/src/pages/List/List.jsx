import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/120x80.png?text=Menu+Item";
const UNASSIGNED_BRANCH_ID = "unassigned";

const STATUS_BADGES = {
  active: {
    label: "Active",
    className: "badge bg-light-success text-success",
  },
  "sold-out": {
    label: "Sold out",
    className: "badge bg-light-danger text-danger",
  },
  paused: {
    label: "Paused",
    className: "badge bg-light-secondary text-secondary",
  },
  default: {
    label: "Status",
    className: "badge bg-light text-body-secondary",
  },
};

const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : "";
};

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryValues, setInventoryValues] = useState({});
  const [inventoryMap, setInventoryMap] = useState({});
  const [savingVariant, setSavingVariant] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [priceSaving, setPriceSaving] = useState(null);
  const [variantUpdating, setVariantUpdating] = useState(null);
  const [foodUpdating, setFoodUpdating] = useState(null);
  const [expandedBranches, setExpandedBranches] = useState({});
  const [imageUploading, setImageUploading] = useState(null);

  const fileInputRefs = useRef({});

  const branchLookup = useMemo(
    () => new Map(branches.map((branch) => [String(branch._id), { ...branch, _id: String(branch._id) }])),
    [branches]
  );

  const refreshInventory = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${url}/api/v2/inventory`, {
        headers: { token },
      });
      if (response.data?.success) {
        const nextInventoryMap = {};
        const nextValues = {};
        (response.data.data || []).forEach((entry) => {
          const variantId =
            entry.foodVariantId?._id || entry.foodVariantId || entry._id;
          if (!variantId) return;
          const quantity = entry.quantity ?? 0;
          nextInventoryMap[variantId] = {
            quantity,
            branchId: String(entry.branchId?._id || entry.branchId || ""),
            record: entry,
          };
          nextValues[variantId] = String(quantity);
        });
        setInventoryMap(nextInventoryMap);
        setInventoryValues(nextValues);
      }
    } catch (error) {
      console.warn("Failed to load inventory snapshot", error);
    }
  }, [token, url]);

  const fetchList = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`, {
        headers: { token },
        params: { includeInactive: true },
      });
      if (response.data.success) {
        const payload = response.data.data || {};
        setFoods(payload.foods || []);
        setBranches(payload.branches || []);
        await refreshInventory();
      } else {
        toast.error(response.data.message || "Failed to load menu items");
      }
    } catch (error) {
      console.error("Menu list fetch failed", error);
      toast.error("Unable to reach server");
    } finally {
      setLoading(false);
    }
  }, [refreshInventory, token, url]);

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login as admin");
      navigate("/");
      return;
    }
    fetchList();
  }, [token, role, navigate, fetchList]);

  useEffect(() => {
    setPriceDrafts(() => {
      const next = {};
      foods.forEach((food) => {
        (food.variants || []).forEach((variant) => {
          next[variant._id] = formatPrice(variant.price);
        });
      });
      return next;
    });
  }, [foods]);

  const branchSections = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const groupMap = new Map();

    const considerVariant = (branchId, food, variantList) => {
      if (branchFilter !== "all" && branchFilter !== branchId) {
        return;
      }

      if (query) {
        const matchesFood =
          food.name?.toLowerCase().includes(query) ||
          food.categoryName?.toLowerCase().includes(query);
        const matchesVariant = variantList.some(
          (variant) =>
            variant.size?.toLowerCase().includes(query) ||
            variant.branchName?.toLowerCase().includes(query)
        );
        if (!matchesFood && !matchesVariant) {
          return;
        }
      }

      const key = branchId || UNASSIGNED_BRANCH_ID;
      const baseBranch = branchLookup.get(branchId);
      const branch = baseBranch
        ? { ...baseBranch, _id: String(baseBranch._id) }
        : {
            _id: key,
            name: variantList[0]?.branchName || "Unassigned branch",
          };

      if (!groupMap.has(key)) {
        groupMap.set(key, { branch, foods: [] });
      }
      groupMap.get(key).foods.push({
        ...food,
        variants: variantList,
      });
    };

    foods.forEach((food) => {
      const variantsByBranch = new Map();
      (food.variants || []).forEach((variant) => {
        const branchId = String(
          variant.branchId?._id || variant.branchId || UNASSIGNED_BRANCH_ID
        );
        if (!variantsByBranch.has(branchId)) {
          variantsByBranch.set(branchId, []);
        }
        variantsByBranch.get(branchId).push(variant);
      });

      variantsByBranch.forEach((variantList, branchId) => {
        considerVariant(branchId, food, variantList);
      });
    });

    const sections = Array.from(groupMap.values());
    sections.sort((a, b) =>
      (a.branch.name || "").localeCompare(b.branch.name || "")
    );
    sections.forEach((section) => {
      section.foods.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    });
    return sections;
  }, [foods, branchFilter, searchTerm, branchLookup]);

  useEffect(() => {
    setExpandedBranches((prev) => {
      const next = { ...prev };
      branchSections.forEach((section, index) => {
        const id = section.branch._id;
        if (next[id] === undefined) {
          next[id] = index === 0;
        }
      });
      return next;
    });
  }, [branchSections]);

  const resolveQuantityValue = (variantId, fallback) =>
    inventoryValues[variantId] ?? String(fallback ?? 0);

  const handleInventoryChange = (variantId, value) => {
    setInventoryValues((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const handleInventorySubmit = async (variant, optionalValue) => {
    const variantId = variant._id;
    const branchId = String(
      variant.branchId?._id || variant.branchId || ""
    );
    const draftValue =
      optionalValue !== undefined
        ? optionalValue
        : inventoryValues[variantId] ?? "";
    const parsed = Number(draftValue);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Quantity must be a non-negative number");
      return;
    }
    setSavingVariant(variantId);
    try {
      const response = await axios.post(
        `${url}/api/v2/inventory`,
        {
          branchId,
          foodVariantId: variantId,
          quantity: parsed,
        },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Inventory updated");
        await refreshInventory();
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to update inventory");
      }
    } catch (error) {
      console.error("Inventory update failed", error);
      const message =
        error.response?.data?.message || "Unable to update inventory";
      toast.error(message);
    } finally {
      setSavingVariant(null);
    }
  };

  const handleInventoryKeyDown = (event, variant) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleInventorySubmit(variant);
    }
  };

  const handleVariantPriceChange = (variantId, value) => {
    setPriceDrafts((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const handleVariantPriceSave = async (variant) => {
    const variantId = variant._id;
    const draft = priceDrafts[variantId];
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Price must be a non-negative number");
      return;
    }
    setPriceSaving(variantId);
    try {
      const response = await axios.put(
        `${url}/api/v2/menu/variants/${variantId}`,
        { price: parsed },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Price updated");
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to update price");
      }
    } catch (error) {
      console.error("Variant price update failed", error);
      const message =
        error.response?.data?.message || "Unable to update variant";
      toast.error(message);
    } finally {
      setPriceSaving(null);
    }
  };

  const handleVariantStatusToggle = async (variant, nextActive) => {
    const variantId = variant._id;
    setVariantUpdating(variantId);
    try {
      const response = await axios.put(
        `${url}/api/v2/menu/variants/${variantId}/status`,
        { isActive: nextActive },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success(
          nextActive ? "Variant resumed for sale" : "Variant paused"
        );
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to update variant");
      }
    } catch (error) {
      console.error("Variant status update failed", error);
      const message =
        error.response?.data?.message || "Unable to update variant status";
      toast.error(message);
    } finally {
      setVariantUpdating(null);
    }
  };

  const handleVariantDelete = async (variant) => {
    const variantId = variant._id;
    const confirmed = window.confirm(
      "Remove this variant? This action cannot be undone."
    );
    if (!confirmed) return;
    setVariantUpdating(variantId);
    try {
      const response = await axios.delete(
        `${url}/api/v2/menu/variants/${variantId}`,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Variant removed");
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to remove variant");
      }
    } catch (error) {
      console.error("Variant delete failed", error);
      const message =
        error.response?.data?.message || "Unable to delete variant";
      toast.error(message);
    } finally {
      setVariantUpdating(null);
    }
  };

  const handleFoodStatusToggle = async (food, nextActive) => {
    const foodId = food._id;
    setFoodUpdating(foodId);
    try {
      const response = await axios.put(
        `${url}/api/v2/menu/foods/${foodId}/status`,
        { isActive: nextActive },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success(
          nextActive ? "Dish set back on menu" : "Dish paused successfully"
        );
        await fetchList();
      } else {
        toast.error(response.data.message || "Failed to update dish status");
      }
    } catch (error) {
      console.error("Food status update failed", error);
      const message =
        error.response?.data?.message || "Unable to update dish status";
      toast.error(message);
    } finally {
      setFoodUpdating(null);
    }
  };

  const removeFood = async (foodId) => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this menu item?"
    );
    if (!confirmed) return;
    try {
      const response = await axios.delete(`${url}/api/v2/menu/foods/${foodId}`, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Food item archived");
        fetchList();
      } else {
        toast.error(response.data.message || "Could not archive food");
      }
    } catch (error) {
      console.error("Remove food failed", error);
      toast.error("Unable to reach server");
    }
  };

  const handleNavigateInventory = (branchId) => {
    if (!branchId || branchId === UNASSIGNED_BRANCH_ID) {
      navigate("/inventory");
      return;
    }
    navigate(`/inventory?branch=${branchId}`);
  };

  const toggleBranch = (branchId) => {
    setExpandedBranches((prev) => ({
      ...prev,
      [branchId]: !prev[branchId],
    }));
  };

  const resolveFoodImageSrc = useCallback(
    (imageUrl) => {
      if (!imageUrl) return FALLBACK_IMAGE;
      if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
      const normalised = String(imageUrl).replace(/^\/+/, "");
      return `${url}/images/${normalised}`;
    },
    [url]
  );

  const handleFoodImageButtonClick = (foodId) => {
    const input = fileInputRefs.current[foodId];
    if (input && !input.disabled) {
      input.click();
    }
  };

  const handleFoodImageSelect = async (food, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setImageUploading(food._id);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await axios.put(
        `${url}/api/v2/menu/foods/${food._id}`,
        formData,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Image updated");
        await fetchList();
      } else {
        toast.error(response.data?.message || "Failed to update image");
      }
    } catch (error) {
      console.error("Food image update failed", error);
      toast.error(
        error.response?.data?.message || "Unable to update food image"
      );
    } finally {
      setImageUploading(null);
    }
  };

  const getVariantQuantity = (variant) => {
    const variantId = variant._id;
    return inventoryMap[variantId]?.quantity ?? variant.stockQuantity ?? 0;
  };

  const resolveVariantStatus = (variant) => {
    const quantity = getVariantQuantity(variant);
    if (!variant.isActive) {
      return variant.isManuallyDisabled ? "paused" : "sold-out";
    }
    if (quantity <= 0) {
      return "sold-out";
    }
    return "active";
  };

  const resolveFoodStatus = (food, variants) => {
    if (!food.isActive) {
      return food.isManuallyDisabled ? "paused" : "sold-out";
    }
    const hasActiveVariant = variants.some(
      (variant) => resolveVariantStatus(variant) === "active"
    );
    return hasActiveVariant ? "active" : "sold-out";
  };

  const getStatusBadge = (status) => {
    const config = STATUS_BADGES[status] || STATUS_BADGES.default;
    return <span className={config.className}>{config.label}</span>;
  };

  const toggleIconClass = (isOpen) =>
    isOpen ? "bi-chevron-down" : "bi-chevron-right";

  const renderBranchSections = () => {
    if (loading) {
      return (
        <div className="card border rounded-4 mb-4">
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading menu items...</p>
          </div>
        </div>
      );
    }

    if (branchSections.length === 0) {
      return (
        <div className="card border rounded-4">
          <div className="card-body text-center py-5 text-muted">
            No menu items match the current filters. Try adjusting the search or branch selection.
          </div>
        </div>
      );
    }

    return branchSections.map((section) => {
      const branchId = section.branch._id;
      const branchOpen = expandedBranches[branchId];
      return (
        <div key={branchId} className="card border rounded-4 mb-4">
          <div className="card-header border-0 py-3 d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <button
                type="button"
                className="btn btn-light btn-sm rounded-circle"
                onClick={() => toggleBranch(branchId)}
                aria-label={`Toggle ${section.branch.name}`}
              >
                <i className={`bi ${toggleIconClass(branchOpen)}`} />
              </button>
              <div>
                <h5 className="mb-0">{section.branch.name}</h5>
                <small className="text-muted">
                  {section.foods.length}{" "}
                  {section.foods.length === 1 ? "dish" : "dishes"}
                </small>
              </div>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleNavigateInventory(branchId)}
              >
                Open inventory
              </button>
            </div>
          </div>
          {branchOpen ? (
            <div className="card-body pt-0">
              {section.foods.map((food) => {
                const foodStatus = resolveFoodStatus(food, food.variants);
                const foodPaused = foodStatus === "paused";
                const actionLabel = foodPaused ? "Resume dish" : "Pause dish";

                return (
                  <div key={food._id} className="border rounded-4 p-3 mb-3">
                    <div className="d-flex flex-column flex-lg-row gap-3">
                      <div className="d-flex gap-3 flex-grow-1">
                        <img
                          src={resolveFoodImageSrc(food.imageUrl)}
                          alt={food.name}
                          className="rounded-4"
                          style={{
                            width: 110,
                            height: 90,
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div>
                          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                            <h5 className="mb-0">{food.name}</h5>
                            {getStatusBadge(foodStatus)}
                          </div>
                          <p className="text-muted mb-2">
                            {food.description || "No description"}
                          </p>
                          <span className="badge bg-primary-subtle text-primary">
                            {food.categoryName || "Uncategorised"}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center">
                        <input
                          ref={(element) => {
                            if (element) {
                              fileInputRefs.current[food._id] = element;
                            } else {
                              delete fileInputRefs.current[food._id];
                            }
                          }}
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={(event) => handleFoodImageSelect(food, event)}
                          disabled={imageUploading === food._id}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleFoodImageButtonClick(food._id)}
                          disabled={imageUploading === food._id}
                        >
                          {imageUploading === food._id ? "Uploading..." : "Change image"}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleFoodStatusToggle(food, foodPaused)}
                          disabled={foodUpdating === food._id}
                        >
                          {foodUpdating === food._id ? "Updating..." : actionLabel}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeFood(food._id)}
                        >
                          Remove dish
                        </button>
                      </div>
                    </div>
                    <div className="table-responsive mt-4">
                      <table className="table align-middle mb-0">
                        <thead className="text-muted small text-uppercase">
                          <tr>
                            <th className="fw-semibold">Size</th>
                            <th>Price</th>
                            <th>Status</th>
                            <th>Inventory</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {food.variants.map((variant) => {
                            const variantId = variant._id;
                            const variantStatus = resolveVariantStatus(variant);
                            const quantity = getVariantQuantity(variant);
                            const draftValue = priceDrafts[variantId] ?? "";
                            const inventoryValue = resolveQuantityValue(
                              variantId,
                              quantity
                            );
                            let variantActionLabel = "Pause";
                            let nextVariantState = false;
                            let actionDisabled =
                              variantUpdating === variantId ||
                              variantStatus === "sold-out";

                            if (variantStatus === "paused") {
                              variantActionLabel = "Resume";
                              nextVariantState = true;
                            } else if (variantStatus === "sold-out") {
                              variantActionLabel = "Sold out";
                            }

                            return (
                              <tr key={variantId}>
                                <td className="fw-semibold">
                                  {variant.size || "Variant"}
                                </td>
                                <td>
                                  <div className="d-flex flex-column flex-lg-row gap-2">
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text">đ</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={draftValue}
                                        className="form-control"
                                        onChange={(event) =>
                                          handleVariantPriceChange(
                                            variantId,
                                            event.target.value
                                          )
                                        }
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleVariantPriceSave(variant)}
                                      disabled={priceSaving === variantId}
                                    >
                                      {priceSaving === variantId ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </td>
                                <td>{getStatusBadge(variantStatus)}</td>
                                <td>
                                  <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={inventoryValue}
                                      className="form-control form-control-sm"
                                      placeholder="Set quantity"
                                      onChange={(event) =>
                                        handleInventoryChange(variantId, event.target.value)
                                      }
                                      onKeyDown={(event) =>
                                        handleInventoryKeyDown(event, variant)
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="btn btn-outline-primary btn-sm"
                                      onClick={() => handleInventorySubmit(variant)}
                                      disabled={savingVariant === variantId}
                                    >
                                      {savingVariant === variantId ? "Updating..." : "Update"}
                                    </button>
                                    <small className="text-muted">
                                      {quantity > 0
                                        ? `In stock: ${quantity}`
                                        : "Out of stock"}
                                    </small>
                                  </div>
                                </td>
                                <td className="text-end">
                                  <div className="d-flex flex-column flex-lg-row gap-2 justify-content-end">
                                    <button
                                      type="button"
                                      className="btn btn-outline-secondary btn-sm"
                                      onClick={() => {
                                        if (!actionDisabled) {
                                          handleVariantStatusToggle(
                                            variant,
                                            nextVariantState
                                          );
                                        }
                                      }}
                                      disabled={actionDisabled}
                                    >
                                      {variantUpdating === variantId
                                        ? "Updating..."
                                        : variantActionLabel}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm"
                                      onClick={() => handleVariantDelete(variant)}
                                      disabled={variantUpdating === variantId}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      );
    });
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Menu library</h3>
          <p className="text-muted mb-0">
            Manage dishes per branch, prices, stock, and availability.
          </p>
        </div>
        <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-lg-auto">
          <input
            type="search"
            className="form-control"
            placeholder="Search dishes, categories, or sizes"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="form-select"
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={String(branch._id)} value={String(branch._id)}>
                {branch.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-light"
            onClick={() => fetchList()}
          >
            Refresh
          </button>
        </div>
      </div>

      {renderBranchSections()}
    </div>
  );
};

export default List;














