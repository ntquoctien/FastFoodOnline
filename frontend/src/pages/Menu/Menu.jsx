import React, { useContext, useEffect, useMemo, useState } from "react";
import "./Menu.css";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import AppDownload from "../../components/AppDownload/AppDownload";
import { StoreContext } from "../../context/StoreContext";
import { useLocation, useNavigate } from "react-router-dom";

const Menu = () => {
  const [category, setCategory] = useState("all");
  const { branches, selectedBranchId } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setCategory("all");
  }, [selectedBranchId]);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const branchLabel = useMemo(() => {
    if (!branches.length) return "đang tải cửa hàng...";
    const branch = branches.find((item) => item._id === selectedBranchId);
    return branch?.name || "hãy chọn cửa hàng";
  }, [branches, selectedBranchId]);

  return (
    <div className="menu-page">
      <section className="menu-hero">
        <p className="menu-hero-badge">Menu</p>
        <h1>Discover every dish we serve</h1>
        <p className="menu-hero-subtitle">
          Khám phá thực đơn tại {branchLabel}. Sử dụng nút &quot;Gần tôi&quot; trên
          thanh điều hướng để chọn chi nhánh phù hợp hoặc tự lựa chọn chi nhánh
          mong muốn.
        </p>
        <div className="menu-hero-tags">
          <span>{branchLabel}</span>
          <span>{branches.length} restaurants</span>
          <span>Freshly updated daily</span>
        </div>
      </section>
      <section className="menu-content">
        <ExploreMenu category={category} setCategory={setCategory} />
        <FoodDisplay
          category={category}
          heading="Menu library"
          anchorId="menu-food-display"
          supportingText={`Filtering dishes for ${branchLabel}. Use the search bar or change categories to refine further.`}
          emptyMessage="No dishes match your current filters. Adjust the category, search term, or restaurant selection."
        />
      </section>
      <AppDownload />
    </div>
  );
};

export default Menu;
