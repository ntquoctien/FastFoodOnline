import React, { useContext, useEffect, useState } from "react";
import "./List.css";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const FALLBACK_IMAGE = "https://via.placeholder.com/80";

const List = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);
  const [foods, setFoods] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/menu/default`);
      if (response.data.success) {
        setFoods(response.data.data.foods || []);
      } else {
        toast.error("Failed to load menu items");
      }
    } catch (error) {
      toast.error("Unable to reach server");
    }
  };

  const removeFood = async (foodId) => {
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
  }, [token, role]);

  return (
    <div className="list add flex-col">
      <p>All Food List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Variants</b>
          <b>Action</b>
        </div>
        {foods.map((item) => {
          const variantSummary = (item.variants || [])
            .map(
              (variant) =>
                `${variant.size} - $${variant.price.toFixed(2)}${
                  variant.branchName ? ` (${variant.branchName})` : ""
                }`
            )
            .join(", ");
          const imageSrc = item.imageUrl ? `${url}/images/${item.imageUrl}` : FALLBACK_IMAGE;
          return (
            <div key={item._id} className="list-table-format">
              <img src={imageSrc} alt={item.name} />
              <p>{item.name}</p>
              <p>{item.categoryName || "N/A"}</p>
              <p>{variantSummary || "No variants"}</p>
              <p onClick={() => removeFood(item._id)} className="cursor">
                X
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default List;
