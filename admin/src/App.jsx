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
    <div>
      <ToastContainer />
      <Navbar />
      <hr />
      <div className="app-content">
        <Sidebar />
        <Routes>
          {isAdmin ? (
            <>
              <Route path="/add" element={<Add url={apiBaseUrl} />} />
              <Route path="/list" element={<List url={apiBaseUrl} />} />
              <Route path="/inventory" element={<Inventory url={apiBaseUrl} />} />
              <Route path="/shippers" element={<Shippers url={apiBaseUrl} />} />
              <Route path="/orders" element={<Orders url={apiBaseUrl} />} />
              <Route path="*" element={<Navigate to="/add" replace />} />
            </>
          ) : (
            <>
              <Route path="/branch/menu" element={<BranchMenu url={apiBaseUrl} />} />
              <Route
                path="/branch/inventory"
                element={<BranchInventory url={apiBaseUrl} />}
              />
              <Route path="/branch/orders" element={<BranchOrders url={apiBaseUrl} />} />
              <Route path="*" element={<Navigate to="/branch/menu" replace />} />
            </>
          )}
        </Routes>
      </div>
    </div>
  );
};

export default App;
