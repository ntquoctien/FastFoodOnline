import React, { useContext } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const adminLinks = [
  { to: "/add", icon: assets.add_icon, label: "Add Items" },
  { to: "/list", icon: assets.order_icon, label: "List Items" },
  { to: "/branches", icon: assets.parcel_icon, label: "Branches" },
  { to: "/inventory", icon: assets.order_icon, label: "Inventory" },
  { to: "/shippers", icon: assets.order_icon, label: "Shippers" },
  { to: "/orders", icon: assets.order_icon, label: "Orders" },
];

const branchLinks = [
  { to: "/branch/menu", icon: assets.order_icon, label: "Menu" },
  { to: "/branch/inventory", icon: assets.order_icon, label: "Inventory" },
  { to: "/branch/orders", icon: assets.order_icon, label: "Orders" },
];

const Sidebar = () => {
  const { token, role } = useContext(StoreContext);

  if (!token) {
    return null;
  }

  const links = role === "admin" ? adminLinks : branchLinks;

  return (
    <div className="sidebar">
      <div className="sidebar-options">
        {links.map((link) => (
          <NavLink to={link.to} key={link.to} className="sidebar-option">
            <img src={link.icon} alt="option" />
            <p>{link.label}</p>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
