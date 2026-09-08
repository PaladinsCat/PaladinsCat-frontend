/**
 * Render the /operations/developer route with `AdminDashboardPage`.
 * refs: none
 */
"use client";
import AdminDashboardPage from "@/app/admin/page";

/**
 * Render the /operations/developer route with `AdminDashboardPage`.
 * refs: none
 * I/O types: `none -> JSX.Element`.
 */
export default function DeveloperDashboardPage() {
  return <AdminDashboardPage mode="developer" />;
}
