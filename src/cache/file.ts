import * as fs from 'fs';
import * as path from 'path';
import type { CacheInterface } from './index';
import { BaseCache, MemoryLock } from './index';

interface SafeCacheEntry {
  value: unknown;
  expiresAt: number;
}

function isCacheEntry(obj: unknown): obj is SafeCacheEntry {
  if (typeof obj !== 'object' || obj === null) return false;
  const entry = obj as Record<string, unknown>;
  return (
    'expiresAt' in entry &&
    typeof entry['expiresAt'] === 'number' &&
    entry['expiresAt'] > 0
  );
}

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
    let files: string[];
    try {
      files = fs.readdirSync(this.cacheDir);
    } catch {
      return;
    }

    const now = Date.now();

    for (const file of files) {
      if (!file.endsWith('.json')) continue;

      const filePath = path.join(this.cacheDir, file);
      try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) continue;

        const content = fs.readFileSync(filePath, 'utf-8');
        const entry = JSON.parse(content);

        if (isCacheEntry(entry) && entry.expiresAt < now) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        if (error instanceof SyntaxError || (error as NodeJS.ErrnoException)?.code === 'ENOENT') {
          try {
            fs.unlinkSync(filePath);
          } catch {
            // ignore cleanup failure
          }
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
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content);

      if (!isCacheEntry(entry)) {
        await this.delete(key);
        return null;
      }

      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry.value as T;
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
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const entry = JSON.parse(content);

      if (!isCacheEntry(entry)) {
        await this.delete(key);
        return false;
      }

      if (entry.expiresAt < Date.now()) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    let files: string[];
    try {
      files = fs.readdirSync(this.cacheDir);
    } catch {
      return;
    }

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          fs.unlinkSync(path.join(this.cacheDir, file));
        } catch {
          // ignore cleanup failure
        }
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
