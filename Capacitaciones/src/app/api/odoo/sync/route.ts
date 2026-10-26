import { NextResponse } from "next/server";
import { odooService } from "@/services/odooService";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await odooService.syncCatalog(body.skus);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
