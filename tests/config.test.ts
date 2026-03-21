import { describe, it, expect, beforeEach } from 'vitest';
import { WeChatConfig } from '../src/config';
import type { WeChatConfigOptions } from '../src/types';

describe('WeChatConfig', () => {
  let config: WeChatConfig;

  beforeEach(() => {
    config = new WeChatConfig();
  });

  describe('loadFromOptions', () => {
    it('should load official accounts', () => {
      const options: WeChatConfigOptions = {
        officialAccounts: {
          default: {
            appId: 'wx123',
            appSecret: 'secret123',
            token: 'token123',
          },
        },
      };
      
      config.loadFromOptions(options);
      
      expect(config.getOfficialAccount('default')).toEqual({
        appId: 'wx123',
        appSecret: 'secret123',
        token: 'token123',
      });
    });

    it('should load mini programs', () => {
      const options: WeChatConfigOptions = {
        miniPrograms: {
          default: {
            appId: 'mp123',
            appSecret: 'mpsecret',
          },
        },
      };
      
      config.loadFromOptions(options);
      
      expect(config.getMiniProgram('default')).toEqual({
        appId: 'mp123',
        appSecret: 'mpsecret',
      });
    });

    it('should set default official account when specified', () => {
      const options: WeChatConfigOptions = {
        officialAccounts: {
          app1: { appId: 'wx1', appSecret: 's1' },
          app2: { appId: 'wx2', appSecret: 's2' },
        },
        defaultOfficialAccount: 'app2',
      };
      
      config.loadFromOptions(options);
      
      expect(config.getDefaultOfficialAccount()).toBe('app2');
    });

    it('should throw error for invalid config', () => {
      expect(() => {
        config.addOfficialAccount('test', { appId: '', appSecret: '' });
      }).toThrow('appId and appSecret are required');
    });
  });

  describe('add/remove operations', () => {
    it('should add and remove official accounts', () => {
      config.addOfficialAccount('test', {
        appId: 'wx123',
        appSecret: 'secret',
      });
      
      expect(config.listOfficialAccounts()).toContain('test');
      
      config.removeOfficialAccount('test');
      expect(config.listOfficialAccounts()).not.toContain('test');
    });

    it('should update existing config', () => {
      config.addOfficialAccount('test', {
        appId: 'wx123',
        appSecret: 'secret',
      });
      
      config.updateOfficialAccount('test', { token: 'newtoken' });
      
      expect(config.getOfficialAccount('test')?.token).toBe('newtoken');
    });
  });

  describe('debug mode', () => {
    it('should set debug mode', () => {
      config.setDebug(true);
      expect(config.isDebug()).toBe(true);
      
      config.setDebug(false);
      expect(config.isDebug()).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should export config to JSON', () => {
      config.addOfficialAccount('default', {
        appId: 'wx123',
        appSecret: 'secret',
      });
      config.setDebug(true);
      
      const json = config.toJSON();
      
      expect(json.officialAccounts?.default).toBeDefined();
      expect(json.debug).toBe(true);
    });
  });
});
