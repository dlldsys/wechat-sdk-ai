import * as fs from 'fs';
import * as path from 'path';
import type { CacheInterface } from './index';
import { BaseCache, MemoryLock } from './index';

export class FileCache extends BaseCache implements CacheInterface {
  private cacheDir: string;
  private defaultTtl: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(cacheDir: string, defaultTtl: number = 7200) {
    super();
    this.cacheDir = cacheDir;
    this.defaultTtl = defaultTtl;
    this.ensureDir();
    this.startCleanup();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const safeKey = Buffer.from(key).toString('base64').replace(/[+/=]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const files = fs.readdirSync(this.cacheDir);
    const now = Date.now();

    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const filePath = path.join(this.cacheDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const entry = JSON.parse(content) as { value: unknown; expiresAt: number };
        
        if (entry.expiresAt && entry.expiresAt < now) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        if (error instanceof SyntaxError) {
          fs.unlinkSync(filePath);
        } else {
          // eslint-disable-next-line no-console
          console.error(`[FileCache] Failed to process cache file: ${filePath}`, error);
        }
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content) as { value: T; expiresAt: number };
      
      if (entry.expiresAt < Date.now()) {
        fs.unlinkSync(filePath);
        return null;
      }
      
      return entry.value;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const filePath = this.getFilePath(key);
    const effectiveTtl = ttl ?? this.defaultTtl;
    const expiresAt = Date.now() + effectiveTtl * 1000;
    
    const entry = { value, expiresAt };
    fs.writeFileSync(filePath, JSON.stringify(entry));
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    
    return false;
  }

  async has(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    
    if (!fs.existsSync(filePath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content) as { expiresAt: number };
      
      if (entry.expiresAt < Date.now()) {
        fs.unlinkSync(filePath);
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    const files = fs.readdirSync(this.cacheDir);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export { MemoryLock as FileLock };
