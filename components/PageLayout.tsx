export default function PageLayout({ children }: { children: React.ReactNode }) {
  // Keep the route wrapper server-renderable. The old implementation scanned
  // every heading/card after hydration and forced layout once per element to
  // restart entrance animations. That hid already-rendered LCP candidates and
  // created a large main-thread task on slower devices.
  return <div>{children}</div>;
}
