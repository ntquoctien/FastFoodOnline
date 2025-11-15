import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

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
    <div className="page-heading">
      <div className="page-title-headings mb-4">
        <h3 className="mb-1">Branch inventory</h3>
        <p className="text-muted mb-0">
          Quick adjustments for stock levels at this location.
        </p>
      </div>
      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading inventory...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            Inventory is empty.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Food</th>
                  <th>Size</th>
                  <th>Quantity</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => (
                  <tr key={entry._id}>
                    <td className="fw-semibold">
                      {entry.foodVariantId?.foodId?.name || "Unknown"}
                    </td>
                    <td className="text-muted">
                      {entry.foodVariantId?.size || "-"}
                    </td>
                    <td className="fw-semibold">{entry.quantity ?? 0}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          type="button"
                          className="btn btn-outline-success"
                          onClick={() => adjustQuantity(entry, 1)}
                        >
                          +1
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => adjustQuantity(entry, -1)}
                        >
                          -1
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchInventory;
