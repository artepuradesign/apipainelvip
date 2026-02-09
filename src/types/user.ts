
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'assinante' | 'suporte';
  user_role?: 'assinante' | 'suporte' | 'admin'; // Role original da API
  plan: string;
  balance: number;
  planBalance?: number; // Saldo do plano
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  cpf?: string;
  phone?: string;
  address?: string;
  notes?: string;
  pixKeys?: string[];
  subscription?: {
    id: number;
    plan_id: number;
    status: 'active' | 'cancelled' | 'expired' | 'suspended';
    starts_at: string;
    ends_at: string;
    auto_renew: boolean;
    plan_name?: string;
  };
}
