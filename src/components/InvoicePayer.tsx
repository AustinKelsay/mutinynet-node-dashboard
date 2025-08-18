import { useState } from 'react';
import { payInvoice } from '../lib/lnd';

export const InvoicePayer = () => {
  const [paymentRequest, setPaymentRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePayInvoice = async () => {
    if (!paymentRequest.trim()) {
      setError('Please enter a payment request');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await payInvoice(paymentRequest);
      setSuccess(`Payment successful! Hash: ${response.payment_hash.substring(0, 20)}...`);
      setPaymentRequest('');
    } catch (err) {
      setError('Failed to pay invoice. Please check the payment request and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPaymentRequest(text);
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Pay Invoice</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-400 text-sm">
              Payment Request
            </label>
            <button
              onClick={handlePaste}
              className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
            >
              Paste
            </button>
          </div>
          <textarea
            value={paymentRequest}
            onChange={(e) => setPaymentRequest(e.target.value)}
            placeholder="Enter or paste Lightning invoice"
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
            rows={4}
            disabled={loading}
          />
        </div>

        <button
          onClick={handlePayInvoice}
          disabled={loading || !paymentRequest}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Processing Payment...' : 'Pay Invoice'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 p-3 rounded-lg">
            {success}
          </div>
        )}
      </div>
    </div>
  );
};