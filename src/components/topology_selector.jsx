// src/components/TopologySelector.jsx
import { useState } from "preact/hooks";

export default function TopologySelector({ onSelect }) {
  const [topology, setTopology] = useState("mesh");

  const handleChange = (e) => {
    const value = e.target.value;
    setTopology(value);
    onSelect(value);
  };

  return (
    <div class="p-4 border-r">
      <h2 class="text-lg font-bold mb-3">Topology Selector</h2>
      <select
        value={topology}
        onChange={handleChange}
        class="p-2 border rounded w-full"
      >
        <option value="mesh">Mesh</option>
        <option value="toroid">Toroid</option>
        <option value="fat-tree">Fat Tree</option>
      </select>
    </div>
  );
}
