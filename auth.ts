import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

// ── Custom error codes surfaced to the sign-in page ──────────────────────────

class EmailNotFound extends CredentialsSignin {
  code = "EmailNotFound" as const;
}
class GoogleOnly extends CredentialsSignin {
  // Account exists but was created via Google — no password stored.
  code = "GoogleOnly" as const;
}
class WrongPassword extends CredentialsSignin {
  code = "WrongPassword" as const;
}

// ── Auth config ───────────────────────────────────────────────────────────────

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)
          ?.trim()
          .toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const result = await sql`
          SELECT id, email, name, password_hash
          FROM   users
          WHERE  email = ${email}
        `;
        const user = result.rows[0];

        if (!user) throw new EmailNotFound();
        if (!user.password_hash) throw new GoogleOnly();

        const valid = await bcrypt.compare(password, user.password_hash as string);
        if (!valid) throw new WrongPassword();

        return {
          id: String(user.id),
          email: user.email as string,
          name: user.name as string | null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
