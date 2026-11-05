import React from 'react';
import { 
  Zap, 
  RotateCcw, 
  Plus, 
  Sparkles, 
  Bell,
  CheckCircle2,
  Receipt,
  LayoutDashboard,
  CreditCard
} from 'lucide-react';
import { ConfigData } from '../types';

export type NavTab = 'dashboard' | 'transactions' | 'charge' | 'alerts';

interface HeaderProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  config: ConfigData | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenCreateOrder: () => void;
  onOpenNewTx: () => void;
  onToggleAssistant: () => void;
  isAssistantOpen: boolean;
  unreadAlertsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  config,
  isRefreshing,
  onRefresh,
  onOpenCreateOrder,
  onOpenNewTx,
  onToggleAssistant,
  isAssistantOpen,
  unreadAlertsCount = 0,
}) => {
  return (
    <header className="border-b border-slate-800 bg-[#0c1222]/95 backdrop-blur-md sticky top-0 z-30">
      {/* Top Banner: Real Production Connection Status */}
      <div className="border-b border-slate-800/60 px-4 lg:px-8 py-1.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PayPal Connected</span>
          </div>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="text-slate-400 hidden sm:inline flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 inline" />
            <span>Live Auto-Sync Active</span>
          </span>
          <span className="text-slate-700 hidden sm:inline" aria-hidden="true">·</span>
          <span className="text-slate-400 hidden md:inline">Merchant ID: <span className="font-mono text-slate-300">{config?.clientIdMasked || 'Active'}</span></span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            title="Refresh payment records"
            className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Main Brand & Actions */}
      <div className="px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight font-sans">PayPilot</h1>
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-mono">
                Merchant
              </span>
            </div>
            <p className="text-xs text-slate-400">Payment Processing & Financial Operations</p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenCreateOrder}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Charge</span>
          </button>

          <button
            onClick={onOpenNewTx}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-400" />
            <span>New Invoice</span>
          </button>

          <button
            onClick={onToggleAssistant}
            className={`text-xs px-3 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
              isAssistantOpen
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Financial Copilot</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Navigation: 4 Clean Tabs */}
      <div className="px-4 lg:px-8 flex items-center gap-2 border-t border-slate-800/80 py-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'dashboard'
              ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'transactions'
              ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Transactions</span>
        </button>

        <button
          onClick={() => setActiveTab('charge')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'charge'
              ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Quick Charge</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 relative ${
            activeTab === 'alerts'
              ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-amber-400" />
          <span>Instant Notifications</span>
          {unreadAlertsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          )}
        </button>
      </div>
    </header>
  );
};

