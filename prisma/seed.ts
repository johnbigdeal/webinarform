import { PrismaClient, Role, Plan } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@webinarform.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin-pass-123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, plan: Plan.PAID },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: Role.ADMIN,
      plan: Plan.PAID,
    },
  });

  // Demo user + form (only if no forms exist yet)
  const existingForms = await prisma.form.count();
  if (existingForms === 0) {
    const demoUser = await prisma.user.upsert({
      where: { email: "demo@webinarform.local" },
      update: {},
      create: {
        email: "demo@webinarform.local",
        name: "Demo User",
        passwordHash: await bcrypt.hash("demo-pass-123", 10),
        role: Role.USER,
        plan: Plan.FREE,
      },
    });

    const form = await prisma.form.create({
      data: {
        slug: "demo-webinar-" + Math.random().toString(36).slice(2, 6),
        ownerId: demoUser.id,
        title: { en: "Demo Webinar Registration", es: "Registro Demo Webinar" },
        description: {
          en: "Join our demo webinar. Fill in the form to register.",
          es: "Únete a nuestro webinar demo. Rellena el formulario para registrarte.",
        },
        submitLabel: { en: "Register", es: "Registrarse" },
        thankYou: { en: "Thanks! We'll be in touch.", es: "¡Gracias! Nos pondremos en contacto." },
        accentColor: "#2563eb",
        webhookEnabled: false,
        tags: { create: [{ tag: "webinar" }, { tag: "demo" }] },
        eventDays: {
          create: [
            {
              date: new Date("2026-07-10T09:00:00Z"),
              label: { en: "Day 1 — July 10", es: "Día 1 — 10 julio" },
              autoTag: "day-1",
              order: 0,
            },
            {
              date: new Date("2026-07-11T09:00:00Z"),
              label: { en: "Day 2 — July 11", es: "Día 2 — 11 julio" },
              autoTag: "day-2",
              order: 1,
            },
          ],
        },
        questions: {
          create: [
            {
              type: "TEXT",
              label: { en: "Name", es: "Nombre" },
              required: true,
              order: 0,
            },
            {
              type: "TEXT",
              label: { en: "Email", es: "Correo" },
              required: true,
              order: 1,
            },
            {
              type: "TEXT",
              label: { en: "Phone", es: "Teléfono" },
              required: false,
              order: 2,
            },
            {
              type: "CHOICE",
              label: { en: "How did you hear about us?", es: "¿Cómo nos conociste?" },
              required: true,
              order: 3,
              options: [
                { id: "o1", label: { en: "Social media", es: "Redes sociales" }, points: 0 },
                { id: "o2", label: { en: "Friend", es: "Amigo" }, points: 0 },
                { id: "o3", label: { en: "Search", es: "Buscador" }, points: 0 },
              ],
            },
            {
              type: "RATING",
              label: { en: "Rate your interest (1-5)", es: "Valora tu interés (1-5)" },
              required: true,
              order: 4,
              points: 0,
            },
          ],
        },
      },
    });

    console.log("Seeded demo form:", form.slug);
  }

  console.log("Seeded admin:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
