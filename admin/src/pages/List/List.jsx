import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/120x80.png?text=Menu+Item";
const UNASSIGNED_BRANCH_ID = "unassigned";

const formatPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(2) : "";
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

  return (
    <div className="list-page">
      <header className="list-header">
        <div>
          <h2>Menu library</h2>
          <p>Manage dishes per branch, prices, stock, and availability.</p>
        </div>
        <div className="list-header-actions">
          <input
            type="search"
            placeholder="Search dishes, categories, or sizes"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
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
            className="list-refresh-btn"
            onClick={() => fetchList()}
          >
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="list-empty">Loading menu items...</div>
      ) : branchSections.length === 0 ? (
        <div className="list-empty">
          No menu items match the current filters. Try changing the search or branch.
        </div>
      ) : (
        <div className="list-branch-container">
          {branchSections.map((section) => {
            const branchId = section.branch._id;
            const branchOpen = expandedBranches[branchId];
            return (
              <section key={branchId} className="list-branch-section">
                <header className="list-branch-header">
                  <div className="list-branch-meta">
                    <button
                      type="button"
                      className={`list-branch-toggle${
                        branchOpen ? " is-open" : ""
                      }`}
                      onClick={() => toggleBranch(branchId)}
                      aria-label={`Toggle ${section.branch.name}`}
                    >
                      <img src={assets.chevron_right} alt="" aria-hidden="true" />
                    </button>
                    <div>
                      <h3>{section.branch.name}</h3>
                      <span>
                        {section.foods.length}{" "}
                        {section.foods.length === 1 ? "dish" : "dishes"}
                      </span>
                    </div>
                  </div>
                  <div className="list-branch-actions">
                    <button
                      type="button"
                      onClick={() => handleNavigateInventory(branchId)}
                    >
                      Open inventory
                    </button>
                  </div>
                </header>

                {branchOpen ? (
                  <div className="list-branch-body">
                    {section.foods.map((food) => {
                      const foodStatus = resolveFoodStatus(
                        food,
                        food.variants
                      );
                      const foodPaused = foodStatus === "paused";
                      const foodSoldOut = foodStatus === "sold-out";
                      const actionLabel = foodPaused
                        ? "Resume dish"
                        : "Pause dish";
                      return (
                        <article key={food._id} className="list-food-card">
                          <div className="list-food-header">
                            <div className="list-food-info">
                              <img
                                src={resolveFoodImageSrc(food.imageUrl)}
                                alt={food.name}
                                onError={(event) => {
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.src = FALLBACK_IMAGE;
                                }}
                              />
                              <div>
                                <div className="list-food-title">
                                  <h4>{food.name}</h4>
                                  <span className={`list-status ${foodStatus}`}>
                                    {foodStatus === "active" && "Active"}
                                    {foodStatus === "sold-out" && "Sold out"}
                                    {foodStatus === "paused" && "Paused"}
                                  </span>
                                </div>
                                <p>{food.description || "No description"}</p>
                                <span className="list-food-category">
                                  {food.categoryName || "Uncategorised"}
                                </span>
                              </div>
                            </div>
                            <div className="list-food-controls">
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
                                className="list-hidden-input"
                                onChange={(event) =>
                                  handleFoodImageSelect(food, event)
                                }
                                disabled={imageUploading === food._id}
                              />
                              <button
                                type="button"
                                className="list-secondary"
                                onClick={() =>
                                  handleFoodImageButtonClick(food._id)
                                }
                                disabled={imageUploading === food._id}
                              >
                                {imageUploading === food._id
                                  ? "Uploading..."
                                  : "Change image"}
                              </button>
                              <button
                                type="button"
                                className="list-secondary"
                                onClick={() =>
                                  handleFoodStatusToggle(food, foodPaused)
                                }
                                disabled={foodUpdating === food._id}
                              >
                                {foodUpdating === food._id
                                  ? "Updating..."
                                  : actionLabel}
                              </button>
                              <button
                                type="button"
                                className="list-danger"
                                onClick={() => removeFood(food._id)}
                              >
                                Remove dish
                              </button>
                            </div>
                          </div>

                          <div className="list-variant-table">
                            <div className="list-variant-head">
                              <span>Size</span>
                              <span>Price</span>
                              <span>Status</span>
                              <span>Inventory</span>
                              <span />
                            </div>
                            {food.variants.map((variant) => {
                              const variantId = variant._id;
                              const variantStatus =
                                resolveVariantStatus(variant);
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
                                <div
                                  key={variantId}
                                  className="list-variant-row"
                                >
                                  <span className="list-variant-size">
                                    {variant.size || "Variant"}
                                  </span>
                                  <span className="list-variant-price">
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={draftValue}
                                      onChange={(event) =>
                                        handleVariantPriceChange(
                                          variantId,
                                          event.target.value
                                        )
                                      }
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleVariantPriceSave(variant)
                                      }
                                      disabled={priceSaving === variantId}
                                    >
                                      {priceSaving === variantId
                                        ? "Saving..."
                                        : "Save"}
                                    </button>
                                  </span>
                                  <span className="list-variant-status">
                                    <span
                                      className={`list-status ${variantStatus}`}
                                    >
                                      {variantStatus === "active" && "Active"}
                                      {variantStatus === "sold-out" &&
                                        "Sold out"}
                                      {variantStatus === "paused" && "Paused"}
                                    </span>
                                  </span>
                                  <span className="list-variant-inventory">
                                    <div className="list-quantity-controls">
                                      <input
                                        type="number"
                                        min="0"
                                        value={inventoryValue}
                                        onChange={(event) =>
                                          handleInventoryChange(
                                            variantId,
                                            event.target.value
                                          )
                                        }
                                        onKeyDown={(event) =>
                                          handleInventoryKeyDown(
                                            event,
                                            variant
                                          )
                                        }
                                        placeholder="Set quantity"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleInventorySubmit(variant)
                                        }
                                        disabled={savingVariant === variantId}
                                      >
                                        {savingVariant === variantId
                                          ? "Updating..."
                                          : "Update"}
                                      </button>
                                    </div>
                                    <small>
                                      {quantity > 0
                                        ? `In stock: ${quantity}`
                                        : "Out of stock"}
                                    </small>
                                  </span>
                                  <span className="list-variant-actions">
                                    <button
                                      type="button"
                                      className="list-secondary"
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
                                      className="list-danger"
                                      onClick={() =>
                                        handleVariantDelete(variant)
                                      }
                                      disabled={variantUpdating === variantId}
                                    >
                                      Delete
                                    </button>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default List;














