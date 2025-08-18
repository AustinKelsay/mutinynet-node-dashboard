import { NodeInfo } from './NodeInfo';
import { ChannelBalance } from './ChannelBalance';
import { OnchainBalance } from './OnchainBalance';
import { InvoiceCreator } from './InvoiceCreator';
import { InvoicePayer } from './InvoicePayer';
import { OnchainSend } from './OnchainSend';
import { OnchainReceive } from './OnchainReceive';
import { PeerManager } from './PeerManager';
import { ChannelManager } from './ChannelManager';

interface DashboardProps {
  onDisconnect: () => void;
}

export const Dashboard = ({ onDisconnect }: DashboardProps) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 bg-clip-text text-transparent">
            ⚡ MutinyNet LND Dashboard
          </h1>
          <p className="text-gray-400 text-lg mb-4">
            Connected to your Lightning Network development node
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => window.open('https://faucet.mutinynet.com', '_blank')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              💰 Open Faucet
            </button>
            <button
              onClick={() => window.open('https://mutinynet.com', '_blank')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              🔍 Open Explorer
            </button>
            <button
              onClick={onDisconnect}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Disconnect
            </button>
          </div>
        </header>

        <div className="space-y-6">
          {/* Top section - Onchain Balance (full width) */}
          <OnchainBalance />

          {/* Node info and Lightning balance */}
          <div className="grid gap-6 lg:grid-cols-2">
            <NodeInfo />
            <ChannelBalance />
          </div>

          {/* Network Management - Peers and Channels */}
          <div className="grid gap-6 lg:grid-cols-2">
            <PeerManager />
            <ChannelManager />
          </div>

          {/* Lightning Payment Operations */}
          <div>
            <h3 className="text-xl font-semibold text-purple-400 mb-4">⚡ Lightning Payments</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <InvoiceCreator />
              <InvoicePayer />
            </div>
          </div>

          {/* Onchain Operations */}
          <div>
            <h3 className="text-xl font-semibold text-orange-400 mb-4">🔗 Onchain Transactions</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <OnchainReceive />
              <OnchainSend />
            </div>
          </div>
        </div>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Connected to MutinyNet • Built with React + Vite + Tailwind</p>
        </footer>
      </div>
    </div>
  );
};