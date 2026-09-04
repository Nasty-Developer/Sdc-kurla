import { boolean, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const appointmentStatusValues = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type AppointmentStatus = (typeof appointmentStatusValues)[number];

export const appointmentsTable = pgTable(
  "clinic_appointments",
  {
    id: serial("id").primaryKey(),
    patientName: text("patient_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    age: integer("age").notNull(),
    treatment: text("treatment").notNull(),
    appointmentDate: text("appointment_date").notNull(),
    appointmentTime: text("appointment_time").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status").notNull().default("pending"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("clinic_appointments_status_idx").on(table.status),
    index("clinic_appointments_submitted_at_idx").on(table.submittedAt),
  ],
);

export const inquiriesTable = pgTable(
  "clinic_inquiries",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    contact: text("contact").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("clinic_inquiries_read_idx").on(table.isRead),
    index("clinic_inquiries_submitted_at_idx").on(table.submittedAt),
  ],
);

export type Appointment = typeof appointmentsTable.$inferSelect;
export type NewAppointment = typeof appointmentsTable.$inferInsert;
export type Inquiry = typeof inquiriesTable.$inferSelect;
export type NewInquiry = typeof inquiriesTable.$inferInsert;