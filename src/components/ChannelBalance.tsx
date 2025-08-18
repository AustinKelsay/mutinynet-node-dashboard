import { useState, useEffect } from 'react';
import { getBalances } from '../lib/lnd';

interface BalanceData {
  balance: string;
  pending_open_balance: string;
  local_balance?: {
    sat: string;
    msat: string;
  };
  remote_balance?: {
    sat: string;
    msat: string;
  };
}

export const ChannelBalance = () => {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      const data = await getBalances();
      setBalance(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSats = (sats: string) => {
    return parseInt(sats).toLocaleString();
  };

  if (loading) return <div className="text-gray-400">Loading balance...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!balance) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-400">Channel Balance</h2>
        <button
          onClick={fetchBalance}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded p-4">
          <div className="text-gray-400 text-sm mb-1">Total Balance</div>
          <div className="text-2xl font-bold text-green-400">
            {formatSats(balance.balance)} sats
          </div>
        </div>
        <div className="bg-gray-700 rounded p-4">
          <div className="text-gray-400 text-sm mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">
            {formatSats(balance.pending_open_balance)} sats
          </div>
        </div>
        {balance.local_balance && (
          <div className="bg-gray-700 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Local Balance</div>
            <div className="text-xl font-bold text-blue-400">
              {formatSats(balance.local_balance.sat)} sats
            </div>
          </div>
        )}
        {balance.remote_balance && (
          <div className="bg-gray-700 rounded p-4">
            <div className="text-gray-400 text-sm mb-1">Remote Balance</div>
            <div className="text-xl font-bold text-orange-400">
              {formatSats(balance.remote_balance.sat)} sats
            </div>
          </div>
        )}
      </div>
    </div>
  );
};