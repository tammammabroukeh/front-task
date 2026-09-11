import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ROUTES } from "@/constants/routes";
import { loginSchema } from "@/schemas/LoginSchema";

/**
 * NextAuth v5 (Auth.js) configuration.
 *
 * FakeStoreAPI has no real authentication, so this uses a Credentials provider
 * validated against a single demo admin defined via environment variables
 * (ADMIN_EMAIL / ADMIN_PASSWORD). Sessions use the JWT strategy so the guard
 * can be enforced purely server-side via a cookie.
 */

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: ROUTES.ADMIN_LOGIN,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const adminEmail = process.env.ADMIN_EMAIL;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
          // Misconfiguration — never authenticate without configured credentials.
          return null;
        }

        const matches =
          email.toLowerCase() === adminEmail.toLowerCase() &&
          password === adminPassword;

        if (!matches) return null;

        return {
          id: "admin",
          name: "Administrator",
          email: adminEmail,
          role: "admin",
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.role = (user as { role?: string }).role ?? "admin";
      }
      return token;
    },
    session: ({ session, token }) => {
      if (session.user) {
        (session.user as { role?: string }).role =
          (token.role as string) ?? "admin";
      }
      return session;
    },
  },
});
