import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

import { Config, TokenOptions } from '@shared/config';
import type { ConfigOptions } from '@shared/config';
import { CsrfError, createCsrfProtect as _createCsrfProtect } from '@shared/protect';
import { Csrf, useCsrfToken } from './client';
import { CsrfProvider } from './provider';

export { CsrfError, Csrf, useCsrfToken, CsrfProvider };

/**
 * Represents token options in config
 */
export class NextTokenOptions extends TokenOptions {
  responseHeader: string = 'X-CSRF-Token';

  constructor(opts?: Partial<NextTokenOptions>) {
    super(opts);
    Object.assign(this, opts);
  }
}

/**
 * Represents configuration object
 */
export class NextConfig extends Config {
  excludePathPrefixes: string[] = ['/_next/'];

  token: NextTokenOptions = new NextTokenOptions();

  constructor(opts?: Partial<NextConfigOptions>) {
    super(opts);
    const newOpts = opts || {};
    if (newOpts.token) newOpts.token = new NextTokenOptions(newOpts.token);
    Object.assign(this, newOpts);
  }
}

/**
 * Represents configuration options object
 */
export interface NextConfigOptions extends Omit<ConfigOptions, 'token'> {
  token: Partial<NextTokenOptions>;
}

/**
 * Represents signature of CSRF protect function to be used in Next.js middleware
 */
export type NextCsrfProtect = {
  (request: NextRequest, response: NextResponse): Promise<void>;
};

/**
 * Create CSRF protection function for use in Next.js middleware
 * @param {Partial<NextConfigOptions>} opts - Configuration options
 * @returns {NextCsrfProtectFunction} - The CSRF protect function
 * @throws {CsrfError} - An error if CSRF validation failed
 */
export function createCsrfProtect(opts?: Partial<NextConfigOptions>): NextCsrfProtect {
  const config = new NextConfig(opts);
  const _csrfProtect = _createCsrfProtect(config);

  return async (request, response) => {
    // execute protect function
    const token = await _csrfProtect({
      request,
      url: request.nextUrl,
      getCookie: (name) => request.cookies.get(name)?.value,
      setCookie: (cookie) => response.cookies.set(cookie),
    });

    // add token to response header
    if (token) response.headers.set(config.token.responseHeader, token);
  };
}

/**
 * Create Next.js middleware function
 * @param {Partial<NextConfigOptions>} opts - Configuration options
 * @returns Next Middleware function
 */
export function createCsrfMiddleware(opts?: Partial<NextConfigOptions>) {
  const csrfProtect = createCsrfProtect(opts);

  return async (request: NextRequest) => {
    const response = NextResponse.next();

    // csrf protection
    try {
      await csrfProtect(request, response);
    } catch (err) {
      if (err instanceof CsrfError) return new NextResponse('invalid csrf token', { status: 403 });
      throw err;
    }

    return response;
  };
}

/**
 * Get CSRF token from request headers
 */
export async function getCsrfToken() {
  const headersList = await headers();
  const csrfToken = headersList.get('X-CSRF-Token') || 'missing';

  return csrfToken;
}
