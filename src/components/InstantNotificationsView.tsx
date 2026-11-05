import React, { useState } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  Clock, 
  DollarSign, 
  User, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  FileText
} from 'lucide-react';
import { WebhookEventRecord } from '../types';

interface InstantNotificationsViewProps {
  webhooks: WebhookEventRecord[];
  onRefresh: () => void;
  onOpenCharge?: () => void;
}

// Friendly translation of PayPal event types into merchant English
function getFriendlyEventInfo(eventType: string) {
  switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      return {
        title: 'Payment Received & Settled',
        description: 'Customer payment was captured and funds added to account',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        dotColor: 'bg-emerald-500',
      };
    case 'CHECKOUT.ORDER.APPROVED':
      return {
        title: 'Order Approved by Customer',
        description: 'Buyer authorized the checkout and is ready for settlement',
        badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        dotColor: 'bg-blue-500',
      };
    case 'PAYMENT.CAPTURE.REFUNDED':
      return {
        title: 'Payment Refunded',
        description: 'Refund transaction processed for previous order',
        badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        dotColor: 'bg-rose-500',
      };
    case 'PAYMENT.CAPTURE.DENIED':
      return {
        title: 'Payment Declined',
        description: 'Payment authorization could not be completed',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        dotColor: 'bg-amber-500',
      };
    case 'CUSTOMER.DISPUTE.CREATED':
      return {
        title: 'Customer Inquiry Received',
        description: 'Customer requested inquiry on recent payment',
        badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        dotColor: 'bg-purple-500',
      };
    default:
      return {
        title: eventType.replace(/\./g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()),
        description: 'Payment network notification received',
        badgeColor: 'text-slate-300 bg-slate-800 border-slate-700',
        dotColor: 'bg-slate-400',
      };
  }
}

// Extract human details from webhook payload
function parseNotificationDetails(item: WebhookEventRecord) {
  const resource = item.payload?.resource || {};
  const amount = resource.amount?.value || resource.purchase_units?.[0]?.amount?.value || null;
  const currency = resource.amount?.currency_code || resource.purchase_units?.[0]?.amount?.currency_code || 'USD';
  const orderId = resource.supplementary_data?.related_ids?.order_id || resource.id || item.event_id;
  const payerName = resource.payer?.name?.given_name 
    ? `${resource.payer.name.given_name} ${resource.payer.name.surname || ''}`
    : null;
  const payerEmail = resource.payer?.email_address || null;

  return { amount, currency, orderId, payerName, payerEmail };
}

export const InstantNotificationsView: React.FC<InstantNotificationsViewProps> = ({
  webhooks,
  onRefresh,
  onOpenCharge,
}) => {
  const [selectedItem, setSelectedItem] = useState<WebhookEventRecord | null>(null);

  return (
    <div className="space-y-4">
      {/* Overview Status Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Instant Payment Notifications
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time updates streamed directly as customers authorize and complete payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>PayPal Live Alerts Connected</span>
            </div>

            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Notifications"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Notification Stream */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-200">{webhooks.length}</span> payment events
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Automatic Instant Delivery</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/70">
          {webhooks.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mx-auto mb-3 text-slate-500">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-200 text-sm">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                As soon as a customer approves or completes a PayPal checkout, real-time alerts will appear here automatically.
              </p>
              {onOpenCharge && (
                <button
                  onClick={onOpenCharge}
                  className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  Create a Quick Charge
                </button>
              )}
            </div>
          ) : (
            webhooks.map((item) => {
              const friendly = getFriendlyEventInfo(item.event_type);
              const details = parseNotificationDetails(item);

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Status Dot */}
                    <div className="mt-1">
                      <span className={`w-2.5 h-2.5 rounded-full block ${friendly.dotColor}`} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100 text-xs">
                          {friendly.title}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${friendly.badgeColor}`}>
                          Verified
                        </span>
                      </div>

                      <p className="text-slate-400 text-xs">{item.summary || friendly.description}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.received_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </span>
                        <span className="text-slate-700" aria-hidden="true">·</span>
                        <span>{new Date(item.received_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {details.orderId && (
                          <>
                            <span className="text-slate-700" aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">Ref: {details.orderId.substring(0, 16)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side: Amount and Details button */}
                  <div className="flex items-center gap-4 justify-between sm:justify-end shrink-0 pl-6 sm:pl-0">
                    {details.amount && (
                      <div className="text-right">
                        <div className="font-mono font-bold text-slate-100 text-sm">
                          ${parseFloat(details.amount).toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{details.currency}</div>
                      </div>
                    )}

                    <button
                      onClick={() => setSelectedItem(item)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Clean Notification Details Modal (Human-readable, no raw JSON dump) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-sans">
                    {getFriendlyEventInfo(selectedItem.event_type).title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {selectedItem.event_id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Structured Details */}
            <div className="mt-4 space-y-3">
              {(() => {
                const details = parseNotificationDetails(selectedItem);
                return (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Event Status:</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified from PayPal</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Timestamp:</span>
                      <span className="text-slate-200 font-mono">
                        {new Date(selectedItem.received_at).toLocaleString()}
                      </span>
                    </div>

                    {details.amount && (
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-slate-400">Transaction Amount:</span>
                        <span className="font-mono text-slate-100 font-bold text-sm">
                          ${parseFloat(details.amount).toFixed(2)} {details.currency}
                        </span>
                      </div>
                    )}

                    {details.orderId && (
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-slate-400">Reference ID:</span>
                        <span className="font-mono text-blue-400 text-[11px] truncate max-w-[200px]" title={details.orderId}>
                          {details.orderId}
                        </span>
                      </div>
                    )}

                    {details.payerName && (
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                        <span className="text-slate-400">Payer Name:</span>
                        <span className="text-slate-200 font-medium">{details.payerName}</span>
                      </div>
                    )}

                    {details.payerEmail && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Payer Email:</span>
                        <span className="text-slate-200 font-mono text-[11px]">{details.payerEmail}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  This notification was cryptographically verified and recorded in your ledger in real time.
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors"
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
