import React, { useContext, useEffect, useMemo, useState } from "react";
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

const Staff = ({ url }) => {
  const { token } = useContext(StoreContext);
  const [staffMembers, setStaffMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [endpointUnavailable, setEndpointUnavailable] = useState(false);
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

  const fetchBranches = async () => {
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
    if (!token) return;
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
    if (!token) return;
    fetchBranches();
    fetchStaff();
  }, [token]);

  useEffect(() => {
    if (!form.branchId && branches.length) {
      setForm((prev) => ({ ...prev, branchId: branches[0]._id }));
    }
  }, [branches, form.branchId]);

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

  const updateStatus = async (staffId, status) => {
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
        `${url}/api/v2/staff/${staffId}`,
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
      toast.error("Unable to update status");
    }
  };

  const resetPassword = async (staffId) => {
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
          API for staff management is not yet available. Entries created here are
          stored temporarily for design preview.
        </div>
      ) : null}

      <div className="staff-layout">
        <section className="staff-form-card">
          <h3>Add team member</h3>
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
                      updateStatus(member._id, event.target.value)
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => resetPassword(member._id)}>
                    Reset password
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
};

export default Staff;
