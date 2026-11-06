import React, { useState } from 'react';
import { 
  CreditCard, 
  ExternalLink, 
  Check, 
  Copy, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { ConfigData } from '../types';
import { safeFetchJson } from '../utils/api';

interface PayPalOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfigData | null;
  onOrderCreated: (orderData: { order_id: string; approve_url?: string; status: string }) => void;
  onCaptureOrder: (orderId: string) => Promise<void>;
}

export const PayPalOrderModal: React.FC<PayPalOrderModalProps> = ({
  isOpen,
  onClose,
  config,
  onOrderCreated,
  onCaptureOrder,
}) => {
  const [description, setDescription] = useState('Cloud SaaS Annual Subscription');
  const [amount, setAmount] = useState('25.00');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [createdOrder, setCreatedOrder] = useState<{
    order_id: string;
    approve_url?: string;
    status: string;
    isSimulated?: boolean;
    errorNotice?: string;
  } | null>(null);

  const [isCapturing, setIsCapturing] = useState(false);
  const [captureSuccess, setCaptureSuccess] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setCreatedOrder(null);
    setCaptureSuccess(false);

    try {
      const res = await safeFetchJson('/api/paypal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          description,
        }),
      });

      if (!res.ok || !res.data) {
        throw new Error(res.error || 'Failed to create payment order.');
      }

      setCreatedOrder(res.data);
      onOrderCreated(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCaptureNow = async () => {
    if (!createdOrder?.order_id) return;
    setIsCapturing(true);
    setError(null);
    try {
      await onCaptureOrder(createdOrder.order_id);
      setCaptureSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Capture failed');
    } finally {
      setIsCapturing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(label);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-sans">Create Customer Payment Order</h2>
              <p className="text-xs text-slate-400">Generate an online checkout order with real-time settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!createdOrder ? (
          /* Create Order Form */
          <form onSubmit={handleCreate} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Item / Order Description
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. SaaS Pro Monthly Subscription"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.50"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs font-mono font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>
            </div>

            {/* Quick preset amount chips */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Quick Presets:</span>
              <div className="flex items-center gap-2 flex-wrap">
                {['5.00', '15.00', '25.00', '50.00', '125.00'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors cursor-pointer ${
                      amount === preset
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Encrypted checkout via PayPal API</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {loading ? 'Processing...' : 'Create Payment Order'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Order Created Success View */
          <div className="mt-5 space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Order Successfully Created</span>
                </span>
                <span className="text-xs font-mono text-slate-400">Status: {createdOrder.status}</span>
              </div>

              <div className="text-xs bg-slate-900/90 p-3 rounded-lg border border-slate-800 font-mono text-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-[10px]">PAYPAL ORDER ID:</span>
                  <span className="text-blue-400 font-bold">{createdOrder.order_id}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(createdOrder.order_id, 'order_id')}
                  className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Copy Order ID"
                >
                  {copiedCard === 'order_id' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Approve */}
              {createdOrder.approve_url && (
                <a
                  href={createdOrder.approve_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs p-3 rounded-xl transition-all flex items-center justify-between group shadow-md"
                >
                  <div>
                    <div className="font-semibold">Proceed to Customer Checkout</div>
                    <div className="text-[10px] text-blue-100">Opens secure PayPal payment window</div>
                  </div>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}

              {/* Direct Capture Test */}
              <button
                onClick={handleCaptureNow}
                disabled={isCapturing || captureSuccess}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium text-xs p-3 rounded-xl transition-all text-left flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-semibold">
                    {captureSuccess ? 'Captured & Settled!' : isCapturing ? 'Executing Capture...' : 'Capture & Settle Payment'}
                  </div>
                  <div className="text-[10px] text-emerald-100">Executes instant fund settlement</div>
                </div>
                <Check className={`w-4 h-4 ${captureSuccess ? 'text-emerald-300' : ''}`} />
              </button>
            </div>

            <div className="pt-3 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCreatedOrder(null)}
                className="text-xs text-blue-400 hover:underline cursor-pointer"
              >
                ← Create another order
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
