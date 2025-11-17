import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";
import { toast } from "react-toastify";

const roleOptions = [
  { value: "branch_manager", label: "Branch Manager" },
  { value: "manager", label: "Manager" },
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
const DRONE_ROLE = "shipper";
const DEFAULT_FORM_ROLE = "staff";
const isLocalStaffId = (value) => String(value || "").startsWith("local-");

const isDroneActor = (member) =>
  String(member?.role || "").toLowerCase() === DRONE_ROLE;

const statusBadgeMap = {
  active: "badge bg-success-subtle text-success",
  inactive: "badge bg-secondary-subtle text-secondary",
  on_leave: "badge bg-warning-subtle text-warning",
};

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
    role: DEFAULT_FORM_ROLE,
    branchId: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: DEFAULT_FORM_ROLE,
    branchId: "",
    password: "",
  });
  const [deletingStaffId, setDeletingStaffId] = useState(null);

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
        const staffList = response.data.data || [];
        setStaffMembers(staffList.filter((member) => !isDroneActor(member)));
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
      const memberBranchId = normaliseId(member.branchId);
      if (filterBranch !== "all" && memberBranchId !== filterBranch) return false;
      if (filterRole !== "all" && member.role !== filterRole) return false;
      return true;
    });
  }, [staffMembers, filterBranch, filterRole, normaliseId]);

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      email: "",
      role: DEFAULT_FORM_ROLE,
      branchId: branches[0]?._id || "",
      password: "",
    });
  };

  const resetEditState = () => {
    setEditingStaff(null);
    setEditForm({
      name: "",
      phone: "",
      role: DEFAULT_FORM_ROLE,
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
      role: member.role || DEFAULT_FORM_ROLE,
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
      if (error.response) {
        toast.error(
          error.response.data?.message || "Failed to create staff member"
        );
      } else {
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
      }
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

  const deleteStaffMember = async (member) => {
    if (!member) return;
    if (!canManageMember(member)) {
      toast.error("You are not allowed to delete this member");
      return;
    }
    const confirmed = window.confirm(
      `Remove ${member.name || member.email || "this member"}?`
    );
    if (!confirmed) return;
    const staffId = member._id;
    if (endpointUnavailable || isLocalStaffId(staffId)) {
      setStaffMembers((prev) => prev.filter((entry) => entry._id !== staffId));
      toast.success("Staff member removed");
      return;
    }
    setDeletingStaffId(staffId);
    try {
      const response = await axios.delete(`${url}/api/v2/staff/${staffId}`, {
        headers: { token },
      });
      if (response.data?.success) {
        toast.success("Staff member removed");
        fetchStaff();
      } else {
        toast.error(response.data?.message || "Unable to delete staff member");
      }
    } catch (error) {
      console.error("Delete staff failed", error);
      toast.error(
        error.response?.data?.message || "Unable to delete staff member"
      );
    } finally {
      setDeletingStaffId(null);
    }
  };

  const renderEditModal = () => {
    if (!editingStaff) return null;
    return (
      <>
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          onClick={closeEditProfile}
        >
          <div
            className="modal-dialog modal-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header border-0">
                <div>
                  <h5 className="mb-1">Edit profile</h5>
                  <small className="text-muted">
                    Update details for{" "}
                    <strong>{editingStaff.name || editingStaff.email}</strong>
                  </small>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={closeEditProfile}
                />
              </div>
              <form onSubmit={submitEditProfile}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={editForm.name}
                      onChange={updateEditForm}
                      required
                      disabled={editSaving}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Role</label>
                    <select
                      className="form-select"
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
                  </div>
                  {isAdmin ? (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Branch</label>
                      <select
                        className="form-select"
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
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Branch</label>
                      <input
                        className="form-control"
                        value={
                          branchNameMap.get(normaliseId(editingStaff.branchId)) ||
                          editingStaff.branchName ||
                          "Unassigned"
                        }
                        readOnly
                      />
                    </div>
                  )}
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Phone</label>
                    <input
                      className="form-control"
                      name="phone"
                      value={editForm.phone}
                      onChange={updateEditForm}
                      placeholder="Optional contact number"
                      disabled={editSaving}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={closeEditProfile}
                    disabled={editSaving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editSaving}>
                    {editSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-backdrop fade show" />
      </>
    );
  };

  if (!canManageStaff) {
    return (
      <div className="page-heading">
        <div className="page-title-headings">
          <h3>Staff Management</h3>
          <p className="text-muted mb-0">
            You do not have permission to manage staff.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-heading">
      <div className="page-title-headings d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3 mb-4">
        <div>
          <h3 className="mb-1">Staff Management</h3>
          <p className="text-muted mb-0">
            Invite and manage team members for each branch.
          </p>
        </div>
        <div className="d-flex flex-column flex-lg-row gap-2 w-100 w-lg-auto">
          <select
            className="form-select"
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
            className="form-select"
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
      </div>

      {endpointUnavailable ? (
        <div className="alert alert-warning rounded-4" role="alert">
          Staff API is temporarily unavailable. Changes are stored locally for preview.
        </div>
      ) : null}

      <div className="row g-4">
        {isAdmin ? (
          <div className="col-12 col-xl-4">
            <div className="card border rounded-4 h-100">
              <div className="card-header border-0">
                <h5 className="mb-1">Invite new staff</h5>
                <small className="text-muted">
                  Create accounts for new team members.
                </small>
              </div>
              <div className="card-body">
                <form onSubmit={handleCreate} className="d-flex flex-column gap-3">
                  <div>
                    <label className="form-label">Full name</label>
                    <input
                      className="form-control"
                      name="name"
                      value={form.name}
                      onChange={updateForm}
                      placeholder="Eg. Sarah Tran"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={updateForm}
                      placeholder="staff@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      name="role"
                      value={form.role}
                      onChange={updateForm}
                    >
                      {roleOptions.map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Branch</label>
                    <select
                      className="form-select"
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
                  </div>
                  <div>
                    <label className="form-label">Temporary password</label>
                    <input
                      className="form-control"
                      name="password"
                      value={form.password}
                      onChange={updateForm}
                      placeholder="Generate or set a password"
                      required={!endpointUnavailable}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Creating..." : "Invite team member"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : null}

        <div className={`col-12 ${isAdmin ? "col-xl-8" : ""}`}>
          <div className="card border rounded-4 h-100">
            <div className="card-header border-0">
              <h5 className="mb-0">Team members</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <p className="text-muted mb-0">Loading staff members...</p>
                </div>
              ) : filteredStaff.length === 0 ? (
                <p className="text-muted mb-0">
                  No staff members match the current filters.
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead className="text-muted small text-uppercase">
                      <tr>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((member) => {
                        const roleLabel =
                          roleOptions.find((role) => role.value === member.role)?.label ||
                          member.role ||
                          "Role";
                        const statusClass =
                          statusBadgeMap[member.status] || statusBadgeMap.active;
                        return (
                          <tr key={member._id}>
                            <td>
                              <div className="fw-semibold">{member.name || "Unnamed"}</div>
                              <small className="text-muted">{member.email}</small>
                            </td>
                            <td className="text-muted">
                              {branchNameMap.get(normaliseId(member.branchId)) ||
                                member.branchName ||
                                "Unassigned"}
                            </td>
                            <td>
                              <span className="badge bg-primary-subtle text-primary">
                                {roleLabel}
                              </span>
                            </td>
                            <td>
                              <span className={statusClass}>
                                {statusOptions.find(
                                  (status) => status.value === member.status
                                )?.label || member.status || "Active"}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex flex-column flex-lg-row gap-2 justify-content-end">
                                <select
                                  className="form-select form-select-sm"
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
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => openEditProfile(member)}
                                  >
                                    Edit profile
                                  </button>
                                ) : null}
                                {canManageMember(member) ? (
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => deleteStaffMember(member)}
                                    disabled={deletingStaffId === member._id}
                                  >
                                    {deletingStaffId === member._id
                                      ? "Removing..."
                                      : "Delete"}
                                  </button>
                                ) : null}
                                {isAdmin ? (
                                  <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => resetPassword(member._id)}
                                  >
                                    Reset password
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {renderEditModal()}
    </div>
  );
};

export default Staff;
