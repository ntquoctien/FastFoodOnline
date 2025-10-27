import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./Inventory.css";

const Inventory = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchFilter, setBranchFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [branchOptions, setBranchOptions] = useState([]);

  const fetchInventory = async (selectedBranch) => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/inventory`, {
        headers: { token },
        params: selectedBranch ? { branchId: selectedBranch } : {},
      });
      if (response.data.success) {
        setItems(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Inventory fetch failed", error);
      toast.error("Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory(branchFilter);
    }
  }, [token, branchFilter]);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${url}/api/v2/branches`, { headers: { token } })
      .then((response) => {
        if (response.data?.success) {
          setBranchOptions(response.data.data?.branches || []);
        }
      })
      .catch((error) => {
        console.warn("Failed to load branch options for inventory", error);
      });
  }, [token, url]);

  const normalizedItems = useMemo(() => {
    return (items || []).map((entry) => {
      const food = entry.foodVariantId?.foodId || {};
      const branch = entry.branchId || {};
      return {
        id: entry._id,
        raw: entry,
        foodId: food._id || entry.foodVariantId?.foodId || entry.foodVariantId?._id,
        foodName: food.name || "Unnamed dish",
        categoryName: food.categoryId?.name || "",
        branchId: branch._id || "",
        branchName: branch.name || "Unknown branch",
        size: entry.foodVariantId?.size || "N/A",
        quantity: entry.quantity ?? 0,
        updatedAt: entry.updatedAt || entry.createdAt,
        variantId: entry.foodVariantId?._id,
      };
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return normalizedItems;
    return normalizedItems.filter(
      (entry) =>
        entry.foodName.toLowerCase().includes(query) ||
        entry.branchName.toLowerCase().includes(query) ||
        entry.size.toLowerCase().includes(query)
    );
  }, [normalizedItems, searchTerm]);

  const groupedInventory = useMemo(() => {
    const map = new Map();
    const groups = [];
    filteredItems.forEach((entry) => {
      const key = entry.foodId || entry.variantId || entry.id;
      if (!map.has(key)) {
        map.set(key, {
          foodId: key,
          foodName: entry.foodName,
          categoryName: entry.categoryName,
          variants: [],
        });
        groups.push(map.get(key));
      }
      map.get(key).variants.push(entry);
    });
    return groups;
  }, [filteredItems]);

  const handleUpdate = async (entry) => {
    const currentQuantity = entry.quantity ?? 0;
    const next = window.prompt(
      `Set quantity for ${entry.foodVariantId?.foodId?.name || "item"} (${entry.foodVariantId?.size})`,
      currentQuantity
    );
    if (next === null) return;
    const parsed = Number(next);
    if (Number.isNaN(parsed)) {
      toast.error("Quantity must be a number");
      return;
    }
    try {
      const payload = {
        branchId: entry.branchId?._id,
        foodVariantId: entry.foodVariantId?._id,
        quantity: parsed,
      };
      const response = await axios.post(`${url}/api/v2/inventory`, payload, {
        headers: { token },
      });
      if (response.data.success) {
        toast.success("Inventory updated");
        fetchInventory(branchFilter);
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to update inventory");
    }
  };

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h2>Inventory</h2>
          <p>Monitor stock levels by branch and variant.</p>
        </div>
        <div className="inventory-controls">
          <input
            type="search"
            placeholder="Search dishes or branches"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            value={branchFilter}
            onChange={(event) => setBranchFilter(event.target.value)}
          >
            <option value="">All branches</option>
            {branchOptions.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="inventory-empty">Loading inventory...</div>
      ) : groupedInventory.length === 0 ? (
        <div className="inventory-empty">
          No inventory entries match the current filters.
        </div>
      ) : (
        <div className="inventory-group-list">
          {groupedInventory.map((group) => (
            <article key={group.foodId} className="inventory-group-card">
              <header className="inventory-group-header">
                <div className="inventory-group-title">
                  <h3>{group.foodName}</h3>
                  {group.categoryName && (
                    <span className="inventory-group-category">
                      {group.categoryName}
                    </span>
                  )}
                </div>
                <span className="inventory-group-count">
                  {group.variants.length} variants
                </span>
              </header>
              <div className="inventory-variant-table">
                <div className="inventory-variant-table-head">
                  <span>Branch</span>
                  <span>Size</span>
                  <span>Quantity</span>
                  <span>Updated</span>
                  <span />
                </div>
                {group.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="inventory-variant-table-row"
                  >
                    <span className="inventory-variant-branch">
                      {variant.branchName}
                    </span>
                    <span>{variant.size}</span>
                    <span className="inventory-variant-quantity">
                      {variant.quantity}
                    </span>
                    <span className="inventory-variant-updated">
                      {variant.updatedAt
                        ? new Date(variant.updatedAt).toLocaleString()
                        : "Never updated"}
                    </span>
                    <span>
                      <button
                        type="button"
                        onClick={() => handleUpdate(variant.raw)}
                      >
                        Adjust
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
