import { UserResponse } from '../user/user.types';
import { TokenResponse } from './jwt.types';

// Complete Auth Response (Login/Signup)
export interface AuthResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

// Email Types
export type EmailType = 'VERIFY' | 'RESET' | 'CHANGE_PASSWORD';