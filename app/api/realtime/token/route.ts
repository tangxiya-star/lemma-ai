import { NextResponse } from "next/server";

// Returns the Butterbase realtime WebSocket URL for the browser.
// Demo uses the service key directly; in a real app this would mint a short-lived end-user JWT.
export async function GET() {
  const base = process.env.BUTTERBASE_URL;
  const key = process.env.BUTTERBASE_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "missing butterbase env" }, { status: 500 });
  }
  const wsBase = base.replace(/^https?:/, base.startsWith("https") ? "wss:" : "ws:");
  return NextResponse.json({ url: `${wsBase}/realtime?token=${key}` });
}
