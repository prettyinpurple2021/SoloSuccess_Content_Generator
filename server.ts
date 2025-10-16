import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const fileResponse = await serveFile(req, `./dist${requestedPath}`);
    const headers = new Headers(fileResponse.headers);
    headers.set("X-Frame-Options", "DENY");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
    headers.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:; script-src 'self' 'unsafe-inline' https:; connect-src 'self' https:; frame-src https://accounts.google.com; object-src 'none'"
    );
    if (requestedPath.endsWith(".html")) {
      headers.set("Cache-Control", "no-store");
    } else {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }
    return new Response(fileResponse.body, { status: fileResponse.status, headers });
  } catch {
    const fallbackResponse = await serveFile(req, "./dist/index.html");
    const headers = new Headers(fallbackResponse.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(fallbackResponse.body, { status: 200, headers });
  }
});


