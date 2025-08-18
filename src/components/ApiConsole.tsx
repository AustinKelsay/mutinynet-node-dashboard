import { useState, useEffect } from 'react';
import { apiLogger } from '../lib/apiLogger';
import type { ApiLog } from '../lib/apiLogger';

export const ApiConsole = () => {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'response' | 'error'>('all');

  useEffect(() => {
    // Subscribe to log updates - ensure we're getting new array references
    const unsubscribe = apiLogger.subscribe((newLogs) => {
      // Force a new array to ensure React detects the change
      setLogs([...newLogs]);
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
      case 'GET': return 'text-emerald-400';
      case 'POST': return 'text-blue-400';
      case 'DELETE': return 'text-red-400';
      case 'PUT': return 'text-yellow-400';
      case 'PATCH': return 'text-orange-400';
      case 'ERROR': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getMethodBgColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-900/30 border-emerald-700';
      case 'POST': return 'bg-blue-900/30 border-blue-700';
      case 'DELETE': return 'bg-red-900/30 border-red-700';
      case 'PUT': return 'bg-yellow-900/30 border-yellow-700';
      case 'PATCH': return 'bg-orange-900/30 border-orange-700';
      case 'ERROR': return 'bg-red-900/40 border-red-600';
      default: return 'bg-gray-900/30 border-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '•';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'response') return log.type === 'success';
    if (filter === 'error') return log.type === 'error';
    return false;
  });

  // Count logs by type
  const logCounts = {
    success: logs.filter(l => l.type === 'success').length,
    errors: logs.filter(l => l.type === 'error').length,
  };

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
          <h3 className="text-lg font-semibold text-purple-400 flex items-center gap-2">
            <span className="text-xl">📡</span> API Console
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
              onClick={() => setFilter('response')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'response' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              ✅ Success ({logCounts.success})
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                filter === 'error' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              ❌ Errors ({logCounts.errors})
            </button>
          </div>
          {/* Method Legend */}
          <div className="flex items-center gap-3 ml-4 text-xs">
            <span className="text-gray-500">Methods:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-700 font-bold">GET</span>
            <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-700 font-bold">POST</span>
            <span className="px-2 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700 font-bold">DELETE</span>
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
                  className={`
                    hover:bg-gray-900 cursor-pointer transition-colors
                    ${log.type === 'error' ? 'bg-red-950/20' : ''}
                  `}
                  onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                >
                  {/* Log Summary Line */}
                  <div className="flex items-center gap-2 px-4 py-2">
                    <span className="text-gray-600 text-xs">
                      {formatTime(log.timestamp)}
                    </span>
                    <span className={`${getTypeColor(log.type)} text-lg`} title={log.type}>
                      {getTypeIcon(log.type)}
                    </span>
                    {/* Enhanced Method Badge */}
                    <span className={`
                      px-2 py-0.5 rounded-md text-xs font-bold border
                      ${getMethodBgColor(log.method)}
                      ${getMethodColor(log.method)}
                    `}>
                      {log.method}
                    </span>
                    <span className="text-gray-400 flex-1 truncate font-mono text-xs">
                      {log.endpoint}
                    </span>
                    {log.type === 'success' && log.status && (
                      <span className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${
                          log.status >= 200 && log.status < 300 ? 'bg-green-900/30 text-green-400 border border-green-700' : 
                          log.status >= 400 ? 'bg-red-900/30 text-red-400 border border-red-700' : 
                          'bg-yellow-900/30 text-yellow-400 border border-yellow-700'
                        }
                      `}>
                        {log.status}
                      </span>
                    )}
                    {log.type === 'error' && log.status && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-400 border border-red-700">
                        {log.status || 'ERROR'}
                      </span>
                    )}
                    {log.duration !== undefined && (
                      <span className="text-gray-500 text-xs">
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
                        {/* Full URL with Method Badge */}
                        {log.fullUrl && (
                          <div>
                            <div className="text-gray-500 mb-1">Full URL:</div>
                            <div className="text-gray-300 bg-gray-800 p-2 rounded font-mono text-xs flex items-center gap-2">
                              <span className={`
                                px-2 py-0.5 rounded-md text-xs font-bold border
                                ${getMethodBgColor(log.method)}
                                ${getMethodColor(log.method)}
                              `}>
                                {log.method}
                              </span>
                              <span className="text-gray-300">{log.fullUrl}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Status and Duration */}
                        {(log.status || log.duration !== undefined) && (
                          <div className="flex gap-4 items-center">
                            {log.status && (
                              <div>
                                <span className="text-gray-500">Status: </span>
                                <span className={`${
                                  log.status >= 200 && log.status < 300 ? 'text-green-400' : 
                                  log.status >= 400 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                            )}
                            {log.duration !== undefined && (
                              <div>
                                <span className="text-gray-500">Duration: </span>
                                <span className="text-gray-300">{log.duration}ms</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Request Section */}
                        <div className="border-l-2 border-blue-600 pl-3">
                          <div className="text-blue-400 font-semibold mb-2">REQUEST</div>
                          
                          {/* Request Parameters */}
                          {log.requestParams !== undefined && log.requestParams !== null && (
                            <div className="mb-3">
                              <div className="text-gray-500 text-xs mb-1">Query Parameters:</div>
                              <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap text-xs">
                                {formatJson(log.requestParams)}
                              </pre>
                            </div>
                          )}
                          
                          {/* Request Body */}
                          {log.requestData !== undefined && log.requestData !== null && (
                            <div className="mb-3">
                              <div className="text-gray-500 text-xs mb-1">Request Body:</div>
                              <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap text-xs">
                                {formatJson(log.requestData)}
                              </pre>
                            </div>
                          )}
                          
                          {/* Request Headers */}
                          {log.requestHeaders !== undefined && log.requestHeaders !== null && (
                            <div>
                              <div className="text-gray-500 text-xs mb-1">Request Headers:</div>
                              <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap text-xs">
                                {formatJson(log.requestHeaders)}
                              </pre>
                            </div>
                          )}
                        </div>
                        
                        {/* Response Section (only show if we have response data) */}
                        {(log.type === 'success' || log.type === 'error') && (
                          <div className={`border-l-2 ${log.type === 'success' ? 'border-green-600' : 'border-red-600'} pl-3`}>
                            <div className={`${log.type === 'success' ? 'text-green-400' : 'text-red-400'} font-semibold mb-2`}>
                              {log.type === 'success' ? 'RESPONSE' : 'ERROR'}
                            </div>
                            
                            {/* Response/Error Data */}
                            {log.responseData !== undefined && log.responseData !== null && (
                              <div className="mb-3">
                                <div className="text-gray-500 text-xs mb-1">
                                  {log.type === 'success' ? 'Response Data:' : 'Error Details:'}
                                </div>
                                <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap text-xs">
                                  {formatJson(log.responseData)}
                                </pre>
                              </div>
                            )}
                            
                            {/* Response Headers */}
                            {log.responseHeaders !== undefined && log.responseHeaders !== null && (
                              <div>
                                <div className="text-gray-500 text-xs mb-1">Response Headers:</div>
                                <pre className="text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre-wrap text-xs">
                                  {formatJson(log.responseHeaders)}
                                </pre>
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