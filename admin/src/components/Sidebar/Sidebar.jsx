import React, { useContext } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const adminSections = [
  {
    title: "Cấu hình",
    links: [
      { to: "/restaurant", icon: assets.parcel_icon, label: "Restaurant" },
      { to: "/categories", icon: assets.order_icon, label: "Categories" },
      { to: "/staff", icon: assets.order_icon, label: "Staff" },
    ],
  },
  {
    title: "Thực đơn & kho",
    links: [
      { to: "/add", icon: assets.add_icon, label: "Add Items" },
      { to: "/list", icon: assets.order_icon, label: "List Items" },
      { to: "/inventory", icon: assets.order_icon, label: "Inventory" },
    ],
  },
  {
    title: "Vận hành",
    links: [
      { to: "/orders", icon: assets.order_icon, label: "Orders" },
      { to: "/shippers", icon: assets.order_icon, label: "Shippers" },
    ],
  },
  {
    title: "Người dùng & tài khoản",
    links: [
      { to: "/admins", icon: assets.order_icon, label: "Admins" },
      { to: "/customers", icon: assets.order_icon, label: "Customers" },
      { to: "/profile", icon: assets.profile_image, label: "Profile" },
    ],
  },
];

const branchSections = [
  {
    title: "Thực đơn",
    links: [
      { to: "/branch/menu", icon: assets.order_icon, label: "Menu" },
      { to: "/branch/inventory", icon: assets.order_icon, label: "Inventory" },
    ],
  },
  {
    title: "Vận hành chi nhánh",
    links: [
      {
        to: "/branch/orders",
        icon: assets.order_icon,
        label: "Orders",
      },
      {
        to: "/branch/staff",
        icon: assets.order_icon,
        label: "Staff",
        requiresManager: true,
      },
    ],
  },
  {
    title: "Tài khoản",
    links: [{ to: "/profile", icon: assets.profile_image, label: "Profile" }],
  },
];

const Sidebar = ({ isMobileOpen, onCloseSidebar }) => {
  const { token, role } = useContext(StoreContext);
  const location = useLocation();

  if (!token) {
    return null;
  }

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch_manager" || role === "manager";
  const sections = (isAdmin ? adminSections : branchSections)
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => {
        if (link.requiresManager && !isBranchManager) {
          return false;
        }
        return true;
      }),
    }))
    .filter((section) => section.links.length > 0);

  const isActive = (path) => {
    if (path === "/profile") {
      return location.pathname === "/profile";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div id="sidebar" className={isMobileOpen ? "active" : ""}>
      <div className="sidebar-wrapper active">
        <div className="sidebar-header position-relative">
          <div className="d-flex justify-content-between align-items-center">
            <div className="logo d-flex align-items-center gap-3">
              <img src={assets.logo} alt="FastFood Admin" height={26} />
              <div>
                <p className="mb-0 fw-bold">FastFood</p>
                <small className="text-muted">
                  {isAdmin ? "Admin Console" : "Branch Dashboard"}
                </small>
              </div>
            </div>
            <div className="sidebar-toggler x">
              <button
                type="button"
                className="btn btn-light btn-sm d-xl-none d-block"
                onClick={onCloseSidebar}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          </div>
        </div>
        <div className="sidebar-menu">
          <ul className="menu">
            {sections.map((section) => (
              <React.Fragment key={section.title}>
                <li className="sidebar-title text-uppercase text-muted fs-6">
                  {section.title}
                </li>
                {section.links.map((link) => (
                  <li
                    key={link.to}
                    className={`sidebar-item${
                      isActive(link.to) ? " active" : ""
                    }`}
                  >
                    <NavLink
                      to={link.to}
                      className={({ isActive: navActive }) =>
                        `sidebar-link${navActive ? " active" : ""}`
                      }
                      onClick={onCloseSidebar}
                    >
                      <span className="sidebar-icon d-inline-flex align-items-center justify-content-center rounded-3 bg-primary-subtle">
                        <img src={link.icon} alt="" width={18} height={18} />
                      </span>
                      <span>{link.label}</span>
                    </NavLink>
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
      {isMobileOpen ? (
        <div className="sidebar-backdrop d-xl-none" onClick={onCloseSidebar} />
      ) : null}
    </div>
  );
};

export default Sidebar;
