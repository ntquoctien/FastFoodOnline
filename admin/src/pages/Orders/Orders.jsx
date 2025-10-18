import React, { useContext, useEffect, useState } from "react";
import "./Orders.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "preparing", label: "Preparing" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const Orders = ({ url }) => {
  const navigate = useNavigate();
  const { token, role } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  const fetchAllOrder = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/orders`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data || []);
      }
    } catch (error) {
      toast.error("Unable to load orders");
    }
  };

  const statusHandler = async (event, orderId) => {
    const status = event.target.value;
    try {
      const response = await axios.patch(
        `${url}/api/v2/orders/${orderId}/status`,
        { status },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Status updated");
        fetchAllOrder();
      } else {
        toast.error(response.data.message || "Unable to update status");
      }
    } catch (error) {
      toast.error("Unable to update status");
    }
  };

  useEffect(() => {
    if (!token || role !== "admin") {
      toast.error("Please login as admin");
      navigate("/");
      return;
    }
    fetchAllOrder();
  }, [token, role]);

  return (
    <div className="order add">
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order) => {
          const itemSummary = order.items
            .map((item) => `${item.title} (${item.size}) x ${item.quantity}`)
            .join(", ");
          return (
            <div key={order._id} className="order-item">
              <img src={assets.parcel_icon} alt="parcel" />
              <div>
                <p className="order-item-food">{itemSummary}</p>
                <p className="order-item-name">
                  {order.address?.firstName} {order.address?.lastName}
                </p>
                <div className="order-item-address">
                  <p>{order.address?.street}</p>
                  <p>
                    {order.address?.city}, {order.address?.state},
                    {" "}
                    {order.address?.country} {order.address?.zipcode}
                  </p>
                </div>
                <p className="order-item-phone">{order.address?.phone}</p>
              </div>
              <p>Items: {order.items.length}</p>
              <p>${order.totalAmount?.toFixed(2)}</p>
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Orders;
