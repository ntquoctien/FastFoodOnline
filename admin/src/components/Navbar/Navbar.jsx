import React, { useContext } from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, role, clearAuth } = useContext(StoreContext);

  const logout = () => {
    clearAuth();
    toast.success("Logout successfully");
    navigate("/", { replace: true });
  };

  return (
    <div className="navbar">
      <img className="logo" src={assets.logo} alt="Tomato admin" />
      <div className="navbar-actions">
        {token ? (
          <>
            <span className="navbar-role">{role === "admin" ? "Admin" : "Branch"}</span>
            <p className="login-conditon" onClick={logout}>
              Logout
            </p>
          </>
        ) : (
          <p className="login-conditon" onClick={() => navigate("/")}>Login</p>
        )}
        <img className="profile" src={assets.profile_image} alt="profile" />
      </div>
    </div>
  );
};

export default Navbar;
