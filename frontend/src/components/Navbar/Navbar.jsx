import React, { useContext, useEffect, useState } from "react";
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
  } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
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
    setSelectedBranchId(event.target.value);
    setMenu("home");
    if (window.location.pathname !== "/") {
      navigate("/");
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
          <button
            type="button"
            onClick={() => {
              setMenu("menu");
              handleScrollNavigate("explore-menu");
            }}
            className={menu === "menu" ? "active" : ""}
          >
            Menu
          </button>
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
            <label htmlFor="branch-select">Restaurant</label>
            <select
              id="branch-select"
              value={selectedBranchId}
              onChange={handleRestaurantChange}
            >
              <option value="all">All locations</option>
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <img src={assets.search_icon} alt="" />
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
