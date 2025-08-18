import { useState } from 'react';
import { fetchLightningAddressInvoice } from '../lib/lnd';

interface FaucetInvoiceProps {
  onClose: () => void;
}

export const FaucetInvoice = ({ onClose }: FaucetInvoiceProps) => {
  const [amount, setAmount] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const lightningAddress = 'refund@lnurl.mutinynet.com';

  const handleRequestInvoice = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setInvoice(null);
    setSuccess(false);

    try {
      // Get invoice from Lightning Address
      const bolt11 = await fetchLightningAddressInvoice(
        lightningAddress,
        parseInt(amount)
      );
      
      setInvoice(bolt11);
      setSuccess(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request faucet invoice';
      
      // Check for CORS or network error
      if (errorMessage.includes('Network Error') || errorMessage.includes('CORS')) {
        setError('Network error: The CORS proxy may be down, or there may be a connection issue. Try again later.');
      } else {
        setError(errorMessage);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-purple-400 mb-4">
          Request Faucet Invoice
        </h3>
        
        <div className="mb-4">
          <p className="text-gray-400 text-sm mb-3">
            Request a Lightning invoice from MutinyNet faucet
          </p>
          <div className="bg-gray-700 rounded p-2 mb-3">
            <span className="text-gray-500 text-xs">Lightning Address:</span>
            <div className="font-mono text-sm text-purple-400">{lightningAddress}</div>
          </div>
          <div className="text-xs text-gray-500">
            Note: Using CORS proxy for development. Production deployment may not need this.
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && invoice ? (
          <div className="space-y-4">
            <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded-lg">
              <div className="text-lg font-semibold mb-2">✅ Invoice Received!</div>
              <div className="text-sm mb-3">Copy this invoice and pay it from your wallet to receive {amount} sats:</div>
              <div className="bg-gray-800 p-3 rounded">
                <textarea
                  readOnly
                  value={invoice}
                  className="w-full bg-transparent text-gray-300 font-mono text-xs resize-none focus:outline-none"
                  rows={4}
                  onClick={(e) => e.currentTarget.select()}
                />
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(invoice);
                  // Show temporary feedback
                  const btn = document.getElementById('copy-btn');
                  if (btn) {
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                      btn.textContent = 'Copy Invoice';
                    }, 2000);
                  }
                }}
                id="copy-btn"
                className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded transition-colors"
              >
                Copy Invoice
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Amount (sats)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount in sats"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
                min="1"
                max="100000"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setAmount('1000')}
                  className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                >
                  1k sats
                </button>
                <button
                  onClick={() => setAmount('5000')}
                  className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                >
                  5k sats
                </button>
                <button
                  onClick={() => setAmount('10000')}
                  className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                >
                  10k sats
                </button>
                <button
                  onClick={() => setAmount('50000')}
                  className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
                >
                  50k sats
                </button>
              </div>
            </div>


            <div className="flex gap-3">
              <button
                onClick={handleRequestInvoice}
                disabled={loading || !amount}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors"
              >
                {loading ? 'Requesting...' : 'Request Invoice'}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};