import React, { useContext } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";

const FoodDisplay = ({ category }) => {
  const { food_list } = useContext(StoreContext);
  const filteredFoods = food_list.filter(
    (item) => category === "all" || item.categoryId === category
  );

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
