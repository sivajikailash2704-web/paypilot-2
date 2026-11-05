import React, { useState } from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  Check, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  AlertCircle,
  Receipt,
  DollarSign,
  User,
  Mail,
  FileText
} from 'lucide-react';
import { ConfigData, Transaction } from '../types';

interface QuickChargeViewProps {
  config: ConfigData | null;
  onCaptureOrder: (orderId: string) => Promise<void>;
  onOrderCreated: (orderData: { order_id: string; approve_url?: string; status: string }) => void;
  transactions: Transaction[];
}

export const QuickChargeView: React.FC<QuickChargeViewProps> = ({
  config,
  onCaptureOrder,
  onOrderCreated,
  transactions,
}) => {
  const [description, setDescription] = useState('Professional Consulting Services');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [amount, setAmount] = useState('50.00');
  const [currency, setCurrency] = useState('USD');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active created order
  const [currentOrder, setCurrentOrder] = useState<{
    order_id: string;
    approve_url?: string;
    status: string;
    amount?: number;
    description?: string;
  } | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState<string | null>(null);

  // Order Search Lookup tool
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<any | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setCaptureStatus(null);

    try {
      const fullDescription = customerName.trim()
        ? `${description} (Customer: ${customerName.trim()})`
        : description;

      const res = await fetch('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          description: fullDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create payment order.');

      const orderInfo = {
        ...data,
        amount: parseFloat(amount),
        description: fullDescription,
      };

      setCurrentOrder(orderInfo);
      onOrderCreated(orderInfo);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCapture = async () => {
    if (!currentOrder?.order_id) return;
    setIsCapturing(true);
    setError(null);
    try {
      await onCaptureOrder(currentOrder.order_id);
      setCaptureStatus('Payment captured successfully! Funds settled and recorded in your ledger.');
      setCurrentOrder(prev => prev ? { ...prev, status: 'COMPLETED' } : null);
    } catch (err: any) {
      setError(err.message || 'Settlement failed');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setIsLookingUp(true);
    setLookupResult(null);
    try {
      const res = await fetch(`/api/paypal/order/${encodeURIComponent(lookupId.trim())}`);
      const data = await res.json();
      setLookupResult(data);
    } catch (err: any) {
      setLookupResult({ error: err.message });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Quick Charge Terminal
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                  Point of Sale
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Initiate one-click customer payment checkouts or capture authorized transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Payment Processing</span>
          </div>
        </div>
      </div>

      {/* 2-Column Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Charge Form */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Create New Customer Payment</span>
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Set payment details to instantly produce a customer checkout link
          </p>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateOrder} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description / Service</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Invoice #1024, Web Development, Consulting"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Name (Optional)</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Email (Optional)</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-medium text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Preset Amounts:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {['20.00', '35.00', '50.00', '100.00', '250.00'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-mono transition-colors cursor-pointer ${
                      amount === val
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2"
            >
              {creating ? 'Connecting with PayPal...' : 'Generate PayPal Checkout Link'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right: Active Order Deck & Settlement */}
        <div className="space-y-6">
          <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-1">
              <Receipt className="w-4 h-4 text-blue-400" />
              <span>Active Checkout Order</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time checkout authorization and direct settlement actions
            </p>

            {currentOrder ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Order Reference:</span>
                    <span className="font-mono text-blue-400 font-bold">{currentOrder.order_id}</span>
                  </div>
                  {currentOrder.amount && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Amount:</span>
                      <span className="font-mono text-slate-100 font-semibold text-sm">
                        ${currentOrder.amount.toFixed(2)} USD
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Payment Status:</span>
                    <span className={`font-semibold ${currentOrder.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {currentOrder.status}
                    </span>
                  </div>
                </div>

                {captureStatus && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{captureStatus}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {currentOrder.approve_url && (
                    <a
                      href={currentOrder.approve_url}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs p-3 rounded-xl flex items-center justify-between transition-colors shadow-sm"
                    >
                      <div>
                        <div className="font-semibold">Complete Checkout</div>
                        <div className="text-[10px] text-blue-100">Opens PayPal payment portal</div>
                      </div>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={handleCapture}
                    disabled={isCapturing || currentOrder.status === 'COMPLETED'}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs p-3 rounded-xl flex items-center justify-between transition-colors cursor-pointer shadow-sm"
                  >
                    <div>
                      <div className="font-semibold">
                        {isCapturing ? 'Settling Funds...' : 'Settle Payment Now'}
                      </div>
                      <div className="text-[10px] text-emerald-100">Instant capture & ledger update</div>
                    </div>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <Receipt className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-medium text-slate-300">Ready to charge</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Fill in the payment details on the left to generate an immediate checkout link.
                </p>
              </div>
            )}
          </div>

          {/* Clean Order Status Lookup */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Verify Order by ID</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Check live status directly from PayPal
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter PayPal Order ID (e.g. 5O190127TN...)"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isLookingUp}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer"
              >
                {isLookingUp ? 'Searching...' : 'Lookup'}
              </button>
            </form>

            {lookupResult && (
              <div className="mt-3 p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                {lookupResult.error ? (
                  <p className="text-rose-400">{lookupResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Order ID:</span>
                      <span className="font-mono text-blue-400 font-bold">{lookupResult.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className="font-semibold text-emerald-400">{lookupResult.status}</span>
                    </div>
                    {lookupResult.purchase_units?.[0]?.amount && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-mono font-bold text-slate-100">
                          ${lookupResult.purchase_units[0].amount.value} {lookupResult.purchase_units[0].amount.currency_code}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
