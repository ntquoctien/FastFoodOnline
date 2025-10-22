import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import "./Staff.css";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const roleOptions = [
  { value: "manager", label: "Branch Manager" },
  { value: "staff", label: "Staff" },
  { value: "chef", label: "Kitchen" },
  { value: "support", label: "Support" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On leave" },
];

const MANAGEABLE_ROLES = ["staff", "chef", "support"];

const Staff = ({ url }) => {
  const { token, role: currentRole, branchId: currentBranchId } =
    useContext(StoreContext);
  const isAdmin = currentRole === "admin";
  const isBranchManager =
    currentRole === "branch_manager" || currentRole === "manager";
  const canManageStaff = isAdmin || isBranchManager;
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [endpointUnavailable, setEndpointUnavailable] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    role: roleOptions[1]?.value || "staff",
    branchId: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: roleOptions[0].value,
    branchId: "",
    password: "",
  });

  const branchNameMap = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(branch._id, branch.name));
    return map;
  }, [branches]);

  const editRoleOptions = useMemo(() => {
    if (isAdmin) return roleOptions;
    return roleOptions.filter((role) => MANAGEABLE_ROLES.includes(role.value));
  }, [isAdmin]);

  const normaliseId = useCallback((value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value._id) return value._id;
    if (typeof value.toString === "function") return value.toString();
    return "";
  }, []);

  const canManageMember = useCallback(
    (member) => {
      if (!member) return false;
      if (isAdmin) return true;
      if (!isBranchManager) return false;
      const managerBranch = normaliseId(currentBranchId);
      if (!managerBranch) return false;
      const memberBranch = normaliseId(member.branchId);
      if (managerBranch !== memberBranch) return false;
      return MANAGEABLE_ROLES.includes(member.role);
    },
    [isAdmin, isBranchManager, currentBranchId, normaliseId]
  );

  const fetchBranches = async () => {
    if (!canManageStaff) return;
    try {
      const response = await axios.get(`${url}/api/v2/branches`, {
        headers: { token },
      });
      if (response.data?.success) {
        setBranches(response.data.data?.branches || []);
      }
    } catch (error) {
      console.warn("Failed to load branches for staff manager", error);
    }
  };

  const fetchStaff = async () => {
    if (!token || !canManageStaff) return;
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/v2/staff`, {
        headers: { token },
      });
      if (response.data?.success) {
        setStaffMembers(response.data.data || []);
        setEndpointUnavailable(false);
        return;
      }
      setEndpointUnavailable(true);
    } catch (error) {
      console.warn("Staff endpoint unavailable", error);
      setEndpointUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !canManageStaff) return;
    fetchBranches();
    fetchStaff();
  }, [token, canManageStaff]);

  useEffect(() => {
    if (!form.branchId && branches.length) {
      setForm((prev) => ({ ...prev, branchId: branches[0]._id }));
    }
  }, [branches, form.branchId]);

  useEffect(() => {
    if (!canManageStaff) return;
    if (!isAdmin && currentBranchId && filterBranch === "all") {
      setFilterBranch(currentBranchId);
    }
  }, [canManageStaff, isAdmin, currentBranchId, filterBranch]);

  const filteredStaff = useMemo(() => {
    return staffMembers.filter((member) => {
      if (filterBranch !== "all" && member.branchId !== filterBranch) return false;
      if (filterRole !== "all" && member.role !== filterRole) return false;
      return true;
    });
  }, [staffMembers, filterBranch, filterRole]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      role: roleOptions[0].value,
      branchId: branches[0]?._id || "",
      password: "",
    });
  };

  const resetEditState = () => {
    setEditingStaff(null);
    setEditForm({
      name: "",
      phone: "",
      role: roleOptions[1]?.value || "staff",
      branchId: "",
    });
  };

  const openEditProfile = (member) => {
    if (!canManageMember(member)) {
      toast.error("You are not allowed to edit this profile");
      return;
    }
    setEditingStaff(member);
    setEditForm({
      name: member.name || "",
      phone: member.phone || "",
      role: member.role || (roleOptions[1]?.value || "staff"),
      branchId: normaliseId(member.branchId),
    });
  };

  const closeEditProfile = () => {
    if (editSaving) return;
    resetEditState();
  };

  const updateEditForm = (event) => {
    const { name, value } = event.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEditProfile = async (event) => {
    event.preventDefault();
    if (!editingStaff || editSaving) return;
    const payload = {};
    const trimmedName = editForm.name.trim();
    if (trimmedName && trimmedName !== (editingStaff.name || "").trim()) {
      payload.name = trimmedName;
    }
    const trimmedPhone = editForm.phone.trim();
    if (trimmedPhone !== (editingStaff.phone || "")) {
      payload.phone = trimmedPhone;
    }
    if (editForm.role && editForm.role !== editingStaff.role) {
      payload.role = editForm.role;
    }
    if (isAdmin) {
      const originalBranch = normaliseId(editingStaff.branchId);
      const nextBranch = editForm.branchId ? editForm.branchId : "";
      if (nextBranch !== (originalBranch || "")) {
        payload.branchId = nextBranch;
      }
    }
    if (Object.keys(payload).length === 0) {
      toast.info("No changes to save");
      return;
    }
    setEditSaving(true);
    try {
      const response = await axios.patch(
        `${url}/api/v2/staff/${editingStaff._id}`,
        payload,
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Staff profile updated");
        resetEditState();
        fetchStaff();
      } else {
        toast.error(response.data?.message || "Unable to update profile");
      }
    } catch (error) {
      console.error("Update staff profile failed", error);
      if (error.response?.status === 403) {
        toast.error("You are not allowed to update this profile");
      } else {
        toast.error("Unable to update profile");
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!form.branchId) {
      toast.error("Please select a branch for this staff member");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      branchId: form.branchId,
      password: form.password,
    };

    if (endpointUnavailable) {
      const fallbackStaff = {
        _id: `local-${Date.now()}`,
        status: "active",
        ...payload,
        branchName: branchNameMap.get(form.branchId),
      };
      setStaffMembers((prev) => [fallbackStaff, ...prev]);
      toast.success("Staff member added (local preview)");
      resetForm();
      setSaving(false);
      return;
    }

    try {
      const response = await axios.post(`${url}/api/v2/staff`, payload, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Staff member created");
        fetchStaff();
        resetForm();
      } else {
        toast.error(response.data?.message || "Failed to create staff member");
      }
    } catch (error) {
      console.error("Create staff failed", error);
      toast.info("API unavailable. Staff member added locally for preview.");
      setEndpointUnavailable(true);
      setStaffMembers((prev) => [
        {
          _id: `local-${Date.now()}`,
          status: "active",
          ...payload,
          branchName: branchNameMap.get(payload.branchId),
        },
        ...prev,
      ]);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (staffMember, status) => {
    if (!canManageMember(staffMember)) {
      toast.error("You are not allowed to update this status");
      return;
    }
    const staffId = staffMember._id;
    if (endpointUnavailable) {
      setStaffMembers((prev) =>
        prev.map((member) =>
          member._id === staffId ? { ...member, status } : member
        )
      );
      toast.success("Status updated (local preview)");
      return;
    }
    try {
      const response = await axios.patch(
        `${url}/api/v2/staff/${staffId}/status`,
        { status },
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Status updated");
        fetchStaff();
      } else {
        toast.error(response.data?.message || "Unable to update status");
      }
    } catch (error) {
      console.error("Update staff failed", error);
      if (error.response?.status === 403) {
        toast.error("You are not allowed to update this status");
      } else {
        toast.error("Unable to update status");
      }
    }
  };

  const resetPassword = async (staffId) => {
    if (!isAdmin) {
      toast.error("You are not allowed to reset passwords");
      return;
    }
    if (endpointUnavailable) {
      toast.info("Password reset simulated (API not available)");
      return;
    }
    try {
      const response = await axios.post(
        `${url}/api/v2/staff/${staffId}/reset-password`,
        {},
        { headers: { token } }
      );
      if (response.data?.success) {
        toast.success("Password reset instructions sent");
      } else {
        toast.error(response.data?.message || "Unable to reset password");
      }
    } catch (error) {
      console.error("Reset password failed", error);
      toast.error("Unable to reset password");
    }
  };

  if (!canManageStaff) {
    return (
      <div className="staff-page">
        <header className="staff-header">
          <div>
            <h2>Staff Management</h2>
            <p>You do not have permission to manage staff.</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <header className="staff-header">
        <div>
          <h2>Staff Management</h2>
          <p>Invite and manage team members for each branch.</p>
        </div>
        <div className="staff-filters">
          <select
            value={filterBranch}
            onChange={(event) => setFilterBranch(event.target.value)}
          >
            <option value="all">All branches</option>
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(event) => setFilterRole(event.target.value)}
          >
            <option value="all">All roles</option>
            {roleOptions.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {endpointUnavailable ? (
        <div className="staff-banner">
          Staff API is temporarily unavailable. Changes are stored locally for preview.
        </div>
      ) : null}

      <div className={`staff-layout${isAdmin ? "" : " staff-layout-single"}`}>
        {isAdmin ? (
          <section className="staff-form-card">
            <h3>Invite new staff</h3>
            <form onSubmit={handleCreate}>
            <label>
              <span>Full name</span>
              <input
                name="name"
                value={form.name}
                onChange={updateForm}
                placeholder="Eg. Sarah Tran"
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateForm}
                placeholder="staff@example.com"
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select name="role" value={form.role} onChange={updateForm}>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Branch</span>
              <select
                name="branchId"
                value={form.branchId}
                onChange={updateForm}
                required
              >
                {branches.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Temporary password</span>
              <input
                name="password"
                value={form.password}
                onChange={updateForm}
                placeholder="Generate or set a password"
                required={!endpointUnavailable}
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Invite team member"}
            </button>
          </form>
        </section>
        ) : null}

        <section className="staff-list">
          {loading ? (
            <div className="staff-empty">Loading staff members...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="staff-empty">
              No staff members match the current filters.
            </div>
          ) : (
            filteredStaff.map((member) => (
              <article key={member._id} className="staff-card">
                <div className="staff-card-main">
                  <div className="staff-avatar">
                    {member.name?.[0]?.toUpperCase() || "S"}
                  </div>
                  <div className="staff-card-info">
                    <h4>{member.name || "Unnamed"}</h4>
                    <p>{member.email}</p>
                    <span className="staff-badge">
                      {roleOptions.find((role) => role.value === member.role)?.label ||
                        member.role ||
                        "Role"}
                    </span>
                  </div>
                </div>
                <div className="staff-card-meta">
                  <p>
                    <strong>Branch:</strong>{" "}
                    {branchNameMap.get(member.branchId) ||
                      member.branchName ||
                      "Unassigned"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`staff-status staff-status-${member.status || "active"}`}>
                      {statusOptions.find((status) => status.value === member.status)?.label ||
                        member.status ||
                        "Active"}
                    </span>
                  </p>
                </div>
                <div className="staff-card-actions">
                  <select
                    value={member.status || "active"}
                    onChange={(event) =>
                      updateStatus(member, event.target.value)
                    }
                    disabled={!canManageMember(member)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {canManageMember(member) ? (
                    <button
                      type="button"
                      onClick={() => openEditProfile(member)}
                    >
                      Edit profile
                    </button>
                  ) : null}
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => resetPassword(member._id)}
                    >
                      Reset password
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </section>
      </div>
      {editingStaff ? (
        <div className="staff-edit-modal" role="dialog" aria-modal="true">
          <div
            className="staff-edit-modal-backdrop"
            onClick={closeEditProfile}
          />
          <div className="staff-edit-modal-card">
            <h3>Edit profile</h3>
            <p className="staff-edit-subtitle">
              Update details for{" "}
              <strong>{editingStaff.name || editingStaff.email}</strong>
            </p>
            <form onSubmit={submitEditProfile}>
              <label>
                <span>Full name</span>
                <input
                  name="name"
                  value={editForm.name}
                  onChange={updateEditForm}
                  required
                  disabled={editSaving}
                />
              </label>
              <label>
                <span>Role</span>
                <select
                  name="role"
                  value={editForm.role}
                  onChange={updateEditForm}
                  disabled={editSaving || editRoleOptions.length === 0}
                >
                  {editRoleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>
              {isAdmin ? (
                <label>
                  <span>Branch</span>
                  <select
                    name="branchId"
                    value={editForm.branchId || ""}
                    onChange={updateEditForm}
                    disabled={editSaving}
                  >
                    <option value="">Unassigned</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label>
                  <span>Branch</span>
                  <input
                    value={
                      branchNameMap.get(normaliseId(editingStaff.branchId)) ||
                      editingStaff.branchName ||
                      "Unassigned"
                    }
                    readOnly
                  />
                </label>
              )}
              <label>
                <span>Phone</span>
                <input
                  name="phone"
                  value={editForm.phone}
                  onChange={updateEditForm}
                  placeholder="Optional contact number"
                  disabled={editSaving}
                />
              </label>
              <div className="staff-edit-actions">
                <button
                  type="button"
                  onClick={closeEditProfile}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button type="submit" disabled={editSaving}>
                  {editSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Staff;
