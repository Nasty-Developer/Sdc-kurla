import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  appointmentStatusValues,
  appointmentsTable,
  db,
  inquiriesTable,
} from "@workspace/db";
import { requireAdmin } from "../middlewares/adminAuth";

const router: IRouter = Router();

const treatmentOptions = [
  { title: "Dental Checkup", price: "₹100", copy: "Complete oral examination and consultation." },
  { title: "Teeth Cleaning", price: "₹500", copy: "Professional scaling and polishing to remove plaque." },
  { title: "Tooth Extraction", price: "₹500", copy: "Safe and painless removal of damaged teeth." },
  { title: "Root Canal Treatment", price: "₹3000", copy: "Advanced endodontic therapy to save infected teeth." },
  { title: "Dental Filling", price: "₹500", copy: "Tooth-colored composite restorations for cavities." },
  { title: "Teeth Whitening", price: "₹3000", copy: "Advanced bleaching for a brighter, confident smile." },
  { title: "Braces / Orthodontics", price: "₹20000", copy: "Straighten your teeth and correct your bite." },
  { title: "Dental Crown", price: "₹1500", copy: "Ceramic caps to restore tooth shape and strength." },
  { title: "Dental Implant", price: "₹10000", copy: "Permanent replacement for missing teeth." },
  { title: "Pediatric Dentistry", price: "₹300", copy: "Specialized, gentle dental care for children." },
  { title: "Dentures And RPD", price: "₹1500", copy: "Removable bridge replacing missing teeth and gaps." },
] as const;

const appointmentSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(30),
  email: z.string().trim().email().max(160),
  age: z.coerce.number().int().min(1).max(120),
  treatment: z.string().trim().min(2).max(120),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferredTime: z.string().trim().min(2).max(40),
  message: z.string().trim().max(500).default(""),
});

const inquirySchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().min(3).max(160),
  message: z.string().trim().min(2).max(1000),
});

const idSchema = z.coerce.number().int().positive();
const statusSchema = z.enum(appointmentStatusValues);

router.post("/appointments", async (req, res) => {
  const parsed = appointmentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the appointment details and try again." });
    return;
  }

  try {
    const [appointment] = await db
      .insert(appointmentsTable)
      .values({
        patientName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email,
        age: parsed.data.age,
        treatment: parsed.data.treatment,
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
    const [appointments, inquiries] = await Promise.all([
      db.select().from(appointmentsTable).orderBy(desc(appointmentsTable.submittedAt)),
      db.select().from(inquiriesTable).orderBy(desc(inquiriesTable.submittedAt)),
    ]);

    const counts = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter((item) => item.status === "pending").length,
      confirmedAppointments: appointments.filter((item) => item.status === "confirmed").length,
      completedAppointments: appointments.filter((item) => item.status === "completed").length,
      cancelledAppointments: appointments.filter((item) => item.status === "cancelled").length,
      totalInquiries: inquiries.length,
      unreadInquiries: inquiries.filter((item) => !item.isRead).length,
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
        detail: item.contact,
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

router.get("/admin/treatments", requireAdmin, (_req, res) => {
  res.json({ treatments: treatmentOptions });
});

export default router;