import { Plan } from '../../constants/enums';

// JWT Payload
export interface JWTPayload {
  id: string;
  email: string;
  plan: Plan;
}

// Token Response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}