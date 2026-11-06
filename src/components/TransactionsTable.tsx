import React, { useMemo, useRef, useState, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ModuleRegistry, 
  AllCommunityModule, 
  themeQuartz,
  ColDef,
  GridReadyEvent
} from 'ag-grid-community';
import { 
  Search, 
  Download, 
  FileText, 
  RotateCcw, 
  Trash2, 
  SlidersHorizontal,
  Printer,
  Plus
} from 'lucide-react';
import { Transaction } from '../types';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Dark theme customized for PayPilot
const paypilotGridTheme = themeQuartz.withParams({
  backgroundColor: '#0c1222',
  foregroundColor: '#f1f5f9',
  headerBackgroundColor: '#111827',
  headerTextColor: '#94a3b8',
  oddRowBackgroundColor: '#0f172a',
  rowHoverColor: '#1e293b',
  borderColor: '#1e293b',
  fontSize: 12,
  fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
  headerFontSize: 11,
});

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
  const gridRef = useRef<AgGridReact>(null);
  const [quickFilterText, setQuickFilterText] = useState('');
  const [invoiceTx, setInvoiceTx] = useState<Transaction | null>(null);

  const onGridReady = useCallback((params: GridReadyEvent) => {
    params.api.sizeColumnsToFit();
  }, []);

  const exportCsv = useCallback(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.exportDataAsCsv({
        fileName: `paypilot_transactions_aggrid_${new Date().toISOString().split('T')[0]}.csv`,
      });
    }
  }, []);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef<Transaction>[]>(() => [
    {
      field: 'id',
      headerName: 'Record ID',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="font-mono text-[11px] text-blue-400 font-semibold">{params.value}</span>
      ),
      sortable: true,
      filter: true,
    },
    {
      field: 'description',
      headerName: 'Description & Item',
      flex: 2,
      minWidth: 180,
      cellRenderer: (params: any) => (
        <span className="font-medium text-slate-100">{params.value}</span>
      ),
      sortable: true,
      filter: true,
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 130,
      type: 'rightAligned',
      cellRenderer: (params: any) => (
        <span className="font-mono font-bold text-slate-100">
          ${Number(params.value).toFixed(2)} <span className="text-[10px] text-slate-400">{params.data?.currency || 'USD'}</span>
        </span>
      ),
      sortable: true,
      filter: 'agNumberColumnFilter',
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      cellRenderer: (params: any) => {
        const val = params.value;
        const color = val === 'Completed' ? 'bg-emerald-500' : val === 'Pending' ? 'bg-amber-500' : 'bg-rose-500';
        const text = val === 'Completed' ? 'text-emerald-400' : val === 'Pending' ? 'text-amber-400' : 'text-rose-400';
        return (
          <div className="flex items-center gap-1.5 h-full">
            <span className={`w-2 h-2 rounded-full ${color}`} />
            <span className={`text-xs font-semibold ${text}`}>{val}</span>
          </div>
        );
      },
      sortable: true,
      filter: true,
    },
    {
      field: 'source',
      headerName: 'Source',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-slate-300 text-xs">{params.value}</span>
      ),
      sortable: true,
      filter: true,
    },
    {
      headerName: 'Customer',
      flex: 1.5,
      minWidth: 160,
      valueGetter: (params) => params.data?.payer_email || params.data?.payer_name || 'Direct Checkout',
      cellRenderer: (params: any) => (
        <div className="leading-tight">
          <div className="text-slate-200 text-xs truncate">{params.data?.payer_name || params.data?.payer_email || 'Direct Checkout'}</div>
          {params.data?.payer_name && params.data?.payer_email && (
            <div className="text-[10px] text-slate-400 font-mono truncate">{params.data.payer_email}</div>
          )}
        </div>
      ),
      sortable: true,
      filter: true,
    },
    {
      field: 'created_at',
      headerName: 'Date',
      width: 140,
      cellRenderer: (params: any) => (
        <span className="text-[11px] font-mono text-slate-400">
          {new Date(params.value).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
      sortable: true,
      filter: 'agDateColumnFilter',
    },
    {
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const tx = params.data;
        if (!tx) return null;
        return (
          <div className="flex items-center gap-1.5 h-full">
            {tx.status === 'Pending' && tx.order_id && (
              <button
                onClick={() => onCaptureOrder(tx.order_id!)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors"
                title="Capture PayPal Order"
              >
                Capture
              </button>
            )}
            <button
              onClick={() => setInvoiceTx(tx)}
              className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
              title="Print Customer Receipt"
            >
              <FileText className="w-3.5 h-3.5" />
            </button>
            {tx.status === 'Completed' && (
              <button
                onClick={() => onRefundOrder(tx.id, tx.order_id)}
                className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
                title="Process Refund"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => onDeleteTransaction(tx.id)}
              className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 cursor-pointer transition-colors"
              title="Delete Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      },
    },
  ], [onCaptureOrder, onRefundOrder, onDeleteTransaction]);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
  }), []);

  return (
    <div className="bg-[#111827]/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm space-y-3 p-4">
      {/* AG Grid Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="AG Grid Search: filter by name, email, order ID, description..."
              value={quickFilterText}
              onChange={(e) => setQuickFilterText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans"
            />
          </div>

          <button
            onClick={exportCsv}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
            title="Export grid data to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateOrder}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Charge</span>
          </button>

          <span className="flex items-center gap-1 text-blue-400 font-mono text-[11px] bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>AG Grid v36</span>
          </span>
        </div>
      </div>

      {/* AG Grid Canvas */}
      <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-800">
        <AgGridReact
          ref={gridRef}
          theme={paypilotGridTheme}
          rowData={transactions}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilterText}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 20, 50]}
          onGridReady={onGridReady}
          animateRows={true}
        />
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
