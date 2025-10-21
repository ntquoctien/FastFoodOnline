import React, { useContext, useEffect } from "react";
import "./Login.css";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";

const allowedRoles = ["admin", "manager", "branch_manager", "staff"];

const Login = ({ url }) => {
  const navigate = useNavigate();
  const { token, role, persistAuth } = useContext(StoreContext);
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const response = await axios.post(url + "/api/user/login", data);
      if (response.data.success) {
        const userRole = response.data.role;
        if (!allowedRoles.includes(userRole)) {
          toast.error("Your account does not have dashboard access");
          setLoading(false);
          return;
        }
        const userProfile =
          response.data.user ||
          response.data.profile || {
            name: response.data.name || data.email.split("@")[0],
            email: response.data.email || data.email,
            avatarUrl: response.data.avatarUrl || "",
          };
        persistAuth({
          token: response.data.token,
          role: userRole,
          branchId: response.data.branchId || "",
          user: userProfile,
        }, { remember: rememberMe });
        toast.success("Login successfully");
        if (userRole === "admin") {
          navigate("/add", { replace: true });
        } else {
          navigate("/branch/menu", { replace: true });
        }
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Admin login failed", error);
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && role) {
      if (role === "admin") {
        navigate("/add", { replace: true });
      } else {
        navigate("/branch/menu", { replace: true });
      }
    }
  }, [token, role, navigate]);

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>Dashboard Login</h2>
        </div>
        <div className="login-popup-inputs">
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            required
            disabled={loading}
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Your password"
            required
            disabled={loading}
          />
        </div>
        <label className="login-remember">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            disabled={loading}
          />
          <span>Remember me</span>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
    </div>
  );
};

export default Login;
