import axios from "axios";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
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
    <header className="navbar">
      <div className="navbar-left">
        <img className="logo" src={assets.logo} alt="Tomato admin" />
        <div className="navbar-title">
          <h1>Admin Console</h1>
          <p>
            {user?.name ? `Welcome back, ${user.name}` : "Manage branches and operations"}
          </p>
        </div>
      </div>
      <div className="navbar-actions">
        {token ? (
          <>
            <button
              type="button"
              className={`navbar-icon-button ${notificationsOpen ? "is-active" : ""}`}
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-label="Notifications"
              ref={notificationsAnchorRef}
            >
              {renderBellIcon()}
              {unreadCount > 0 ? <span className="navbar-badge">{unreadCount}</span> : null}
            </button>
            {notificationsOpen ? (
              <div className="navbar-notifications" ref={notificationsPanelRef}>
                <div className="navbar-notifications-header">
                  <p>Notifications</p>
                  <button
                    type="button"
                    disabled={notificationsLoading || notifications.length === 0}
                    onClick={markAllRead}
                  >
                    Mark as read
                  </button>
                </div>
                <div className="navbar-notifications-body">
                  {notificationsLoading ? (
                    <p className="navbar-notifications-empty">Loading...</p>
                  ) : notifications.length === 0 ? (
                    <p className="navbar-notifications-empty">
                      You're all caught up!
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification._id || notification.id}
                        className={`navbar-notification ${
                          notification.read ? "" : "navbar-notification-unread"
                        }`}
                      >
                        <p className="navbar-notification-title">
                          {notification.title || "System update"}
                        </p>
                        {notification.message ? (
                          <p className="navbar-notification-message">
                            {notification.message}
                          </p>
                        ) : null}
                        {notification.createdAt ? (
                          <span className="navbar-notification-meta">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
            <div className="navbar-divider" />
            <div className="navbar-profile">
              <div className="navbar-avatar">
                <img
                  src={user?.avatarUrl || assets.profile_image}
                  alt={user?.name || "Profile"}
                  onError={(event) => {
                    event.currentTarget.src = assets.profile_image;
                  }}
                />
                <span className="navbar-status-indicator" />
              </div>
              <div className="navbar-profile-copy">
                <span className="navbar-profile-name">
                  {user?.name || "Administrator"}
                </span>
                <span className="navbar-profile-role">{roleLabel}</span>
              </div>
              <button type="button" className="navbar-logout" onClick={logout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="navbar-logout" onClick={() => navigate("/")}>
            Login
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
