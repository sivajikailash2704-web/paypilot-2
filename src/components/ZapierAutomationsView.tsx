import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Check, 
  AlertCircle, 
  Send, 
  Clock, 
  ExternalLink, 
  RotateCcw, 
  ShieldCheck, 
  Layers, 
  Copy,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { safeFetchJson } from '../utils/api';

interface ZapierLog {
  id: string;
  timestamp: string;
  event: string;
  status: number;
  message: string;
  payload?: any;
}

export const ZapierAutomationsView: React.FC = () => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoForward, setAutoForward] = useState(true);
  const [logs, setLogs] = useState<ZapierLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson('/api/zapier/config');
      if (res.ok && res.data) {
        setWebhookUrl(res.data.webhookUrl || '');
        setAutoForward(res.data.autoForward ?? true);
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load Zapier config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await safeFetchJson('/api/zapier/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, autoForward }),
      });
      if (!res.ok) throw new Error(res.error || 'Failed to save settings');
      setFeedback({ type: 'success', message: 'Zapier settings saved. Real-time forwarder active.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvent = async () => {
    if (!webhookUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please enter your Zapier Webhook URL before sending a test.' });
      return;
    }

    setTesting(true);
    setFeedback(null);
    try {
      const res = await safeFetchJson('/api/zapier/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl }),
      });
      if (!res.ok) throw new Error(res.error || 'Test delivery failed');

      setFeedback({ type: 'success', message: res.data?.message || 'Test event delivered to Zapier!' });
      fetchConfig();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Zapier Payment Automations
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
                  Full Integration
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger workflows across Slack, Google Sheets, QuickBooks, or Gmail automatically whenever a PayPal payment settles
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated Pipeline Ready</span>
            </div>
            <button
              onClick={fetchConfig}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main 2-Column: Configuration & Recipe shortcuts on left, Live Delivery Logs on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Configuration Form */}
        <div className="space-y-6">
          <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Webhook Endpoint Configuration</span>
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Zapier Catch Hook URL
                </label>
                <input
                  type="url"
                  placeholder="https://hooks.zapier.com/hooks/catch/123456/abcdef"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Create a Zap with the <strong>Webhooks by Zapier (Catch Hook)</strong> trigger, and paste your URL here.
                </p>
              </div>

              {/* Auto Forward Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Automatic Dispatch on Capture
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Immediately send payload to Zapier every time a customer checkout settles
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoForward(!autoForward)}
                  className="text-amber-400 cursor-pointer"
                >
                  {autoForward ? (
                    <ToggleRight className="w-7 h-7 text-amber-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>

                <button
                  type="button"
                  onClick={handleTestEvent}
                  disabled={testing || !webhookUrl.trim()}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testing ? 'Sending...' : 'Send Test Event'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Popular Recipes */}
          <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Recommended Automation Workflows</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block">💬 Slack Alert</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Posts customer name and amount in team chat upon payment</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block">📊 Google Sheets</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Logs order ID, amount, and payer email into financial spreadsheet</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block">🧾 QuickBooks / Xero</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Creates formal sales receipt and synchronizes general ledger</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <span className="font-semibold text-slate-200 block">✉️ Gmail / SendGrid</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Dispatches branded welcome email with download links</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Real-time Dispatch Logs */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Zapier Dispatch Log & History</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">{logs.length} deliveries</span>
            </div>

            <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <Zap className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                  <p className="text-slate-300 font-medium">No webhook dispatches yet.</p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Enter your Zapier webhook URL and click "Send Test Event" to verify.
                  </p>
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="py-3 px-1 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-semibold text-slate-200 text-xs">{log.event}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          log.status >= 200 && log.status < 300
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        HTTP {log.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs">{log.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Payload format: JSON</span>
            <span>Retries: Auto-fallback</span>
          </div>
        </div>
      </div>
    </div>
  );
};
