import { useState } from 'react';
import { fetchLightningAddressInvoice, payInvoice } from '../lib/lnd';

interface FaucetInvoiceProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const FaucetInvoice = ({ onClose, onSuccess }: FaucetInvoiceProps) => {
  const [amount, setAmount] = useState('10000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const lightningAddress = 'refund@lnurl.mutinynet.com';

  const handleRequestAndPay = async () => {
    if (!amount || parseInt(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setInvoice(null);
    setSuccess(false);

    try {
      // Step 1: Get invoice from Lightning Address
      const bolt11 = await fetchLightningAddressInvoice(
        lightningAddress,
        parseInt(amount)
      );
      
      setInvoice(bolt11);
      
      // Step 2: Pay the invoice
      await payInvoice(bolt11);
      
      setSuccess(true);
      
      // Close after success
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request or pay faucet invoice';
      setError(errorMessage);
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
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-900/20 border border-green-500 text-green-400 p-4 rounded-lg text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="font-semibold">Payment Successful!</div>
            <div className="text-sm mt-1">You should receive {amount} sats soon</div>
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

            {invoice && !loading && (
              <div className="mb-4 p-3 bg-gray-700 rounded">
                <div className="text-xs text-gray-400 mb-1">Invoice received:</div>
                <div className="font-mono text-xs text-gray-300 break-all">
                  {invoice.substring(0, 50)}...
                </div>
                <div className="text-xs text-yellow-400 mt-2">
                  ⏳ Paying invoice...
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRequestAndPay}
                disabled={loading || !amount}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors"
              >
                {loading ? 'Processing...' : 'Request & Pay Invoice'}
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