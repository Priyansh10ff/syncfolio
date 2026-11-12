import { redirect } from "next/navigation";
import { getDashboardContext, isProfileEmpty } from "@/lib/dashboard";

export default async function DashboardIndex() {
  const { profile } = await getDashboardContext();
  redirect(isProfileEmpty(profile) ? "/dashboard/welcome" : "/dashboard/profile");
}
