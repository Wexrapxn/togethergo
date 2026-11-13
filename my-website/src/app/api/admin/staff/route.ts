import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all staff members and their permissions (ADMIN ONLY)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const staffRoles = await prisma.userRole.findMany({
      where: { role: "STAFF" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: true,
            roles: true,
          },
        },
      },
    });

    const assignments = await prisma.staffAssignment.findMany();

    const staffList = staffRoles.map((sr) => {
      const assignment = assignments.find((a) => a.userId === sr.userId);
      let permissions = [
        "VERIFY_ID",
        "VERIFY_SCREENING",
        "MANAGE_ACCOMMODATION",
        "HANDLE_EMERGENCY",
      ];
      if (assignment) {
        try {
          permissions = JSON.parse(assignment.permissions);
        } catch {
          // default
        }
      }
      return {
        ...sr.user,
        permissions,
      };
    });

    return NextResponse.json({ success: true, staff: staffList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Grant or revoke STAFF role (ADMIN ONLY)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, permissions } = body; // action: "GRANT" | "REVOKE" | "UPDATE_PERMISSIONS"

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    if (action === "GRANT") {
      // Add STAFF role
      await prisma.userRole.upsert({
        where: { userId_role: { userId: targetUserId, role: "STAFF" } },
        update: {},
        create: { userId: targetUserId, role: "STAFF" },
      });

      // Set default permissions
      const perms = permissions || [
        "VERIFY_ID",
        "VERIFY_SCREENING",
        "MANAGE_ACCOMMODATION",
        "HANDLE_EMERGENCY",
      ];
      await prisma.staffAssignment.upsert({
        where: { userId: targetUserId },
        update: { permissions: JSON.stringify(perms), grantedBy: user.username },
        create: {
          userId: targetUserId,
          grantedBy: user.username,
          permissions: JSON.stringify(perms),
        },
      });

      return NextResponse.json({ success: true, message: "Staff role granted" });
    }

    if (action === "REVOKE") {
      await prisma.userRole.deleteMany({
        where: { userId: targetUserId, role: "STAFF" },
      });
      await prisma.staffAssignment.deleteMany({
        where: { userId: targetUserId },
      });
      return NextResponse.json({ success: true, message: "Staff role revoked" });
    }

    if (action === "UPDATE_PERMISSIONS") {
      await prisma.staffAssignment.upsert({
        where: { userId: targetUserId },
        update: { permissions: JSON.stringify(permissions || []) },
        create: {
          userId: targetUserId,
          grantedBy: user.username,
          permissions: JSON.stringify(permissions || []),
        },
      });
      return NextResponse.json({ success: true, message: "Permissions updated" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
