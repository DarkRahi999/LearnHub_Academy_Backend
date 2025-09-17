// Enums for user gender
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

// Enums for user roles
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}

// Enums for permissions
export enum Permission {
  // User permissions
  VIEW_PROFILE = 'view_profile',
  UPDATE_PROFILE = 'update_profile',
  VIEW_NOTICES = 'view_notices',
  VIEW_POSTS = 'view_posts',
  
  // Admin permissions
  CREATE_NOTICE = 'create_notice',
  UPDATE_NOTICE = 'update_notice',
  DELETE_NOTICE = 'delete_notice',
  MANAGE_USERS = 'manage_users',
  CREATE_COURSE = 'create_course',
  UPDATE_COURSE = 'update_course',
  DELETE_COURSE = 'delete_course',
  
  // Super Admin permissions
  CREATE_POST = 'create_post',
  UPDATE_POST = 'update_post',
  DELETE_POST = 'delete_post',
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_PERMISSIONS = 'manage_permissions',
  SYSTEM_SETTINGS = 'system_settings',
}