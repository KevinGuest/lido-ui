import { NextRequest } from "next/server";

function poolUpstreamUrl(path: string, search = ""): string | null {
  const base = (process.env.PUBLIC_POOL_API_URL ?? "").trim().replace(/\/+$/, "");
  if (!base) return null;
  const suffix = path.replace(/^\/+/, "");
  return `${base}/${suffix}${search}`;
}

async function proxyToPool(
  request: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<Response> {
  const path = pathSegments.join("/");
  const upstream = poolUpstreamUrl(path, request.nextUrl.search);
  if (!upstream) {
    return Response.json({ message: "Pool API not configured" }, { status: 503 });
  }

  const isStream = path === "api/logs/stream" && method === "GET";
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  if (isStream) headers.set("accept", "text/event-stream");

  const init: RequestInit = {
    method,
    headers,
    cache: "no-store",
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.text();
  }

  const upstreamRes = await fetch(upstream, init);
  const outHeaders = new Headers();
  const upstreamType = upstreamRes.headers.get("content-type");
  if (upstreamType) outHeaders.set("content-type", upstreamType);
  if (isStream) {
    outHeaders.set("cache-control", "no-cache");
    outHeaders.set("connection", "keep-alive");
    outHeaders.set("x-accel-buffering", "no");
  }

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: outHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToPool(request, path, "GET");
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToPool(request, path, "PUT");
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToPool(request, path, "POST");
}
