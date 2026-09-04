import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const configuredValues = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Sign in is required to access the admin panel." });
      return;
    }

    const adminUserIds = configuredValues(process.env.ADMIN_USER_IDS);
    const adminEmails = configuredValues(process.env.ADMIN_EMAILS);

    if (adminUserIds.length === 0 && adminEmails.length === 0) {
      res.status(503).json({
        error: "Admin access is not configured. Add ADMIN_EMAILS or ADMIN_USER_IDS to the server environment.",
      });
      return;
    }

    if (adminUserIds.includes(userId.toLowerCase())) {
      next();
      return;
    }

    if (adminEmails.length > 0) {
      const user = await clerkClient.users.getUser(userId);
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
      if (email && adminEmails.includes(email)) {
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