import MetricDetailPage from "@/components/MetricDetailPage";

const CONFIG = {'key': 'hpm', 'label': 'Healing / Min', 'unit': '', 'stroke': '#34d399', 'fill': 'rgba(52,211,153,0.15)'};

export default function HPMPage() {
  return <MetricDetailPage config={CONFIG} />;
}
