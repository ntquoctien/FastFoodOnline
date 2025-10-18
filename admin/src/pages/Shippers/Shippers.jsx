import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import "./Shippers.css";

const statusOptions = ["available", "busy", "inactive"];

const Shippers = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/shippers`, {
        headers: { token },
      });
      if (response.data.success) {
        setShippers(response.data.data || []);
      } else {
        toast.error(response.data.message || "Failed to load shippers");
      }
    } catch (error) {
      console.error("Shipper list failed", error);
      toast.error("Unable to fetch shippers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchShippers();
    }
  }, [token]);

  const updateStatus = async (shipperId, status) => {
    try {
      const response = await axios.patch(
        `${url}/api/v2/shippers/${shipperId}/status`,
        { status },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Status updated");
        fetchShippers();
      } else {
        toast.error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Shipper update failed", error);
      toast.error("Unable to update status");
    }
  };

  return (
    <div className="shippers-page">
      <div className="shippers-header">
        <h2>Drone Shippers</h2>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="shippers-table">
          <div className="shippers-row shippers-header-row">
            <span>Name</span>
            <span>Branch</span>
            <span>Vehicle</span>
            <span>Status</span>
            <span>Action</span>
          </div>
          {shippers.map((shipper) => (
            <div key={shipper._id} className="shippers-row">
              <span>{shipper.userId?.name || "-"}</span>
              <span>{shipper.branchId?.name || "-"}</span>
              <span>{shipper.vehicleType || "-"}</span>
              <span className={`status-pill status-${shipper.status}`}>
                {shipper.status}
              </span>
              <select
                value={shipper.status}
                onChange={(event) => updateStatus(shipper._id, event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shippers;
