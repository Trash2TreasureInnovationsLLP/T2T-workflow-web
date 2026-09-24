"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Modal } from "@/components/ui/Modal";

interface UsersClientProps {
  initialUsers: any[];
  departments: any[];
  currentUser: any;
}

export const STANDARD_ROLES = [
  { value: "EMPLOYEE", label: "Employee / Team Member" },
  { value: "INTERN", label: "Intern" },
  { value: "MANAGER", label: "Manager" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "OPERATIONS_LEAD", label: "Operations Lead" },
  { value: "FIELD_MANAGER", label: "Field / Logistics Manager" },
  { value: "ENGINEER", label: "Engineer / Developer" },
  { value: "ANALYST", label: "Data / Business Analyst" },
  { value: "AUDITOR", label: "Auditor / Quality Assurance" },
  { value: "HR", label: "Human Resources (HR)" },
  { value: "LEGAL", label: "Legal & Compliance" },
  { value: "RESEARCHER", label: "Researcher / Circular Scientist" },
  { value: "COO", label: "Chief Operating Officer (COO)" },
  { value: "CTO", label: "Chief Technology Officer (CTO)" },
  { value: "CFO", label: "Chief Financial Officer (CFO)" },
  { value: "CMO", label: "Chief Marketing Officer (CMO)" },
  { value: "CAO", label: "Chief Advisory Officer (CAO)" },
  { value: "SUPER_ADMIN", label: "Super Admin / CEO" },
];

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
  const [sortBy, setSortBy] = useState("DEFAULT");

  const distinctRoles = useMemo(() => {
    const rolesMap = new Map<string, string>();
    STANDARD_ROLES.forEach((r) => rolesMap.set(r.value, r.label));
    users.forEach((u) => {
      if (u.role && !rolesMap.has(u.role)) {
        rolesMap.set(u.role, u.role.replace(/_/g, " "));
      }
    });
    return Array.from(rolesMap.entries()).map(([value, label]) => ({ value, label }));
  }, [users]);

  // Track locally updated and deleted users to avoid stale server revalidation overwriting client state
  const locallyUpdatedUsersRef = React.useRef<Map<string, any>>(new Map());
  const locallyDeletedUserIdsRef = React.useRef<Set<string>>(new Set());

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Keep users synchronized when server data revalidates, preserving any locally created or updated users
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsers((prev) => {
        const merged: any[] = [];
        const seenIds = new Set<string>();

        // Process server users
        for (const serverUser of initialUsers) {
          if (locallyDeletedUserIdsRef.current.has(serverUser.id)) {
            continue; // Ignore deleted user even if stale server data returned it
          }

          seenIds.add(serverUser.id);
          const localUpdated = locallyUpdatedUsersRef.current.get(serverUser.id);
          if (localUpdated) {
            const serverTime = new Date(serverUser.updatedAt || 0).getTime();
            const localTime = new Date(localUpdated.updatedAt || 0).getTime();
            // If server caught up with our edit
            if (
              serverTime >= localTime &&
              serverUser.fullName === localUpdated.fullName &&
              serverUser.employeeId === localUpdated.employeeId
            ) {
              locallyUpdatedUsersRef.current.delete(serverUser.id);
              merged.push(serverUser);
            } else {
              // Server is still stale, preserve our edited fields
              merged.push({ ...serverUser, ...localUpdated });
            }
          } else {
            merged.push(serverUser);
          }
        }

        // Preserve any local-only users (e.g. newly created users not yet in initialUsers)
        for (const u of prev) {
          if (!seenIds.has(u.id) && !locallyDeletedUserIdsRef.current.has(u.id)) {
            merged.unshift(u);
            seenIds.add(u.id);
          }
        }

        return merged;
      });
    }
  }, [initialUsers]);

  // Create user modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    role: "EMPLOYEE",
    customRole: "",
    departmentId: departments[0]?.id || "",
    newDepartmentName: "",
    designation: "",
    skills: "",
    temporaryPassword: "T2T@Temp2026!",
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [newCredentialsBanner, setNewCredentialsBanner] = useState<any | null>(null);

  // Automatically update departmentId in form if departments change or become available
  useEffect(() => {
    if (!createForm.departmentId && departments.length > 0) {
      setCreateForm((prev) => ({
        ...prev,
        departmentId: prev.departmentId || departments[0].id,
      }));
    }
  }, [departments]);

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

  const filteredUsers = useMemo(() => {
    const list = users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (deptFilter !== "ALL" && u.departmentId !== deptFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase().trim();
        return (
          (u.fullName && u.fullName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.employeeId && u.employeeId.toLowerCase().includes(q)) ||
          (u.designation && u.designation.toLowerCase().includes(q))
        );
      }
      return true;
    });

    if (sortBy === "EMP_ID_ASC") {
      return [...list].sort((a, b) =>
        (a.employeeId || "").localeCompare(b.employeeId || "", undefined, { numeric: true, sensitivity: "base" })
      );
    }
    if (sortBy === "EMP_ID_DESC") {
      return [...list].sort((a, b) =>
        (b.employeeId || "").localeCompare(a.employeeId || "", undefined, { numeric: true, sensitivity: "base" })
      );
    }
    if (sortBy === "NAME_ASC") {
      return [...list].sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    }
    if (sortBy === "NAME_DESC") {
      return [...list].sort((a, b) => (b.fullName || "").localeCompare(a.fullName || ""));
    }
    return list;
  }, [users, roleFilter, deptFilter, searchTerm, sortBy]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const finalRole =
        createForm.role === "__CUSTOM__"
          ? createForm.customRole.trim().toUpperCase().replace(/\s+/g, "_")
          : createForm.role;
      const finalDept =
        createForm.departmentId === "__NEW__"
          ? createForm.newDepartmentName.trim()
          : createForm.departmentId;

      const payload = {
        ...createForm,
        employeeId: createForm.employeeId.trim() || undefined,
        role: finalRole || "EMPLOYEE",
        departmentId: finalDept,
      };

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Guarantee department object and designation are present
        const resolvedDept =
          data.user.department ||
          departments.find((d) => d.id === data.user.departmentId) ||
          null;

        const fullNewUser = {
          ...data.user,
          department: resolvedDept,
          departmentId: data.user.departmentId || resolvedDept?.id || null,
          designation: data.user.designation || createForm.designation,
          accountStatus: data.user.accountStatus || "ACTIVE",
          _count: data.user._count || { assignedTasks: 0, projectMemberships: 0 },
        };

        locallyUpdatedUsersRef.current.set(fullNewUser.id, fullNewUser);
        setUsers((prev) => [fullNewUser, ...prev.filter((u) => u.id !== fullNewUser.id)]);
        setNewCredentialsBanner({
          name: fullNewUser.fullName,
          email: fullNewUser.email,
          empId: fullNewUser.employeeId,
          tempPass: data.temporaryPassword,
        });
        setCreateModalOpen(false);
        setCreateForm({
          fullName: "",
          email: "",
          employeeId: "",
          role: "EMPLOYEE",
          customRole: "",
          departmentId: departments[0]?.id || "",
          newDepartmentName: "",
          designation: "",
          skills: "",
          temporaryPassword: "T2T@Temp2026!",
        });
        // Clear active filters so the new member is immediately visible in the table
        setRoleFilter("ALL");
        setDeptFilter("ALL");
        setSearchTerm("");
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
    const isStandard = STANDARD_ROLES.some((r) => r.value === user.role);
    setEditForm({
      fullName: user.fullName || "",
      employeeId: user.employeeId || "",
      role: isStandard ? (user.role || "EMPLOYEE") : "__CUSTOM__",
      customRole: isStandard ? "" : (user.role || ""),
      departmentId: user.departmentId || user.department?.id || "",
      newDepartmentName: "",
      designation: user.designation || "",
      accountStatus: user.accountStatus || "ACTIVE",
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const trimmedName = editForm.fullName?.trim();
    if (!trimmedName) {
      alert("Full Name cannot be empty.");
      return;
    }

    const trimmedEmpId = editForm.employeeId?.trim();
    if (!trimmedEmpId) {
      alert("Employee ID cannot be empty.");
      return;
    }

    const finalRole = editForm.role === "__CUSTOM__" ? editForm.customRole?.trim() : editForm.role;
    if (!finalRole) {
      alert("Role is required.");
      return;
    }

    let finalDept = editForm.departmentId;
    if (finalDept === "__NEW__") {
      finalDept = "";
    }

    setEditLoading(true);

    try {
      const payload = {
        ...editForm,
        fullName: trimmedName,
        employeeId: trimmedEmpId,
        role: finalRole,
        departmentId: finalDept,
        newDepartmentName: editForm.departmentId === "__NEW__" ? editForm.newDepartmentName?.trim() : undefined,
        designation: editForm.designation?.trim(),
      };

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const updated = await res.json();
        const resolvedDept =
          updated.department ||
          departments.find((d) => d.id === (updated.departmentId || editForm.departmentId)) ||
          null;

        const mergedUser = {
          ...selectedUser,
          ...updated,
          fullName: trimmedName,
          employeeId: trimmedEmpId,
          designation: payload.designation || updated.designation,
          role: payload.role || updated.role,
          department: resolvedDept,
          departmentId: updated.departmentId || editForm.departmentId || null,
          accountStatus: payload.accountStatus || updated.accountStatus,
          updatedAt: updated.updatedAt || new Date().toISOString(),
        };

        // Cache local update to prevent any stale server revalidation from reverting
        locallyUpdatedUsersRef.current.set(mergedUser.id, mergedUser);

        setUsers((prev) =>
          prev.map((u) => (u.id === mergedUser.id ? mergedUser : u))
        );
        setSelectedUser(null);
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

  const handleOpenDelete = (user: any) => {
    if (user.id === currentUser?.id) {
      alert("You cannot delete your own Super Admin account.");
      return;
    }
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        locallyDeletedUserIdsRef.current.add(userToDelete.id);
        locallyUpdatedUsersRef.current.delete(userToDelete.id);
        setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
        setSelectedUserIds((prev) => prev.filter((id) => id !== userToDelete.id));
        setDeleteModalOpen(false);
        setUserToDelete(null);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete user.");
      }
    } catch (err) {
      alert("Error deleting user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = selectedUserIds.filter((id) => id !== currentUser?.id);
    if (idsToDelete.length === 0) {
      alert("No valid users selected for deletion.");
      return;
    }
    setBulkDeleteLoading(true);

    try {
      for (const id of idsToDelete) {
        const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
        if (res.ok) {
          locallyDeletedUserIdsRef.current.add(id);
          locallyUpdatedUsersRef.current.delete(id);
        }
      }
      setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u.id)));
      setSelectedUserIds([]);
      setBulkDeleteModalOpen(false);
      router.refresh();
    } catch (err) {
      alert("Error deleting selected users.");
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleToggleSelectAll = () => {
    const selectableUsers = filteredUsers.filter((u) => u.id !== currentUser?.id);
    if (selectedUserIds.length === selectableUsers.length && selectableUsers.length > 0) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (userId: string) => {
    if (userId === currentUser?.id) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
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
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500 font-medium"
            title="Sort members list"
          >
            <option value="DEFAULT">Sort: Recent / Default</option>
            <option value="EMP_ID_ASC">Employee ID (Low → High / A → Z)</option>
            <option value="EMP_ID_DESC">Employee ID (High → Low / Z → A)</option>
            <option value="NAME_ASC">Name (A → Z)</option>
            <option value="NAME_DESC">Name (Z → A)</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Roles ({users.length})</option>
            {distinctRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
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

      {/* Bulk Action Bar when users are selected */}
      {selectedUserIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-rose-900 font-semibold">
            <span className="bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {selectedUserIds.length}
            </span>
            <span>member{selectedUserIds.length > 1 ? "s" : ""} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white text-xs font-medium transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all members"
                    checked={
                      filteredUsers.filter((u) => u.id !== currentUser?.id).length > 0 &&
                      selectedUserIds.length ===
                        filteredUsers.filter((u) => u.id !== currentUser?.id).length
                    }
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-800 transition-colors select-none"
                  onClick={() => {
                    setSortBy((prev) => (prev === "EMP_ID_ASC" ? "EMP_ID_DESC" : "EMP_ID_ASC"));
                  }}
                  title="Click to sort by Employee ID"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Member Name & ID</span>
                    {sortBy === "EMP_ID_ASC" && <span className="text-emerald-600 font-bold">▲ ID</span>}
                    {sortBy === "EMP_ID_DESC" && <span className="text-emerald-600 font-bold">▼ ID</span>}
                  </div>
                </th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Workload</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const isSelected = selectedUserIds.includes(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? "bg-rose-50/40 hover:bg-rose-50/60" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${u.fullName}`}
                        disabled={isCurrent}
                        checked={isSelected}
                        onChange={() => handleToggleSelectUser(u.id)}
                        className={`w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 ${
                          isCurrent ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        title={isCurrent ? "Cannot select own account" : undefined}
                      />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <UserAvatar user={u} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{u.fullName}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
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
                      {u.department?.name ||
                        departments.find((d) => d.id === u.departmentId)?.name ||
                        "Unassigned"}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">{u.designation || "—"}</td>

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
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setResetPassUser(u);
                            setResetModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg transition-colors ${
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

                        <button
                          onClick={() => handleOpenDelete(u)}
                          disabled={isCurrent}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isCurrent
                              ? "text-slate-300 cursor-not-allowed"
                              : "text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          }`}
                          title={isCurrent ? "Cannot delete yourself" : "Delete User from Organization"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold uppercase tracking-wider text-slate-700">
                  Employee ID
                </label>
                <span className="text-[11px] text-slate-400 font-normal">Custom / Random</span>
              </div>
              <input
                type="text"
                placeholder="e.g. T2T-015, EMP-99 (or leave blank to auto-generate)"
                value={createForm.employeeId}
                onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono placeholder:font-sans"
              />
            </div>
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
                {STANDARD_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter Custom Role...</option>
              </select>
              {createForm.role === "__CUSTOM__" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Circular Economy Specialist or QA Lead"
                  value={createForm.customRole}
                  onChange={(e) => setCreateForm({ ...createForm, customRole: e.target.value })}
                  className="w-full mt-2 p-2 border border-emerald-300 rounded-lg bg-emerald-50/40 text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              )}
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
                <option value="">Select Department (Optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
                <option value="__NEW__">+ Enter New Department...</option>
              </select>
              {createForm.departmentId === "__NEW__" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Green R&D / Bio-Plastic Innovation"
                  value={createForm.newDepartmentName}
                  onChange={(e) => setCreateForm({ ...createForm, newDepartmentName: e.target.value })}
                  className="w-full mt-2 p-2 border border-emerald-300 rounded-lg bg-emerald-50/40 text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={editForm.employeeId || ""}
                onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

            <div>
              <label className="block font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Role *
              </label>
              <select
                required
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
              >
                {STANDARD_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
                <option value="__CUSTOM__">+ Enter Custom Role...</option>
              </select>
              {editForm.role === "__CUSTOM__" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Circular Economy Specialist or QA Lead"
                  value={editForm.customRole || ""}
                  onChange={(e) => setEditForm({ ...editForm, customRole: e.target.value })}
                  className="w-full mt-2 p-2 border border-emerald-300 rounded-lg bg-emerald-50/40 text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              )}
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
                <option value="__NEW__">+ Enter New Department...</option>
              </select>
              {editForm.departmentId === "__NEW__" && (
                <input
                  type="text"
                  required
                  placeholder="e.g. Green R&D / Bio-Plastic Innovation"
                  value={editForm.newDepartmentName || ""}
                  onChange={(e) => setEditForm({ ...editForm, newDepartmentName: e.target.value })}
                  className="w-full mt-2 p-2 border border-emerald-300 rounded-lg bg-emerald-50/40 text-xs focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              )}
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

      {/* ================= DELETE USER MODAL ================= */}
      {userToDelete && (
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteModalOpen(false);
              setUserToDelete(null);
            }
          }}
          title="Delete Team Member"
          subtitle="Permanently remove user account and credentials from the organization."
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-900">This action cannot be undone.</p>
                <p className="mt-0.5 text-rose-700 text-[11px]">
                  All permissions, assigned workload, and access credentials for this member will be permanently removed.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <UserAvatar user={userToDelete} size="md" />
              <div>
                <div className="font-bold text-slate-900 text-sm">{userToDelete.fullName}</div>
                <div className="text-slate-500 font-mono text-xs">{userToDelete.employeeId}</div>
                <div className="text-slate-600 text-[11px] mt-0.5">
                  {userToDelete.designation || userToDelete.role} • {userToDelete.email}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? "Deleting Member..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= BULK DELETE MODAL ================= */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => {
          if (!bulkDeleteLoading) setBulkDeleteModalOpen(false);
        }}
        title="Delete Selected Members"
        subtitle={`Permanently remove ${selectedUserIds.length} selected member(s) from the organization.`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Warning: Permanent Deletion</p>
              <p className="mt-0.5 text-rose-700 text-[11px]">
                You are about to permanently delete {selectedUserIds.length} member(s). This cannot be undone.
              </p>
            </div>
          </div>

          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50 p-1">
            {users
              .filter((u) => selectedUserIds.includes(u.id))
              .map((u) => (
                <div key={u.id} className="p-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{u.fullName}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{u.employeeId}</span>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={bulkDeleteLoading}
              onClick={() => setBulkDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={bulkDeleteLoading}
              onClick={handleBulkDelete}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{bulkDeleteLoading ? "Deleting Members..." : `Delete ${selectedUserIds.length} Members`}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
