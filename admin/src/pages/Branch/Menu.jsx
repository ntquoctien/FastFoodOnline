import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const BranchMenu = ({ url }) => {
  const { token, branchId } = useContext(StoreContext);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMenu = async () => {
    if (!branchId) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`, {
        params: { branchId },
      });
      if (response.data.success) {
        setFoods(response.data.data?.foods || []);
      } else {
        toast.error(response.data.message || "Failed to load menu");
      }
    } catch (error) {
      console.error("Branch menu fetch failed", error);
      toast.error("Unable to load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && branchId) {
      fetchMenu();
    }
  }, [token, branchId]);

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-4">
        <h3 className="mb-1">Branch menu</h3>
        <p className="text-muted mb-0">
          Overview of dishes published to this location.
        </p>
      </div>
      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading menu...</p>
          </div>
        ) : foods.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            No menu items published for this branch.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Food</th>
                  <th>Description</th>
                  <th>Variants</th>
                </tr>
              </thead>
              <tbody>
                {foods.map((food) => (
                  <tr key={food._id}>
                    <td className="fw-semibold">{food.name}</td>
                    <td className="text-muted">{food.description || "—"}</td>
                    <td className="text-muted">
                      {(food.variants || [])
                        .map(
                          (variant) =>
                            `${variant.size} - $${
                              variant.price?.toFixed(2) ?? "0.00"
                            }`
                        )
                        .join(", ") || "No variants"}
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

export default BranchMenu;
