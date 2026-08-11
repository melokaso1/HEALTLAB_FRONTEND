export type UserRoleType = 'admin' | 'professional' | 'receptionist';
export type UserStatusType = 'active' | 'inactive';

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: UserRoleType;
  status: UserStatusType;
  avatarUrl?: string;
  initials?: string;
  avatarBg?: string;
  lastAccess?: string;
}

export type PermissionStatus = 'allowed' | 'denied' | 'restricted';

export interface PermissionItem {
  id: string;
  label: string;
  status: PermissionStatus;
}

export interface PermissionGroup {
  id: string;
  title: string;
  icon: 'calendar' | 'file' | 'gear';
  items: PermissionItem[];
}

export interface CreateUserData {
  name: string;
  email: string;
  role: UserRoleType;
  password?: string;
}

export interface UpdateUserRoleData {
  userId: number;
  newRole: UserRoleType;
}
