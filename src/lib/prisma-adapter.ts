import type { Adapter, AdapterAccount, AdapterUser, AdapterSession } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";

export function PrismaAdapter(): Adapter {
  return {
    async createUser(data: Omit<AdapterUser, "id">) {
      console.log("Creating user with data:", data);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return user as AdapterUser;
    },

    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { id } });
      return (user as AdapterUser) ?? null;
    },

    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      return (user as AdapterUser) ?? null;
    },

    async getUserByAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return (account?.user as AdapterUser) ?? null;
    },

    async updateUser(data: Partial<AdapterUser> & Pick<AdapterUser, "id">) {
      const user = await prisma.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          email: data.email,
          image: data.image,
          emailVerified: data.emailVerified,
        },
      });
      return user as AdapterUser;
    },

    async deleteUser(id: string) {
      await prisma.user.delete({ where: { id } });
    },

    async linkAccount(data: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          refresh_token: data.refresh_token ?? null,
          access_token: data.access_token ?? null,
          expires_at: data.expires_at ?? null,
          token_type: data.token_type ?? null,
          scope: data.scope ?? null,
          id_token: data.id_token ?? null,
          session_state: (data.session_state as string) ?? null,
        },
      });
    },

    async unlinkAccount({
      provider,
      providerAccountId,
    }: {
      provider: string;
      providerAccountId: string;
    }) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createSession(data: {
      sessionToken: string;
      userId: string;
      expires: Date;
    }) {
      const session = await prisma.session.create({ data });
      return session as AdapterSession;
    },

    async getSessionAndUser(sessionToken: string) {
      const result = await prisma.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!result) return null;
      return {
        session: result as AdapterSession,
        user: result.user as AdapterUser,
      };
    },

    async updateSession(
      data: Partial<AdapterSession> & Pick<AdapterSession, "sessionToken">
    ) {
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data,
      });
      return session as AdapterSession;
    },

    async deleteSession(sessionToken: string) {
      await prisma.session.delete({ where: { sessionToken } });
    },

    async createVerificationToken(data: {
      identifier: string;
      token: string;
      expires: Date;
    }) {
      const token = await prisma.verificationToken.create({ data });
      return token;
    },

    async useVerificationToken({
      identifier,
      token,
    }: {
      identifier: string;
      token: string;
    }) {
      try {
        const result = await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
        return result;
      } catch {
        return null;
      }
    },
  };
}
