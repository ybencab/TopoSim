// src/components/TopologySelector.jsx
import { useState } from "preact/hooks";

const DEFAULT_PARAMS = {
  mesh: { size: 3, dimensions: 2 },
  fat_tree: { k: 2, n: 3 },
  wk: { k: 3, l: 2 }
}

export default function TopologySelector({ onChange }) {
  const [topology, setTopology] = useState("mesh");
  const [params, setParams] = useState(DEFAULT_PARAMS.mesh);

  const handleTopologyChange = (e) => {
    const newTopology = e.target.value;
    const newParams = DEFAULT_PARAMS[newTopology] || {};
    setTopology(newTopology);
    setParams(newParams);
    onChange(newTopology, newParams);
  };

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    const newParams = { ...params, [name]: parseInt(value) || value };
    setParams(newParams);
    onChange(topology, newParams);
  }

  const paramInputs = Object.keys(params).map((key) => (
    <div class="mb-2" key={key}>
      <label class="block text-sm font-medium mb-1">{key}</label>
      <input
        type="number"
        name={key}
        value={params[key]}
        onInput={handleParamChange}
        class="p-1 border rounded w-full"
      />
    </div>
  ));

  return (
    <div class="p-4 border-r">
      <h2 class="text-lg font-bold mb-3">Topology Selector</h2>
      <select
        value={topology}
        onChange={handleTopologyChange}
        class="p-2 border rounded w-full mb-2"
      >
        <option value="mesh">Mesh</option>
        <option value="torus">Torus</option>
        <option value="wk">WK-Recursive</option>
        <option value="fat_tree">Fat Tree</option>
      </select>
      {paramInputs}
    </div>
  );
}
