import React, { useContext } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { NavLink } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";

const adminLinks = [
  { to: "/restaurant", icon: assets.parcel_icon, label: "Restaurant" },
  { to: "/add", icon: assets.add_icon, label: "Add Items" },
  { to: "/list", icon: assets.order_icon, label: "List Items" },
  { to: "/categories", icon: assets.order_icon, label: "Categories" },
  { to: "/staff", icon: assets.order_icon, label: "Staff" },
  { to: "/inventory", icon: assets.order_icon, label: "Inventory" },
  { to: "/shippers", icon: assets.order_icon, label: "Shippers" },
  { to: "/orders", icon: assets.order_icon, label: "Orders" },
  { to: "/profile", icon: assets.profile_image, label: "Profile" },
];

const branchLinks = [
  { to: "/branch/menu", icon: assets.order_icon, label: "Menu" },
  { to: "/branch/inventory", icon: assets.order_icon, label: "Inventory" },
  { to: "/branch/staff", icon: assets.order_icon, label: "Staff" },
  { to: "/branch/orders", icon: assets.order_icon, label: "Orders" },
  { to: "/profile", icon: assets.profile_image, label: "Profile" },
];

const Sidebar = () => {
  const { token, role } = useContext(StoreContext);

  if (!token) {
    return null;
  }

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch_manager" || role === "manager";
  const links = isAdmin
    ? adminLinks
    : branchLinks.filter(
        (link) => link.to !== "/branch/staff" || isBranchManager
      );

  return (
    <aside className="sidebar">
      <div className="sidebar-shell">
        <div className="sidebar-brand">
          <img src={assets.logo} alt="FastFood Admin" />
          <div>
            <p>FastFood</p>
            <span>{isAdmin ? "Admin console" : "Branch dashboard"}</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              to={link.to}
              key={link.to}
              className={({ isActive }) =>
                `sidebar-option${isActive ? " is-active" : ""}`
              }
            >
              <span className="sidebar-option-icon">
                <img src={link.icon} alt="" />
              </span>
              <span className="sidebar-option-label">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
