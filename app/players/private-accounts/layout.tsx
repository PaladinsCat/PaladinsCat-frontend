import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Private Paladins Accounts",
  description: "Browse pseudonymous private Paladins accounts observed in match data, including account level, mastery, rank, and observation history.",
  alternates: { canonical: "/players/private-accounts" },
};

export default function PrivateAccountsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
