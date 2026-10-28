import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { initialAdminUsers, persistDataset } from "@/lib/mockData";

const SESSION_COOKIE = "onprotec_admin_session";

function sanitizeUser(u: any) {
  const { password, ...rest } = u;
  return rest;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const listAll = searchParams.get("list") === "true";

    if (listAll) {
      return NextResponse.json({
        success: true,
        data: initialAdminUsers.map(sanitizeUser),
      });
    }

    const cookieStore = await cookies();
    const sessionVal = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionVal) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    try {
      const parsed = JSON.parse(Buffer.from(sessionVal, "base64").toString("utf-8"));
      const found = initialAdminUsers.find(
        (u) => Number(u.id) === Number(parsed.id) && u.isActive
      );
      if (!found) {
        return NextResponse.json({ success: true, authenticated: false, user: null });
      }
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: sanitizeUser(found),
      });
    } catch {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, identifier, password, username, email, name, role, department } = body;

    // Acción 1: Crear nuevo usuario administrativo
    if (action === "create") {
      if (!username || !email || !name || !password) {
        return NextResponse.json(
          { success: false, error: "Todos los campos son obligatorios para crear la credencial." },
          { status: 400 }
        );
      }

      const exists = initialAdminUsers.some(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === email.toLowerCase()
      );
      if (exists) {
        return NextResponse.json(
          { success: false, error: "El usuario o correo electrónico ya está registrado." },
          { status: 400 }
        );
      }

      const maxId = initialAdminUsers.reduce((m, u) => Math.max(m, Number(u.id) || 0), 0);
      const newUser = {
        id: maxId + 1,
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: (role as any) || "Coordinador de Sala",
        department: department || "OnProtec Capacitaciones",
        password,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date().toISOString(),
      };

      initialAdminUsers.push(newUser);
      await persistDataset();

      return NextResponse.json({
        success: true,
        data: sanitizeUser(newUser),
        message: "Credencial administrativa creada exitosamente.",
      });
    }

    // Acción 2: Iniciar Sesión (Login)
    const cleanId = (identifier || "").trim().toLowerCase();
    const user = initialAdminUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanId || u.email.toLowerCase() === cleanId) &&
        u.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciales inválidas. Verifique su usuario/correo y contraseña de OnProtec.",
        },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Esta credencial administrativa se encuentra desactivada.",
        },
        { status: 403 }
      );
    }

    user.lastLoginAt = new Date().toISOString();
    await persistDataset();

    const tokenPayload = Buffer.from(
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
      })
    ).toString("base64");

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, tokenPayload, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return NextResponse.json({
      success: true,
      user: sanitizeUser(user),
      message: `Bienvenido a OnProtec Capacitaciones, ${user.name}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, username, email, role, department, password, isActive } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID requerido" }, { status: 400 });
    }

    const idx = initialAdminUsers.findIndex((u) => Number(u.id) === Number(id));
    if (idx === -1) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const current = initialAdminUsers[idx];
    const updated = {
      ...current,
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username: username.trim().toLowerCase() }),
      ...(email !== undefined && { email: email.trim().toLowerCase() }),
      ...(role !== undefined && { role }),
      ...(department !== undefined && { department }),
      ...(password !== undefined && password.trim() !== "" && { password }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    };

    initialAdminUsers[idx] = updated;
    await persistDataset();

    return NextResponse.json({
      success: true,
      data: sanitizeUser(updated),
      message: "Credencial actualizada correctamente.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (idParam) {
      const idx = initialAdminUsers.findIndex((u) => String(u.id) === idParam);
      if (idx === -1) {
        return NextResponse.json(
          { success: false, error: "Credencial no encontrada" },
          { status: 404 }
        );
      }
      if (initialAdminUsers.length <= 1) {
        return NextResponse.json(
          { success: false, error: "Debe existir al menos un administrador activo." },
          { status: 400 }
        );
      }
      initialAdminUsers.splice(idx, 1);
      await persistDataset();
      return NextResponse.json({ success: true, message: "Credencial eliminada." });
    }

    // Cerrar sesión
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
    return NextResponse.json({ success: true, message: "Sesión cerrada." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
