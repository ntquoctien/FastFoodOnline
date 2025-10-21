import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list, selectedBranchId } = useContext(StoreContext);
  const filteredFoods = food_list
    .map((item) => {
      const matchesCategory = category === "all" || item.categoryId === category;
      if (!matchesCategory) return null;

      const variants = (item.variants || []).filter(
        (variant) =>
          selectedBranchId === "all" || variant.branchId === selectedBranchId
      );

      if (selectedBranchId !== "all" && variants.length === 0) {
        return null;
      }

      return {
        ...item,
        variants: selectedBranchId === "all" ? item.variants : variants,
      };
    })
    .filter(Boolean);

  return (
    <div className="food-display" id="food-display">
      <h2>Top dishes near you</h2>
      <div className="food-display-list">
        {filteredFoods.map((item) => (
          <FoodItem key={item._id} food={item} />
        ))}
      </div>
    </div>
  );
};

export default FoodDisplay;
