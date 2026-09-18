"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  KeyRound,
  Edit2,
  CheckCircle2,
  Ban,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface UsersClientProps {
  initialUsers: any[];
  departments: any[];
  currentUser: any;
}

export const UsersClient: React.FC<UsersClientProps> = ({
  initialUsers,
  departments,
  currentUser,
}) => {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");

  // Create user modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    role: "EMPLOYEE",
    departmentId: departments[0]?.id || "",
    designation: "",
    skills: "",
    temporaryPassword: "T2T@Temp2026!",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [newCredentialsBanner, setNewCredentialsBanner] = useState<any | null>(null);

  // Edit user modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [editLoading, setEditLoading] = useState(false);

  // Reset password modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPassUser, setResetPassUser] = useState<any | null>(null);
  const [newTempPassword, setNewTempPassword] = useState("T2T@Reset2026!");
  const [resetLoading, setResetLoading] = useState(false);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
    if (deptFilter !== "ALL" && u.departmentId !== deptFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.employeeId.toLowerCase().includes(q) ||
        u.designation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => [data.user, ...prev]);
        setNewCredentialsBanner({
          name: data.user.fullName,
          email: data.user.email,
          empId: data.user.employeeId,
          tempPass: data.temporaryPassword,
        });
        setCreateModalOpen(false);
        setCreateForm({
          fullName: "",
          email: "",
          role: "EMPLOYEE",
          departmentId: departments[0]?.id || "",
          designation: "",
          skills: "",
          temporaryPassword: "T2T@Temp2026!",
        });
        router.refresh();
      } else {
        alert(data.error || "Failed to create user.");
      }
    } catch (err) {
      alert("Error submitting user.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      fullName: user.fullName,
      role: user.role,
      departmentId: user.departmentId || "",
      designation: user.designation,
      accountStatus: user.accountStatus,
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        setEditModalOpen(false);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update user.");
      }
    } catch (err) {
      alert("Error updating user.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    const newStatus = user.accountStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (!confirm(`Are you sure you want to change status to ${newStatus} for ${user.fullName}?`))
      return;

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountStatus: newStatus }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, accountStatus: newStatus } : u))
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser) return;
    setResetLoading(true);

    try {
      const res = await fetch(`/api/users/${resetPassUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPasswordTo: newTempPassword }),
      });

      if (res.ok) {
        alert(
          `Password reset successful for ${resetPassUser.fullName}! Temporary password: ${newTempPassword}. User will be forced to change it on next login.`
        );
        setResetModalOpen(false);
      } else {
        alert("Failed to reset password.");
      }
    } catch (err) {
      alert("Error resetting password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Organization User Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Super Admin control center for creating employee credentials, configuring RBAC roles, and account security.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Temporary Credentials Success Banner */}
      {newCredentialsBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start justify-between text-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-900">
                Member Created Successfully: {newCredentialsBanner.name} ({newCredentialsBanner.empId})
              </span>
              <p className="text-emerald-800 text-[11px] mt-1">
                Login Identifier: <strong>{newCredentialsBanner.email}</strong> • Temporary Password:{" "}
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  {newCredentialsBanner.tempPass}
                </span>
              </p>
              <span className="text-[10px] text-emerald-700 mt-1 block">
                * User will be forced to choose their personal password on first login.
              </span>
            </div>
          </div>
          <button
            onClick={() => setNewCredentialsBanner(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, employee ID, designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 hover:bg-white transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="CEO">CEO</option>
            <option value="COO">COO</option>
            <option value="CTO">CTO</option>
            <option value="CFO">CFO</option>
            <option value="CMO">CMO</option>
            <option value="CAO">CAO (Advisory)</option>
            <option value="EMPLOYEE">Employees</option>
            <option value="INTERN">Interns</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500 max-w-[160px] truncate"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Member Name & ID</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Workload</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={u} size="sm" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="font-mono">{u.employeeId}</span>
                          <span>•</span>
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={u.role === "SUPER_ADMIN" ? "brand" : "default"}>{u.role}</Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-700">
                    {u.department?.name || "Unassigned"}
                  </td>

                  <td className="py-3.5 px-4 font-medium text-slate-800">{u.designation}</td>

                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="font-semibold text-slate-800">{u._count?.assignedTasks || 0}</span> tasks •{" "}
                    <span className="font-semibold text-slate-800">{u._count?.projectMemberships || 0}</span> projects
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={u.accountStatus === "ACTIVE" ? "brand" : "danger"}>
                      {u.accountStatus}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        title="Edit User"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setResetPassUser(u);
                          setResetModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50"
                        title="Reset Password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`p-1.5 rounded-lg ${
                          u.accountStatus === "ACTIVE"
                            ? "text-rose-600 hover:bg-rose-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={u.accountStatus === "ACTIVE" ? "Suspend Account" : "Activate Account"}
                      >
                        {u.accountStatus === "ACTIVE" ? (
                          <Ban className="w-3.5 h-3.5" />
                        ) : (
                          <UserCheck className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= CREATE USER MODAL ================= */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Organization Member"
        subtitle="Generates credentials with temporary password. Forces password reset on first login."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sravan Varma"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Corporate Email *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. sravan@trash2treasure.co.in"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Role *
              </label>
              <select
                required
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="EMPLOYEE">Employee / Team Member</option>
                <option value="INTERN">Intern</option>
                <option value="COO">COO</option>
                <option value="CTO">CTO</option>
                <option value="CFO">CFO</option>
                <option value="CMO">CMO</option>
                <option value="CAO">CAO (Advisory)</option>
                <option value="SUPER_ADMIN">Super Admin / CEO</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Department
              </label>
              <select
                value={createForm.departmentId}
                onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Designation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Machine Vision Engineer or Operations Associate"
              value={createForm.designation}
              onChange={(e) => setCreateForm({ ...createForm, designation: e.target.value })}
              className="w-full p-2.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Temporary Password
            </label>
            <input
              type="text"
              value={createForm.temporaryPassword}
              onChange={(e) =>
                setCreateForm({ ...createForm, temporaryPassword: e.target.value })
              }
              className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {createLoading ? "Creating Member..." : "Issue Credentials"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ================= EDIT USER MODAL ================= */}
      {selectedUser && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Member: ${selectedUser.fullName}`}
          subtitle={`Employee ID: ${selectedUser.employeeId}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Role
              </label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="INTERN">Intern</option>
                <option value="COO">COO</option>
                <option value="CTO">CTO</option>
                <option value="CFO">CFO</option>
                <option value="CMO">CMO</option>
                <option value="CAO">CAO (Advisory)</option>
                <option value="SUPER_ADMIN">Super Admin / CEO</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Department
              </label>
              <select
                value={editForm.departmentId}
                onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Designation
              </label>
              <input
                type="text"
                required
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ================= RESET PASSWORD MODAL ================= */}
      {resetPassUser && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={`Reset Password for ${resetPassUser.fullName}`}
          subtitle="Sets temporary password and forces reset upon user's next login."
          maxWidth="sm"
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Temporary Password
              </label>
              <input
                type="text"
                required
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-emerald-800 font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
              >
                {resetLoading ? "Resetting..." : "Confirm Password Reset"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
