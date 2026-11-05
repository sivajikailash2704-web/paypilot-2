import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  RotateCcw, 
  Trash2, 
  FileText,
  Printer
} from 'lucide-react';
import { Transaction } from '../types';

interface TransactionsTableProps {
  transactions: Transaction[];
  onCaptureOrder: (orderId: string) => void;
  onRefundOrder: (txId: string, orderId?: string) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenCreateOrder: () => void;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  onCaptureOrder,
  onRefundOrder,
  onDeleteTransaction,
  onOpenCreateOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Refunded' | 'Failed'>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'PayPal Checkout' | 'Manual' | 'Invoice'>('All');
  const [invoiceTx, setInvoiceTx] = useState<Transaction | null>(null);
  const [capturingId, setCapturingId] = useState<string | null>(null);

  // Filtered transactions
  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.order_id && t.order_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.payer_email && t.payer_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.payer_name && t.payer_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesSource = sourceFilter === 'All' || t.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  const handleCapture = async (orderId: string) => {
    setCapturingId(orderId);
    try {
      await onCaptureOrder(orderId);
    } finally {
      setCapturingId(null);
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Order ID', 'Capture ID', 'Description', 'Amount', 'Currency', 'Status', 'Source', 'Payer Email', 'Created At'];
    const rows = filtered.map((t) => [
      t.id,
      t.order_id || '',
      t.capture_id || '',
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.currency,
      t.status,
      t.source,
      t.payer_email || '',
      t.created_at,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `paypilot_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by description, PayPal Order ID, or payer email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Export CSV button */}
          <button
            onClick={exportCSV}
            title="Export filtered records to CSV"
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            {(['All', 'Completed', 'Pending', 'Refunded'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as any)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="All">All Sources</option>
            <option value="PayPal Checkout">PayPal Checkout</option>
            <option value="Manual">Manual</option>
            <option value="Invoice">Invoices</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Transaction Details</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4">Source & ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="font-medium text-slate-300">No transactions match your criteria.</p>
                    <p className="text-xs text-slate-400">Create a new customer charge or adjust your filters.</p>
                    <button
                      onClick={onOpenCreateOrder}
                      className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                    >
                      Create Customer Charge
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Description & Payer */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-100">{tx.description}</div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {tx.payer_email && <span>{tx.payer_email}</span>}
                      {tx.payer_email && tx.payer_name && <span aria-hidden="true">·</span>}
                      {tx.payer_name && <span>{tx.payer_name}</span>}
                      {!tx.payer_email && !tx.payer_name && <span>Anonymous Payer</span>}
                    </div>
                  </td>

                  {/* Status: Zero-Pill style - Clean dot + typography */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      {tx.status === 'Completed' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-emerald-400">Completed</span>
                        </>
                      )}
                      {tx.status === 'Pending' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-amber-400">Pending</span>
                        </>
                      )}
                      {tx.status === 'Refunded' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-rose-400">Refunded</span>
                        </>
                      )}
                      {tx.status === 'Failed' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-slate-500" />
                          <span className="text-slate-400">Failed</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4 text-right">
                    <div className="font-mono font-semibold text-slate-100 text-sm">
                      ${tx.amount.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{tx.currency}</div>
                  </td>

                  {/* Source & Order ID */}
                  <td className="py-3 px-4">
                    <div className="text-slate-300 font-medium">{tx.source}</div>
                    {tx.order_id && (
                      <div className="text-[11px] font-mono text-blue-400 truncate max-w-[130px]" title={tx.order_id}>
                        {tx.order_id}
                      </div>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Capture button for pending orders */}
                      {tx.status === 'Pending' && tx.order_id && (
                        <button
                          onClick={() => handleCapture(tx.order_id!)}
                          disabled={capturingId === tx.order_id}
                          title="Capture PayPal Order Now"
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-medium px-2 py-1 rounded transition-colors cursor-pointer"
                        >
                          {capturingId === tx.order_id ? 'Capturing...' : 'Capture'}
                        </button>
                      )}

                      {/* Refund button for completed orders */}
                      {tx.status === 'Completed' && (
                        <button
                          onClick={() => onRefundOrder(tx.id, tx.order_id)}
                          title="Process refund"
                          className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* View & Print Customer Receipt */}
                      <button
                        onClick={() => setInvoiceTx(tx)}
                        title="View & Print Customer Receipt"
                        className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        title="Delete record"
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Showing {filtered.length} of {transactions.length} records</span>
        <span>Real-time multi-currency transaction ledger</span>
      </div>

      {/* Customer Receipt / Invoice Modal */}
      {invoiceTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-100 font-sans">Payment Receipt & Invoice</h3>
              </div>
              <button
                onClick={() => setInvoiceTx(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-base font-bold text-slate-100">PayPilot Business</h4>
                  <p className="text-[11px] text-slate-400">Electronic Payment Receipt</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs text-blue-400 font-bold block">{invoiceTx.id}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(invoiceTx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Billed To</span>
                  <p className="font-medium text-slate-200 mt-0.5">{invoiceTx.payer_name || 'Customer'}</p>
                  <p className="text-[11px] text-slate-400">{invoiceTx.payer_email || 'Direct Checkout'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Payment Method</span>
                  <p className="font-medium text-slate-200 mt-0.5">{invoiceTx.source}</p>
                  <p className="text-[11px] font-mono text-emerald-400">{invoiceTx.status}</p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-300 font-medium">{invoiceTx.description}</span>
                  <span className="font-mono text-slate-100 font-semibold">${invoiceTx.amount.toFixed(2)} {invoiceTx.currency}</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 text-slate-500 text-[11px]">
                  <span>Processing Fee</span>
                  <span className="font-mono">$0.00</span>
                </div>
                <div className="flex items-center justify-between text-sm py-2 border-t border-slate-800 mt-2 font-bold">
                  <span className="text-slate-100">Total Settled</span>
                  <span className="font-mono text-emerald-400">${invoiceTx.amount.toFixed(2)} {invoiceTx.currency}</span>
                </div>
              </div>

              {(invoiceTx.order_id || invoiceTx.capture_id) && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  {invoiceTx.order_id && <div>PayPal Order ID: {invoiceTx.order_id}</div>}
                  {invoiceTx.capture_id && <div>Capture Transaction ID: {invoiceTx.capture_id}</div>}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setInvoiceTx(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
