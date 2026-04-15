import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  website: text("website"),
  hasWebsite: integer("has_website", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
});

export const generatedSites = sqliteTable("generated_sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  htmlPath: text("html_path").notNull(),
  previewUrl: text("preview_url").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const outreach = sqliteTable("outreach", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  toEmail: text("to_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  sentAt: integer("sent_at"),
  createdAt: integer("created_at").notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type GeneratedSite = typeof generatedSites.$inferSelect;
export type Outreach = typeof outreach.$inferSelect;
