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

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((entry) => {
      if (
        !query ||
        entry.foodVariantId?.foodId?.name?.toLowerCase().includes(query) ||
        entry.branchId?.name?.toLowerCase().includes(query)
      ) {
        return true;
      }
      return false;
    });
  }, [items, searchTerm]);

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
          <p>Monitor stock levels across every branch location.</p>
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
      ) : filteredItems.length === 0 ? (
        <div className="inventory-empty">
          No inventory entries match the current filters.
        </div>
      ) : (
        <div className="inventory-grid">
          {filteredItems.map((entry) => (
            <article key={entry._id} className="inventory-card">
              <div className="inventory-card-header">
                <span className="inventory-branch">
                  {entry.branchId?.name || "Unknown branch"}
                </span>
                <span className="inventory-updated">
                  {entry.updatedAt
                    ? new Date(entry.updatedAt).toLocaleString()
                    : "Never updated"}
                </span>
              </div>
              <div className="inventory-card-body">
                <h3>{entry.foodVariantId?.foodId?.name || "Unnamed item"}</h3>
                <p className="inventory-variant">
                  Size: {entry.foodVariantId?.size || "—"}
                </p>
              </div>
              <div className="inventory-card-footer">
                <span className="inventory-quantity">
                  {entry.quantity ?? 0} in stock
                </span>
                <button type="button" onClick={() => handleUpdate(entry)}>
                  Adjust quantity
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
