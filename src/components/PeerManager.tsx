import { useState, useEffect } from 'react';
import { listPeers, connectPeer, disconnectPeer } from '../lib/lnd';

interface Peer {
  pub_key: string;
  address: string;
  bytes_sent: string;
  bytes_recv: string;
  sat_sent: string;
  sat_recv: string;
  inbound: boolean;
  ping_time: string;
}

export const PeerManager = () => {
  const [peers, setPeers] = useState<Peer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddPeer, setShowAddPeer] = useState(false);
  const [newPeerPubkey, setNewPeerPubkey] = useState('');
  const [newPeerHost, setNewPeerHost] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPeers();
  }, []);

  const fetchPeers = async () => {
    setLoading(true);
    try {
      const response = await listPeers();
      setPeers(response.peers || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch peers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPeer = async () => {
    if (!newPeerPubkey || !newPeerHost) {
      setError('Please enter both pubkey and host');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await connectPeer(newPeerPubkey, newPeerHost);
      setNewPeerPubkey('');
      setNewPeerHost('');
      setShowAddPeer(false);
      await fetchPeers();
    } catch (err) {
      setError('Failed to connect to peer');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnectPeer = async (pubkey: string) => {
    if (!confirm('Are you sure you want to disconnect this peer?')) return;

    setActionLoading(true);
    try {
      await disconnectPeer(pubkey);
      await fetchPeers();
    } catch (err) {
      setError('Failed to disconnect peer');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatBytes = (bytes: string) => {
    const b = parseInt(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(2)} KB`;
    return `${(b / 1048576).toFixed(2)} MB`;
  };

  const openPeerOnMutinynet = (pubkey: string) => {
    window.open(`https://mutinynet.com/lightning/node/${pubkey}`, '_blank');
  };

  if (loading) return <div className="text-gray-400">Loading peers...</div>;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-400">Peers</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchPeers}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowAddPeer(!showAddPeer)}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
          >
            {showAddPeer ? 'Cancel' : 'Add Peer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {showAddPeer && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Node Public Key
              </label>
              <input
                type="text"
                value={newPeerPubkey}
                onChange={(e) => setNewPeerPubkey(e.target.value)}
                placeholder="Enter node pubkey"
                className="w-full bg-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                disabled={actionLoading}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Host (IP:Port)
              </label>
              <input
                type="text"
                value={newPeerHost}
                onChange={(e) => setNewPeerHost(e.target.value)}
                placeholder="e.g., 192.168.1.100:9735"
                className="w-full bg-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={actionLoading}
              />
            </div>
            <button
              onClick={handleAddPeer}
              disabled={actionLoading || !newPeerPubkey || !newPeerHost}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors"
            >
              {actionLoading ? 'Connecting...' : 'Connect to Peer'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {peers.length === 0 ? (
          <div className="text-gray-500 text-center py-4">
            No connected peers
          </div>
        ) : (
          peers.map((peer) => (
            <div key={peer.pub_key} className="bg-gray-700 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="font-mono text-xs text-gray-400">
                      {peer.pub_key.substring(0, 20)}...{peer.pub_key.substring(peer.pub_key.length - 10)}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${peer.inbound ? 'bg-green-600' : 'bg-blue-600'}`}>
                      {peer.inbound ? 'Inbound' : 'Outbound'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Address:</span>{' '}
                      <span className="text-gray-300">{peer.address}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Ping:</span>{' '}
                      <span className="text-gray-300">{peer.ping_time}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Sent:</span>{' '}
                      <span className="text-green-400">{formatBytes(peer.bytes_sent)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Received:</span>{' '}
                      <span className="text-blue-400">{formatBytes(peer.bytes_recv)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => openPeerOnMutinynet(peer.pub_key)}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    View Peer
                  </button>
                  <button
                    onClick={() => handleDisconnectPeer(peer.pub_key)}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};