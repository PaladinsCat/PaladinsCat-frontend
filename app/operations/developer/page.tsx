/**
 * Define the operations developer page responsibility boundary.
 * Coordinates operations developer page data loading, authorization, and presentation.
 */
"use client";
import AdminDashboardPage from "@/app/admin/page";

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns the declared route value; request, cache, and navigation effects follow the implementation.
 */
export default function DeveloperDashboardPage() {
  return <AdminDashboardPage mode="developer" />;
}
