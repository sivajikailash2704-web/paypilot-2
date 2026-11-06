import fs from 'fs';
import path from 'path';

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
  verification_status: 'SUCCESS' | 'FAILURE' | 'VERIFIED' | 'UNVERIFIED';
  resource_type?: string;
  payload: any;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'paypilot_store.json');

interface StoreData {
  transactions: Transaction[];
  webhooks: WebhookEventRecord[];
  zapierSettings?: {
    webhookUrl: string;
    autoForward: boolean;
    logs: Array<{ id: string; timestamp: string; event: string; status: number; message: string; payload?: any }>;
  };
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1001',
    description: 'SaaS Pro Monthly Subscription',
    amount: 29.00,
    currency: 'USD',
    status: 'Completed',
    source: 'PayPal Checkout',
    payer_email: 'john.miller@enterprise.com',
    payer_name: 'John Miller',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'tx_1002',
    description: 'Hardware Equipment Purchase',
    amount: 54.75,
    currency: 'USD',
    status: 'Completed',
    source: 'PayPal Checkout',
    payer_email: 'alex.rivera@techflow.io',
    payer_name: 'Alex Rivera',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'tx_1003',
    description: 'Custom Platform Integration - Milestone 1',
    amount: 125.00,
    currency: 'USD',
    status: 'Pending',
    source: 'Invoice',
    payer_email: 'billing@clientco.com',
    payer_name: 'Client Co.',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'tx_1004',
    order_id: '8WJ92841KX920194B',
    capture_id: '5TR71029KL839102X',
    description: 'Cloud Infrastructure Credits (1000 Units)',
    amount: 45.00,
    currency: 'USD',
    status: 'Completed',
    source: 'PayPal Checkout',
    payer_email: 'finance@devops-corp.io',
    payer_name: 'Marcus Vance',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tx_1005',
    description: 'Enterprise Consulting Retainer - Q4',
    amount: 450.00,
    currency: 'USD',
    status: 'Pending',
    source: 'Manual',
    payer_email: 'sarah.founder@fintech.io',
    payer_name: 'Sarah Chen',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  }
];

const INITIAL_WEBHOOKS: WebhookEventRecord[] = [
  {
    id: 'wh_init_1',
    event_id: 'WH-89X728109-SECURE',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    summary: 'Payment capture completed for 45.00 USD',
    received_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    verification_status: 'SUCCESS',
    resource_type: 'capture',
    payload: {
      id: '5TR71029KL839102X',
      status: 'COMPLETED',
      amount: { value: '45.00', currency_code: 'USD' },
      seller_receivable_breakdown: { paypal_fee: { value: '1.61', currency_code: 'USD' } }
    }
  }
];

function ensureDataStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      const initial: StoreData = {
        transactions: INITIAL_TRANSACTIONS,
        webhooks: INITIAL_WEBHOOKS,
      };
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error('Error loading store file, resetting in memory:', err);
    return {
      transactions: INITIAL_TRANSACTIONS,
      webhooks: INITIAL_WEBHOOKS,
    };
  }
}

function saveStore(data: StoreData) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write store file:', err);
  }
}

export const Store = {
  getTransactions(): Transaction[] {
    const data = ensureDataStore();
    return [...data.transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addTransaction(tx: Omit<Transaction, 'id' | 'created_at'> & { id?: string; created_at?: string }): Transaction {
    const data = ensureDataStore();
    const newTx: Transaction = {
      ...tx,
      id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: tx.created_at || new Date().toISOString(),
    };
    data.transactions.unshift(newTx);
    saveStore(data);
    return newTx;
  },

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction | null {
    const data = ensureDataStore();
    const idx = data.transactions.findIndex(t => t.id === id || t.order_id === id);
    if (idx === -1) return null;
    data.transactions[idx] = {
      ...data.transactions[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveStore(data);
    return data.transactions[idx];
  },

  deleteTransaction(id: string): boolean {
    const data = ensureDataStore();
    const initialLen = data.transactions.length;
    data.transactions = data.transactions.filter(t => t.id !== id);
    if (data.transactions.length !== initialLen) {
      saveStore(data);
      return true;
    }
    return false;
  },

  resetTransactions(): void {
    const data = ensureDataStore();
    data.transactions = [...INITIAL_TRANSACTIONS];
    saveStore(data);
  },

  getWebhooks(): WebhookEventRecord[] {
    const data = ensureDataStore();
    return [...data.webhooks].sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
  },

  addWebhook(event: Omit<WebhookEventRecord, 'id' | 'received_at'> & { id?: string; received_at?: string }): WebhookEventRecord {
    const data = ensureDataStore();
    const newEvent: WebhookEventRecord = {
      ...event,
      id: event.id || `wh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      received_at: event.received_at || new Date().toISOString(),
    };
    data.webhooks.unshift(newEvent);
    if (data.webhooks.length > 100) {
      data.webhooks = data.webhooks.slice(0, 100);
    }
    saveStore(data);
    return newEvent;
  },

  clearWebhooks(): void {
    const data = ensureDataStore();
    data.webhooks = [];
    saveStore(data);
  },

  getZapierSettings() {
    const data = ensureDataStore();
    return data.zapierSettings || {
      webhookUrl: '',
      autoForward: true,
      logs: []
    };
  },

  saveZapierSettings(settings: { webhookUrl?: string; autoForward?: boolean }) {
    const data = ensureDataStore();
    if (!data.zapierSettings) {
      data.zapierSettings = { webhookUrl: '', autoForward: true, logs: [] };
    }
    if (typeof settings.webhookUrl === 'string') {
      data.zapierSettings.webhookUrl = settings.webhookUrl.trim();
    }
    if (typeof settings.autoForward === 'boolean') {
      data.zapierSettings.autoForward = settings.autoForward;
    }
    saveStore(data);
    return data.zapierSettings;
  },

  addZapierLog(log: { event: string; status: number; message: string; payload?: any }) {
    const data = ensureDataStore();
    if (!data.zapierSettings) {
      data.zapierSettings = { webhookUrl: '', autoForward: true, logs: [] };
    }
    const entry = {
      id: `zap_log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    data.zapierSettings.logs.unshift(entry);
    if (data.zapierSettings.logs.length > 50) {
      data.zapierSettings.logs = data.zapierSettings.logs.slice(0, 50);
    }
    saveStore(data);
    return entry;
  }
};

