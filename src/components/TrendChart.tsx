import React from 'react';
import { BarChart3, TrendingUp, CreditCard, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { DashboardData } from '../types';

interface TrendChartProps {
  dashboard: DashboardData | null;
  onQuickOrder: (amount: number, description: string) => void;
  onSwitchToLab: () => void;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  dashboard,
  onQuickOrder,
  onSwitchToLab,
}) => {
  const trends = dashboard?.daily_trends || [];
  const maxVal = Math.max(...trends.map((t) => t.completed + t.pending), 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 7-Day Velocity Chart */}
      <div className="lg:col-span-2 bg-[#111827]/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>7-Day Payment Activity & Volume</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily distribution of settled volume vs pending authorizations
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>Settled</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" />
              <span>Pending</span>
            </span>
          </div>
        </div>

        {/* Bar Graph */}
        <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-800">
          {trends.map((day, idx) => {
            const completedHeight = Math.max((day.completed / maxVal) * 140, day.completed > 0 ? 8 : 2);
            const pendingHeight = Math.max((day.pending / maxVal) * 140, day.pending > 0 ? 8 : 2);
            const dateLabel = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-200 pointer-events-none -translate-y-1">
                  ${(day.completed + day.pending).toFixed(0)}
                </div>

                <div className="w-full max-w-[36px] flex flex-col items-center gap-1">
                  {/* Pending portion */}
                  {day.pending > 0 && (
                    <div
                      style={{ height: `${pendingHeight}px` }}
                      className="w-full bg-amber-500/80 rounded-t-sm transition-all hover:bg-amber-400"
                      title={`Pending: $${day.pending.toFixed(2)}`}
                    />
                  )}
                  {/* Completed portion */}
                  <div
                    style={{ height: `${completedHeight}px` }}
                    className={`w-full bg-blue-600 rounded-sm transition-all hover:bg-blue-500 ${
                      day.pending > 0 ? 'rounded-t-none' : ''
                    }`}
                    title={`Completed: $${day.completed.toFixed(2)}`}
                  />
                </div>

                <span className="text-[11px] text-slate-400 mt-1 font-mono">{dateLabel}</span>
              </div>
            );
          })}
        </div>

        {/* Chart Footnote / Quick Summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Transactions synchronize in real-time with PayPal payment endpoints.</span>
          </div>
          <button
            onClick={onSwitchToLab}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Open Quick Charge</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Quick Launch & Terminal Pad */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Quick Charge Shortcuts</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400">Ready</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Create instant PayPal checkout links for common customer billing tiers.
          </p>

          <div className="space-y-2.5">
            <button
              onClick={() => onQuickOrder(15.00, 'Micro-transaction Checkout')}
              className="w-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 p-2.5 rounded-lg text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                  $15.00 Express Checkout
                </div>
                <div className="text-[11px] text-slate-400">One-click customer checkout order</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onQuickOrder(49.99, 'Annual SaaS Pro Subscription')}
              className="w-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 p-2.5 rounded-lg text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                  $49.99 SaaS Pro Plan
                </div>
                <div className="text-[11px] text-slate-400">Recurring customer billing settlement</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => onQuickOrder(120.00, 'Professional Consulting Retainer')}
              className="w-full bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 p-2.5 rounded-lg text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                  $120.00 Consulting Retainer
                </div>
                <div className="text-[11px] text-slate-400">Professional client engagement fee</div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>PCI-DSS Compliant · TLS 1.3</span>
          </span>
          <span className="font-mono text-slate-400">USD</span>
        </div>
      </div>
    </div>
  );
};
