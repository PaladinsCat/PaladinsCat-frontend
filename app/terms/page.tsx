export default function TermsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-pc-accent">Terms of Use</h1>
      <div className="bg-pc-bg-elevated rounded-lg border border-pc-border p-6 space-y-4 text-pc-text-secondary">
        <p>Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <h2 className="text-xl font-semibold text-pc-text">1. Acceptance of Terms</h2>
        <p>
          By accessing or using PaladinsCat, you agree to be bound by these Terms of Use.
          If you do not agree, do not use the service.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">2. Use of the Service</h2>
        <p>
          PaladinsCat provides stats and analytics for the game Paladins. The data is provided
          for informational purposes only. We make no guarantees regarding the accuracy or
          completeness of the data displayed.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">3. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials
          and for all activity that occurs under your account.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">4. Intellectual Property</h2>
        <p>
          All Paladins game content, including champion names, images, and assets, are property
          of Hi-Rez Studios. PaladinsCat is a fan-made project and is not affiliated with or
          endorsed by Hi-Rez Studios.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">5. Limitation of Liability</h2>
        <p>
          PaladinsCat is provided &ldquo;as is&rdquo; without warranties of any kind. We shall not be
          liable for any damages arising from the use of this service.
        </p>

        <h2 className="text-xl font-semibold text-pc-text">6. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the updated terms.
        </p>
      </div>
    </div>
  );
}
