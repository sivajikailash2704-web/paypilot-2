import express, { Request, Response } from 'express';
import { Store, Transaction, WebhookEventRecord } from './store.js';
import { 
  createOrder, 
  captureOrder, 
  getOrderDetails, 
  getPayPalConfig, 
  verifyWebhookSignature,
  setDynamicWebhookId,
  getActiveWebhookId,
  fetchPayPalWebhooks,
  registerPayPalWebhook
} from './paypal.js';
import { handleAssistantQuery } from './assistant.js';

export const apiRouter = express.Router();

// Middleware to parse JSON
apiRouter.use(express.json());

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  const config = getPayPalConfig();
  res.json({
    status: 'ok',
    app: 'PayPilot - Payment Operations Platform',
    gateway_status: 'online',
    configured: Boolean(config.clientId && config.clientSecret),
    timestamp: new Date().toISOString(),
  });
});

// App configuration & gateway status
apiRouter.get('/config', (req: Request, res: Response) => {
  const config = getPayPalConfig();
  const maskedClientId = config.clientId
    ? `${config.clientId.substring(0, 8)}...${config.clientId.substring(config.clientId.length - 6)}`
    : 'Not configured';

  const activeWebhook = getActiveWebhookId();

  res.json({
    mode: 'PayPal Connected',
    baseUrl: 'PayPal Production REST API',
    clientIdMasked: maskedClientId,
    hasSecret: Boolean(config.clientSecret),
    webhookConfigured: Boolean(activeWebhook),
    activeWebhookId: activeWebhook,
    callbackUrl: `${process.env.APP_URL || 'https://your-domain.run.app'}/api/paypal/webhook`,
    defaultTestCards: [
      { type: 'Corporate Visa', number: '4035 1234 5678 9010', exp: '12/28', cvv: '123' },
      { type: 'Mastercard World', number: '5424 0000 0000 0008', exp: '10/27', cvv: '456' },
      { type: 'Amex Business', number: '3782 8224 6310 005', exp: '08/29', cvv: '8888' },
    ],
    sandboxTips: []
  });
});

// Webhook config & auto-registration
apiRouter.get('/paypal/webhook-config', async (req: Request, res: Response) => {
  const activeWebhook = getActiveWebhookId();
  const callbackUrl = `${process.env.APP_URL || 'https://your-domain.run.app'}/api/paypal/webhook`;
  const existingWebhooks = await fetchPayPalWebhooks();

  res.json({
    activeWebhookId: activeWebhook,
    callbackUrl,
    configured: Boolean(activeWebhook),
    existingWebhooks,
  });
});

apiRouter.post('/paypal/webhook-config', (req: Request, res: Response) => {
  const { webhook_id } = req.body;
  if (!webhook_id || typeof webhook_id !== 'string') {
    res.status(400).json({ error: 'Valid webhook_id string is required.' });
    return;
  }
  setDynamicWebhookId(webhook_id.trim());
  res.json({ message: 'Webhook ID saved successfully.', webhook_id: getActiveWebhookId() });
});

apiRouter.post('/paypal/auto-register-webhook', async (req: Request, res: Response) => {
  const callbackUrl = req.body.url || `${process.env.APP_URL || 'http://localhost:3000'}/api/paypal/webhook`;
  try {
    const result = await registerPayPalWebhook(callbackUrl);
    res.json({
      message: 'Webhook registered successfully with PayPal REST API.',
      webhook_id: result.id,
      url: result.url,
    });
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Failed to auto-register webhook with PayPal.' });
  }
});

// Dashboard metrics & transactions
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const transactions = Store.getTransactions();
  const completedTotal = transactions
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTotal = transactions
    .filter(t => t.status === 'Pending')
    .reduce((sum, t) => sum + t.amount, 0);

  const refundedTotal = transactions
    .filter(t => t.status === 'Refunded')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by currency
  const currencyMap: Record<string, number> = {};
  transactions.forEach(t => {
    currencyMap[t.currency] = (currencyMap[t.currency] || 0) + t.amount;
  });

  // Calculate daily totals for last 7 days
  const last7Days: { date: string; completed: number; pending: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayTxs = transactions.filter(t => t.created_at.startsWith(dateStr));
    last7Days.push({
      date: dateStr,
      completed: dayTxs.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0),
      pending: dayTxs.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0),
    });
  }

  res.json({
    completed_total: Math.round(completedTotal * 100) / 100,
    pending_total: Math.round(pendingTotal * 100) / 100,
    refunded_total: Math.round(refundedTotal * 100) / 100,
    transaction_count: transactions.length,
    currency_distribution: currencyMap,
    daily_trends: last7Days,
    transactions,
  });
});

// Financial Insights (matches original python endpoint + enhanced)
apiRouter.get('/insights', (req: Request, res: Response) => {
  const transactions = Store.getTransactions();
  const pending = transactions.filter(t => t.status === 'Pending');
  const completed = transactions.filter(t => t.status === 'Completed');
  const refunded = transactions.filter(t => t.status === 'Refunded');

  const largestPending = pending.length > 0
    ? [...pending].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const largestCompleted = completed.length > 0
    ? [...completed].sort((a, b) => b.amount - a.amount)[0]
    : null;

  const sandboxCount = transactions.filter(t => t.source === 'PayPal Checkout').length;

  res.json({
    total_transactions: transactions.length,
    pending_count: pending.length,
    completed_count: completed.length,
    refunded_count: refunded.length,
    sandbox_count: sandboxCount,
    largest_pending: largestPending ? { description: largestPending.description, amount: largestPending.amount, currency: largestPending.currency } : null,
    largest_completed: largestCompleted ? { description: largestCompleted.description, amount: largestCompleted.amount, currency: largestCompleted.currency } : null,
    conversion_rate: transactions.length > 0 ? Math.round((completed.length / transactions.length) * 100) : 0,
  });
});

// Transactions list & create
apiRouter.get('/transactions', (req: Request, res: Response) => {
  const transactions = Store.getTransactions();
  res.json({ transactions });
});

apiRouter.post('/transactions', (req: Request, res: Response) => {
  const { description, amount, currency = 'USD', status = 'Pending', source = 'Manual' } = req.body;
  if (!description || typeof description !== 'string') {
    res.status(400).json({ error: 'Description is required.' });
    return;
  }
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Amount must be greater than zero.' });
    return;
  }
  if (!['Pending', 'Completed', 'Refunded', 'Failed'].includes(status)) {
    res.status(400).json({ error: 'Invalid status value.' });
    return;
  }

  const tx = Store.addTransaction({
    description: description.trim(),
    amount: Math.round(parsedAmount * 100) / 100,
    currency: currency.toUpperCase(),
    status,
    source,
  });

  res.status(201).json({ id: tx.id, message: 'Transaction added successfully.', transaction: tx });
});

apiRouter.delete('/transactions/:id', (req: Request, res: Response) => {
  const success = Store.deleteTransaction(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }
  res.json({ message: 'Transaction deleted successfully.' });
});

apiRouter.post('/transactions/reset', (req: Request, res: Response) => {
  Store.resetTransactions();
  res.json({ message: 'Reset to default sample and sandbox transactions.' });
});

// PayPal Checkout: Create Order
apiRouter.post('/paypal/create-order', async (req: Request, res: Response) => {
  const { amount, currency = 'USD', description = 'PayPilot test order' } = req.body;
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: 'Amount must be a positive number.' });
    return;
  }

  try {
    const order = await createOrder({
      amount: parsedAmount,
      currency,
      description,
    });

    // Record the pending transaction into Store so it is visible immediately in the monitoring UI
    const tx = Store.addTransaction({
      order_id: order.orderId,
      description,
      amount: parsedAmount,
      currency: currency.toUpperCase(),
      status: 'Pending',
      source: 'PayPal Checkout',
      raw_details: order.raw,
    });

    res.json({
      order_id: order.orderId,
      approve_url: order.approveUrl,
      status: order.status,
      isSimulated: order.isSimulated,
      errorNotice: order.errorNotice,
      transaction_id: tx.id,
    });
  } catch (err: any) {
    console.error('Error creating PayPal order:', err);
    res.status(502).json({ error: err.message || 'PayPal order creation failed.' });
  }
});

// PayPal Checkout: Capture Order
apiRouter.post('/paypal/capture-order', async (req: Request, res: Response) => {
  const { order_id } = req.body;
  if (!order_id || typeof order_id !== 'string') {
    res.status(400).json({ error: 'order_id is required.' });
    return;
  }

  try {
    const captureResult = await captureOrder(order_id);

    // Update matching transaction or create new one
    const transactions = Store.getTransactions();
    const existing = transactions.find(t => t.order_id === order_id);

    let updatedTx: Transaction | null = null;
    if (existing) {
      updatedTx = Store.updateTransaction(existing.id, {
        status: 'Completed',
        capture_id: captureResult.captureId,
        amount: captureResult.amount > 0 ? captureResult.amount : existing.amount,
        payer_email: captureResult.payer?.email_address || existing.payer_email,
        payer_name: captureResult.payer?.name ? `${captureResult.payer.name.given_name || ''} ${captureResult.payer.name.surname || ''}`.trim() : existing.payer_name,
        raw_details: captureResult.raw,
      });
    } else {
      updatedTx = Store.addTransaction({
        order_id,
        capture_id: captureResult.captureId,
        description: `PayPal order ${order_id}`,
        amount: captureResult.amount > 0 ? captureResult.amount : 25.00,
        currency: captureResult.currency || 'USD',
        status: 'Completed',
        source: 'PayPal Checkout',
        payer_email: captureResult.payer?.email_address,
        raw_details: captureResult.raw,
      });
    }

    res.json({
      status: captureResult.status,
      capture_id: captureResult.captureId,
      amount: captureResult.amount,
      currency: captureResult.currency,
      transaction: updatedTx,
    });
  } catch (err: any) {
    console.error('Capture failed:', err);
    res.status(502).json({ error: err.message || 'PayPal capture failed.' });
  }
});

// Fetch Order info from PayPal Checkout
apiRouter.get('/paypal/order/:orderId', async (req: Request, res: Response) => {
  try {
    const details = await getOrderDetails(req.params.orderId);
    res.json(details);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Refund an order / transaction
apiRouter.post('/paypal/refund-order', (req: Request, res: Response) => {
  const { id, order_id, reason = 'Customer requested sandbox refund' } = req.body;
  const transactions = Store.getTransactions();
  const tx = transactions.find(t => t.id === id || (order_id && t.order_id === order_id));
  if (!tx) {
    res.status(404).json({ error: 'Transaction not found.' });
    return;
  }

  const updated = Store.updateTransaction(tx.id, {
    status: 'Refunded',
    description: `${tx.description} (Refunded: ${reason})`,
  });

  // Also record a webhook event for audit
  Store.addWebhook({
    event_id: `WH-REFUND-${Date.now()}`,
    event_type: 'PAYMENT.CAPTURE.REFUNDED',
    summary: `Refunded payment of $${tx.amount} ${tx.currency} for order ${tx.order_id || tx.id}`,
    verification_status: 'SUCCESS',
    resource_type: 'refund',
    payload: {
      id: `REF-${Date.now()}`,
      status: 'COMPLETED',
      amount: { value: `${tx.amount.toFixed(2)}`, currency_code: tx.currency },
      reason,
      parent_payment: tx.capture_id || tx.order_id,
    }
  });

  res.json({ message: 'Order marked as refunded.', transaction: updated });
});

// PayPal Live Webhook Listener
apiRouter.post('/paypal/webhook', async (req: Request, res: Response) => {
  const event = req.body;
  if (!event || !event.event_type) {
    res.status(400).json({ error: 'Invalid webhook payload.' });
    return;
  }

  const headers = req.headers as Record<string, string>;
  const isValid = await verifyWebhookSignature(headers, event);

  const eventRecord = Store.addWebhook({
    event_id: event.id || `wh_${Date.now()}`,
    event_type: event.event_type,
    summary: event.summary || `Received ${event.event_type}`,
    verification_status: isValid ? 'SUCCESS' : 'UNVERIFIED',
    resource_type: event.resource_type,
    payload: event,
  });

  // Automatic state updates on known webhook events
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const resource = event.resource || {};
    const customId = resource.custom_id || resource.supplementary_data?.related_ids?.order_id;
    if (customId) {
      Store.updateTransaction(customId, { status: 'Completed', capture_id: resource.id });
    }
  }

  res.json({ status: 'received', event_id: eventRecord.id, verified: isValid });
});

// Verify Webhook Signature Endpoint (matches Python original)
apiRouter.post('/paypal/webhook/verify', async (req: Request, res: Response) => {
  const headers = req.headers as Record<string, string>;
  const body = req.body;
  const verified = await verifyWebhookSignature(headers, body);
  res.json({ verification_status: verified ? 'SUCCESS' : 'FAILURE' });
});

// Get Webhook history
apiRouter.get('/paypal/webhooks', (req: Request, res: Response) => {
  const webhooks = Store.getWebhooks();
  res.json({ webhooks });
});

// Webhook Simulator for Hackathon Demos
apiRouter.post('/paypal/simulate-webhook', (req: Request, res: Response) => {
  const { event_type = 'PAYMENT.CAPTURE.COMPLETED', order_id, amount = 29.00, currency = 'USD' } = req.body;

  const simEventId = `WH-SIM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const targetOrderId = order_id || `8WJ${Math.floor(100000 + Math.random() * 900000)}B`;

  let summary = `Simulated webhook: ${event_type}`;
  let payload: any = {
    id: simEventId,
    event_type,
    create_time: new Date().toISOString(),
    resource_type: 'capture',
    resource: {
      id: `CAP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'COMPLETED',
      amount: { value: Number(amount).toFixed(2), currency_code: currency },
      supplementary_data: { related_ids: { order_id: targetOrderId } },
    }
  };

  if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    summary = `Payment capture completed for ${amount} ${currency}`;
    // If matching transaction exists, complete it
    const txs = Store.getTransactions();
    const match = txs.find(t => t.order_id === targetOrderId || t.id === targetOrderId);
    if (match) {
      Store.updateTransaction(match.id, {
        status: 'Completed',
        capture_id: payload.resource.id,
      });
    } else {
      Store.addTransaction({
        order_id: targetOrderId,
        capture_id: payload.resource.id,
        description: `Simulated Sandbox Webhook Order`,
        amount: Number(amount),
        currency,
        status: 'Completed',
        source: 'PayPal Checkout',
        payer_email: 'webhook-sim@sandbox.paypal.com',
      });
    }
  } else if (event_type === 'CHECKOUT.ORDER.APPROVED') {
    summary = `Buyer approved order ${targetOrderId}`;
    payload.resource_type = 'checkout-order';
    payload.resource = { id: targetOrderId, status: 'APPROVED', intent: 'CAPTURE' };
    const txs = Store.getTransactions();
    const match = txs.find(t => t.order_id === targetOrderId);
    if (match) {
      Store.updateTransaction(match.id, { status: 'Pending' });
    }
  } else if (event_type === 'PAYMENT.CAPTURE.DENIED') {
    summary = `Payment capture denied for order ${targetOrderId}`;
    payload.resource.status = 'DENIED';
    const txs = Store.getTransactions();
    const match = txs.find(t => t.order_id === targetOrderId);
    if (match) {
      Store.updateTransaction(match.id, { status: 'Failed' });
    }
  } else if (event_type === 'PAYMENT.CAPTURE.REFUNDED') {
    summary = `Refund issued for order ${targetOrderId}`;
    payload.resource_type = 'refund';
    payload.resource.status = 'COMPLETED';
    const txs = Store.getTransactions();
    const match = txs.find(t => t.order_id === targetOrderId);
    if (match) {
      Store.updateTransaction(match.id, { status: 'Refunded' });
    }
  }

  const record = Store.addWebhook({
    event_id: simEventId,
    event_type,
    summary,
    verification_status: 'VERIFIED',
    resource_type: payload.resource_type,
    payload,
  });

  res.json({
    message: `Simulated ${event_type} webhook successfully processed.`,
    event: record,
  });
});

// PayPilot AI Assistant
apiRouter.post('/assistant', async (req: Request, res: Response) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Please enter a question or command.' });
    return;
  }

  try {
    const reply = await handleAssistantQuery(message.trim());
    res.json({ reply });
  } catch (err: any) {
    console.error('Assistant error:', err);
    res.json({ reply: 'I encountered an error analyzing your payment data. Please try again.' });
  }
});
