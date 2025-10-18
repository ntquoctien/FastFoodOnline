import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./branch.css";

const BranchOrders = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/orders`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Branch orders fetch failed", error);
      toast.error("Unable to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <div className="branch-page">
      <h2>Branch Orders</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="branch-table">
          <div className="branch-row branch-header-row">
            <span>Customer</span>
            <span>Items</span>
            <span>Total</span>
            <span>Status</span>
          </div>
          {orders.map((order) => (
            <div key={order._id} className="branch-row">
              <span>{order.address?.firstName} {order.address?.lastName}</span>
              <span>
                {(order.items || [])
                  .map((item) => `${item.title} (${item.size}) x ${item.quantity}`)
                  .join(", ")}
              </span>
              <span>${order.totalAmount?.toFixed(2)}</span>
              <span>{order.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BranchOrders;
