import * as fs from 'fs';
import * as path from 'path';
import type { OfficialAccountConfig, MiniProgramConfig, WeChatConfigOptions, AppConfig, ConfigLoadOptions } from '../types';

export class WeChatConfig {
  private officialAccounts: Map<string, OfficialAccountConfig> = new Map();
  private miniPrograms: Map<string, MiniProgramConfig> = new Map();
  private defaultOfficialAccount: string | null = null;
  private defaultMiniProgram: string | null = null;
  private debugMode: boolean = false;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  constructor(options?: WeChatConfigOptions) {
    if (options) {
      this.loadFromOptions(options);
    }
  }

  loadFromOptions(options: WeChatConfigOptions): void {
    if (options.officialAccounts) {
      for (const [name, config] of Object.entries(options.officialAccounts)) {
        this.addOfficialAccount(name, config);
      }
    }

    if (options.miniPrograms) {
      for (const [name, config] of Object.entries(options.miniPrograms)) {
        this.addMiniProgram(name, config);
      }
    }

    if (options.defaultOfficialAccount) {
      this.defaultOfficialAccount = options.defaultOfficialAccount;
    } else if (this.officialAccounts.size === 1) {
      this.defaultOfficialAccount = this.officialAccounts.keys().next().value ?? null;
    }

    if (options.defaultMiniProgram) {
      this.defaultMiniProgram = options.defaultMiniProgram;
    } else if (this.miniPrograms.size === 1) {
      this.defaultMiniProgram = this.miniPrograms.keys().next().value ?? null;
    }

    if (options.debug !== undefined) {
      this.debugMode = options.debug;
    }

    if (options.logLevel) {
      this.logLevel = options.logLevel;
    }
  }

  loadFromEnv(prefix: string = 'WECHAT'): void {
    const env = process.env;

    const officialAppId = env[`${prefix}_OFFICIAL_APPID`];
    const officialSecret = env[`${prefix}_OFFICIAL_SECRET`];
    if (officialAppId && officialSecret) {
      this.addOfficialAccount('default', {
        appId: officialAppId,
        appSecret: officialSecret,
        token: env[`${prefix}_OFFICIAL_TOKEN`],
        encodingAESKey: env[`${prefix}_OFFICIAL_AES_KEY`],
      });
      this.defaultOfficialAccount = 'default';
    }

    const miniAppId = env[`${prefix}_MINI_APPID`];
    const miniSecret = env[`${prefix}_MINI_SECRET`];
    if (miniAppId && miniSecret) {
      this.addMiniProgram('default', {
        appId: miniAppId,
        appSecret: miniSecret,
      });
      this.defaultMiniProgram = 'default';
    }

    if (env[`${prefix}_DEBUG`]) {
      this.debugMode = env[`${prefix}_DEBUG`] === 'true';
    }

    if (env[`${prefix}_LOG_LEVEL`]) {
      const level = env[`${prefix}_LOG_LEVEL`] as 'debug' | 'info' | 'warn' | 'error';
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        this.logLevel = level;
      }
    }
  }

  loadFromJson(jsonPath: string): void {
    const absolutePath = path.isAbsolute(jsonPath) ? jsonPath : path.resolve(process.cwd(), jsonPath);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Config file not found: ${absolutePath}`);
    }

    const content = fs.readFileSync(absolutePath, 'utf-8');
    const config = JSON.parse(content) as WeChatConfigOptions;
    this.loadFromOptions(config);
  }

  load(options: ConfigLoadOptions): void {
    switch (options.source) {
      case 'env':
        this.loadFromEnv(options.envPrefix);
        break;
      case 'json':
        if (!options.jsonPath) {
          throw new Error('jsonPath is required for JSON config loading');
        }
        this.loadFromJson(options.jsonPath);
        break;
      case 'memory':
        break;
      default:
        throw new Error(`Unknown config source: ${options.source}`);
    }
  }

  addOfficialAccount(name: string, config: OfficialAccountConfig): void {
    if (!config.appId || !config.appSecret) {
      throw new Error('appId and appSecret are required for official account');
    }
    this.officialAccounts.set(name, { ...config });
  }

  addMiniProgram(name: string, config: MiniProgramConfig): void {
    if (!config.appId || !config.appSecret) {
      throw new Error('appId and appSecret are required for mini program');
    }
    this.miniPrograms.set(name, { ...config });
  }

  updateOfficialAccount(name: string, config: Partial<OfficialAccountConfig>): void {
    const existing = this.officialAccounts.get(name);
    if (!existing) {
      throw new Error(`Official account "${name}" not found`);
    }
    this.officialAccounts.set(name, { ...existing, ...config });
  }

  updateMiniProgram(name: string, config: Partial<MiniProgramConfig>): void {
    const existing = this.miniPrograms.get(name);
    if (!existing) {
      throw new Error(`Mini program "${name}" not found`);
    }
    this.miniPrograms.set(name, { ...existing, ...config });
  }

  removeOfficialAccount(name: string): boolean {
    return this.officialAccounts.delete(name);
  }

  removeMiniProgram(name: string): boolean {
    return this.miniPrograms.delete(name);
  }

  getOfficialAccount(name?: string): OfficialAccountConfig | undefined {
    const key = name ?? this.defaultOfficialAccount;
    if (!key) {
      return undefined;
    }
    return this.officialAccounts.get(key);
  }

  getMiniProgram(name?: string): MiniProgramConfig | undefined {
    const key = name ?? this.defaultMiniProgram;
    if (!key) {
      return undefined;
    }
    return this.miniPrograms.get(key);
  }

  getAppConfig(name: string, type: 'official' | 'mini'): AppConfig | undefined {
    if (type === 'official') {
      const config = this.getOfficialAccount(name);
      if (config) {
        return { ...config, type: 'official' };
      }
    } else {
      const config = this.getMiniProgram(name);
      if (config) {
        return { ...config, type: 'mini' };
      }
    }
    return undefined;
  }

  getDefaultOfficialAccount(): string | null {
    return this.defaultOfficialAccount;
  }

  getDefaultMiniProgram(): string | null {
    return this.defaultMiniProgram;
  }

  setDefaultOfficialAccount(name: string): void {
    if (!this.officialAccounts.has(name)) {
      throw new Error(`Official account "${name}" not found`);
    }
    this.defaultOfficialAccount = name;
  }

  setDefaultMiniProgram(name: string): void {
    if (!this.miniPrograms.has(name)) {
      throw new Error(`Mini program "${name}" not found`);
    }
    this.defaultMiniProgram = name;
  }

  listOfficialAccounts(): string[] {
    return Array.from(this.officialAccounts.keys());
  }

  listMiniPrograms(): string[] {
    return Array.from(this.miniPrograms.keys());
  }

  isDebug(): boolean {
    return this.debugMode;
  }

  setDebug(enabled: boolean): void {
    this.debugMode = enabled;
  }

  getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.logLevel;
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  toJSON(): WeChatConfigOptions {
    const officialAccounts: Record<string, OfficialAccountConfig> = {};
    for (const [name, config] of this.officialAccounts) {
      officialAccounts[name] = config;
    }

    const miniPrograms: Record<string, MiniProgramConfig> = {};
    for (const [name, config] of this.miniPrograms) {
      miniPrograms[name] = config;
    }

    return {
      officialAccounts,
      miniPrograms,
      defaultOfficialAccount: this.defaultOfficialAccount ?? undefined,
      defaultMiniProgram: this.defaultMiniProgram ?? undefined,
      debug: this.debugMode,
      logLevel: this.logLevel,
    };
  }
}
