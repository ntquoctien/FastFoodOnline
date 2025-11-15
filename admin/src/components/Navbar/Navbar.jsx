import axios from "axios";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const {
    token,
    role,
    user,
    clearAuth,
    refreshProfile,
    profileLoading,
  } = useContext(StoreContext);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const apiBaseUrl =
    import.meta.env.VITE_API_URL || "http://localhost:4000";

  const roleLabel = useMemo(() => {
    if (!role) return "Guest";
    return role
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }, [role]);

  const logout = () => {
    clearAuth();
    toast.success("Logout successfully");
    navigate("/", { replace: true });
  };

  useEffect(() => {
    if (token && !user && !profileLoading) {
      refreshProfile();
    }
  }, [token, user, profileLoading, refreshProfile]);

  const notificationsAnchorRef = useRef(null);
  const notificationsPanelRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setNotificationsLoading(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/v2/notifications`, {
        headers: { token },
      });
      if (response.data?.success) {
        const list = response.data.notifications || response.data.data || [];
        setNotifications(Array.isArray(list) ? list : []);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.warn("Failed to fetch notifications", error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(interval);
  }, [token, fetchNotifications]);

  const markAllRead = useCallback(async () => {
    if (notifications.length === 0) return;
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true }))
    );
    try {
      await axios.post(
        `${apiBaseUrl}/api/v2/notifications/mark-read`,
        {},
        { headers: { token } }
      );
    } catch (error) {
      console.warn("Failed to mark notifications read", error);
    }
  }, [apiBaseUrl, token, notifications.length]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification?.read).length,
    [notifications]
  );

  const renderBellIcon = () => (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="navbar-bell-icon"
    >
      <path
        d="M12 2a6 6 0 0 0-6 6v2.586c0 .512-.195 1.004-.543 1.372l-.964 1.01A1.5 1.5 0 0 0 5.793 16h12.414a1.5 1.5 0 0 0 1.3-2.032l-.964-1.01A1.94 1.94 0 0 1 18 10.586V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.995-2.824L15 19h-6a3 3 0 0 0 2.824 2.995L12 22Z"
        fill="currentColor"
      />
    </svg>
  );

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleClick = (event) => {
      if (
        notificationsAnchorRef.current?.contains(event.target) ||
        notificationsPanelRef.current?.contains(event.target)
      ) {
        return;
      }
      setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!token) {
      setNotificationsOpen(false);
      setNotifications([]);
    }
  }, [token]);

  return (
    <header className="mb-4">
      <div className="navbar navbar-expand rounded-4 shadow-sm bg-white px-3 py-2 align-items-center">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-primary d-xl-none"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <i className="bi bi-list fs-4" />
          </button>
          <div>
            <h3 className="mb-0">Admin Console</h3>
            <small className="text-muted">
              {user?.name ? `Welcome back, ${user.name}` : "Manage branches and operations"}
            </small>
          </div>
        </div>
        <div className="ms-auto d-flex align-items-center gap-3 position-relative">
          {token ? (
            <>
              <div className="dropdown">
                <button
                  type="button"
                  className={`btn btn-light rounded-circle p-2 position-relative ${notificationsOpen ? "active" : ""}`}
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  aria-label="Notifications"
                  ref={notificationsAnchorRef}
                >
                  {renderBellIcon()}
                  {unreadCount > 0 ? (
                    <span className="badge bg-danger position-absolute top-0 end-0 translate-middle rounded-pill">
                      {unreadCount}
                    </span>
                  ) : null}
                </button>
                {notificationsOpen ? (
                  <div
                    className="dropdown-menu dropdown-menu-end show shadow border-0 rounded-4 p-0"
                    ref={notificationsPanelRef}
                  >
                    <div className="card border-0 mb-0 rounded-4">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Notifications</h6>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-decoration-none"
                          onClick={markAllRead}
                          disabled={notificationsLoading || notifications.length === 0}
                        >
                          Mark as read
                        </button>
                      </div>
                      <div className="card-body p-0">
                        {notificationsLoading ? (
                          <p className="text-center text-muted py-4 mb-0">Loading...</p>
                        ) : notifications.length === 0 ? (
                          <p className="text-center text-muted py-4 mb-0">
                            You're all caught up!
                          </p>
                        ) : (
                          <ul className="list-group list-group-flush">
                            {notifications.map((notification) => (
                              <li
                                key={notification._id || notification.id}
                                className={`list-group-item ${notification.read ? "" : "bg-light"} `}
                              >
                                <p className="mb-1 fw-semibold">
                                  {notification.title || "System update"}
                                </p>
                                {notification.message ? (
                                  <small className="text-muted d-block">
                                    {notification.message}
                                  </small>
                                ) : null}
                                {notification.createdAt ? (
                                  <small className="text-muted">
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </small>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="d-flex align-items-center gap-3">
                <div className="avatar avatar-xl position-relative">
                  <img
                    src={user?.avatarUrl || assets.profile_image}
                    alt={user?.name || "Profile"}
                    onError={(event) => {
                      event.currentTarget.src = assets.profile_image;
                    }}
                  />
                  <span className="avatar-status bg-success"></span>
                </div>
                <div>
                  <p className="mb-0 fw-semibold">{user?.name || "Administrator"}</p>
                  <small className="text-muted text-capitalize">{roleLabel}</small>
                </div>
                <button type="button" className="btn btn-danger" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => navigate("/")}>
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
