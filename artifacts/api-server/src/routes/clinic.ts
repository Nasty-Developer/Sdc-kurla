import { Router, type IRouter } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  appointmentStatusValues,
  appointmentsTable,
  clinicBranchesTable,
  clinicMediaTable,
  clinicSettingsTable,
  clinicTreatmentsTable,
  db,
  inquiriesTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";
import { objectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();

const appointmentSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(30),
  email: z.string().trim().email().max(160),
  age: z.coerce.number().int().min(1).max(120),
  treatment: z.string().trim().min(2).max(120),
  branchId: z.coerce.number().int().positive(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().trim().min(2).max(40),
  message: z.string().trim().max(500).default(""),
});

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(10).max(30),
  message: z.string().trim().min(2).max(1000),
});

const idSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(appointmentStatusValues);
const appointmentScheduleSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.enum(["6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"]),
});
const treatmentSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  price: z.string().trim().min(1).max(40),
  icon: z.string().trim().min(1).max(40).default("Stethoscope"),
  imagePath: z.string().trim().startsWith("/objects/").nullable().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
const settingsSchema = z.object({
  clinicName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160),
  address: z.string().trim().min(5).max(300),
  hours: z.string().trim().min(2).max(120),
  sundayHours: z.string().trim().min(2).max(120),
  socialInstagram: z.string().trim().max(300).default(""),
  socialFacebook: z.string().trim().max(300).default(""),
  mapUrl: z.string().trim().max(500).default(""),
});
const mediaSchema = z.object({
  objectPath: z.string().trim().startsWith("/objects/"),
  originalName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().regex(/^image\/(jpeg|png|webp|gif)$/),
  size: z.coerce.number().int().positive().max(10 * 1024 * 1024),
});
const branchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(300),
  phone: z.string().trim().min(7).max(30),
  whatsapp: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160),
  hours: z.string().trim().min(2).max(120),
  sundayHours: z.string().trim().min(2).max(120),
  mapUrl: z.string().trim().max(500).default(""),
  imagePath: z.string().trim().startsWith("/objects/").nullable().optional(),
  isActive: z.boolean().default(true),
});

router.get("/branches", async (_req, res) => {
  try {
    const branches = await db
      .select()
      .from(clinicBranchesTable)
      .where(eq(clinicBranchesTable.isActive, true))
      .orderBy(asc(clinicBranchesTable.name));
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ error: "Unable to load clinic branches." });
  }
});

router.get("/treatments", async (_req, res) => {
  try {
    const treatments = await db
      .select()
      .from(clinicTreatmentsTable)
      .where(eq(clinicTreatmentsTable.isActive, true))
      .orderBy(asc(clinicTreatmentsTable.displayOrder), asc(clinicTreatmentsTable.title));
    res.json({ treatments });
  } catch (error) {
    res.status(500).json({ error: "Unable to load treatments." });
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const [settings] = await db.select().from(clinicSettingsTable).limit(1);
    if (!settings) {
      res.status(404).json({ error: "Clinic settings are not configured." });
      return;
    }
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: "Unable to load clinic settings." });
  }
});

router.post("/appointments", async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the appointment details and try again." });
    return;
  }

  try {
    const [branch] = await db
      .select({ id: clinicBranchesTable.id })
      .from(clinicBranchesTable)
      .where(and(eq(clinicBranchesTable.id, parsed.data.branchId), eq(clinicBranchesTable.isActive, true)));
    if (!branch) {
      res.status(400).json({ error: "Please choose an available clinic branch." });
      return;
    }
    const [appointment] = await db
      .insert(appointmentsTable)
      .values({
        patientName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        age: parsed.data.age,
        treatment: parsed.data.treatment,
        branchId: parsed.data.branchId,
        appointmentDate: parsed.data.preferredDate,
        appointmentTime: parsed.data.preferredTime,
        notes: parsed.data.message,
      })
      .returning();

    res.status(201).json({ appointment });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to save appointment");
    res.status(500).json({ error: "We could not save your appointment. Please try again." });
  }
});

router.post("/inquiries", async (req, res) => {
  const parsed = inquirySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check your message details and try again." });
    return;
  }

  try {
    const [inquiry] = await db
      .insert(inquiriesTable)
      .values(parsed.data)
      .returning();
    res.status(201).json({ inquiry });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to save inquiry");
    res.status(500).json({ error: "We could not save your message. Please try again." });
  }
});

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
  try {
    const [appointments, inquiries, activeTreatments] = await Promise.all([
      db.select().from(appointmentsTable).orderBy(desc(appointmentsTable.submittedAt)),
      db.select().from(inquiriesTable).orderBy(desc(inquiriesTable.submittedAt)),
      db.select({ id: clinicTreatmentsTable.id }).from(clinicTreatmentsTable).where(eq(clinicTreatmentsTable.isActive, true)),
    ]);

    const counts = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter((item) => item.status === "pending").length,
      confirmedAppointments: appointments.filter((item) => item.status === "confirmed").length,
      completedAppointments: appointments.filter((item) => item.status === "completed").length,
      cancelledAppointments: appointments.filter((item) => item.status === "cancelled").length,
      totalInquiries: inquiries.length,
      unreadInquiries: inquiries.filter((item) => !item.isRead).length,
      activeTreatments: activeTreatments.length,
    };

    const recentActivity = [
      ...appointments.map((item) => ({
        type: "appointment" as const,
        id: item.id,
        title: `${item.patientName} requested ${item.treatment}`,
        detail: `${item.appointmentDate} · ${item.appointmentTime}`,
        status: item.status,
        createdAt: item.submittedAt,
      })),
      ...inquiries.map((item) => ({
        type: "inquiry" as const,
        id: item.id,
        title: `${item.name} sent a message`,
        detail: `${item.email} · ${item.phone}`,
        status: item.isRead ? "read" : "unread",
        createdAt: item.submittedAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 8);

    res.json({ counts, recentActivity });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to load admin dashboard");
    res.status(500).json({ error: "Unable to load the dashboard." });
  }
});

router.get("/admin/appointments", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status ? statusSchema.safeParse(req.query.status) : null;
    if (status && !status.success) {
      res.status(400).json({ error: "Invalid appointment status." });
      return;
    }

    const appointments = await db
      .select()
      .from(appointmentsTable)
      .where(status?.success ? eq(appointmentsTable.status, status.data) : undefined)
      .orderBy(desc(appointmentsTable.submittedAt));
    res.json({ appointments });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to load appointments");
    res.status(500).json({ error: "Unable to load appointments." });
  }
});

router.patch("/admin/appointments/:id/status", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const status = statusSchema.safeParse(req.body?.status);
  if (!id.success || !status.success) {
    res.status(400).json({ error: "Invalid appointment update." });
    return;
  }

  try {
    const [appointment] = await db
      .update(appointmentsTable)
      .set({ status: status.data, updatedAt: new Date() })
      .where(eq(appointmentsTable.id, id.data))
      .returning();
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found." });
      return;
    }
    res.json({ appointment });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to update appointment");
    res.status(500).json({ error: "Unable to update appointment." });
  }
});

router.patch("/admin/appointments/:id/schedule", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const schedule = appointmentScheduleSchema.safeParse(req.body);
  if (!id.success || !schedule.success) {
    res.status(400).json({ error: "Choose a valid future date and clinic appointment time." });
    return;
  }
  const selectedDate = new Date(`${schedule.data.appointmentDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
    res.status(400).json({ error: "Appointments must be scheduled for today or a future date." });
    return;
  }
  try {
    const [appointment] = await db
      .update(appointmentsTable)
      .set({ ...schedule.data, updatedAt: new Date() })
      .where(eq(appointmentsTable.id, id.data))
      .returning();
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found." });
      return;
    }
    res.json({ appointment });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to reschedule appointment");
    res.status(500).json({ error: "Unable to reschedule appointment." });
  }
});

router.delete("/admin/appointments/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid appointment." });
    return;
  }

  try {
    const [appointment] = await db
      .delete(appointmentsTable)
      .where(eq(appointmentsTable.id, id.data))
      .returning();
    if (!appointment) {
      res.status(404).json({ error: "Appointment not found." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    req.log?.error({ err: error }, "Unable to delete appointment");
    res.status(500).json({ error: "Unable to delete appointment." });
  }
});

router.get("/admin/inquiries", requireAdmin, async (req, res) => {
  try {
    const inquiries = await db
      .select()
      .from(inquiriesTable)
      .orderBy(desc(inquiriesTable.submittedAt));
    res.json({ inquiries });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to load inquiries");
    res.status(500).json({ error: "Unable to load inquiries." });
  }
});

router.patch("/admin/inquiries/:id/read", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid inquiry." });
    return;
  }

  try {
    const [inquiry] = await db
      .update(inquiriesTable)
      .set({ isRead: true, updatedAt: new Date() })
      .where(and(eq(inquiriesTable.id, id.data), eq(inquiriesTable.isRead, false)))
      .returning();
    if (!inquiry) {
      const [existing] = await db.select().from(inquiriesTable).where(eq(inquiriesTable.id, id.data));
      if (!existing) {
        res.status(404).json({ error: "Inquiry not found." });
        return;
      }
      res.json({ inquiry: existing });
      return;
    }
    res.json({ inquiry });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to update inquiry");
    res.status(500).json({ error: "Unable to update inquiry." });
  }
});

router.patch("/admin/inquiries/:id/unread", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid inquiry." });
    return;
  }

  try {
    const [inquiry] = await db
      .update(inquiriesTable)
      .set({ isRead: false, updatedAt: new Date() })
      .where(eq(inquiriesTable.id, id.data))
      .returning();
    if (!inquiry) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.json({ inquiry });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to mark inquiry unread");
    res.status(500).json({ error: "Unable to mark inquiry unread." });
  }
});

router.delete("/admin/inquiries/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid inquiry." });
    return;
  }

  try {
    const [inquiry] = await db
      .delete(inquiriesTable)
      .where(eq(inquiriesTable.id, id.data))
      .returning();
    if (!inquiry) {
      res.status(404).json({ error: "Inquiry not found." });
      return;
    }
    res.status(204).send();
  } catch (error) {
    req.log?.error({ err: error }, "Unable to delete inquiry");
    res.status(500).json({ error: "Unable to delete inquiry." });
  }
});

router.get("/admin/treatments", requireAdmin, async (_req, res) => {
  try {
    const treatments = await db.select().from(clinicTreatmentsTable).orderBy(asc(clinicTreatmentsTable.displayOrder), asc(clinicTreatmentsTable.title));
    res.json({ treatments });
  } catch (error) {
    res.status(500).json({ error: "Unable to load treatments." });
  }
});

router.post("/admin/treatments", requireAdmin, async (req, res) => {
  const parsed = treatmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the treatment details." });
    return;
  }
  try {
    const [treatment] = await db.insert(clinicTreatmentsTable).values(parsed.data).returning();
    res.status(201).json({ treatment });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to create treatment");
    res.status(500).json({ error: "Unable to create treatment. Titles must be unique." });
  }
});

router.patch("/admin/treatments/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const parsed = treatmentSchema.partial().safeParse(req.body);
  if (!id.success || !parsed.success) {
    res.status(400).json({ error: "Please check the treatment details." });
    return;
  }
  try {
    const [existing] = await db.select({ imagePath: clinicTreatmentsTable.imagePath }).from(clinicTreatmentsTable).where(eq(clinicTreatmentsTable.id, id.data));
    const [treatment] = await db.update(clinicTreatmentsTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(clinicTreatmentsTable.id, id.data))
      .returning();
    if (!treatment) {
      res.status(404).json({ error: "Treatment not found." });
      return;
    }
    if (existing?.imagePath && existing.imagePath !== treatment.imagePath) {
      await objectStorageService.delete(existing.imagePath).catch(() => undefined);
      await db.delete(clinicMediaTable).where(eq(clinicMediaTable.objectPath, existing.imagePath));
    }
    res.json({ treatment });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to update treatment");
    res.status(500).json({ error: "Unable to update treatment." });
  }
});

router.delete("/admin/treatments/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid treatment." });
    return;
  }
  try {
    const [treatment] = await db.delete(clinicTreatmentsTable).where(eq(clinicTreatmentsTable.id, id.data)).returning();
    if (!treatment) {
      res.status(404).json({ error: "Treatment not found." });
      return;
    }
    if (treatment.imagePath) {
      await objectStorageService.delete(treatment.imagePath).catch(() => undefined);
    }
    res.status(204).send();
  } catch (error) {
    req.log?.error({ err: error }, "Unable to delete treatment");
    res.status(500).json({ error: "Unable to delete treatment." });
  }
});

router.get("/admin/media", requireAdmin, async (_req, res) => {
  try {
    const media = await db.select().from(clinicMediaTable).orderBy(desc(clinicMediaTable.createdAt));
    res.json({ media });
  } catch (error) {
    res.status(500).json({ error: "Unable to load media." });
  }
});

router.post("/admin/media", requireAdmin, async (req, res) => {
  const parsed = mediaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the uploaded image details." });
    return;
  }
  try {
    const [media] = await db.insert(clinicMediaTable).values(parsed.data).returning();
    res.status(201).json({ media });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to save media");
    res.status(500).json({ error: "Unable to save uploaded image." });
  }
});

router.delete("/admin/media/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid media item." });
    return;
  }
  try {
    const [media] = await db.delete(clinicMediaTable).where(eq(clinicMediaTable.id, id.data)).returning();
    if (!media) {
      res.status(404).json({ error: "Media item not found." });
      return;
    }
    await objectStorageService.delete(media.objectPath).catch(() => undefined);
    res.status(204).send();
  } catch (error) {
    req.log?.error({ err: error }, "Unable to delete media");
    res.status(500).json({ error: "Unable to delete media." });
  }
});

router.get("/admin/branches", requireAdmin, async (_req, res) => {
  try {
    const branches = await db.select().from(clinicBranchesTable).orderBy(asc(clinicBranchesTable.name));
    res.json({ branches });
  } catch (error) {
    res.status(500).json({ error: "Unable to load clinic branches." });
  }
});

router.post("/admin/branches", requireAdmin, async (req, res) => {
  const parsed = branchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the branch details." });
    return;
  }
  try {
    const [branch] = await db.insert(clinicBranchesTable).values(parsed.data).returning();
    res.status(201).json({ branch });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to create branch");
    res.status(500).json({ error: "Unable to create branch. Branch names must be unique." });
  }
});

router.patch("/admin/branches/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  const parsed = branchSchema.partial().safeParse(req.body);
  if (!id.success || !parsed.success) {
    res.status(400).json({ error: "Please check the branch details." });
    return;
  }
  try {
    const [existing] = await db.select({ imagePath: clinicBranchesTable.imagePath }).from(clinicBranchesTable).where(eq(clinicBranchesTable.id, id.data));
    const [branch] = await db.update(clinicBranchesTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(clinicBranchesTable.id, id.data))
      .returning();
    if (!branch) {
      res.status(404).json({ error: "Branch not found." });
      return;
    }
    if (existing?.imagePath && existing.imagePath !== branch.imagePath) {
      await objectStorageService.delete(existing.imagePath).catch(() => undefined);
      await db.delete(clinicMediaTable).where(eq(clinicMediaTable.objectPath, existing.imagePath));
    }
    res.json({ branch });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to update branch");
    res.status(500).json({ error: "Unable to update branch." });
  }
});

router.delete("/admin/branches/:id", requireAdmin, async (req, res) => {
  const id = idSchema.safeParse(req.params.id);
  if (!id.success) {
    res.status(400).json({ error: "Invalid branch." });
    return;
  }
  try {
    const [branch] = await db.select().from(clinicBranchesTable).where(eq(clinicBranchesTable.id, id.data));
    if (!branch) {
      res.status(404).json({ error: "Branch not found." });
      return;
    }
    await db.update(appointmentsTable).set({ branchId: null, updatedAt: new Date() }).where(eq(appointmentsTable.branchId, id.data));
    await db.delete(clinicBranchesTable).where(eq(clinicBranchesTable.id, id.data));
    if (branch.imagePath) {
      await objectStorageService.delete(branch.imagePath).catch(() => undefined);
    }
    res.status(204).send();
  } catch (error) {
    req.log?.error({ err: error }, "Unable to delete branch");
    res.status(500).json({ error: "Unable to delete branch." });
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  const [settings] = await db.select().from(clinicSettingsTable).limit(1);
  if (!settings) {
    res.status(404).json({ error: "Clinic settings are not configured." });
    return;
  }
  res.json({ settings });
});

router.patch("/admin/settings", requireAdmin, async (req, res) => {
  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the clinic settings." });
    return;
  }
  try {
    const [existing] = await db.select().from(clinicSettingsTable).limit(1);
    const [settings] = existing
      ? await db.update(clinicSettingsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(clinicSettingsTable.id, existing.id)).returning()
      : await db.insert(clinicSettingsTable).values({ id: 1, ...parsed.data }).returning();
    res.json({ settings });
  } catch (error) {
    req.log?.error({ err: error }, "Unable to update clinic settings");
    res.status(500).json({ error: "Unable to update clinic settings." });
  }
});

export default router;