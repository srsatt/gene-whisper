// Cloudflare Worker for static assets subdomain (static.yourdomain.com)
// Serves data files, model files, and WASM files directly from R2

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // All requests to static subdomain are for static assets
    try {
      const objectKey = url.pathname.substring(1); // Remove leading slash
      const object = await env.STATIC_ASSETS.get(objectKey);
      
      if (object === null) {
        return new Response('Object Not Found', { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      
      // Set appropriate content type based on file extension
      if (objectKey.endsWith('.json')) {
        headers.set('content-type', 'application/json');
      } else if (objectKey.endsWith('.txt')) {
        headers.set('content-type', 'text/plain');
      } else if (objectKey.endsWith('.wasm')) {
        headers.set('content-type', 'application/wasm');
      } else if (objectKey.endsWith('.bin')) {
        headers.set('content-type', 'application/octet-stream');
      }
      
      // Add CORS headers for cross-origin requests
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      // Add aggressive caching for static assets
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 year
      
      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      console.error('R2 error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
