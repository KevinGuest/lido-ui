import { NextResponse } from "next/server";

import { sendTelegramConnectionTest } from "@/lib/notifications";

export const runtime = "nodejs";

type Body = {
  botToken?: string;
  chatId?: string;
};

/**
 * Demo / Pages fallback: Telegram Bot API blocks browser CORS, so the UI
 * posts here and we forward a single connection-ok message server-side.
 */
export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const botToken = body.botToken?.trim() || "";
  const chatId = body.chatId?.trim() || "";
  if (!botToken || !chatId) {
    return NextResponse.json(
      { message: "botToken and chatId are required" },
      { status: 400 },
    );
  }

  try {
    await sendTelegramConnectionTest({ botToken, chatId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Telegram test failed" },
      { status: 400 },
    );
  }
}
