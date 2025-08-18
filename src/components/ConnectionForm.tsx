import { useState } from 'react';
import { testConnection } from '../lib/lnd';
import { connectionManager } from '../lib/connectionManager';

interface ConnectionFormProps {
  onConnect: () => void;
}

export const ConnectionForm = ({ onConnect }: ConnectionFormProps) => {
  const [host, setHost] = useState('');
  const [macaroon, setMacaroon] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!host || !macaroon) {
      setError('Please enter both host and macaroon');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Test the connection
      const nodeInfo = await testConnection(host, macaroon);
      
      // Save credentials if successful
      connectionManager.saveCredentials({ host, macaroon });
      
      console.log('Connected to node:', nodeInfo.alias);
      onConnect();
    } catch (err) {
      setError('Failed to connect. Please check your credentials and try again.');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 bg-clip-text text-transparent">
            ⚡ MutinyNet LND Dashboard
          </h1>
          <p className="text-gray-400">
            Connect to your Lightning Network node
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-8 shadow-xl">
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            <p className="font-bold mb-2">⚠️ WARNING</p>
            <p className="text-sm">
              This dashboard is for testing on MutinyNet only. 
              <strong> NEVER</strong> enter admin macaroon credentials for a mainnet node!
              Admin macaroons grant full control over your funds.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                LND Host
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="e.g., localhost or 192.168.1.100"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the host without https:// or port
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Admin Macaroon (hex encoded)
              </label>
              <textarea
                value={macaroon}
                onChange={(e) => setMacaroon(e.target.value)}
                placeholder="Paste your admin macaroon here"
                className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm resize-none"
                rows={4}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">
                You can find this in your LND data directory
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={loading || !host || !macaroon}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Connecting...' : 'Connect to Node'}
            </button>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Credentials are stored locally in your browser
        </p>
      </div>
    </div>
  );
};