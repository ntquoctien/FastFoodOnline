import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./branch.css";

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
    <div className="branch-page">
      <h2>Branch Menu</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="branch-table">
          <div className="branch-row branch-header-row">
            <span>Food</span>
            <span>Description</span>
            <span>Variants</span>
          </div>
          {foods.map((food) => (
            <div key={food._id} className="branch-row">
              <span>{food.name}</span>
              <span className="branch-desc">{food.description}</span>
              <span>
                {(food.variants || [])
                  .map((variant) => `${variant.size} - $${variant.price?.toFixed(2) ?? "0.00"}`)
                  .join(", ") || "No variants"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchMenu;
