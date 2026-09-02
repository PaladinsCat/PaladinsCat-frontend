/**
 * Define the operations developer page responsibility boundary.
 * Coordinates operations developer page data loading, authorization, and presentation.
 * refs: none
 */
"use client";
import AdminDashboardPage from "@/app/admin/page";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 * refs: none
 */
export default function DeveloperDashboardPage() {
  return <AdminDashboardPage mode="developer" />;
}
