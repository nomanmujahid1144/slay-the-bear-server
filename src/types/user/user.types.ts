import { Plan } from '../../constants/enums';

// User Response (without sensitive data)
export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isVerified: boolean;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

// User creation data
export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// User update data
export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
}