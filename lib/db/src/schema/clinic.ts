import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

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
    branchId: integer("branch_id"),
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
    contact: text("contact").notNull().default(""),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
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

export const clinicAdminUsersTable = pgTable(
  "clinic_admin_users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clinic_admin_users_clerk_user_id_key").on(table.clerkUserId),
    index("clinic_admin_users_active_idx").on(table.isActive),
  ],
);

export type ClinicAdminUser = typeof clinicAdminUsersTable.$inferSelect;
export type NewClinicAdminUser = typeof clinicAdminUsersTable.$inferInsert;

export const clinicBranchesTable = pgTable(
  "clinic_branches",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    phone: text("phone").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email").notNull(),
    hours: text("hours").notNull(),
    sundayHours: text("sunday_hours").notNull(),
    mapUrl: text("map_url").notNull().default(""),
    imagePath: text("image_path"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clinic_branches_name_key").on(table.name),
    index("clinic_branches_active_name_idx").on(table.isActive, table.name),
  ],
);

export type ClinicBranch = typeof clinicBranchesTable.$inferSelect;
export type NewClinicBranch = typeof clinicBranchesTable.$inferInsert;

export const clinicTreatmentsTable = pgTable(
  "clinic_treatments",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    price: text("price").notNull(),
    icon: text("icon").notNull().default("Stethoscope"),
    imagePath: text("image_path"),
    isActive: boolean("is_active").notNull().default(true),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clinic_treatments_title_key").on(table.title),
    index("clinic_treatments_active_order_idx").on(table.isActive, table.displayOrder),
  ],
);

export const clinicMediaTable = pgTable(
  "clinic_media",
  {
    id: serial("id").primaryKey(),
    objectPath: text("object_path").notNull(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("clinic_media_object_path_key").on(table.objectPath),
    index("clinic_media_created_at_idx").on(table.createdAt),
  ],
);

export const clinicSettingsTable = pgTable("clinic_settings", {
  id: integer("id").primaryKey().default(1),
  clinicName: text("clinic_name").notNull(),
  phone: text("phone").notNull(),
  alternatePhone: text("alternate_phone").notNull().default(""),
  whatsapp: text("whatsapp").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  hours: text("hours").notNull(),
  sundayHours: text("sunday_hours").notNull(),
  socialInstagram: text("social_instagram").notNull().default(""),
  socialFacebook: text("social_facebook").notNull().default(""),
  mapUrl: text("map_url").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ClinicTreatment = typeof clinicTreatmentsTable.$inferSelect;
export type NewClinicTreatment = typeof clinicTreatmentsTable.$inferInsert;
export type ClinicMedia = typeof clinicMediaTable.$inferSelect;
export type NewClinicMedia = typeof clinicMediaTable.$inferInsert;
export type ClinicSettings = typeof clinicSettingsTable.$inferSelect;
export type NewClinicSettings = typeof clinicSettingsTable.$inferInsert;