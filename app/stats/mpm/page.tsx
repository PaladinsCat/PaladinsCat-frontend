import MetricDetailPage from "@/components/MetricDetailPage";

const CONFIG = {'key': 'mpm', 'label': 'Mitigation / Min', 'unit': '', 'stroke': '#60a5fa', 'fill': 'rgba(96,165,250,0.15)'};

export default function MPMPage() {
  return <MetricDetailPage config={CONFIG} />;
}
