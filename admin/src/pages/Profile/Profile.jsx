import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import "./Profile.css";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";

const Profile = () => {
  const { user, updateProfile, refreshProfile, profileLoading } =
    useContext(StoreContext);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const avatarObjectUrlRef = useRef(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    }));
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    setAvatarPreview(user?.avatarUrl || "");
    setAvatarFile(null);
    setRemoveAvatar(false);
    setChangePassword(false);
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
    };
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordChange = () => {
    setChangePassword((prev) => {
      if (prev) {
        setForm((prevForm) => ({
          ...prevForm,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
      return !prev;
    });
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
    const objectUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = objectUrl;
    setAvatarPreview(objectUrl);
    setAvatarFile(file);
    setRemoveAvatar(false);
    event.target.value = "";
  };

  const handleRemoveAvatar = () => {
    if (avatarFile) {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current);
        avatarObjectUrlRef.current = null;
      }
      setAvatarFile(null);
      setAvatarPreview(user?.avatarUrl || "");
      setRemoveAvatar(false);
      return;
    }
    if (removeAvatar) {
      setAvatarPreview(user?.avatarUrl || "");
      setRemoveAvatar(false);
      return;
    }
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    if (changePassword) {
      if (!form.newPassword || !form.confirmPassword) {
        toast.error("Please fill both new password fields");
        return;
      }
      if (form.newPassword !== form.confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      if (form.newPassword.length < 8) {
        toast.error("New password must have at least 8 characters");
        return;
      }
      if (!form.currentPassword) {
        toast.error("Current password is required to change password");
        return;
      }
    }

    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("email", form.email.trim());
    formData.append("phone", form.phone.trim());
    if (changePassword) {
      formData.append("currentPassword", form.currentPassword);
      formData.append("newPassword", form.newPassword);
    }
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    } else if (removeAvatar) {
      formData.append("removeAvatar", "true");
    }

    setSaving(true);
    try {
      const response = await updateProfile(formData);
      if (response?.success) {
        toast.success("Profile updated");
        setForm((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setChangePassword(false);
        if (avatarObjectUrlRef.current) {
          URL.revokeObjectURL(avatarObjectUrlRef.current);
          avatarObjectUrlRef.current = null;
        }
        setAvatarFile(null);
        setRemoveAvatar(false);
        await refreshProfile();
      } else {
        toast.error(response?.message || "Unable to update profile");
      }
    } catch (error) {
      console.error("Profile update failed", error);
      toast.error("Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = avatarPreview || assets.profile_image;
  const showRemoveButton = Boolean(avatarPreview || user?.avatarUrl);
  const removeButtonLabel = avatarFile
    ? "Cancel upload"
    : removeAvatar
    ? "Undo remove"
    : "Remove photo";

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h2>My Profile</h2>
          <p>Manage your personal information and dashboard access.</p>
        </div>
        <div className="profile-avatar">
          <div className="profile-avatar-preview">
            <img
              src={avatarSrc}
              alt={form.name || "Profile avatar"}
              onError={(event) => {
                event.currentTarget.src = assets.profile_image;
              }}
            />
          </div>
          <div className="profile-avatar-actions">
            <label
              className="profile-avatar-upload"
              data-disabled={profileLoading || saving ? "true" : "false"}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={profileLoading || saving}
              />
              Change photo
            </label>
            {showRemoveButton ? (
              <button
                type="button"
                className="profile-avatar-remove"
                onClick={handleRemoveAvatar}
                disabled={profileLoading || saving}
              >
                {removeButtonLabel}
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="profile-grid">
          <label className="profile-field">
            <span>Full name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={onChange}
              disabled={profileLoading || saving}
              required
            />
          </label>
          <label className="profile-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              disabled={profileLoading || saving}
              />
          </label>
          <label className="profile-field">
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={onChange}
              disabled={profileLoading || saving}
            />
          </label>
        </div>

        <section className="profile-password">
          <div className="profile-password-header">
            <div>
              <h3>Update password</h3>
              <p>Only change your password when you really need to.</p>
            </div>
            <button
              type="button"
              className="profile-password-toggle"
              onClick={togglePasswordChange}
              disabled={profileLoading || saving}
            >
              {changePassword ? "Cancel" : "Change password"}
            </button>
          </div>
          {changePassword ? (
            <div className="profile-grid profile-password-grid">
              <label className="profile-field">
                <span>Current password</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={onChange}
                  disabled={profileLoading || saving}
                  placeholder="Enter current password"
                />
              </label>
              <label className="profile-field">
                <span>New password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={onChange}
                  disabled={profileLoading || saving}
                  placeholder="Enter new password"
                />
              </label>
              <label className="profile-field">
                <span>Confirm new password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={onChange}
                  disabled={profileLoading || saving}
                  placeholder="Confirm new password"
                />
              </label>
            </div>
          ) : (
            <p className="profile-password-hint">
              You can update your password whenever you need extra security.
            </p>
          )}
        </section>

        <footer className="profile-actions">
          <button type="submit" disabled={saving || profileLoading}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </footer>
      </form>
    </div>
  );
};

export default Profile;

