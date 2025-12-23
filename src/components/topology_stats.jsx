import { useMemo } from "preact/hooks";

// --- METRICS CALCULATION ENGINE ---
const calculateMetrics = (type, params) => {
  const stats = {
    symmetry: "No",
    degree: 0,
    homogeneity: "No",
    bisectionBandwidth: 0, // In number of unidirectional links
    hopCount: 0, // Topological diameter
    connectivity: 0,
    totalSwitches: 0,
    totalLinks: 0, // Unidirectional
  };

  // --- MESH ---
  // Params: size (k), dimensions (n)
  if (type === "mesh") {
    const k = params.size;
    const n = params.dimensions;
    const N = Math.pow(k, n);

    stats.symmetry = "No (Asymmetric at edges)";
    stats.homogeneity = "No (Corners degree n, center 2n)";
    stats.degree = `Max: ${2 * n}, Min: ${n}`;
    
    // Bisection: Cutting in half breaks k^(n-1) bidirectional links
    // Unidirectional links = 2 * k^(n-1)
    stats.bisectionBandwidth = 2 * Math.pow(k, n - 1);
    
    // Hop Count / Diameter: n * (k - 1)
    stats.hopCount = n * (k - 1);
    
    // Connectivity: Degree of the corner node
    stats.connectivity = n;
    
    stats.totalSwitches = N;
    
    // Links: n * k^(n-1) * (k-1) are bidirectional links
    // Multiply by 2 for unidirectional
    stats.totalLinks = 2 * n * Math.pow(k, n - 1) * (k - 1);
  }

  // --- FAT TREE (k-ary n-tree) ---
  // Params: k (ports), n (stages/levels)
  else if (type === "fat_tree") {
    const k = params.k;
    const n = params.n;
    const numSwitches = n * Math.pow(k, n - 1);

    stats.symmetry = "No (Hierarchical)"; // Root is different from leaves
    stats.homogeneity = "Yes (Fixed degree 2k)"; // Internally switches are identical
    stats.degree = 2 * k; // k up, k down
    
    // Bisection: Determined by the root.
    // Total bisection capacity is NumHosts * 1 (full bisection) / 2 halves
    // Unidirectional links crossing the cut: k^n
    stats.bisectionBandwidth = Math.pow(k, n); 
    
    // Hop Count: Up to root (n) + Down to destination (n) = 2n
    stats.hopCount = 2 * n; 
    
    stats.connectivity = k; // Minimum links to cut to isolate a subtree
    
    stats.totalSwitches = numSwitches;
    
    // Links: 
    // - Hosts to first stage: k^n
    // - Between stages (n-1 levels): (n-1) * k^n
    // Total bidirectional = n * k^n
    // Total unidirectional = 2 * n * k^n
    stats.totalLinks = 2 * n * Math.pow(k, n);
  }

  return stats;
};

export default function TopologyStats({ type, params }) {
  const stats = useMemo(() => calculateMetrics(type, params), [type, params]);

  return (
    <div className="absolute top-4 right-4 z-50 w-80 p-4 font-sans text-sm bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200">
      
      {/* Header */}
      <h3 className="pb-2 mb-3 text-base font-bold text-gray-800 border-b border-gray-300">
        Topology Analysis
      </h3>
      
      {/* Data Grid */}
      <div className="flex flex-col gap-3">
        <StatRow label="Symmetry" value={stats.symmetry} />
        <StatRow label="Homogeneity" value={stats.homogeneity} />
        <StatRow label="Switch Degree" value={stats.degree} />
        <StatRow label="Hop Count (Ø)" value={stats.hopCount} />
        <StatRow label="Bisection BW" value={stats.bisectionBandwidth} />
        <StatRow label="Connectivity" value={stats.connectivity} />
        
        {/* Separator */}
        <div className="my-1 border-t border-gray-200" />
        
        {/* Highlighted Totals */}
        <StatRow label="Total Switches" value={stats.totalSwitches.toLocaleString()} highlight />
        <StatRow label="Total Links" value={stats.totalLinks.toLocaleString()} highlight />
      </div>

      {/* Footer / Note */}
      <div className="mt-4 text-xs italic text-gray-500 leading-tight opacity-80">
        * Diameter in cycles is assumed equal to Hop Count (1 cycle/hop).
      </div>
    </div>
  );
}

// Improved Row Component
const StatRow = ({ label, value, highlight = false }) => (
  <div className="flex flex-row justify-between items-start gap-3">
    {/* Label */}
    <span className="text-gray-600 font-semibold shrink-0 whitespace-nowrap">
      {label}:
    </span>
    
    {/* Value */}
    <span className={`text-right break-words leading-tight ${highlight ? 'text-indigo-600 font-bold' : 'text-gray-900 font-medium'}`}>
      {value}
    </span>
  </div>
);
