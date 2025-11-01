import { Injectable } from '@nestjs/common';
import { UserRole, Permission } from '../utils/enums';

@Injectable()
export class RolePermissionsService {
  private readonly rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.USER]: [
      Permission.VIEW_PROFILE,
      Permission.UPDATE_PROFILE,
      Permission.VIEW_NOTICES,
      Permission.VIEW_POSTS,
    ],
    [UserRole.ADMIN]: [
      Permission.VIEW_PROFILE,
      Permission.UPDATE_PROFILE,
      Permission.VIEW_NOTICES,
      Permission.VIEW_POSTS,
      Permission.CREATE_NOTICE,
      Permission.UPDATE_NOTICE,
      Permission.DELETE_NOTICE,
      Permission.MANAGE_USERS,
      Permission.CREATE_POST,
      Permission.UPDATE_POST,
      Permission.DELETE_POST,
      Permission.CREATE_COURSE,
      Permission.UPDATE_COURSE,
      Permission.DELETE_COURSE,
      Permission.CREATE_BOOK,
      Permission.UPDATE_BOOK,
      Permission.DELETE_BOOK,
      Permission.CREATE_EXAM,
      Permission.UPDATE_EXAM,
      Permission.DELETE_EXAM,
    ],
    [UserRole.SUPER_ADMIN]: [
      Permission.VIEW_PROFILE,
      Permission.UPDATE_PROFILE,
      Permission.VIEW_NOTICES,
      Permission.VIEW_POSTS,
      Permission.CREATE_NOTICE,
      Permission.UPDATE_NOTICE,
      Permission.DELETE_NOTICE,
      Permission.MANAGE_USERS,
      Permission.CREATE_POST,
      Permission.UPDATE_POST,
      Permission.DELETE_POST,
      Permission.MANAGE_ADMINS,
      Permission.MANAGE_PERMISSIONS,
      Permission.SYSTEM_SETTINGS,
      Permission.CREATE_COURSE,
      Permission.UPDATE_COURSE,
      Permission.DELETE_COURSE,
      Permission.CREATE_BOOK,
      Permission.UPDATE_BOOK,
      Permission.DELETE_BOOK,
      Permission.CREATE_EXAM,
      Permission.UPDATE_EXAM,
      Permission.DELETE_EXAM,
    ],
  };

  hasPermission(userRole: UserRole, permission: Permission): boolean {
    const permissions = this.rolePermissions[userRole] || [];
    return permissions.includes(permission);
  }

  hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  getUserPermissions(userRole: UserRole): Permission[] {
    return this.rolePermissions[userRole] || [];
  }

  canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can manage everyone
    if (managerRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Admin can manage users but not other admins or super admins
    if (managerRole === UserRole.ADMIN) {
      return targetRole === UserRole.USER;
    }
    
    // Users cannot manage anyone
    return false;
  }

  canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    // Super admin can assign any role
    if (assignerRole === UserRole.SUPER_ADMIN) {
      return true;
    }
    
    // Admin can only assign user role
    if (assignerRole === UserRole.ADMIN) {
      return targetRole === UserRole.USER;
    }
    
    // Users cannot assign any role
    return false;
  }
}