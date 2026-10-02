import { NextRequest } from 'next/server';

// Server-side proxy for template PDFs. The browser can display the media
// server's PDFs in an <iframe>, but cannot read their bytes (no CORS headers).
// The Next.js server is not subject to CORS, so it fetches the exact URL and
// hands the bytes back from our own origin.
const ALLOWED_HOSTS = new Set(['mediaserver.advancedtechnologypark.com']);

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get('url');
  if (!target) return new Response('Missing "url" parameter', { status: 400 });

  let u: URL;
  try {
    u = new URL(target);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.host)) {
    return new Response('Host not allowed', { status: 403 });
  }
  if (!u.pathname.toLowerCase().endsWith('.pdf')) {
    return new Response('Only PDF files can be proxied', { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(u.toString(), { cache: 'no-store' });
  } catch (err) {
    return new Response(`Could not reach media server: ${String(err)}`, { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`Media server returned ${upstream.status} for ${u.toString()}`, {
      status: upstream.status,
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Cache-Control': 'private, max-age=300',
    },
  });
}