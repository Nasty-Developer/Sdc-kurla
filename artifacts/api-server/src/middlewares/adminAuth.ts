import { clerkClient, getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { clinicAdminUsersTable, db } from "@workspace/db";
import type { RequestHandler } from "express";

const configuredValues = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
      res.status(503).json({
        error: "Admin authentication is not configured for this deployment.",
      });
      return;
    }

    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in is required to access the admin panel." });
      return;
    }

    const adminUserIds = configuredValues(process.env.ADMIN_USER_IDS);
    const adminEmails = configuredValues(process.env.ADMIN_EMAILS);
    const existingAdmin = await db
      .select()
      .from(clinicAdminUsersTable)
      .where(eq(clinicAdminUsersTable.clerkUserId, userId))
      .limit(1);

    if (existingAdmin[0]?.isActive) {
      next();
      return;
    }

    if (existingAdmin[0] && !existingAdmin[0].isActive) {
      res.status(403).json({ error: "This account is not authorized for the admin panel." });
      return;
    }

    if (adminUserIds.length === 0 && adminEmails.length === 0) {
      res.status(503).json({
        error: "Admin access is not configured. Add ADMIN_EMAILS or ADMIN_USER_IDS to the server environment.",
      });
      return;
    }

    const isIdAllowed = adminUserIds.includes(userId.toLowerCase());
    let email = "";
    if (adminEmails.length > 0 || isIdAllowed) {
      const user = await clerkClient.users.getUser(userId);
      const userEmails = user.emailAddresses
        .map((address) => address.emailAddress.trim().toLowerCase())
        .filter(Boolean);
      email = (user.primaryEmailAddress?.emailAddress ?? userEmails[0] ?? "").trim().toLowerCase();
      const isEmailAllowed = userEmails.some((address) => adminEmails.includes(address));

      if (isIdAllowed || isEmailAllowed) {
        await db
          .insert(clinicAdminUsersTable)
          .values({
            clerkUserId: userId,
            email,
            isActive: true,
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: clinicAdminUsersTable.clerkUserId,
            set: { email, isActive: true, updatedAt: new Date() },
          });
        next();
        return;
      }
    }

    res.status(403).json({ error: "This account is not authorized for the admin panel." });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to verify admin access");
    res.status(401).json({ error: "Unable to verify your admin session." });
  }
};