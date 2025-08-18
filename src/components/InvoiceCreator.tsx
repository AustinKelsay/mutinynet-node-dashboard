import { useState } from 'react';
import { createInvoice } from '../lib/lnd';

export const InvoiceCreator = () => {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateInvoice = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setInvoice(null);
    
    try {
      const data = await createInvoice(parseInt(amount), memo || undefined);
      setInvoice(data.payment_request);
      setAmount('');
      setMemo('');
    } catch (err) {
      setError('Failed to create invoice');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invoice) return;
    
    try {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Create Invoice</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Amount (sats)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in sats"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Memo (optional)
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Description for this invoice"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleCreateInvoice}
          disabled={loading || !amount}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Creating Invoice...' : 'Create Invoice'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}

        {invoice && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Payment Request</span>
              <button
                onClick={copyToClipboard}
                className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-gray-800 p-3 rounded text-xs font-mono text-gray-300 break-all">
              {invoice}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};