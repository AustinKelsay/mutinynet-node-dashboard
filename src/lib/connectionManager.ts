const STORAGE_KEY = 'lnd_credentials';

export interface Credentials {
  host: string;
  macaroon: string;
}

export const connectionManager = {
  getCredentials(): Credentials | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  },

  saveCredentials(credentials: Credentials): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  },

  clearCredentials(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  hasCredentials(): boolean {
    return this.getCredentials() !== null;
  }
};