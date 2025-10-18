import React, { useContext, useEffect, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/frontend_assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${url}/api/v2/orders/me`, {
        headers: { token },
      });
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load orders", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <div className="my-orders">
      <h2>Orders</h2>
      <div className="container">
        {orders.map((order) => {
          const itemSummary = order.items
            .map((item) => `${item.title} (${item.size}) x ${item.quantity}`)
            .join(", ");
          return (
            <div key={order._id} className="my-orders-order">
              <img src={assets.parcel_icon} alt="Parcel" />
              <p>{itemSummary}</p>
              <p>${order.totalAmount?.toFixed(2)}</p>
              <p>items: {order.items.length}</p>
              <p>
                <span>&#x25cf;</span>
                <b> {order.status}</b>
              </p>
              <button onClick={fetchOrders}>Track Order</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
