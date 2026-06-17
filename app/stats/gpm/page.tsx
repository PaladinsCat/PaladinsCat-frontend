import MetricDetailPage from "@/components/MetricDetailPage";

const CONFIG = {'key': 'gpm', 'label': 'Gold / Min', 'unit': '', 'stroke': '#facc15', 'fill': 'rgba(250,204,21,0.15)'};

export default function GPMPage() {
  return <MetricDetailPage config={CONFIG} />;
}
