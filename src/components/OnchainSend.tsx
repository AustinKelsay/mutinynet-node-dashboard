import { useState } from 'react';
import { sendCoins } from '../lib/lnd';

export const OnchainSend = () => {
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [feeRate, setFeeRate] = useState('');
  const [sendAll, setSendAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSend = async () => {
    if (!address) {
      setError('Please enter a Bitcoin address');
      return;
    }

    if (!sendAll && (!amount || parseInt(amount) <= 0)) {
      setError('Please enter a valid amount or select "Send All"');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const txid = await sendCoins(
        address,
        parseInt(amount || '0'),
        feeRate ? parseInt(feeRate) : undefined,
        sendAll
      );
      setSuccess(`Transaction sent! TXID: ${txid}`);
      setAddress('');
      setAmount('');
      setFeeRate('');
      setSendAll(false);
    } catch (err) {
      setError('Failed to send transaction. Please check the address and amount.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openInExplorer = (txid: string) => {
    const cleanTxid = txid.replace('Transaction sent! TXID: ', '');
    window.open(`https://mutinynet.com/tx/${cleanTxid}`, '_blank');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Send Onchain</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Bitcoin Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Bitcoin address"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            disabled={loading}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Amount (sats)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to send"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading || sendAll}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Fee Rate (sat/vB)
            </label>
            <input
              type="number"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
              placeholder="Optional"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="sendAll"
            checked={sendAll}
            onChange={(e) => setSendAll(e.target.checked)}
            className="w-4 h-4 text-purple-600 bg-gray-700 rounded focus:ring-purple-500"
            disabled={loading}
          />
          <label htmlFor="sendAll" className="text-gray-400 text-sm">
            Send all funds (sweep wallet)
          </label>
        </div>

        <button
          onClick={handleSend}
          disabled={loading || !address}
          className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Sending Transaction...' : 'Send Onchain'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900/20 border border-green-500 text-green-400 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="break-all">{success}</span>
              <button
                onClick={() => openInExplorer(success)}
                className="ml-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
              >
                View TX
              </button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          ⚠️ Always double-check the address before sending. Transactions cannot be reversed.
        </div>
      </div>
    </div>
  );
};