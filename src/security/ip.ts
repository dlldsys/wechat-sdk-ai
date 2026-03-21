import * as crypto from 'crypto';

export interface IPWhitelistOptions {
  whitelist?: string[];
  enabled?: boolean;
}

export class IPWhitelist {
  private whitelist: Set<string>;
  private enabled: boolean;

  constructor(options?: IPWhitelistOptions) {
    this.whitelist = new Set(options?.whitelist ?? []);
    this.enabled = options?.enabled ?? true;
  }

  add(ip: string): void {
    this.whitelist.add(ip);
  }

  remove(ip: string): boolean {
    return this.whitelist.delete(ip);
  }

  clear(): void {
    this.whitelist.clear();
  }

  isAllowed(ip: string): boolean {
    if (!this.enabled) {
      return true;
    }
    
    if (this.whitelist.size === 0) {
      return true;
    }
    
    return this.whitelist.has(ip);
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getWhitelist(): string[] {
    return Array.from(this.whitelist);
  }

  setWhitelist(ips: string[]): void {
    this.whitelist = new Set(ips);
  }
}

export function extractIP(request: {
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string | null {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips?.split(',')[0].trim() ?? null;
  }
  
  const realIP = request.headers['x-real-ip'];
  if (realIP) {
    const ip = Array.isArray(realIP) ? realIP[0] : realIP;
    return ip ?? null;
  }
  
  return request.socket?.remoteAddress ?? null;
}

export function createIPMiddleware(whitelist: IPWhitelist) {
  return (req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }, res: { status: (code: number) => { json: (data: unknown) => void } }, next: () => void) => {
    const ip = extractIP(req);
    
    if (!ip || !whitelist.isAllowed(ip)) {
      res.status(403).json({ error: 'Forbidden', message: 'IP not allowed' });
      return;
    }
    
    next();
  };
}

export const WECHAT_IP_RANGES = [
  '101.226.103.*',
  '101.226.62.*',
  '140.207.54.*',
  '140.207.97.*',
  '140.207.98.*',
  '140.207.99.*',
  '180.163.26.*',
  '180.163.28.*',
  '203.205.128.*',
  '203.205.129.*',
  '203.205.130.*',
  '203.205.131.*',
  '203.205.147.*',
  '203.205.148.*',
  '203.205.149.*',
  '203.205.153.*',
  '203.205.154.*',
  '203.205.155.*',
  '59.37.97.*',
  '59.37.98.*',
  '59.37.99.*',
  '61.129.135.*',
  '61.151.168.*',
  '61.151.180.*',
];

export function isWeChatIP(ip: string): boolean {
  for (const range of WECHAT_IP_RANGES) {
    if (matchIPRange(ip, range)) {
      return true;
    }
  }
  return false;
}

function matchIPRange(ip: string, range: string): boolean {
  if (!range.includes('*')) {
    return ip === range;
  }
  
  const prefix = range.replace(/\*.*/, '');
  return ip.startsWith(prefix);
}

export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
