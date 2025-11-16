import { Suspense } from "preact/compat";
import { useState, useEffect } from "preact/hooks";

const TOPOLOGIES = {
  mesh: () => import("../topologies/mesh.jsx"),
};

export default function TopologyCanvas({ topology, params }) {
  const TopologyComponent = TOPOLOGIES[topology]
    ? LazyTopology(TOPOLOGIES[topology])
    : NotImplemented(topology);

  return (
    <div class="flex-1 w-full h-full overflow-hidden bg-gray-100">
      <Suspense fallback={<div class="p-4 text-gray-500">Loading...</div>}>
        <TopologyComponent params={params} />
      </Suspense>
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
