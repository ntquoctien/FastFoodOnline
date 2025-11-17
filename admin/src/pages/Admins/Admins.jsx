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

const initialForm = { name: "", email: "", phone: "", password: "" };

const Admins = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchAdmins = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/admins`, {
        headers: { token },
      });
      if (response.data?.success) {
        setAdmins(response.data.data || []);
      } else {
        toast.error(response.data?.message || "Không thể tải danh sách admin");
      }
    } catch (error) {
      console.error("Admins fetch failed", error);
      toast.error("Không thể tải danh sách admin");
    } finally {
      setLoading(false);
    }
  }, [token, url]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.email.trim() &&
      form.password.trim().length >= 8
    );
  }, [form]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || creating) return;
    setCreating(true);
    try {
      const response = await axios.post(
        `${url}/api/v2/admins`,
        {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Tạo admin mới thành công");
        setForm(initialForm);
        fetchAdmins();
      } else {
        toast.error(response.data?.message || "Không thể tạo admin");
      }
    } catch (error) {
      console.error("Create admin failed", error);
      toast.error("Không thể tạo admin");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-heading">
      <div className="page-title-headings mb-3">
        <div>
          <h3 className="mb-1">Quản lý Admin</h3>
          <p className="text-muted mb-0">
            Thêm tài khoản quản trị viên mới mà không cần thao tác trực tiếp với
            cơ sở dữ liệu.
          </p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="card border rounded-4 h-100">
            <div className="card-body">
              <h5 className="mb-3">Tạo admin mới</h5>
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <div>
                  <label className="form-label">Họ tên</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleInput}
                    placeholder="Tên admin"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleInput}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={form.phone}
                    onChange={handleInput}
                    placeholder="Tùy chọn"
                  />
                </div>
                <div>
                  <label className="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleInput}
                    placeholder="Ít nhất 8 ký tự"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!canSubmit || creating}
                >
                  {creating ? "Đang tạo..." : "Tạo admin"}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card border rounded-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Danh sách admin ({admins.length})</h5>
                <button
                  type="button"
                  className="btn btn-light btn-sm"
                  onClick={fetchAdmins}
                  disabled={loading}
                >
                  {loading ? "Đang tải..." : "Làm mới"}
                </button>
              </div>
              {loading ? (
                <p className="text-muted mb-0">Đang tải dữ liệu...</p>
              ) : admins.length === 0 ? (
                <p className="text-muted mb-0">
                  Chưa có tài khoản admin nào khác.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Tên</th>
                        <th>Email</th>
                        <th>Điện thoại</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin._id}>
                          <td className="fw-semibold">{admin.name}</td>
                          <td>{admin.email}</td>
                          <td>{admin.phone || "-"}</td>
                          <td className="text-muted">
                            {admin.createdAt
                              ? new Date(admin.createdAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admins;

