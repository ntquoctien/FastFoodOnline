import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { formatCurrency } from "../../utils/currency";
import { toast } from "react-toastify";

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
    <div className="page-heading">
      <div className="page-title-headings mb-4">
        <h3 className="mb-1">Branch orders</h3>
        <p className="text-muted mb-0">
          Snapshot of recent orders handled by this branch.
        </p>
      </div>
      <div className="card border rounded-4">
        {loading ? (
          <div className="card-body text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" />
            <p className="text-muted mb-0">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card-body text-center py-5 text-muted">
            No orders found for this branch.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead className="text-muted small text-uppercase">
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="fw-semibold">
                      {order.address?.firstName} {order.address?.lastName}
                    </td>
                    <td className="text-muted">
                      {(order.items || [])
                        .map(
                          (item) =>
                            `${item.title} (${item.size || "-"}) × ${item.quantity}`
                        )
                        .join(", ")}
                    </td>
                    <td className="fw-semibold">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="text-muted text-capitalize">
                      {order.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchOrders;
