import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Home.css";
import Header from "../../components/Header/Header";
import ExploreMenu from "../../components/ExploreMenu/ExploreMenu";
import FoodDisplay from "../../components/FoodDisplay/FoodDisplay";
import AppDownload from "../../components/AppDownload/AppDownload";
import { StoreContext } from "../../context/StoreContext";

const Home = () => {
  const [category, setCategory] = useState("all");
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedBranchId } = useContext(StoreContext);

  useEffect(() => {
    if (location.state?.scrollTo) {
      const element = document.getElementById(location.state.scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    setCategory("all");
  }, [selectedBranchId]);

  return (
    <div>
      <Header />
      <ExploreMenu category={category} setCategory={setCategory} />
      <FoodDisplay
        category={category}
        heading="Menu nhanh"
        anchorId="home-menu-preview"
        supportingText="Một vài gợi ý nổi bật từ chi nhánh bạn đã chọn. Vào trang menu để xem toàn bộ món ăn và tiện ích chi tiết."
        variant="summary"
        limit={4}
        ctaSlot={
          <div className="food-display-cta">
            <p>Muốn xem toàn bộ menu kèm đầy đủ biến thể?</p>
            <Link to="/menu" className="food-display-cta-button">
              Xem menu chi tiết
            </Link>
          </div>
        }
      />
      <AppDownload />
    </div>
  );
};

export default Home;
