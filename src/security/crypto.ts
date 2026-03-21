import * as crypto from 'crypto';

export class WxCrypto {
  private appId: string;
  private token: string;
  private key: Buffer;
  private iv: Buffer;

  constructor(appId: string, token: string, encodingAESKey: string) {
    this.appId = appId;
    this.token = token;
    
    this.key = Buffer.from(encodingAESKey + '=', 'base64');
    this.iv = this.key.slice(0, 16);
  }

  encrypt(message: string): string {
    const random = crypto.randomBytes(16);
    const msgLen = Buffer.alloc(4);
    msgLen.writeUInt32BE(Buffer.byteLength(message), 0);
    
    const msgBuffer = Buffer.from(message);
    const appIdBuffer = Buffer.from(this.appId);
    
    const content = Buffer.concat([random, msgLen, msgBuffer, appIdBuffer]);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', this.key, this.iv);
    cipher.setAutoPadding(true);
    
    const encrypted = Buffer.concat([cipher.update(content), cipher.final()]);
    
    return encrypted.toString('base64');
  }

  decrypt(encrypted: string): string {
    const encryptedBuffer = Buffer.from(encrypted, 'base64');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, this.iv);
    decipher.setAutoPadding(true);
    
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    
    const content = decrypted.slice(16);
    const msgLen = content.readUInt32BE(0);
    const message = content.slice(4, 4 + msgLen).toString();
    const fromAppId = content.slice(4 + msgLen).toString();
    
    if (fromAppId !== this.appId) {
      throw new Error('AppId mismatch');
    }
    
    return message;
  }

  generateSignature(timestamp: string, nonce: string, encrypted?: string): string {
    const arr = [this.token, timestamp, nonce];
    if (encrypted) {
      arr.push(encrypted);
    }
    arr.sort();
    
    const str = arr.join('');
    return crypto.createHash('sha1').update(str).digest('hex');
  }

  verifySignature(signature: string, timestamp: string, nonce: string, encrypted?: string): boolean {
    const expected = this.generateSignature(timestamp, nonce, encrypted);
    return signature === expected;
  }

  encryptMessage(message: string, timestamp: string, nonce: string): {
    Encrypt: string;
    MsgSignature: string;
    TimeStamp: string;
    Nonce: string;
  } {
    const encrypted = this.encrypt(message);
    const msgSignature = this.generateSignature(timestamp, nonce, encrypted);
    
    return {
      Encrypt: encrypted,
      MsgSignature: msgSignature,
      TimeStamp: timestamp,
      Nonce: nonce,
    };
  }

  decryptMessage(encrypted: string, msgSignature: string, timestamp: string, nonce: string): string {
    if (!this.verifySignature(msgSignature, timestamp, nonce, encrypted)) {
      throw new Error('Signature verification failed');
    }
    
    return this.decrypt(encrypted);
  }
}

export function sha1(data: string): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

export function sha256(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hmacSha256(data: string, key: string): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

export function md5(data: string): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

export function verifyWeChatSignature(params: {
  signature: string;
  timestamp: string;
  nonce: string;
  token: string;
  echostr?: string;
}): boolean {
  const { signature, timestamp, nonce, token } = params;
  const arr = [token, timestamp, nonce].sort();
  const str = arr.join('');
  const expected = sha1(str);
  return signature === expected;
}

export function verifyMessageSignature(params: {
  signature: string;
  timestamp: string;
  nonce: string;
  token: string;
  encrypted?: string;
}): boolean {
  const { signature, timestamp, nonce, token, encrypted } = params;
  const arr = [token, timestamp, nonce];
  if (encrypted) {
    arr.push(encrypted);
  }
  arr.sort();
  const str = arr.join('');
  const expected = sha1(str);
  return signature === expected;
}
