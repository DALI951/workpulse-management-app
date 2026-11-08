import { redirect } from "next/navigation";
import { getSessionUser, ensureAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureAdminUser();
  const session = await getSessionUser();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN") {
    redirect("/admin/dashboard");
  } else {
    redirect("/collaborator/projects");
  }
}
