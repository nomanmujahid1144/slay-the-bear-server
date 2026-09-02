import { Plan } from '../../constants/enums';

// JWT Payload — cross-server contract with the AI backend (Server A)
export interface JWTPayload {
  sub: string;
  email: string;
  plan: Plan;
  role: string;
  jti: string;
  iat?: number;
  exp?: number;
}


// Token Response
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}