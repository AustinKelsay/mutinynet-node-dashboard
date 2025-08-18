import { useState, useEffect } from 'react';
import { listChannels, listPendingChannels, listClosedChannels, openChannel, closeChannel } from '../lib/lnd';

interface Channel {
  active: boolean;
  remote_pubkey: string;
  channel_point: string;
  capacity: string;
  local_balance: string;
  remote_balance: string;
  private: boolean;
  initiator: boolean;
}

interface ClosedChannel {
  channel_point: string;
  chan_id: string;
  closing_tx_hash: string;
  remote_pubkey: string;
  capacity: string;
  close_height: number;
  settled_balance: string;
  close_type: string;
}

interface PendingChannelsResponse {
  pending_open_channels?: Array<{
    channel: {
      remote_node_pub: string;
      channel_point: string;
      capacity: string;
      local_balance: string;
      remote_balance: string;
    };
    commit_fee: string;
    commit_weight: string;
    fee_per_kw: string;
  }>;
  pending_closing_channels?: Array<{
    channel: {
      remote_node_pub: string;
      channel_point: string;
      capacity: string;
      local_balance: string;
      remote_balance: string;
    };
    closing_txid: string;
  }>;
  pending_force_closing_channels?: Array<{
    channel: {
      remote_node_pub: string;
      channel_point: string;
      capacity: string;
      local_balance: string;
      remote_balance: string;
    };
    closing_txid: string;
    limbo_balance: string;
    maturity_height: number;
    blocks_til_maturity: number;
  }>;
  waiting_close_channels?: Array<{
    channel: {
      remote_node_pub: string;
      channel_point: string;
      capacity: string;
      local_balance: string;
      remote_balance: string;
    };
    limbo_balance: string;
  }>;
}

type TabType = 'active' | 'pending' | 'closed';

export const ChannelManager = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pendingChannels, setPendingChannels] = useState<PendingChannelsResponse | null>(null);
  const [closedChannels, setClosedChannels] = useState<ClosedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOpenChannel, setShowOpenChannel] = useState(false);
  const [newChannelPubkey, setNewChannelPubkey] = useState('');
  const [channelAmount, setChannelAmount] = useState('');
  const [pushAmount, setPushAmount] = useState('0');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const [channelsResponse, pendingResponse, closedResponse] = await Promise.all([
        listChannels(),
        listPendingChannels(),
        listClosedChannels(),
      ]);
      setChannels(channelsResponse.channels || []);
      setPendingChannels(pendingResponse);
      setClosedChannels(closedResponse.channels || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch channels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChannel = async () => {
    if (!newChannelPubkey || !channelAmount) {
      setError('Please enter pubkey and channel amount');
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      await openChannel(
        newChannelPubkey,
        parseInt(channelAmount),
        parseInt(pushAmount || '0')
      );
      setNewChannelPubkey('');
      setChannelAmount('');
      setPushAmount('0');
      setShowOpenChannel(false);
      await fetchChannels();
    } catch (err) {
      setError('Failed to open channel');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseChannel = async (channelPoint: string, force: boolean = false) => {
    const confirmMsg = force
      ? 'Force close this channel? This will require on-chain confirmation time.'
      : 'Cooperatively close this channel?';
    
    if (!confirm(confirmMsg)) return;

    setActionLoading(true);
    try {
      await closeChannel(channelPoint, force);
      await fetchChannels();
    } catch (err) {
      setError('Failed to close channel');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatSats = (sats: string) => {
    return parseInt(sats).toLocaleString();
  };

  const calculatePercentage = (local: string, capacity: string) => {
    const localNum = parseInt(local);
    const capacityNum = parseInt(capacity);
    if (capacityNum === 0) return 0;
    return Math.round((localNum / capacityNum) * 100);
  };

  const getTotalPending = () => {
    if (!pendingChannels) return 0;
    return (
      (pendingChannels.pending_open_channels?.length || 0) +
      (pendingChannels.pending_closing_channels?.length || 0) +
      (pendingChannels.pending_force_closing_channels?.length || 0) +
      (pendingChannels.waiting_close_channels?.length || 0)
    );
  };

  const getChannelStats = () => {
    const totalCapacity = channels.reduce((sum, ch) => sum + parseInt(ch.capacity), 0);
    const totalLocal = channels.reduce((sum, ch) => sum + parseInt(ch.local_balance), 0);
    const totalRemote = channels.reduce((sum, ch) => sum + parseInt(ch.remote_balance), 0);
    const activeChannels = channels.filter(ch => ch.active).length;
    const inactiveChannels = channels.filter(ch => !ch.active).length;

    return {
      totalCapacity,
      totalLocal,
      totalRemote,
      activeChannels,
      inactiveChannels,
      totalChannels: channels.length
    };
  };

  const getCloseTypeLabel = (closeType: string) => {
    const types: { [key: string]: string } = {
      'COOPERATIVE_CLOSE': 'Cooperative',
      'LOCAL_FORCE_CLOSE': 'Local Force',
      'REMOTE_FORCE_CLOSE': 'Remote Force',
      'BREACH_CLOSE': 'Breach',
      'FUNDING_CANCELED': 'Funding Canceled',
      'ABANDONED': 'Abandoned'
    };
    return types[closeType] || closeType;
  };

  if (loading) return <div className="text-gray-400">Loading channels...</div>;

  const stats = getChannelStats();
  const pendingCount = getTotalPending();

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-400">Channels</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchChannels}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowOpenChannel(!showOpenChannel)}
            className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
          >
            {showOpenChannel ? 'Cancel' : 'Open Channel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Total Capacity</div>
          <div className="text-xl font-bold text-purple-400">
            {formatSats(stats.totalCapacity.toString())} sats
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Channels</div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-green-400">{stats.activeChannels}</span>
            <span className="text-gray-500">/</span>
            <span className="text-lg text-gray-400">{stats.totalChannels}</span>
            {pendingCount > 0 && (
              <span className="text-sm text-yellow-400">(+{pendingCount} pending)</span>
            )}
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Outbound (Can Send)</div>
          <div className="text-lg font-bold text-blue-400">
            {formatSats(stats.totalLocal.toString())} sats
          </div>
          <div className="text-xs text-gray-500">
            {stats.totalCapacity > 0 ? Math.round((stats.totalLocal / stats.totalCapacity) * 100) : 0}% of capacity
          </div>
        </div>
        <div className="bg-gray-700 rounded p-3">
          <div className="text-gray-400 text-xs mb-1">Inbound (Can Receive)</div>
          <div className="text-lg font-bold text-orange-400">
            {formatSats(stats.totalRemote.toString())} sats
          </div>
          <div className="text-xs text-gray-500">
            {stats.totalCapacity > 0 ? Math.round((stats.totalRemote / stats.totalCapacity) * 100) : 0}% of capacity
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-700 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'active'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-600'
          }`}
        >
          Active ({channels.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'pending'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-600'
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'closed'
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-600'
          }`}
        >
          Closed ({closedChannels.length})
        </button>
      </div>

      {showOpenChannel && (
        <div className="bg-gray-700 rounded-lg p-4 mb-4">
          <div className="space-y-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1">
                Node Public Key
              </label>
              <input
                type="text"
                value={newChannelPubkey}
                onChange={(e) => setNewChannelPubkey(e.target.value)}
                placeholder="Enter node pubkey"
                className="w-full bg-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                disabled={actionLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Channel Size (sats)
                </label>
                <input
                  type="number"
                  value={channelAmount}
                  onChange={(e) => setChannelAmount(e.target.value)}
                  placeholder="e.g., 100000"
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={actionLoading}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Push Amount (sats)
                </label>
                <input
                  type="number"
                  value={pushAmount}
                  onChange={(e) => setPushAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-gray-600 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={actionLoading}
                />
              </div>
            </div>
            <button
              onClick={handleOpenChannel}
              disabled={actionLoading || !newChannelPubkey || !channelAmount}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 rounded transition-colors"
            >
              {actionLoading ? 'Opening Channel...' : 'Open Channel'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Active Channels Tab */}
        {activeTab === 'active' && (
          channels.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No active channels
            </div>
          ) : (
            channels.map((channel) => {
              const localPercent = calculatePercentage(channel.local_balance, channel.capacity);
              
              return (
                <div key={channel.channel_point} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${channel.active ? 'bg-green-400' : 'bg-red-400'}`} />
                        <span className="text-sm font-medium">
                          {channel.active ? 'Active' : 'Inactive'}
                        </span>
                        {channel.private && (
                          <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">Private</span>
                        )}
                        {channel.initiator && (
                          <span className="text-xs bg-blue-600 px-2 py-0.5 rounded">Initiator</span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-gray-400 mb-2">
                        {channel.remote_pubkey.substring(0, 20)}...
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCloseChannel(channel.channel_point, false)}
                        disabled={actionLoading}
                        className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => handleCloseChannel(channel.channel_point, true)}
                        disabled={actionLoading}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-sm transition-colors"
                      >
                        Force
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="text-gray-300">{formatSats(channel.capacity)} sats</span>
                    </div>

                    <div className="relative bg-gray-600 h-8 rounded-lg overflow-hidden">
                      {/* Outbound (left side, blue) */}
                      <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                        style={{ width: `${localPercent}%` }}
                      />
                      {/* Inbound (right side, orange) */}
                      <div
                        className="absolute right-0 top-0 h-full bg-gradient-to-l from-orange-500 to-orange-400 transition-all duration-300"
                        style={{ width: `${100 - localPercent}%` }}
                      />
                      {/* Center divider line */}
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-gray-800"
                        style={{ left: `${localPercent}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-2 text-xs font-medium">
                        <span className="text-white drop-shadow-md">{localPercent}%</span>
                        <span className="text-white drop-shadow-md">{100 - localPercent}%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span className="text-gray-500">Can Send:</span>{' '}
                        <span className="text-blue-400 font-medium">{formatSats(channel.local_balance)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-gray-500">Can Receive:</span>{' '}
                        <span className="text-orange-400 font-medium">{formatSats(channel.remote_balance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Pending Channels Tab */}
        {activeTab === 'pending' && (
          pendingCount === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No pending channels
            </div>
          ) : (
            <div className="space-y-4">
              {pendingChannels?.pending_open_channels && pendingChannels.pending_open_channels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">Opening Channels</h4>
                  {pendingChannels.pending_open_channels.map((pending, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 mb-2">
                      <div className="font-mono text-xs text-gray-400 mb-1">
                        {pending.channel.remote_node_pub.substring(0, 20)}...
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Capacity:</span>{' '}
                          <span className="text-gray-300">{formatSats(pending.channel.capacity)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Local:</span>{' '}
                          <span className="text-blue-400">{formatSats(pending.channel.local_balance)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingChannels?.pending_closing_channels && pendingChannels.pending_closing_channels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-400 mb-2">Closing Channels</h4>
                  {pendingChannels.pending_closing_channels.map((pending, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 mb-2">
                      <div className="font-mono text-xs text-gray-400 mb-1">
                        {pending.channel.remote_node_pub.substring(0, 20)}...
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Closing TX:</span>{' '}
                        <span className="font-mono text-xs text-gray-300">{pending.closing_txid.substring(0, 20)}...</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pendingChannels?.pending_force_closing_channels && pendingChannels.pending_force_closing_channels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-400 mb-2">Force Closing Channels</h4>
                  {pendingChannels.pending_force_closing_channels.map((pending, index) => (
                    <div key={index} className="bg-gray-700 rounded-lg p-3 mb-2">
                      <div className="font-mono text-xs text-gray-400 mb-1">
                        {pending.channel.remote_node_pub.substring(0, 20)}...
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Limbo Balance:</span>{' '}
                          <span className="text-yellow-400">{formatSats(pending.limbo_balance)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Blocks to Maturity:</span>{' '}
                          <span className="text-gray-300">{pending.blocks_til_maturity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Closed Channels Tab */}
        {activeTab === 'closed' && (
          closedChannels.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              No closed channels
            </div>
          ) : (
            closedChannels.map((channel) => (
              <div key={channel.channel_point} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                        {getCloseTypeLabel(channel.close_type)}
                      </span>
                      <span className="text-xs text-gray-400">
                        Block #{channel.close_height}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-gray-400">
                      {channel.remote_pubkey.substring(0, 20)}...
                    </div>
                  </div>
                  <button
                    onClick={() => window.open(`https://mutinynet.com/tx/${channel.closing_tx_hash}`, '_blank')}
                    className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    View TX
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div>
                    <span className="text-gray-500">Capacity:</span>{' '}
                    <span className="text-gray-300">{formatSats(channel.capacity)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Settled:</span>{' '}
                    <span className="text-green-400">{formatSats(channel.settled_balance)}</span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};