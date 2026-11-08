import { NetworkLogEntry } from '../types';

type Listener = (logs: NetworkLogEntry[]) => void;

class NetworkMonitorService {
  private logs: NetworkLogEntry[] = [];
  private listeners: Set<Listener> = new Set();
  private initialized = false;
  private outboundUserPayloadsCount = 0;

  public init() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Wrap window.fetch
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : resource instanceof Request ? resource.url : String(resource);
      const method = config?.method?.toUpperCase() || (resource instanceof Request ? resource.method.toUpperCase() : 'GET');

      // Check if this is an attempt to send data outside
      const hasBody = !!config?.body;
      const isExternal = !url.startsWith(window.location.origin) && !url.startsWith('/') && !url.startsWith('blob:') && !url.startsWith('data:');

      const entry: NetworkLogEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        method,
        url,
        blocked: isExternal && hasBody, // Block any external upload attempts
        reason: isExternal && hasBody 
          ? 'Blocked: Outbound external payload strictly prohibited by Zero-Upload policy'
          : isExternal 
            ? 'External resource request' 
            : 'Local / App Shell asset request',
        size: typeof config?.body === 'string' ? config.body.length : undefined
      };

      this.addLog(entry);

      if (isExternal && hasBody) {
        this.outboundUserPayloadsCount++;
        console.error('[FileForge Security] Blocked prohibited external upload:', url);
        throw new Error(`Security Violation: FileForge prohibited an external upload to ${url}`);
      }

      return originalFetch(...args);
    };

    // Wrap XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    const originalXhrSend = XMLHttpRequest.prototype.send;
    const self = this;

    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: any[]) {
      (this as any)._ffMethod = args[0];
      (this as any)._ffUrl = args[1];
      return originalXhrOpen.apply(this, args as any);
    };

    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: any) {
      const url = (this as any)._ffUrl || '';
      const method = (this as any)._ffMethod || 'GET';
      const isExternal = !url.startsWith(window.location.origin) && !url.startsWith('/') && !url.startsWith('blob:') && !url.startsWith('data:');

      if (isExternal && body) {
        self.outboundUserPayloadsCount++;
        const entry: NetworkLogEntry = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          method,
          url,
          blocked: true,
          reason: 'Blocked XHR: Outbound external upload strictly prohibited by Zero-Upload policy',
        };
        self.addLog(entry);
        console.error('[FileForge Security] Blocked prohibited XHR upload:', url);
        throw new Error(`Security Violation: FileForge prohibited an external XHR upload to ${url}`);
      }

      self.addLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        method,
        url,
        blocked: false,
        reason: isExternal ? 'External XHR request' : 'Local XHR asset'
      });

      return originalXhrSend.apply(this, [body] as any);
    };

    // Add initial log
    this.addLog({
      id: 'init-guard',
      timestamp: Date.now(),
      method: 'SYSTEM',
      url: 'localhost (Secure Zero-Upload Sandbox Active)',
      blocked: false,
      reason: 'Network Monitor Guard active. Zero files transmitted to external servers.'
    });
  }

  private addLog(entry: NetworkLogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > 200) {
      this.logs.pop();
    }
    this.notify();
  }

  public getLogs(): NetworkLogEntry[] {
    return [...this.logs];
  }

  public getOutboundUserPayloadsCount(): number {
    return this.outboundUserPayloadsCount;
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l([...this.logs]));
  }
}

export const networkMonitor = new NetworkMonitorService();

