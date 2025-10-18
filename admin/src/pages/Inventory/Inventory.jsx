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

  const branches = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      if (item.branchId?._id) {
        map.set(item.branchId._id, item.branchId.name);
      }
    });
    return Array.from(map.entries());
  }, [items]);

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
        <h2>Inventory</h2>
        <select
          value={branchFilter}
          onChange={(event) => setBranchFilter(event.target.value)}
        >
          <option value="">All branches</option>
          {branches.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="inventory-table">
          <div className="inventory-row inventory-header-row">
            <span>Branch</span>
            <span>Food</span>
            <span>Size</span>
            <span>Quantity</span>
            <span>Updated</span>
            <span>Action</span>
          </div>
          {items.map((entry) => (
            <div key={entry._id} className="inventory-row">
              <span>{entry.branchId?.name || "Unknown"}</span>
              <span>{entry.foodVariantId?.foodId?.name || "Unknown"}</span>
              <span>{entry.foodVariantId?.size || "-"}</span>
              <span>{entry.quantity ?? 0}</span>
              <span>
                {entry.updatedAt
                  ? new Date(entry.updatedAt).toLocaleString()
                  : "-"}
              </span>
              <button onClick={() => handleUpdate(entry)}>Set quantity</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Inventory;
