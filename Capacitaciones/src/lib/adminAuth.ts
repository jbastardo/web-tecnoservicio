import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { initialAdminUsers } from "@/lib/serverStorage";
import { AdminUser } from "@/types";

export const SESSION_COOKIE = "onprotec_admin_session";

export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionVal = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionVal) return null;

    const parsed = JSON.parse(Buffer.from(sessionVal, "base64").toString("utf-8"));
    const found = initialAdminUsers.find(
      (u) => Number(u.id) === Number(parsed.id) && u.isActive
    );
    return found || null;
  } catch {
    return null;
  }
}

export function isSuperAdmin(user: AdminUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "Super Admin Master" ||
    user.role === "Super Admin" ||
    user.email?.toLowerCase() === "juan@onprotec.com" ||
    user.username?.toLowerCase() === "juan"
  );
}

export async function requireAdmin(): Promise<
  { user: AdminUser; errorResponse?: never } | { user?: never; errorResponse: NextResponse }
> {
  const user = await getAuthenticatedAdmin();
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Sesión administrativa requerida. Por favor inicia sesión en /admin.",
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}
