import { UserRole } from '../../utils/enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare namespace Express {
  export interface User {
    userId: string;
    role: UserRole;
    email: string;
  }
}
