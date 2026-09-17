export type UserRole =
  | "SUPER_ADMIN"
  | "CEO"
  | "COO"
  | "CTO"
  | "CFO"
  | "CMO"
  | "CAO"
  | "EMPLOYEE"
  | "INTERN";

export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type ProjectStatus = "PLANNING" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED";

export type SprintStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface SessionUser {
  id: string;
  email: string;
  employeeId: string;
  fullName: string;
  role: UserRole;
  designation: string;
  departmentId: string | null;
  departmentName?: string;
  avatarUrl: string | null;
  mustChangePassword: boolean;
  accountStatus: AccountStatus;
}

export interface PermissionCheck {
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageSprints: boolean;
  canCreateTasks: boolean;
  canEditAllTasks: boolean;
  canViewExecutiveDashboard: boolean;
  canViewAuditLogs: boolean;
  canPostAnnouncements: boolean;
  canViewFinancials: boolean;
  canManageRoles: boolean;
  isAdvisoryOnly: boolean;
}

export function getRolePermissions(role: string): PermissionCheck {
  const normalized = role.toUpperCase();

  switch (normalized) {
    case "SUPER_ADMIN":
    case "CEO":
      return {
        canManageUsers: true,
        canManageProjects: true,
        canManageSprints: true,
        canCreateTasks: true,
        canEditAllTasks: true,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: true,
        canPostAnnouncements: true,
        canViewFinancials: true,
        canManageRoles: true,
        isAdvisoryOnly: false,
      };

    case "COO":
      return {
        canManageUsers: true,
        canManageProjects: true,
        canManageSprints: true,
        canCreateTasks: true,
        canEditAllTasks: true,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: true,
        canPostAnnouncements: true,
        canViewFinancials: true,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };

    case "CTO":
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageSprints: true,
        canCreateTasks: true,
        canEditAllTasks: true,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: false,
        canPostAnnouncements: true,
        canViewFinancials: false,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };

    case "CFO":
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageSprints: false,
        canCreateTasks: true,
        canEditAllTasks: false,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: false,
        canPostAnnouncements: true,
        canViewFinancials: true,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };

    case "CMO":
      return {
        canManageUsers: false,
        canManageProjects: true,
        canManageSprints: true,
        canCreateTasks: true,
        canEditAllTasks: false,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: false,
        canPostAnnouncements: true,
        canViewFinancials: false,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };

    case "CAO": // Advisory role - broad visibility, no mutation of core operations
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageSprints: false,
        canCreateTasks: false,
        canEditAllTasks: false,
        canViewExecutiveDashboard: true,
        canViewAuditLogs: true,
        canPostAnnouncements: false,
        canViewFinancials: true,
        canManageRoles: false,
        isAdvisoryOnly: true,
      };

    case "INTERN":
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageSprints: false,
        canCreateTasks: false,
        canEditAllTasks: false,
        canViewExecutiveDashboard: false,
        canViewAuditLogs: false,
        canPostAnnouncements: false,
        canViewFinancials: false,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };

    case "EMPLOYEE":
    default:
      return {
        canManageUsers: false,
        canManageProjects: false,
        canManageSprints: false,
        canCreateTasks: true,
        canEditAllTasks: false,
        canViewExecutiveDashboard: false,
        canViewAuditLogs: false,
        canPostAnnouncements: false,
        canViewFinancials: false,
        canManageRoles: false,
        isAdvisoryOnly: false,
      };
  }
}
