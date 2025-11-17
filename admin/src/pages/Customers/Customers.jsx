import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { StoreContext } from "../../context/StoreContext";

const customerSortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "name_asc", label: "Tên A-Z" },
  { value: "name_desc", label: "Tên Z-A" },
];

const Customers = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ordersModal, setOrdersModal] = useState({ open: false, customer: null });
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedSearch(search), 400);
    return () => window.clearTimeout(handle);
  }, [search]);

  const fetchCustomers = useCallback(
    async (term) => {
      if (!token) return;
      setLoading(true);
      try {
        const response = await axios.get(`${url}/api/v2/customers`, {
          headers: { token },
          params: term ? { search: term } : undefined,
        });
        if (response.data?.success) {
          setCustomers(response.data.data || []);
        } else {
          toast.error(response.data?.message || "Không thể tải khách hàng");
        }
      } catch (error) {
        console.error("Customers fetch failed", error);
        toast.error("Không thể tải khách hàng");
      } finally {
        setLoading(false);
      }
    },
    [token, url]
  );

  useEffect(() => {
    fetchCustomers(debouncedSearch);
  }, [fetchCustomers, debouncedSearch]);

  const openOrdersModal = async (customer) => {
    setOrdersModal({ open: true, customer });
    setOrders([]);
    setOrdersLoading(true);
    try {
      const response = await axios.get(
        `${url}/api/v2/customers/${customer._id}/orders`,
        {
          headers: { token },
        }
      );
      if (response.data?.success) {
        setOrders(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Không thể tải đơn hàng");
      }
    } catch (error) {
      console.error("Customer orders fetch failed", error);
      toast.error("Không thể tải đơn hàng");
    } finally {
      setOrdersLoading(false);
    }
  };

  const closeOrdersModal = () => {
    setOrdersModal({ open: false, customer: null });
    setOrders([]);
  };

  const sortedCustomers = useMemo(() => {
    const list = [...customers];
    const getTime = (value) => {
      if (!value) return 0;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return 0;
      return date.getTime();
    };
    switch (sortOption) {
      case "name_asc":
        return list.sort((a, b) =>
          (a.name || "").localeCompare(b.name || "", "vi", {
            sensitivity: "base",
          })
        );
      case "name_desc":
        return list.sort((a, b) =>
          (b.name || "").localeCompare(a.name || "", "vi", {
            sensitivity: "base",
          })
        );
      case "oldest":
        return list.sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
      case "newest":
      default:
        return list.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    }
  }, [customers, sortOption]);

  const filteredCount = useMemo(
    () => sortedCustomers.length,
    [sortedCustomers]
  );

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-3">
        <div>
          <h3 className="mb-1">Khách hàng đăng ký</h3>
          <p className="text-muted mb-0">
            Tra cứu thông tin tài khoản khách hàng và xem lịch sử đơn hàng của họ.
          </p>
        </div>
      </div>

      <div className="card border rounded-4">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center mb-3">
            <div className="flex-grow-1 w-100">
              <input
                type="search"
                className="form-control"
                placeholder="Tìm theo tên, email hoặc số điện thoại"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center">
              <select
                className="form-select form-select-sm"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value)}
              >
                {customerSortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="text-muted small">
                {loading ? "Đang tải..." : `${filteredCount} khách hàng`}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="text-muted mb-0">Đang tải dữ liệu khách hàng...</p>
          ) : sortedCustomers.length === 0 ? (
            <p className="text-muted mb-0">
              Chưa có khách hàng nào hoặc không tìm thấy kết quả phù hợp.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Email</th>
                    <th>Điện thoại</th>
                    <th>Ngày đăng ký</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td className="fw-semibold">{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone || "-"}</td>
                      <td className="text-muted">
                        {customer.createdAt
                          ? new Date(customer.createdAt).toLocaleString()
                          : "-"}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => openOrdersModal(customer)}
                        >
                          Xem đơn hàng
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {ordersModal.open ? (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content border-0 rounded-4">
                <div className="modal-header border-0">
                  <div>
                    <h5 className="mb-0">
                      Đơn hàng của {ordersModal.customer?.name}
                    </h5>
                    <small className="text-muted">
                      {ordersModal.customer?.email}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeOrdersModal}
                  />
                </div>
                <div className="modal-body">
                  {ordersLoading ? (
                    <p className="text-muted mb-0">Đang tải đơn hàng...</p>
                  ) : orders.length === 0 ? (
                    <p className="text-muted mb-0">
                      Khách hàng này chưa có đơn hàng nào.
                    </p>
                  ) : (
                    <div className="list-group">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="list-group-item list-group-item-action flex-column align-items-start"
                        >
                          <div className="d-flex justify-content-between w-100">
                            <div>
                              <h6 className="mb-1">Mã đơn: {order._id}</h6>
                              <small className="text-muted">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString()
                                  : ""}
                              </small>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-primary-subtle text-primary me-2 text-capitalize">
                                {order.status?.replace(/_/g, " ") || "pending"}
                              </span>
                              <span className="badge bg-light text-body">
                                {order.paymentStatus || "unpaid"}
                              </span>
                              <p className="fw-semibold mb-0 mt-2">
                                {order.totalAmount?.toLocaleString("vi-VN")}đ
                              </p>
                            </div>
                          </div>
                          {order.branch ? (
                            <small className="text-muted">
                              Chi nhánh: {order.branch}
                            </small>
                          ) : null}
                          <ul className="mt-2 mb-0 ps-3">
                            {(order.items || []).map((item, index) => (
                              <li key={`${order._id}-item-${index}`}>
                                {item.title} {item.size ? `(${item.size})` : ""} ×{" "}
                                {item.quantity} —{" "}
                                {item.totalPrice?.toLocaleString("vi-VN")}đ
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-light" onClick={closeOrdersModal}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeOrdersModal}></div>
        </>
      ) : null}
    </div>
  );
};

export default Customers;

