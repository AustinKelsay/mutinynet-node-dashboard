import { useState, useEffect } from 'react';
import { getInfo } from '../lib/lnd';

interface NodeInfoData {
  identity_pubkey: string;
  alias: string;
  num_active_channels: number;
  num_peers: number;
  block_height: number;
  synced_to_chain: boolean;
  synced_to_graph: boolean;
  version: string;
}

export const NodeInfo = () => {
  const [info, setInfo] = useState<NodeInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const data = await getInfo();
        setInfo(data);
      } catch (err) {
        setError('Failed to fetch node info');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  const copyPubkey = async () => {
    if (!info) return;
    
    try {
      await navigator.clipboard.writeText(info.identity_pubkey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) return <div className="text-gray-400">Loading node info...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!info) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">Node Information</h2>
      <div className="space-y-2 text-gray-300">
        <div className="flex justify-between">
          <span className="text-gray-500">Alias:</span>
          <span className="font-mono">{info.alias || 'Unknown'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Public Key:</span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs">{info.identity_pubkey.substring(0, 20)}...</span>
            <button
              onClick={copyPubkey}
              className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs transition-colors"
              title={info.identity_pubkey}
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Active Channels:</span>
          <span>{info.num_active_channels}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Peers:</span>
          <span>{info.num_peers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Block Height:</span>
          <span>{info.block_height.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Synced:</span>
          <span className={info.synced_to_chain ? 'text-green-400' : 'text-yellow-400'}>
            {info.synced_to_chain ? '✓ Yes' : '⚠ No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Version:</span>
          <span className="text-xs">{info.version}</span>
        </div>
      </div>
    </div>
  );
};