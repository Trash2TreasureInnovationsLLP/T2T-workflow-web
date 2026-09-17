import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  // Route normal employees or interns directly to their personal workspace or dashboard
  if (user.role === "EMPLOYEE" || user.role === "INTERN") {
    redirect("/my-work");
  }

  redirect("/dashboard");
}
