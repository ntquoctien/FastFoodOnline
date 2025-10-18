import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./branch.css";

const BranchInventory = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/inventory`, {
        headers: { token },
      });
      if (response.data.success) {
        setItems(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load inventory");
      }
    } catch (error) {
      console.error("Branch inventory fetch failed", error);
      toast.error("Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInventory();
    }
  }, [token]);

  const adjustQuantity = async (entry, delta) => {
    try {
      const response = await axios.post(
        `${url}/api/v2/inventory`,
        {
          foodVariantId: entry.foodVariantId?._id,
          quantity: Math.max(0, (entry.quantity ?? 0) + delta),
        },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Inventory updated");
        fetchInventory();
      } else {
        toast.error(response.data.message || "Failed to update inventory");
      }
    } catch (error) {
      console.error("Inventory update failed", error);
      toast.error("Unable to update inventory");
    }
  };

  return (
    <div className="branch-page">
      <h2>Branch Inventory</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="branch-table">
          <div className="branch-row branch-header-row">
            <span>Food</span>
            <span>Size</span>
            <span>Quantity</span>
            <span>Action</span>
          </div>
          {items.map((entry) => (
            <div key={entry._id} className="branch-row">
              <span>{entry.foodVariantId?.foodId?.name || "Unknown"}</span>
              <span>{entry.foodVariantId?.size || "-"}</span>
              <span>{entry.quantity ?? 0}</span>
              <div className="branch-actions">
                <button onClick={() => adjustQuantity(entry, 1)}>+1</button>
                <button onClick={() => adjustQuantity(entry, -1)}>-1</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchInventory;
