import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractSubdomain, getRootDomain } from '@/lib/tenant-host';

const SKIP_PREFIXES = ['/dashboard', '/login', '/register', '/api', '/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Already on explicit /book/[slug] route
  if (pathname.startsWith('/book/')) {
    return NextResponse.next();
  }

  const host = request.headers.get('host') || '';
  const slug = extractSubdomain(host, getRootDomain());

  if (!slug) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/book/${slug}${pathname === '/' ? '' : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
