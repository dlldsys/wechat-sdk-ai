import { describe, it, expect, beforeEach } from 'vitest';
import { IPWhitelist, isWeChatIP, extractIP } from '../src/security/ip';

describe('IPWhitelist', () => {
  let whitelist: IPWhitelist;

  beforeEach(() => {
    whitelist = new IPWhitelist();
  });

  it('should allow all IPs when whitelist is empty', () => {
    expect(whitelist.isAllowed('1.2.3.4')).toBe(true);
  });

  it('should allow IPs in whitelist', () => {
    whitelist.add('1.2.3.4');
    whitelist.add('5.6.7.8');
    
    expect(whitelist.isAllowed('1.2.3.4')).toBe(true);
    expect(whitelist.isAllowed('5.6.7.8')).toBe(true);
    expect(whitelist.isAllowed('9.10.11.12')).toBe(false);
  });

  it('should remove IP from whitelist', () => {
    whitelist.add('1.2.3.4');
    whitelist.remove('1.2.3.4');
    
    expect(whitelist.isAllowed('1.2.3.4')).toBe(true);
  });

  it('should clear whitelist', () => {
    whitelist.add('1.2.3.4');
    whitelist.add('5.6.7.8');
    whitelist.clear();
    
    expect(whitelist.getWhitelist()).toHaveLength(0);
  });

  it('should enable/disable whitelist', () => {
    whitelist.add('1.2.3.4');
    whitelist.disable();
    
    expect(whitelist.isAllowed('9.10.11.12')).toBe(true);
    
    whitelist.enable();
    expect(whitelist.isAllowed('9.10.11.12')).toBe(false);
  });

  it('should set whitelist from array', () => {
    whitelist.setWhitelist(['1.2.3.4', '5.6.7.8']);
    
    expect(whitelist.getWhitelist()).toEqual(['1.2.3.4', '5.6.7.8']);
  });
});

describe('isWeChatIP', () => {
  it('should identify WeChat IP', () => {
    expect(isWeChatIP('101.226.103.1')).toBe(true);
    expect(isWeChatIP('203.205.128.100')).toBe(true);
  });

  it('should reject non-WeChat IP', () => {
    expect(isWeChatIP('8.8.8.8')).toBe(false);
    expect(isWeChatIP('1.2.3.4')).toBe(false);
  });
});

describe('extractIP', () => {
  it('should extract IP from x-forwarded-for', () => {
    const req = {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
      socket: { remoteAddress: '9.10.11.12' },
    };
    
    expect(extractIP(req)).toBe('1.2.3.4');
  });

  it('should extract IP from x-real-ip', () => {
    const req = {
      headers: { 'x-real-ip': '1.2.3.4' },
      socket: { remoteAddress: '9.10.11.12' },
    };
    
    expect(extractIP(req)).toBe('1.2.3.4');
  });

  it('should extract IP from socket', () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '9.10.11.12' },
    };
    
    expect(extractIP(req)).toBe('9.10.11.12');
  });
});
