import React, { useContext, useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { assets } from "../../assets/frontend_assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const {
    getTotalCartAmount,
    token,
    setToken,
    branches,
    selectedBranchId,
    setSelectedBranchId,
    searchTerm,
    setSearchTerm,
    locateNearestBranch,
  } = useContext(StoreContext);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (location.pathname === "/menu") {
      setMenu("menu");
      return;
    }
    if (location.pathname !== "/") {
      setMenu("");
    }
  }, [location.pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    toast.success("Logout Successfully");
    navigate("/");
  };

  const handleScrollNavigate = (section) => {
    navigate("/", { state: { scrollTo: section } });
  };

  const handleRestaurantChange = (event) => {
    const nextBranchId = event.target.value;
    if (!nextBranchId) return;
    setSelectedBranchId(nextBranchId);
    if (location.pathname === "/menu") {
      setMenu("menu");
    } else if (location.pathname === "/") {
      setMenu("home");
    } else {
      setMenu("");
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed !== searchTerm) {
      setSearchTerm(trimmed);
    }
    if (location.pathname !== "/menu") {
      navigate("/menu", { state: { scrollTo: "menu-food-display" } });
      return;
    }
    const target = document.getElementById("menu-food-display");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/menu", {
        replace: true,
        state: { scrollTo: "menu-food-display" },
      });
    }
  };

  const handleSearchClear = () => {
    if (!searchTerm) return;
    setSearchTerm("");
    searchInputRef.current?.focus();
  };

  const handleLocateNearest = async () => {
    if (isLocating) return;
    setIsLocating(true);
    try {
      const nearest = await locateNearestBranch();
      if (nearest?.branch?.name) {
        toast.success(`Đã chọn ${nearest.branch.name} gần bạn`);
      }
    } catch (error) {
      // errors handled inside locateNearestBranch
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="" className="logo" />
      </Link>
      <ul className="navbar-menu">
        <li>
          <Link
            to="/"
            onClick={() => setMenu("home")}
            className={menu === "home" ? "active" : ""}
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            to="/menu"
            onClick={() => setMenu("menu")}
            className={menu === "menu" ? "active" : ""}
          >
            Menu
          </Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              setMenu("mobile-app");
              handleScrollNavigate("app-download");
            }}
            className={menu === "mobile-app" ? "active" : ""}
          >
            Mobile App
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              setMenu("contact-us");
              handleScrollNavigate("footer");
            }}
            className={menu === "contact-us" ? "active" : ""}
          >
            Contact Us
          </button>
        </li>
      </ul>
      <div className="navbar-right">
        {branches.length > 0 && (
          <div className="navbar-branch-select">
            <label htmlFor="branch-select">Cửa hàng của bạn</label>
            <div className="navbar-branch-controls">
              <select
                id="branch-select"
                value={selectedBranchId}
                onChange={handleRestaurantChange}
              >
                <option value="">Chọn cửa hàng gần nhất</option>
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="navbar-find-branch"
                onClick={handleLocateNearest}
                disabled={isLocating}
              >
                {isLocating ? "Đang tìm..." : "Gần tôi"}
              </button>
            </div>
          </div>
        )}
        <form className="navbar-search" onSubmit={handleSearchSubmit}>
          <input
            ref={searchInputRef}
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search dishes..."
            aria-label="Search dishes"
          />
          {searchTerm && (
            <button
              type="button"
              className="navbar-search-clear"
              onClick={handleSearchClear}
              aria-label="Clear search"
            >
              <img src={assets.cross_icon} alt="" />
            </button>
          )}
          <button
            type="submit"
            className="navbar-search-submit"
            aria-label="Search"
          >
            <img src={assets.search_dark_icon} alt="" />
          </button>
        </form>
        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="" />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? (
          <button className="auth-button" onClick={() => setShowLogin(true)}>
            sign in
          </button>
        ) : (
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="" />
                <p>Orders</p>
              </li>
              <hr />
              <li onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <p>Logout</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
