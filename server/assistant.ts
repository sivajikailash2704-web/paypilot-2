import { GoogleGenAI } from '@google/genai';
import { Store, Transaction } from './store.js';

export async function handleAssistantQuery(message: string): Promise<string> {
  const transactions = Store.getTransactions();
  const webhooks = Store.getWebhooks();

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({});
      const prompt = `
You are PayPilot, an intelligent financial operations copilot and merchant analytics assistant.
You help business operators and finance teams understand their real-time payment dashboard, captured revenue, pending authorizations, settlement velocity, and webhook notification events.

Rules:
- Give concise, highly practical, and actionable insights.
- Ground your analysis directly in the current live payment transaction records and webhook data provided below.
- Never claim to move real banking funds or provide formal regulated investment advice.

CURRENT DASHBOARD STATE:
Total Transactions: ${transactions.length}
Completed: ${transactions.filter(t => t.status === 'Completed').length} (Total: $${transactions.filter(t => t.status === 'Completed').reduce((sum, t) => sum + t.amount, 0).toFixed(2)})
Pending: ${transactions.filter(t => t.status === 'Pending').length} (Total: $${transactions.filter(t => t.status === 'Pending').reduce((sum, t) => sum + t.amount, 0).toFixed(2)})
Refunded: ${transactions.filter(t => t.status === 'Refunded').length}
Failed: ${transactions.filter(t => t.status === 'Failed').length}

RECENT TRANSACTIONS:
${JSON.stringify(transactions.slice(0, 10).map(t => ({
  id: t.id,
  order_id: t.order_id,
  description: t.description,
  amount: t.amount,
  currency: t.currency,
  status: t.status,
  source: t.source,
  date: t.created_at
})), null, 2)}

RECENT WEBHOOK EVENTS (${webhooks.length} total):
${JSON.stringify(webhooks.slice(0, 5).map(w => ({
  type: w.event_type,
  time: w.received_at,
  status: w.verification_status
})), null, 2)}

USER QUESTION:
"${message}"
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to deterministic assistant:', err.message);
    }
  }

  // Heuristic rule-based fallback (enhanced from original python prototype)
  const qLower = message.toLowerCase();
  const pending = transactions.filter(t => t.status === 'Pending');
  const completed = transactions.filter(t => t.status === 'Completed');
  const refunded = transactions.filter(t => t.status === 'Refunded');

  if (qLower.includes('largest') || qLower.includes('biggest') || qLower.includes('highest')) {
    if (pending.length > 0) {
      const largestPending = [...pending].sort((a, b) => b.amount - a.amount)[0];
      return `The largest pending payment is **${largestPending.description}** for **$${largestPending.amount.toFixed(2)} ${largestPending.currency}** (ID: ${largestPending.id}).`;
    }
    if (transactions.length > 0) {
      const largest = [...transactions].sort((a, b) => b.amount - a.amount)[0];
      return `The highest value transaction recorded is **${largest.description}** for **$${largest.amount.toFixed(2)} ${largest.currency}** [${largest.status}].`;
    }
    return 'No transactions have been recorded yet.';
  }

  if (qLower.includes('pending')) {
    const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
    return `You have **${pending.length}** pending transactions totaling **$${totalPending.toFixed(2)} USD**. Once authorized by customers, capture them to settle funds.`;
  }

  if (qLower.includes('completed') || qLower.includes('revenue') || qLower.includes('sales')) {
    const totalCompleted = completed.reduce((sum, t) => sum + t.amount, 0);
    return `You have **${completed.length}** settled transactions totaling **$${totalCompleted.toFixed(2)} USD** in captured revenue.`;
  }

  if (qLower.includes('webhook') || qLower.includes('event')) {
    return `There are **${webhooks.length}** webhook events recorded in your event log, tracking automated payment captures, approvals, and settlements.`;
  }

  const totalVol = transactions.reduce((sum, t) => sum + t.amount, 0);
  return `PayPilot Financial Overview: You have **${transactions.length}** total transactions recorded ($${totalVol.toFixed(2)} overall volume), with **${completed.length} completed**, **${pending.length} pending authorization**, and **${refunded.length} refunded**. Try asking for "largest pending invoice" or "summarize sales".`;
}
