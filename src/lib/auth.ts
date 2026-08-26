import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { account, session, user, verification } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/server/email";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    // No esperar a que el correo salga antes de responder — evita filtrar por timing si el
    // correo existe o no. Sin RESEND_API_KEY configurada, sendPasswordResetEmail solo loguea
    // (ver src/server/email.ts), igual que bienvenida y confirmación de pago.
    sendResetPassword: async ({ user: resetUser, url }) => {
      sendPasswordResetEmail(resetUser.email, url).catch((err) =>
        console.error("No se pudo enviar el correo de recuperación de contraseña:", err),
      );
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: false,
        defaultValue: "estudiante",
      },
      identificationType: { type: "string", required: false },
      identificationNumber: { type: "string", required: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          sendWelcomeEmail(createdUser.email, createdUser.name).catch((err) =>
            console.error("No se pudo enviar el correo de bienvenida:", err),
          );
        },
      },
    },
  },
  plugins: [nextCookies()],
});
