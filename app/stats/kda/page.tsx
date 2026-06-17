import MetricDetailPage from "@/components/MetricDetailPage";

const CONFIG = {'key': 'kda', 'label': 'KDA Ratio', 'unit': '', 'stroke': '#33b6b1', 'fill': 'rgba(51,182,177,0.15)'};

export default function KDAPage() {
  return <MetricDetailPage config={CONFIG} />;
}
