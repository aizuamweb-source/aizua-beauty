import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL || "https://beauty.aizualabs.com"));
  res.cookies.delete("sb-admin-token");
  return res;
}
