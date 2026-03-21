import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '../src/utils/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger = new Logger({ level: 'info' });
    logger.info('test message');
    
    expect(consoleSpy.info).toHaveBeenCalled();
  });

  it('should respect log level', () => {
    logger = new Logger({ level: 'warn' });
    
    logger.debug('debug message');
    logger.info('info message');
    logger.warn('warn message');
    logger.error('error message');
    
    expect(consoleSpy.debug).not.toHaveBeenCalled();
    expect(consoleSpy.info).not.toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalled();
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should log with prefix', () => {
    logger = new Logger({ level: 'info', prefix: 'test' });
    logger.info('message');
    
    const call = consoleSpy.info.mock.calls[0][0];
    expect(call).toContain('[test]');
  });

  it('should log data in debug mode', () => {
    logger = new Logger({ level: 'debug', debug: true });
    logger.debug('message', { key: 'value' });
    
    const call = consoleSpy.debug.mock.calls[0][0];
    expect(call).toContain('key');
    expect(call).toContain('value');
  });

  it('should create child logger', () => {
    logger = new Logger({ level: 'info', prefix: 'parent' });
    const child = logger.child('child');
    
    child.info('message');
    
    const call = consoleSpy.info.mock.calls[0][0];
    expect(call).toContain('[parent:child]');
  });

  it('should set debug mode', () => {
    logger = new Logger({ level: 'info' });
    logger.setDebug(true);
    
    logger.debug('debug message');
    
    expect(consoleSpy.debug).toHaveBeenCalled();
  });
});
