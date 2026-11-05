import React, { useState, useEffect, useCallback } from 'react';
import { Header, NavTab } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { TrendChart } from './components/TrendChart';
import { TransactionsTable } from './components/TransactionsTable';
import { RecentActivity } from './components/RecentActivity';
import { QuickChargeView } from './components/QuickChargeView';
import { InstantNotificationsView } from './components/InstantNotificationsView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { PayPalOrderModal } from './components/PayPalOrderModal';
import { ManualTxModal } from './components/ManualTxModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { DashboardData, InsightsData, ConfigData, WebhookEventRecord } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [webhooks, setWebhooks] = useState<WebhookEventRecord[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Modals
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [manualTxOpen, setManualTxOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Dashboard & Insights
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const [dashRes, insRes, cfgRes, whRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/insights'),
        fetch('/api/config'),
        fetch('/api/paypal/webhooks'),
      ]);

      if (dashRes.ok) {
        const dData = await dashRes.json();
        setDashboard(dData);
      }
      if (insRes.ok) {
        const iData = await insRes.json();
        setInsights(iData);
      }
      if (cfgRes.ok) {
        const cData = await cfgRes.json();
        setConfig(cData);
      }
      if (whRes.ok) {
        const wData = await whRes.json();
        setWebhooks(wData.webhooks || []);
      }
    } catch (err) {
      console.error('Failed to sync data:', err);
    } finally {
      if (!quiet) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Background polling every 15s to keep payment records live
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Check for PayPal return url params (?paypal=success / ?paypal=cancel)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('paypal') === 'success') {
      addToast('success', 'Payment Authorized', 'Customer checkout authorization was completed.');
      fetchData();
    } else if (params.get('paypal') === 'cancel') {
      addToast('info', 'Checkout Cancelled', 'The customer cancelled checkout.');
    }
  }, [fetchData]);

  // Capture PayPal Order
  const handleCaptureOrder = async (orderId: string) => {
    try {
      const res = await fetch('/api/paypal/capture-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to capture PayPal order.');
      }
      addToast('success', 'Payment Settled', `Order ${orderId} captured and settled successfully.`);
      fetchData();
    } catch (err: any) {
      addToast('error', 'Settlement Failed', err.message);
      throw err;
    }
  };

  // Refund Order
  const handleRefundOrder = async (txId: string, orderId?: string) => {
    try {
      const res = await fetch('/api/paypal/refund-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: txId, order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Refund failed.');

      addToast('info', 'Refund Processed', 'Transaction marked as refunded.');
      fetchData();
    } catch (err: any) {
      addToast('error', 'Refund Failed', err.message);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete transaction.');
      addToast('info', 'Record Removed', 'Transaction record removed from ledger.');
      fetchData();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  // Quick Order Launcher helper
  const handleQuickOrder = async (amount: number, description: string) => {
    try {
      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, currency: 'USD' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order creation failed.');

      addToast('success', 'Payment Order Created', `Created checkout for $${amount.toFixed(2)} USD.`);
      fetchData();
      setActiveTab('charge');
    } catch (err: any) {
      addToast('error', 'Order Creation Error', err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        config={config}
        isRefreshing={isRefreshing}
        onRefresh={() => {
          fetchData();
          addToast('info', 'Dashboard Refreshed', 'Latest payment records synchronized.');
        }}
        onOpenCreateOrder={() => setCreateOrderOpen(true)}
        onOpenNewTx={() => setManualTxOpen(true)}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
        isAssistantOpen={isAssistantOpen}
        unreadAlertsCount={webhooks.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* VIEW 1: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <MetricCards dashboard={dashboard} insights={insights} />

            {/* Velocity Chart & Quick Test Launcher */}
            <TrendChart
              dashboard={dashboard}
              onQuickOrder={handleQuickOrder}
              onSwitchToLab={() => setActiveTab('charge')}
            />

            {/* Recent Activity Stream & Diagnostics */}
            <RecentActivity
              transactions={dashboard?.transactions || []}
              insights={insights}
              onViewAll={() => setActiveTab('transactions')}
              onCaptureOrder={handleCaptureOrder}
            />
          </div>
        )}

        {/* VIEW 2: Transactions */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-100">Transaction Ledger & Receipts</h2>
              <p className="text-xs text-slate-400">Search, filter, capture, and generate printable receipts for all customer checkouts</p>
            </div>
            <TransactionsTable
              transactions={dashboard?.transactions || []}
              onCaptureOrder={handleCaptureOrder}
              onRefundOrder={handleRefundOrder}
              onDeleteTransaction={handleDeleteTransaction}
              onOpenCreateOrder={() => setCreateOrderOpen(true)}
            />
          </div>
        )}

        {/* VIEW 3: Quick Charge Terminal */}
        {activeTab === 'charge' && (
          <QuickChargeView
            config={config}
            onCaptureOrder={handleCaptureOrder}
            onOrderCreated={(data) => {
              addToast('success', 'Payment Order Generated', `Order Reference: ${data.order_id}`);
              fetchData();
            }}
            transactions={dashboard?.transactions || []}
          />
        )}

        {/* VIEW 4: Instant Notifications */}
        {activeTab === 'alerts' && (
          <InstantNotificationsView
            webhooks={webhooks}
            onRefresh={fetchData}
            onOpenCharge={() => setActiveTab('charge')}
          />
        )}
      </main>

      {/* Slide-over Financial Assistant Drawer / Modal */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-[#111827] border-l border-slate-800 h-full p-4 flex flex-col shadow-2xl">
            <AiAssistantDrawer onClose={() => setIsAssistantOpen(false)} />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0c1222] py-4 px-4 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300 font-sans">PayPilot</span>
            <span className="text-slate-700" aria-hidden="true">·</span>
            <span>Enterprise Payment Operations & Settlement Platform</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>PCI-DSS Level 1 · 256-Bit SSL Encryption</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PayPalOrderModal
        isOpen={createOrderOpen}
        onClose={() => setCreateOrderOpen(false)}
        config={config}
        onOrderCreated={(data) => {
          addToast('success', 'Order Created', `Order ${data.order_id} recorded in ledger.`);
          fetchData();
        }}
        onCaptureOrder={handleCaptureOrder}
      />

      <ManualTxModal
        isOpen={manualTxOpen}
        onClose={() => setManualTxOpen(false)}
        onAdded={() => {
          addToast('success', 'Invoice Added', 'Transaction added to ledger.');
          fetchData();
        }}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
