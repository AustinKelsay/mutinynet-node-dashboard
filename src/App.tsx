import { useState, useEffect } from 'react';
import { ConnectionForm } from './components/ConnectionForm';
import { Dashboard } from './components/Dashboard';
import { connectionManager } from './lib/connectionManager';
import { getInfo } from './lib/lnd';

function App() {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have saved credentials and they still work
    const checkConnection = async () => {
      if (connectionManager.hasCredentials()) {
        try {
          // Try to get node info to verify credentials still work
          await getInfo();
          setConnected(true);
        } catch (err) {
          // Credentials are invalid or expired
          console.error('Saved credentials are invalid:', err);
          connectionManager.clearCredentials();
          setConnected(false);
        }
      }
      setChecking(false);
    };

    checkConnection();
  }, []);

  const handleConnect = () => {
    setConnected(true);
  };

  const handleDisconnect = () => {
    connectionManager.clearCredentials();
    setConnected(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⚡</div>
          <p className="text-gray-400">Checking connection...</p>
        </div>
      </div>
    );
  }

  return connected ? (
    <Dashboard onDisconnect={handleDisconnect} />
  ) : (
    <ConnectionForm onConnect={handleConnect} />
  );
}

export default App;