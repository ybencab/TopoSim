import { useState } from "preact/hooks";

import TopologyCanvas from "./components/topology_canvas";
import TopologySelector from "./components/topology_selector";

export function App() {
  const [selectedTopology, setSelectedTopology] = useState("mesh");
  const [params, setParams] = useState({size: 3, dimesions: 2});

  const handleChange = (top, p) => {
    setSelectedTopology(top);
    setParams(p);
  };

  return (
    <div style="width: 100vw; height: 100vh; overflow: hidden;">
      <TopologySelector onSelect={handleChange} />
      <TopologyCanvas topology={selectedTopology} params={params} />
    </div>
  );
}
