import { useState } from 'react';
import { newAddress } from '../lib/lnd';

export const OnchainReceive = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [addressType, setAddressType] = useState('p2wkh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateAddress = async () => {
    setLoading(true);
    setError(null);
    setCopied(false);

    try {
      const newAddr = await newAddress(addressType);
      setAddress(newAddr);
    } catch (err) {
      setError('Failed to generate address');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInExplorer = () => {
    if (!address) return;
    window.open(`https://mutinynet.com/address/${address}`, '_blank');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Receive Onchain</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-2">
            Address Type
          </label>
          <select
            value={addressType}
            onChange={(e) => setAddressType(e.target.value)}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          >
            <option value="p2wkh">Native SegWit (P2WPKH) - Recommended</option>
            <option value="np2wkh">Nested SegWit (P2SH-P2WPKH)</option>
            <option value="p2tr">Taproot (P2TR)</option>
          </select>
        </div>

        <button
          onClick={handleGenerateAddress}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Generating...' : 'Generate New Address'}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
            {error}
          </div>
        )}

        {address && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-400 text-sm">Bitcoin Address</span>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
                <button
                  onClick={openInExplorer}
                  className="text-sm bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded transition-colors"
                >
                  Explorer
                </button>
              </div>
            </div>
            <div className="bg-gray-800 p-3 rounded">
              <div className="font-mono text-sm text-gray-300 break-all">
                {address}
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              Send Bitcoin to this address. It will appear in your onchain balance after confirmation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};