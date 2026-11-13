import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = params;
    const body = await req.json();
    const { action, roleId, roleName, description, targetUserId } = body;
    // action: "ADD" | "DELETE" | "CLAIM" | "UNCLAIM" | "ASSIGN"

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true, roles: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const isCreator = trip.creatorId === user.id;
    const isMember = trip.members.some(
      (m) => m.userId === user.id && (m.status === "APPROVED" || m.status === "PAID")
    );

    if (action === "ADD") {
      if (!isCreator) {
        return NextResponse.json({ error: "Only trip creator can add roles" }, { status: 403 });
      }
      if (!roleName) {
        return NextResponse.json({ error: "Role name is required" }, { status: 400 });
      }

      const newRole = await prisma.tripRole.create({
        data: {
          tripId,
          roleName: roleName.trim(),
          description: description?.trim() || null,
        },
      });
      return NextResponse.json({ success: true, role: newRole });
    }

    if (action === "DELETE") {
      if (!isCreator) {
        return NextResponse.json({ error: "Only trip creator can delete roles" }, { status: 403 });
      }
      await prisma.tripRole.delete({
        where: { id: roleId },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "CLAIM") {
      if (!isMember && !isCreator) {
        return NextResponse.json({ error: "Only approved trip members can claim roles" }, { status: 403 });
      }

      const role = await prisma.tripRole.findUnique({ where: { id: roleId } });
      if (!role || role.tripId !== tripId) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      if (role.userId && role.userId !== user.id) {
        return NextResponse.json({ error: "Role is already claimed by someone else" }, { status: 400 });
      }

      await prisma.tripRole.update({
        where: { id: roleId },
        data: { userId: user.id },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "UNCLAIM") {
      const role = await prisma.tripRole.findUnique({ where: { id: roleId } });
      if (!role || role.tripId !== tripId) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      if (role.userId !== user.id && !isCreator) {
        return NextResponse.json({ error: "Cannot unclaim another member's role" }, { status: 403 });
      }

      await prisma.tripRole.update({
        where: { id: roleId },
        data: { userId: null },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "ASSIGN") {
      if (!isCreator) {
        return NextResponse.json({ error: "Only trip creator can assign roles" }, { status: 403 });
      }

      await prisma.tripRole.update({
        where: { id: roleId },
        data: { userId: targetUserId || null },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Trip role error:", error);
    return NextResponse.json({ error: error.message || "Failed to manage role" }, { status: 500 });
  }
}
