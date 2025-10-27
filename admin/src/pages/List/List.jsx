import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE =
  "https://via.placeholder.com/120x80.png?text=Menu+Item";

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);

  const [foods, setFoods] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryValues, setInventoryValues] = useState({});
  const [inventoryMap, setInventoryMap] = useState({});
  const [savingVariant, setSavingVariant] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});

  const refreshInventory = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/v2/inventory`, {
        headers: { token },
      });
      if (response.data?.success) {
        const map = {};
        (response.data.data || []).forEach((entry) => {
          const variantId =
            entry.foodVariantId?._id || entry.foodVariantId || entry._id;
          if (!variantId) return;
          map[variantId] = {
            quantity: entry.quantity ?? 0,
            branchId: entry.branchId?._id || entry.branchId,
            record: entry,
          };
        });
        setInventoryMap(map);
        setInventoryValues((prev) => {
          const next = { ...prev };
          Object.entries(map).forEach(([variantId, entry]) => {
            next[variantId] = String(entry.quantity ?? 0);
          });
          return next;
        });
      }
    } catch (error) {
      console.warn("Failed to load inventory snapshot", error);
    }
  }, [token, url]);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`, {
        headers: { token },
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

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login as admin");
      navigate("/");
      return;
    }
    fetchList();
  }, [token, role, navigate, fetchList]);

  const filteredFoods = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return foods
      .map((food) => {
        const matchesSearch =
          !query ||
          food.name?.toLowerCase().includes(query) ||
          food.categoryName?.toLowerCase().includes(query);
        if (!matchesSearch) return null;

        let scopedVariants = food.variants || [];
        if (branchFilter !== "all") {
          scopedVariants = scopedVariants.filter((variant) => {
            const branchId = variant.branchId?._id || variant.branchId;
            return String(branchId) === String(branchFilter);
          });
        }
        if (sizeFilter !== "all") {
          scopedVariants = scopedVariants.filter((variant) =>
            (variant.size || "").toLowerCase() === sizeFilter.toLowerCase()
          );
        }
        if (!scopedVariants.length) return null;
        return { ...food, variants: scopedVariants };
      })
      .filter(Boolean);
  }, [foods, branchFilter, sizeFilter, searchTerm]);

  const branchNameMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(branch._id, branch.name));
    return map;
  }, [branches]);

  const sizeOptions = useMemo(() => {
    const set = new Set();
    foods.forEach((food) => {
      (food.variants || []).forEach((variant) => {
        if (variant.size) {
          set.add(variant.size);
        }
      });
    });
    return Array.from(set.values()).sort((a, b) =>
      String(a || "").localeCompare(String(b || ""))
    );
  }, [foods]);

  const handleFoodSizeFilter = useCallback((foodId, value) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [foodId]: value,
    }));
  }, []);

  const resolveQuantityValue = useCallback(
    (variantId) => {
      if (Object.prototype.hasOwnProperty.call(inventoryValues, variantId)) {
        return inventoryValues[variantId];
      }
      const existing = inventoryMap[variantId]?.quantity;
      return typeof existing === "number" ? String(existing) : "";
    },
    [inventoryMap, inventoryValues]
  );

  const handleInventoryChange = (variantId, value) => {
    setInventoryValues((prev) => ({
      ...prev,
      [variantId]: value,
    }));
  };

  const handleInventorySubmit = async (variant) => {
    const variantId = variant._id;
    const rawValue =
      inventoryValues[variantId] !== undefined
        ? inventoryValues[variantId]
        : resolveQuantityValue(variantId);
    if (rawValue === "" || rawValue === undefined) {
      toast.error("Enter a quantity before saving");
      return;
    }
    const quantity = Number(rawValue);
    if (Number.isNaN(quantity) || quantity < 0) {
      toast.error("Quantity must be a non-negative number");
      return;
    }
    const branchId = variant.branchId?._id || variant.branchId;
    if (!branchId) {
      toast.error("Variant branch information missing");
      return;
    }
    setSavingVariant(variantId);
    try {
      const response = await axios.post(
        `${url}/api/v2/inventory`,
        {
          branchId,
          foodVariantId: variantId,
          quantity,
        },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Inventory updated");
        const data = response.data.data || {};
        const updatedId =
          data.foodVariantId?._id || data.foodVariantId || variantId;
        setInventoryMap((prev) => ({
          ...prev,
          [updatedId]: {
            quantity: data.quantity ?? quantity,
            branchId: data.branchId?._id || data.branchId || branchId,
            record: data,
          },
        }));
        setInventoryValues((prev) => ({
          ...prev,
          [updatedId]: String(quantity),
        }));
      } else {
        toast.error(response.data?.message || "Failed to update inventory");
      }
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to update inventory");
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

  const renderFoodCards = () =>
    filteredFoods.map((food) => {
      const variants = food.variants || [];
      const imageSrc = food.imageUrl
        ? `${url}/images/${food.imageUrl}`
        : FALLBACK_IMAGE;
      const foodSizeOptions = Array.from(
        new Set(variants.map((variant) => variant.size).filter(Boolean))
      ).sort((a, b) => String(a || "").localeCompare(String(b || "")));
      const selectedSize = selectedSizes[food._id] || "all";
      const visibleVariants =
        selectedSize === "all"
          ? variants
          : variants.filter(
              (variant) =>
                (variant.size || "").toLowerCase() ===
                selectedSize.toLowerCase()
            );

      return (
        <article key={food._id} className="list-food-card">
          <header className="list-food-header">
            <div className="list-food-main">
              <div className="list-food-thumb">
                <img src={imageSrc} alt={food.name} loading="lazy" />
              </div>
              <div className="list-food-info">
                <div className="list-food-name">
                  <h3>{food.name}</h3>
                  <span className="list-tag">
                    {food.categoryName || "Uncategorised"}
                  </span>
                </div>
                {food.description ? (
                  <p className="list-food-description">{food.description}</p>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="list-remove"
              onClick={() => removeFood(food._id)}
            >
              Remove dish
            </button>
          </header>
          {variants.length === 0 ? (
            <div className="list-variant-empty">
              This dish has no active variants for the current filters.
            </div>
          ) : (
            <div className="list-variant-table">
              <div className="list-variant-table-head">
                <span>Branch</span>
                <span className="list-variant-size-control">
                  <span>Size</span>
                  {foodSizeOptions.length > 1 ? (
                    <select
                      value={selectedSize}
                      onChange={(event) =>
                        handleFoodSizeFilter(food._id, event.target.value)
                      }
                    >
                      <option value="all">All</option>
                      {foodSizeOptions.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="list-variant-size-placeholder">
                      {foodSizeOptions[0] || "Variant"}
                    </span>
                  )}
                </span>
                <span>Price</span>
                <span>Inventory</span>
              </div>
              {visibleVariants.length === 0 ? (
                <div className="list-variant-empty">
                  This dish has no variant matching the selected size.
                </div>
              ) : (
                visibleVariants.map((variant) => {
                  const variantId = variant._id;
                  const quantityDisplay = inventoryMap[variantId]?.quantity;
                  const inputValue = resolveQuantityValue(variantId);
                  const isSaving = savingVariant === variantId;
                  const variantBranchId =
                    variant.branchId?._id || variant.branchId;

                  return (
                    <div key={variantId} className="list-variant-row">
                      <span className="list-variant-branch">
                        {branchNameMap.get(variantBranchId) ||
                          variant.branchName ||
                          "Branch"}
                      </span>
                      <span className="list-variant-size">
                        {variant.size || "Variant"}
                      </span>
                      <span className="list-variant-price">
                        ${Number(variant.price || 0).toFixed(2)}
                      </span>
                      <div className="list-variant-inventory">
                        <span className="list-current-qty">
                          {typeof quantityDisplay === "number"
                            ? `In stock: ${quantityDisplay}`
                            : "No inventory set"}
                        </span>
                        <div className="list-quantity-controls">
                          <input
                            type="number"
                            min="0"
                            value={inputValue}
                            onChange={(event) =>
                              handleInventoryChange(
                                variantId,
                                event.target.value
                              )
                            }
                            onKeyDown={(event) =>
                              handleInventoryKeyDown(event, variant)
                            }
                            placeholder="Set quantity"
                          />
                          <button
                            type="button"
                            onClick={() => handleInventorySubmit(variant)}
                            disabled={isSaving}
                          >
                            {isSaving ? "Saving..." : "Update"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </article>
      );
    });

  return (
    <div className="list-page">
      <header className="list-header">
        <div>
          <h2>Menu library</h2>
          <p>Browse and curate dishes, filtered by branch availability.</p>
        </div>
        <div className="list-header-actions">
          <input
            type="search"
            placeholder="Search dishes or categories"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={sizeFilter}
            onChange={(event) => setSizeFilter(event.target.value)}
          >
            <option value="all">All sizes</option>
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </header>

      {loading ? (
        <div className="list-empty">Loading menu items...</div>
      ) : filteredFoods.length === 0 ? (
        <div className="list-empty">
          No menu items match the current filters. Try changing the branch or search term.
        </div>
      ) : (
        <div className="list-group-container">{renderFoodCards()}</div>
      )}
    </div>
  );
};

export default List;



