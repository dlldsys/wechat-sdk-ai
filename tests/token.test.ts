import { describe, it, expect } from 'vitest';
import { generateSignature, generateNonceStr, generateTimestamp } from '../src/token';

describe('Token utilities', () => {
  describe('generateSignature', () => {
    it('should generate SHA1 signature', () => {
      const params = {
        a: '1',
        b: '2',
        c: '3',
      };
      
      const signature = generateSignature(params);
      
      expect(signature).toHaveLength(40);
      expect(signature).toMatch(/^[a-f0-9]{40}$/);
    });

    it('should sort params before signing', () => {
      const params1 = { a: '1', b: '2', c: '3' };
      const params2 = { c: '3', a: '1', b: '2' };
      
      const sig1 = generateSignature(params1);
      const sig2 = generateSignature(params2);
      
      expect(sig1).toBe(sig2);
    });

    it('should skip empty values', () => {
      const params = {
        a: '1',
        b: '',
        c: undefined as unknown as string,
      };
      
      const signature = generateSignature(params);
      
      expect(signature).toBeDefined();
    });
  });

  describe('generateNonceStr', () => {
    it('should generate random string', () => {
      const str1 = generateNonceStr();
      const str2 = generateNonceStr();
      
      expect(str1).not.toBe(str2);
    });

    it('should generate string of specified length', () => {
      expect(generateNonceStr(8)).toHaveLength(8);
      expect(generateNonceStr(32)).toHaveLength(32);
    });

    it('should generate alphanumeric string', () => {
      const str = generateNonceStr(100);
      expect(str).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateTimestamp', () => {
    it('should generate current timestamp', () => {
      const before = Math.floor(Date.now() / 1000);
      const timestamp = generateTimestamp();
      const after = Math.floor(Date.now() / 1000);
      
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });
});
