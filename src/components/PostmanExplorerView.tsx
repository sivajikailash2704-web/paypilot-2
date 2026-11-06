import React, { useState } from 'react';
import { 
  Send, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Clock, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Code
} from 'lucide-react';
import { safeFetchJson } from '../utils/api';

interface EndpointConfig {
  name: string;
  method: 'GET' | 'POST';
  path: string;
  description: string;
  defaultBody?: string;
}

const ENDPOINTS: EndpointConfig[] = [
  {
    name: 'System Health & Connection',
    method: 'GET',
    path: '/api/health',
    description: 'Verifies PayPal gateway connection and operational readiness',
  },
  {
    name: 'Dashboard Analytics',
    method: 'GET',
    path: '/api/dashboard',
    description: 'Retrieves aggregated volume, daily trends, and transactions ledger',
  },
  {
    name: 'Create PayPal Order',
    method: 'POST',
    path: '/api/paypal/create-order',
    description: 'Dispatches authorized order request to PayPal REST API',
    defaultBody: JSON.stringify({ amount: 45.00, currency: 'USD', description: 'Enterprise SaaS Pro Plan' }, null, 2),
  },
  {
    name: 'Test Zapier Automation',
    method: 'POST',
    path: '/api/zapier/test',
    description: 'Tests automated webhook event dispatch to Zapier',
    defaultBody: JSON.stringify({ webhookUrl: 'https://hooks.zapier.com/hooks/catch/sample/hook' }, null, 2),
  },
];

export const PostmanExplorerView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(ENDPOINTS[0]);
  const [requestBody, setRequestBody] = useState(ENDPOINTS[0].defaultBody || '');
  const [running, setRunning] = useState(false);
  const [response, setResponse] = useState<any | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const handleSelectEndpoint = (ep: EndpointConfig) => {
    setSelectedEndpoint(ep);
    setRequestBody(ep.defaultBody || '');
    setResponse(null);
  };

  const handleRunRequest = async () => {
    setRunning(true);
    setResponse(null);

    let parsedBody: any = undefined;
    if (selectedEndpoint.method === 'POST' && requestBody.trim()) {
      try {
        parsedBody = JSON.parse(requestBody);
      } catch (err) {
        setResponse({
          status: 400,
          statusText: 'Bad Request',
          latency_ms: 1,
          error: 'Invalid JSON body syntax.',
        });
        setRunning(false);
        return;
      }
    }

    try {
      const res = await safeFetchJson('/api/postman/test-runner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: selectedEndpoint.path,
          method: selectedEndpoint.method,
          body: parsedBody,
        }),
      });

      if (!res.ok) {
        setResponse({
          status: res.status || 500,
          statusText: 'Gateway Error',
          latency_ms: 0,
          error: res.error || 'Failed to execute endpoint runner',
          responseBody: res.data || { error: res.error },
        });
      } else {
        setResponse(res.data);
      }
    } catch (err: any) {
      setResponse({
        status: 500,
        statusText: 'Network Error',
        latency_ms: 0,
        error: err.message,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadCollection = () => {
    const a = document.createElement('a');
    a.href = '/api/postman/collection';
    a.download = 'paypilot_paypal_postman_collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyResponseJson = () => {
    if (!response) return;
    navigator.clipboard.writeText(JSON.stringify(response.responseBody || response, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const curlCommand = `curl -X ${selectedEndpoint.method} "https://your-domain.run.app${selectedEndpoint.path}" \\
  -H "Content-Type: application/json"${selectedEndpoint.method === 'POST' && requestBody ? ` \\
  -d '${requestBody.replace(/\n/g, '')}'` : ''}`;

  const copyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Send className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-sans">
                  Postman API Workspace & Test Runner
                </h2>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full font-mono">
                  Collection v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execute live requests against PayPilot and PayPal payment APIs with instant response telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCollection}
              className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Download Postman Collection v2.1 JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Postman Collection</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column: Request Builder on left, Response Inspector on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request Builder */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span>Request Builder</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">HTTP REST</span>
          </div>

          {/* Endpoint Selector Tabs */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Select Endpoint to Test:</label>
            <div className="space-y-1.5">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.path}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs ${
                    selectedEndpoint.path === ep.path
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 shadow-xs'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${ep.method === 'POST' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {ep.method}
                    </span>
                    <span className="font-mono text-slate-200">{ep.path}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">{ep.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* URL Bar */}
          <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className={`font-bold text-[10px] px-1.5 py-0.5 rounded ${selectedEndpoint.method === 'POST' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
              {selectedEndpoint.method}
            </span>
            <span className="text-slate-200 truncate flex-1">{selectedEndpoint.path}</span>
            <button
              onClick={handleRunRequest}
              disabled={running}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-3.5 py-1.5 rounded-md flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>{running ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          {/* Body editor if POST */}
          {selectedEndpoint.method === 'POST' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Request Body (JSON):</label>
              <textarea
                rows={5}
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-orange-300 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}

          {/* cURL Snippet */}
          <div className="pt-2 border-t border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] flex items-center gap-1">
                <Terminal className="w-3 h-3 text-slate-400" />
                <span>Equivalent cURL Command</span>
              </span>
              <button
                onClick={copyCurl}
                className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-400 overflow-x-auto border border-slate-800">
              {curlCommand}
            </pre>
          </div>
        </div>

        {/* Right: Response Inspector */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Response Telemetry</span>
              </h3>

              {response && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    {response.status} {response.statusText}
                  </span>
                  <span className="font-mono text-amber-300 text-[11px] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{response.latency_ms}ms</span>
                  </span>
                </div>
              )}
            </div>

            {response ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Formatted Response JSON:</span>
                  <button
                    onClick={copyResponseJson}
                    className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedResponse ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedResponse ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 p-3.5 rounded-xl text-xs font-mono text-emerald-300 max-h-[360px] overflow-y-auto border border-slate-800 leading-relaxed">
                  {JSON.stringify(response.responseBody || response, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="py-20 text-center text-slate-500 text-xs">
                <Send className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                <p className="text-slate-300 font-medium">Ready to execute</p>
                <p className="text-slate-500 text-[11px] mt-1 max-w-xs mx-auto">
                  Click "Send" on the left to fire a live API request and inspect headers, latency, and status.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Payload Engine: Postman v2.1</span>
            <span>PayPal Gateway Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
