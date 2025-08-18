export interface ApiLog {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  type: 'request' | 'response' | 'error';
  data?: unknown;
  status?: number;
  duration?: number;
}

class ApiLogger {
  private logs: ApiLog[] = [];
  private listeners: ((logs: ApiLog[]) => void)[] = [];
  private maxLogs = 100; // Keep last 100 logs

  addLog(log: Omit<ApiLog, 'id' | 'timestamp'>) {
    const newLog: ApiLog = {
      ...log,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };

    this.logs.unshift(newLog); // Add to beginning
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(this.logs));
  }

  getLogs(): ApiLog[] {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener(this.logs));
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