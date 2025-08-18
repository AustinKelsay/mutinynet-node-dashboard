import { useState, useEffect } from 'react';
import { apiLogger } from '../lib/apiLogger';
import type { ApiLog } from '../lib/apiLogger';

export const ApiConsole = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'request' | 'response' | 'error'>('all');

  useEffect(() => {
    // Subscribe to log updates
    const unsubscribe = apiLogger.subscribe((newLogs) => {
      setLogs(newLogs);
    });

    // Load initial logs
    setLogs(apiLogger.getLogs());

    return unsubscribe;
  }, []);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-400';
      case 'POST': return 'text-blue-400';
      case 'DELETE': return 'text-red-400';
      case 'PUT': return 'text-yellow-400';
      case 'ERROR': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return '→';
      case 'response': return '←';
      case 'error': return '⚠';
      default: return '•';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'request': return 'text-blue-400';
      case 'response': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const formatJson = (data: unknown): string => {
    if (!data) return 'null';
    if (typeof data === 'string') return data;
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div className="bg-gray-900 border-t-2 border-gray-800">
      {/* Console Header */}
      <div className="bg-gray-800 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-purple-400">
            API Console
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('request')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'request' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Requests
            </button>
            <button
              onClick={() => setFilter('response')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'response' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Responses
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Errors
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => apiLogger.clearLogs()}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Console Body */}
      {expanded && (
        <div className="max-h-96 overflow-y-auto bg-gray-950 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No API calls logged yet
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="hover:bg-gray-900 cursor-pointer"
                  onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                >
                  {/* Log Summary Line */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <span className="text-gray-600">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={getTypeColor(log.type)}>
                      {getTypeIcon(log.type)}
                    </span>
                    <span className={getMethodColor(log.method)}>
                      {log.method}
                    </span>
                    <span className="text-gray-400 flex-1 truncate">
                      {log.endpoint}
                    </span>
                    {log.status && (
                      <span className={`${
                        log.status >= 200 && log.status < 300 ? 'text-green-400' : 
                        log.status >= 400 ? 'text-red-400' : 'text-yellow-400'
                      }`}>
                        {log.status}
                      </span>
                    )}
                    {log.duration !== undefined && (
                      <span className="text-gray-600">
                        {log.duration}ms
                      </span>
                    )}
                    <span className="text-gray-600">
                      {selectedLog === log.id ? '▼' : '▶'}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {selectedLog === log.id && (
                    <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
                      <div className="space-y-3">
                        <div>
                          <div className="text-gray-500 mb-1">Endpoint:</div>
                          <div className="text-gray-300 bg-gray-800 p-2 rounded">
                            {log.method} {log.endpoint}
                          </div>
                        </div>
                        
                        {log.data !== undefined && log.data !== null && (
                          <div>
                            <div className="text-gray-500 mb-1">
                              {log.type === 'request' ? 'Request Data:' : 
                               log.type === 'response' ? 'Response Data:' : 'Error Data:'}
                            </div>
                            <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {formatJson(log.data)}
                            </pre>
                          </div>
                        )}
                        
                        {log.status && (
                          <div className="flex gap-4">
                            <div>
                              <span className="text-gray-500">Status: </span>
                              <span className={`${
                                log.status >= 200 && log.status < 300 ? 'text-green-400' : 
                                log.status >= 400 ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {log.status}
                              </span>
                            </div>
                            {log.duration !== undefined && (
                              <div>
                                <span className="text-gray-500">Duration: </span>
                                <span className="text-gray-300">{log.duration}ms</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};