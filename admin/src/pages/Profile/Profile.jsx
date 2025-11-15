import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
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
    <div className="page-heading">
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-1">Account profile</h5>
              <small className="text-muted">
                Update your basic information and avatar.
              </small>
            </div>
            <div className="card-body d-flex flex-column align-items-center gap-3">
              <div className="rounded-circle overflow-hidden" style={{ width: 140, height: 140 }}>
                <img
                  src={avatarSrc}
                  alt={form.name || "Profile avatar"}
                  className="img-fluid w-100 h-100 object-fit-cover"
                  onError={(event) => {
                    event.currentTarget.src = assets.profile_image;
                  }}
                />
              </div>
              <div className="d-flex flex-column gap-2 w-100">
                <label className="btn btn-outline-primary w-100">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={profileLoading || saving}
                    hidden
                  />
                  Change photo
                </label>
                {showRemoveButton ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleRemoveAvatar}
                    disabled={profileLoading || saving}
                  >
                    {removeButtonLabel}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border rounded-4">
            <div className="card-header border-0">
              <h5 className="mb-0">Account details</h5>
            </div>
            <form onSubmit={handleSubmit} className="card-body d-flex flex-column gap-3">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Full name</label>
                  <input
                    className="form-control"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    disabled={profileLoading || saving}
                    required
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    className="form-control"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    disabled={profileLoading || saving}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label">Phone</label>
                  <input
                    className="form-control"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    disabled={profileLoading || saving}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="border rounded-4 p-3 bg-body-tertiary">
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
                  <div>
                    <h6 className="mb-0">Update password</h6>
                    <small className="text-muted">
                      Only change your password when you really need to.
                    </small>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={togglePasswordChange}
                    disabled={profileLoading || saving}
                  >
                    {changePassword ? "Cancel" : "Change password"}
                  </button>
                </div>
                {changePassword ? (
                  <div className="row g-3 mt-0 pt-3">
                    <div className="col-12">
                      <label className="form-label">Current password</label>
                      <input
                        className="form-control"
                        type="password"
                        name="currentPassword"
                        value={form.currentPassword}
                        onChange={onChange}
                        disabled={profileLoading || saving}
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">New password</label>
                      <input
                        className="form-control"
                        type="password"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={onChange}
                        disabled={profileLoading || saving}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Confirm new password</label>
                      <input
                        className="form-control"
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={onChange}
                        disabled={profileLoading || saving}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-muted small mb-0 pt-3">
                    You can update your password whenever you need extra security.
                  </p>
                )}
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary" disabled={saving || profileLoading}>
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

