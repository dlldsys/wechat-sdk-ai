import { describe, it, expect } from 'vitest';
import { WxCrypto, sha1, sha256, verifyWeChatSignature } from '../src/security/crypto';

describe('WxCrypto', () => {
  const appId = 'wx1234567890';
  const token = 'testtoken';
  const encodingAESKey = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG';
  
  let crypto: WxCrypto;

  beforeEach(() => {
    crypto = new WxCrypto(appId, token, encodingAESKey);
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt message', () => {
      const message = '<xml><test>hello</test></xml>';
      
      const encrypted = crypto.encrypt(message);
      const decrypted = crypto.decrypt(encrypted);
      
      expect(decrypted).toBe(message);
    });

    it('should produce different encrypted values', () => {
      const message = 'test message';
      
      const encrypted1 = crypto.encrypt(message);
      const encrypted2 = crypto.encrypt(message);
      
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('signature', () => {
    it('should generate and verify signature', () => {
      const timestamp = Date.now().toString();
      const nonce = 'randomnonce';
      
      const signature = crypto.generateSignature(timestamp, nonce);
      const valid = crypto.verifySignature(signature, timestamp, nonce);
      
      expect(valid).toBe(true);
    });

    it('should fail verification with wrong signature', () => {
      const timestamp = Date.now().toString();
      const nonce = 'randomnonce';
      
      const valid = crypto.verifySignature('wrongsignature', timestamp, nonce);
      
      expect(valid).toBe(false);
    });

    it('should include encrypted message in signature', () => {
      const timestamp = Date.now().toString();
      const nonce = 'randomnonce';
      const encrypted = crypto.encrypt('test');
      
      const signature = crypto.generateSignature(timestamp, nonce, encrypted);
      const valid = crypto.verifySignature(signature, timestamp, nonce, encrypted);
      
      expect(valid).toBe(true);
    });
  });

  describe('encryptMessage/decryptMessage', () => {
    it('should encrypt and decrypt message with signature', () => {
      const message = '<xml><test>hello</test></xml>';
      const timestamp = Date.now().toString();
      const nonce = 'randomnonce';
      
      const encrypted = crypto.encryptMessage(message, timestamp, nonce);
      const decrypted = crypto.decryptMessage(
        encrypted.Encrypt,
        encrypted.MsgSignature,
        encrypted.TimeStamp,
        encrypted.Nonce
      );
      
      expect(decrypted).toBe(message);
    });
  });
});

describe('Hash functions', () => {
  it('should generate SHA1 hash', () => {
    const hash = sha1('test');
    expect(hash).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
  });

  it('should generate SHA256 hash', () => {
    const hash = sha256('test');
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });
});

describe('verifyWeChatSignature', () => {
  it('should verify WeChat signature', () => {
    const token = 'testtoken';
    const timestamp = Date.now().toString();
    const nonce = 'randomnonce';
    
    const arr = [token, timestamp, nonce].sort();
    const signature = sha1(arr.join(''));
    
    const valid = verifyWeChatSignature({
      signature,
      timestamp,
      nonce,
      token,
    });
    
    expect(valid).toBe(true);
  });

  it('should fail with wrong signature', () => {
    const valid = verifyWeChatSignature({
      signature: 'wrongsignature',
      timestamp: Date.now().toString(),
      nonce: 'nonce',
      token: 'token',
    });
    
    expect(valid).toBe(false);
  });
});
