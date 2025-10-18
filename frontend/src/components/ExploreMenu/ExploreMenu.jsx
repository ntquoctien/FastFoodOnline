import React, { useContext } from "react";
import "./ExploreMenu.css";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { categories } = useContext(StoreContext);

  const handleSelect = (categoryId) => {
    setCategory((prev) => (prev === categoryId ? "all" : categoryId));
  };

  return (
    <div className="explore-menu" id="explore-menu">
      <h1>Explore our menu</h1>
      <p className="explore-menu-text">
        Choose from a diverse menu featuring a detectable array of dishes. Our
        mission is to satisfy your cravings and elevate your dining experience,
        one delicious meal at a time.
      </p>
      <div className="explore-menu-list">
        <div className="explore-menu-list-item">
          <div
            onClick={() => setCategory("all")}
            className={`explore-menu-list-card ${category === "all" ? "active" : ""}`}
          >
            <p>All</p>
          </div>
        </div>
        {categories.map((item) => (
          <div
            onClick={() => handleSelect(item._id)}
            key={item._id}
            className="explore-menu-list-item"
          >
            <div className={`explore-menu-list-card ${category === item._id ? "active" : ""}`}>
              <p>{item.name}</p>
            </div>
          </div>
        ))}
      </div>
      <hr/>
    </div>
  );
};

export default ExploreMenu;
