import { getServerSession, Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}
