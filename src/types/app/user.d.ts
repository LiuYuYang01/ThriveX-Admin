export interface Login {
  username: string;
  password: string;
}

export interface UserInfo {
  id?: number;
  name: string;
  email: string;
  avatar: string;
  info: string;
}

export type User = Login & UserInfo & { createTime?: string };

export interface LoginReturn {
  token: string;
  user: User;
  role: Role;
}

export interface EditUser {
  oldUsername: string;
  newUsername: string;
  oldPassword: string;
  newPassword: string;
}

export interface FilterForm {
  name?: string;
  role?: number;
  createTime: Date[];
}

export interface FilterUser extends FilterQueryParams {
  name?: string;
  roleId?: number;
}
