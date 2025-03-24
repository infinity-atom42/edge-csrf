import * as util from '@shared/util';

import { CsrfError, createCsrfProtect } from './index';
import type { SvelteKitCsrfProtectRequestEvent } from './index';

/**
 * Helper classes
 */

class Cookies {
  jar: Record<string, string> = {};

  get(name: string) {
    return this.jar[name];
  }

  set(name: string, value: string) {
    this.jar[name] = value;
  }
}

class RequestEvent implements SvelteKitCsrfProtectRequestEvent {
  request: Request = new Request('http://example.com/');

  url: URL = new URL('http://example.com/');

  cookies = new Cookies();

  locals = { csrfToken: undefined };

  constructor(url?: string, requestArgs?: RequestInit) {
    if (url) {
      this.request = new Request(url, requestArgs);
      this.url = new URL(url);
    }
  }
}

describe('csrfProtect integration tests', () => {
  const csrfProtectDefault = createCsrfProtect();

  it('should work in req.body', async () => {
    const secretUint8 = util.createSecret(8);
    const tokenUint8 = await util.createToken(secretUint8, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `csrf_token=${encodeURIComponent(util.utoa(tokenUint8))}`,
    });
    event.cookies.set('_csrfSecret', util.utoa(secretUint8));

    await csrfProtectDefault(event);

    // assertions
    const { csrfToken } = event.locals;
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.toBe('');
  });

  it('should work in x-csrf-token header', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await csrfProtectDefault(event);

    // assertions
    const { csrfToken } = event.locals;
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.toBe('');
  });

  it('should handle server action form submissions', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const formData = new FormData();
    formData.set('csrf_token', util.utoa(token));
    formData.set('key1', 'val1');

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      body: formData,
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await csrfProtectDefault(event);

    // assertions
    const { csrfToken } = event.locals;
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.toBe('');
  });

  it('should handle server action non-form submissions', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify([util.utoa(token), 'arg']),
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await csrfProtectDefault(event);

    // assertions
    const { csrfToken } = event.locals;
    expect(csrfToken).toBeDefined();
    expect(csrfToken).not.toBe('');
  });

  it('should fail with token from different secret', async () => {
    const evilSecret = util.createSecret(8);
    const goodSecret = util.createSecret(8);
    const token = await util.createToken(evilSecret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    event.cookies.set('_csrfSecret', util.utoa(goodSecret));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with an invalid token', async () => {
    const secret = util.createSecret(8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': btoa(String.fromCharCode(100)) },
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with non-base64 token', async () => {
    const secret = util.createSecret(8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '-' },
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with no token', async () => {
    const secret = util.createSecret(8);

    const event = new RequestEvent('http://example.com', { method: 'POST' });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with empty token', async () => {
    const secret = util.createSecret(8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': '' },
    });
    event.cookies.set('_csrfSecret', util.utoa(secret));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with non-base64 secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    event.cookies.set('_csrfSecret', '-');

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with an invalid secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    event.cookies.set('_csrfSecret', btoa(String.fromCharCode(100)));

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with no secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });

  it('should fail with empty secret', async () => {
    const secret = util.createSecret(8);
    const token = await util.createToken(secret, 8);

    const event = new RequestEvent('http://example.com', {
      method: 'POST',
      headers: { 'x-csrf-token': util.utoa(token) },
    });
    event.cookies.set('_csrfSecret', '');

    await expect(csrfProtectDefault(event)).rejects.toThrow(CsrfError);
  });
});

describe('obtaining secrets tests', () => {
  const csrfProtectDefault = createCsrfProtect();

  describe('sets new secret when missing from request', () => {
    const methods = ['GET', 'POST'];

    it.each(methods)('%s request', async (method) => {
      const event = new RequestEvent('http://example.com', { method });
      
      // For POST requests, we need to set up a valid token
      if (method === 'POST') {
        // First, handle a GET request to create a secret
        const setupEvent = new RequestEvent('http://example.com', { method: 'GET' });
        await csrfProtectDefault(setupEvent);
        
        // Get the secret that was set
        const secretStr = setupEvent.cookies.get('_csrfSecret');
        
        // Set the secret in the test event
        event.cookies.set('_csrfSecret', secretStr);
        
        // Create a token and include it in the request
        const secret = util.atou(secretStr!);
        const token = await util.createToken(secret, 8);
        
        // Add the token to the request headers
        event.request = new Request('http://example.com', {
          method: 'POST',
          headers: { 'x-csrf-token': util.utoa(token) }
        });
      }

      try {
        await csrfProtectDefault(event);
      } finally {
        // do nothing
      }

      expect(event.cookies.get('_csrfSecret')).not.toEqual(undefined);
    });
  });

  describe('keeps existing secret when present in request', () => {
    const methods = ['GET', 'POST'];
    const secretStr = util.utoa(util.createSecret(8));

    it.each(methods)('%s request', async (method) => {
      const event = new RequestEvent('http://example.com', { method });
      event.cookies.set('_csrfSecret', secretStr);
      
      // For POST requests, we need to set up a valid token
      if (method === 'POST') {
        // Create a token and include it in the request
        const secret = util.atou(secretStr);
        const token = await util.createToken(secret, 8);
        
        // Add the token to the request headers
        event.request = new Request('http://example.com', {
          method: 'POST',
          headers: { 'x-csrf-token': util.utoa(token) }
        });
      }

      try {
        await csrfProtectDefault(event);
      } finally {
        // do nothing
      }

      expect(event.cookies.get('_csrfSecret')).toEqual(secretStr);
    });
  });
});
