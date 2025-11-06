import Graph3DViewer from "./components/graph_viewer";
import TopologySelector from "./components/topology_selector";

export function App() {
  return (
    <div style="width: 100vw; height: 100vh; overflow: hidden;">
      <TopologySelector />
      <Graph3DViewer />
    </div>
  );
}
