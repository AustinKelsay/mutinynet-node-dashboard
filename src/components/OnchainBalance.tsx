import { useState, useEffect } from 'react';
import { getWalletBalance, listUnspent } from '../lib/lnd';

interface WalletBalanceData {
  total_balance: string;
  confirmed_balance: string;
  unconfirmed_balance: string;
  locked_balance: string;
  reserved_balance_anchor_chan: string;
}

interface UtxoData {
  utxos: Array<{
    address: string;
    amount_sat: string;
    confirmations: string;
    outpoint: {
      txid_str: string;
      output_index: number;
    };
  }>;
}

export const OnchainBalance = () => {
  const [balance, setBalance] = useState<WalletBalanceData | null>(null);
  const [utxos, setUtxos] = useState<UtxoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUtxos, setShowUtxos] = useState(false);

  useEffect(() => {
    fetchBalanceData();
  }, []);

  const fetchBalanceData = async () => {
    setLoading(true);
    try {
      const [balanceData, utxoData] = await Promise.all([
        getWalletBalance(),
        listUnspent(),
      ]);
      setBalance(balanceData);
      setUtxos(utxoData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch onchain balance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSats = (sats: string) => {
    return parseInt(sats).toLocaleString();
  };

  const formatBtc = (sats: string) => {
    const btc = parseInt(sats) / 100000000;
    return btc.toFixed(8);
  };

  if (loading) return <div className="text-gray-400">Loading onchain balance...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!balance) return null;

  const utxoCount = utxos?.utxos?.length || 0;
  const largestUtxo = utxos?.utxos?.reduce((max, utxo) => {
    const amount = parseInt(utxo.amount_sat);
    return amount > max ? amount : max;
  }, 0) || 0;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-400">Onchain Balance</h2>
        <button
          onClick={fetchBalanceData}
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Total Balance</div>
          <div className="text-xl font-bold text-green-400">
            {formatSats(balance.total_balance)} sats
          </div>
          <div className="text-xs text-gray-500">
            {formatBtc(balance.total_balance)} BTC
          </div>
        </div>

        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Confirmed</div>
          <div className="text-lg font-bold text-blue-400">
            {formatSats(balance.confirmed_balance)} sats
          </div>
        </div>

        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Unconfirmed</div>
          <div className="text-lg font-bold text-yellow-400">
            {formatSats(balance.unconfirmed_balance)} sats
          </div>
        </div>

        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">UTXOs</div>
          <div className="text-lg font-bold text-purple-400">
            {utxoCount}
          </div>
          <div className="text-xs text-gray-500">
            Largest: {formatSats(largestUtxo.toString())}
          </div>
        </div>
      </div>

      {parseInt(balance.locked_balance) > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600 text-yellow-400 p-3 rounded-lg mb-4 text-sm">
          <span className="font-semibold">Locked Balance:</span> {formatSats(balance.locked_balance)} sats
          <span className="text-xs text-gray-500 ml-2">(Reserved for anchor channels)</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowUtxos(!showUtxos)}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {showUtxos ? 'Hide' : 'Show'} UTXOs ({utxoCount})
        </button>
      </div>

      {showUtxos && utxos && utxos.utxos.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {utxos.utxos.map((utxo, index) => (
            <div key={index} className="bg-gray-700 rounded p-3 text-sm">
              <div className="flex justify-between items-start mb-1">
                <span className="font-bold text-green-400">
                  {formatSats(utxo.amount_sat)} sats
                </span>
                <span className="text-xs text-gray-400">
                  {utxo.confirmations} confs
                </span>
              </div>
              <div className="font-mono text-xs text-gray-500 truncate">
                {utxo.outpoint.txid_str}:{utxo.outpoint.output_index}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};