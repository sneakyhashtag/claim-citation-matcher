import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { createPool } from "@vercel/postgres";
import bcrypt from "bcryptjs";

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
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const pool = createPool({ connectionString: process.env.POSTGRES_URL });
        const client = await pool.connect();
        try {
          const result = await client.query(
            "SELECT id, email, name, password_hash FROM users WHERE email = $1",
            [email.toLowerCase().trim()]
          );
          const user = result.rows[0];
          if (!user?.password_hash) return null;

          const valid = await bcrypt.compare(password, user.password_hash);
          if (!valid) return null;

          return { id: String(user.id), email: user.email, name: user.name };
        } finally {
          client.release();
          await pool.end();
        }
      },
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  session: { strategy: "jwt" },
  trustHost: true,
});
