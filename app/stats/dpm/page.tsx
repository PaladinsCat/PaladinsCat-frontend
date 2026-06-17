import MetricDetailPage from "@/components/MetricDetailPage";

const CONFIG = {'key': 'dpm', 'label': 'Damage / Min', 'unit': '', 'stroke': '#f87171', 'fill': 'rgba(248,113,113,0.15)'};

export default function DPMPage() {
  return <MetricDetailPage config={CONFIG} />;
}
