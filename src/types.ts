export interface Transaction {
  id: string;
  order_id?: string;
  capture_id?: string;
  description: string;
  amount: number;
  currency: string;
  status: 'Completed' | 'Pending' | 'Failed' | 'Refunded';
  source: 'PayPal Checkout' | 'Manual' | 'Invoice';
  payer_email?: string;
  payer_name?: string;
  created_at: string;
  updated_at?: string;
  raw_details?: any;
}

export interface WebhookEventRecord {
  id: string;
  event_id: string;
  event_type: string;
  summary?: string;
  received_at: string;
  verification_status: 'SUCCESS' | 'FAILURE' | 'VERIFIED' | 'SIMULATED' | 'UNVERIFIED';
  resource_type?: string;
  payload: any;
}

export interface DashboardData {
  completed_total: number;
  pending_total: number;
  refunded_total: number;
  transaction_count: number;
  currency_distribution: Record<string, number>;
  daily_trends: Array<{
    date: string;
    completed: number;
    pending: number;
  }>;
  transactions: Transaction[];
}

export interface InsightsData {
  total_transactions: number;
  pending_count: number;
  completed_count: number;
  refunded_count: number;
  sandbox_count: number;
  largest_pending: { description: string; amount: number; currency: string } | null;
  largest_completed: { description: string; amount: number; currency: string } | null;
  conversion_rate: number;
}

export interface ConfigData {
  mode: string;
  baseUrl: string;
  clientIdMasked: string;
  hasSecret: boolean;
  webhookConfigured: boolean;
  defaultTestCards: Array<{
    type: string;
    number: string;
    exp: string;
    cvv: string;
  }>;
  sandboxTips: string[];
}
