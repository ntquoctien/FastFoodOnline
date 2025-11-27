import React, { useContext, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const navIcons = assets.navIcons;

const adminSections = [
  {
    title: "Cấu hình",
    links: [
      { to: "/restaurant", icon: navIcons.restaurant, label: "Restaurant" },
      { to: "/hubs", icon: navIcons.inventory, label: "Hubs" },
      { to: "/categories", icon: navIcons.categories, label: "Categories" },
      { to: "/staff", icon: navIcons.staffs, label: "Staff" },
    ],
  },
  {
    title: "Thực đơn & kho",
    links: [
      { to: "/add", icon: navIcons.add, label: "Add Items" },
      { to: "/list", icon: navIcons.list, label: "List Items" },
      { to: "/inventory", icon: navIcons.inventory, label: "Inventory" },
    ],
  },
  {
    title: "Vận hành",
    links: [
      { to: "/orders", icon: navIcons.orders, label: "Orders" },
      { to: "/drones", icon: navIcons.shippers, label: "Drones" },
    ],
  },
  {
    title: "Người dùng & tài khoản",
    links: [
      { to: "/admins", icon: navIcons.admins, label: "Admins" },
      { to: "/customers", icon: navIcons.customers, label: "Customers" },
      { to: "/profile", icon: navIcons.profile, label: "Profile" },
    ],
  },
];

const branchSections = [
  {
    title: "Thực đơn",
    links: [
      { to: "/branch/menu", icon: navIcons.list, label: "Menu" },
      { to: "/branch/inventory", icon: navIcons.inventory, label: "Inventory" },
    ],
  },
  {
    title: "Vận hành chi nhánh",
    links: [
      {
        to: "/branch/orders",
        icon: navIcons.orders,
        label: "Orders",
      },
      {
        to: "/branch/staff",
        icon: navIcons.staffs,
        label: "Staff",
        requiresManager: true,
      },
    ],
  },
  {
    title: "Tài khoản",
    links: [{ to: "/profile", icon: navIcons.profile, label: "Profile" }],
  },
];

const Sidebar = ({ isMobileOpen, onCloseSidebar }) => {
  const { token, role } = useContext(StoreContext);
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});

  if (!token) {
    return null;
  }

  const isAdmin = role === "admin";
  const isBranchManager = role === "branch_manager" || role === "manager";
  const sections = useMemo(() => {
    return (isAdmin ? adminSections : branchSections)
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
  }, [isAdmin, isBranchManager]);

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({
      ...prev,
      [title]: !(prev[title] ?? true),
    }));
  };

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
              <img src={assets.logo} alt="FastFood Admin" height={42} />
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
            {sections.map((section) => {
              const isExpanded = expandedSections[section.title] ?? true;
              return (
                <li
                  key={section.title}
                  className={`sidebar-section ${
                    isExpanded ? "expanded" : "collapsed"
                  }`}
                >
                  <button
                    type="button"
                    className="sidebar-title text-uppercase text-muted fs-6 sidebar-section-toggle"
                    onClick={() => toggleSection(section.title)}
                    aria-expanded={isExpanded}
                  >
                    <span>{section.title}</span>
                    <span className="toggle-icon">
                      <i
                        className={`bi ${
                          isExpanded ? "bi-chevron-up" : "bi-chevron-down"
                        }`}
                      />
                    </span>
                  </button>
                  <ul className={`sidebar-links${isExpanded ? " show" : ""}`}>
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
                  </ul>
                </li>
              );
            })}
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
