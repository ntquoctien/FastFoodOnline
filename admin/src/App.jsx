import React, { useContext } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Navigate, Route, Routes } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Inventory from "./pages/Inventory/Inventory";
import Shippers from "./pages/Shippers/Shippers";
import BranchMenu from "./pages/Branch/Menu";
import BranchInventory from "./pages/Branch/Inventory";
import BranchOrders from "./pages/Branch/Orders";
import Branches from "./pages/Branches/Branches";
import Categories from "./pages/Categories/Categories";
import Staff from "./pages/Staff/Staff";
import Profile from "./pages/Profile/Profile";
import RestaurantSettings from "./pages/Restaurant/Restaurant";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./components/Login/Login";
import { StoreContext } from "./context/StoreContext";

const App = () => {
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "https://food-delivery-backend-5b6g.onrender.com";
  const { token, role } = useContext(StoreContext);

  if (!token) {
    return (
      <>
        <ToastContainer />
        <Routes>
          <Route path="/*" element={<Login url={apiBaseUrl} />} />
        </Routes>
      </>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="app-shell">
      <ToastContainer />
      <Navbar />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/restaurant" element={<RestaurantSettings url={apiBaseUrl} />} />
                <Route path="/add" element={<Add url={apiBaseUrl} />} />
                <Route path="/list" element={<List url={apiBaseUrl} />} />
                <Route path="/branches" element={<Branches url={apiBaseUrl} />} />
                <Route path="/categories" element={<Categories url={apiBaseUrl} />} />
                <Route path="/staff" element={<Staff url={apiBaseUrl} />} />
                <Route path="/inventory" element={<Inventory url={apiBaseUrl} />} />
                <Route path="/shippers" element={<Shippers url={apiBaseUrl} />} />
                <Route path="/orders" element={<Orders url={apiBaseUrl} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/restaurant" replace />} />
              </>
            ) : (
              <>
                <Route path="/branch/menu" element={<BranchMenu url={apiBaseUrl} />} />
                <Route
                  path="/branch/inventory"
                  element={<BranchInventory url={apiBaseUrl} />}
                />
                <Route path="/branch/staff" element={<Staff url={apiBaseUrl} />} />
                <Route path="/branch/orders" element={<BranchOrders url={apiBaseUrl} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<Navigate to="/branch/menu" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
