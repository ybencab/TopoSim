import { Suspense } from "preact/compat";
import { useState, useEffect } from "preact/hooks";
import TopologyStats from "./topology_stats.jsx";

const TOPOLOGIES = {
  mesh: () => import("../topologies/mesh.jsx"),
  fat_tree: () => import("../topologies/fat_tree.jsx"),
  wk: () => import("../topologies/wk_recursive.jsx"),
  torus: () => import("../topologies/torusj.jsx"),
};

export default function TopologyCanvas({ topology, params }) {
  const TopologyComponent = TOPOLOGIES[topology]
    ? LazyTopology(TOPOLOGIES[topology])
    : NotImplemented(topology);

  const SHOWSTATS = !!TOPOLOGIES[topology]
  return (
    <div class="relative flex-1 w-full h-full overflow-hidden bg-gray-100">
      <Suspense fallback={<div class="p-4 text-gray-500">Loading...</div>}>
        <TopologyComponent params={params} />
      </Suspense>

      { SHOWSTATS && (
        <TopologyStats type={topology} params={params} />
      )}
    </div>
  );
}

function LazyTopology(importFn) {
  return (props) => {
    const [Comp, setComp] = useState(null);

    useEffect(() => {
      let mounted = true;
      importFn().then((mod) => {
        if (mounted) setComp(() => mod.default);
      });
      return () => { mounted = false };
    }, [importFn]); // importFn nunca cambia, pero ok

    return Comp ? <Comp {...props} /> : <div class="p-4 text-gray-500">Loading...</div>;
  };
}

function NotImplemented(name) {
  return () => (
    <div class="flex items-center justify-center w-full h-full text-gray-600 text-lg italic">
      Topology "<span class="font-semibold">{name}</span>" not implemented yet.
    </div>
  );
}
