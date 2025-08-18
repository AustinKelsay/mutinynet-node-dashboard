export interface ApiLog {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  type: 'pending' | 'success' | 'error';
  // Request data
  requestData?: unknown;
  requestHeaders?: unknown;
  requestParams?: unknown;
  // Response data
  responseData?: unknown;
  responseHeaders?: unknown;
  status?: number;
  duration?: number;
  fullUrl?: string;
}

class ApiLogger {
  private logs: ApiLog[] = [];
  private listeners: ((logs: ApiLog[]) => void)[] = [];
  private maxLogs = 100; // Keep last 100 logs
  private pendingRequests = new Map<string, ApiLog>(); // Track pending requests
  private updateTimer: ReturnType<typeof setTimeout> | null = null;

  private generateRequestId(method: string, url: string): string {
    return `${method}-${url}-${Date.now()}`;
  }

  private notifyListeners() {
    // Batch updates to avoid too many re-renders
    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.listeners.forEach(listener => listener([...this.logs]));
        this.updateTimer = null;
      }, 10); // Small delay to batch rapid updates
    }
  }

  startRequest(method: string, endpoint: string, data?: unknown, params?: unknown, headers?: unknown, fullUrl?: string): string {
    const requestId = this.generateRequestId(method, endpoint);
    const newLog: ApiLog = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      method,
      endpoint,
      type: 'pending',
      requestData: data,
      requestParams: params,
      requestHeaders: headers,
      fullUrl,
    };

    // Store in pending map but DON'T add to logs yet
    this.pendingRequests.set(requestId, newLog);
    
    // Don't notify listeners yet - wait for completion
    return requestId;
  }

  completeRequest(requestId: string, responseData: unknown, status: number, headers?: unknown, duration?: number) {
    const pendingLog = this.pendingRequests.get(requestId);
    if (!pendingLog) {
      console.warn('No pending request found for requestId:', requestId);
      return;
    }
    
    console.log('Completing request:', requestId, 'Method:', pendingLog.method, 'Endpoint:', pendingLog.endpoint);

    // Create completed log with all data
    const completedLog: ApiLog = {
      ...pendingLog,
      type: 'success',
      responseData,
      responseHeaders: headers,
      status,
      duration,
    };

    // Create a NEW array to trigger React re-render
    this.logs = [completedLog, ...this.logs];
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Remove from pending
    this.pendingRequests.delete(requestId);

    // Notify listeners
    this.notifyListeners();
  }

  failRequest(requestId: string, error: unknown, status?: number, headers?: unknown, duration?: number) {
    const pendingLog = this.pendingRequests.get(requestId);
    
    if (!pendingLog) {
      // If no pending request, create a new error log
      const newLog: ApiLog = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date(),
        method: 'ERROR',
        endpoint: '',
        type: 'error',
        responseData: error,
        responseHeaders: headers,
        status,
        duration,
      };
      // Create a NEW array to trigger React re-render
      this.logs = [newLog, ...this.logs];
    } else {
      // Create error log with all data
      const errorLog: ApiLog = {
        ...pendingLog,
        type: 'error',
        responseData: error,
        responseHeaders: headers,
        status,
        duration,
      };
      
      // Create a NEW array to trigger React re-render
      this.logs = [errorLog, ...this.logs];
      
      // Remove from pending
      this.pendingRequests.delete(requestId);
    }
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  // Deprecated - kept for compatibility
  addLog(log: Omit<ApiLog, 'id' | 'timestamp'>) {
    const newLog: ApiLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };

    // Create a NEW array to trigger React re-render
    this.logs = [newLog, ...this.logs];
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.notifyListeners();
  }

  getLogs(): ApiLog[] {
    // Return a new array to avoid mutations
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    // Notify listeners immediately for clear action
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: ApiLog[]) => void) {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const apiLogger = new ApiLogger();