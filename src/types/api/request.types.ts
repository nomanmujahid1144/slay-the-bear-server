import { Request } from 'express';
import { Plan } from '../../constants/enums';

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    plan: Plan;
  };
}