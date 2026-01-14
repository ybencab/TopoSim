import { useMemo } from "preact/hooks";

const calculateMetrics = (type, params) => {
  const stats = {
    symmetry: "No",
    degree: 0,
    homogeneity: "No",
    bisectionWidth: 0,
    hopCount: 0, 
    connectivity: 0,
    totalSwitches: 0,
    totalLinks: 0,
  };

  // --- MESH (Malla) ---
  if (type === "mesh") {
    const k = params.size;
    const n = params.dimensions;
    const N = Math.pow(k, n);

    stats.symmetry = "No (Asymmetric at edges)";
    stats.homogeneity = "No (Corners degree n, center 2n)";
    stats.degree = `Max: ${2 * n}`;

    stats.hopCount = n * (k - 1);

    // Bisección (Enlaces físicos): k^(n-1)
    stats.bisectionWidth = Math.pow(k, n - 1);

    stats.connectivity = n;
    stats.totalSwitches = N;
    
    // Total Enlaces (Aristas del grafo): n * k^(n-1) * (k-1)
    // Para 3x3 (k=3, n=2): 2 * 3^1 * 2 = 12 enlaces.
    stats.totalLinks = n * Math.pow(k, n - 1) * (k - 1);
  }

  // --- TORUS (Toro) ---
  else if (type === "torus") {
    const k = params.size;
    const n = params.dimensions;
    const N = Math.pow(k, n);

    stats.symmetry = "Yes";
    stats.homogeneity = "Yes";
    stats.degree = 2 * n;

    stats.hopCount = n * Math.floor(k / 2);

    // Bisección (Enlaces físicos): 2 * k^(n-1)
    stats.bisectionWidth = 2 * Math.pow(k, n - 1);

    stats.connectivity = 2 * n;
    stats.totalSwitches = N;
    
    // Total Enlaces: n * N
    // Cada nodo añade n enlaces "nuevos" (o 2n compartido entre 2)
    stats.totalLinks = n * N;
  }

  // --- FAT TREE ---
  else if (type === "fat_tree") {
    const k = params.k; 
    const n = params.n; 
    const numHosts = Math.pow(k, n);
    const numSwitches = n * Math.pow(k, n - 1);

    stats.symmetry = "No";
    stats.homogeneity = "Yes";
    stats.degree = `Switch: ${2 * k}`; 
    
    stats.hopCount = 2 * n; 
    
    // Bisección (Enlaces físicos): N / 2
    // En el corte superior, la mitad de los hosts comunican con la otra mitad.
    stats.bisectionWidth = numHosts / 2; 

    stats.connectivity = k; 
    stats.totalSwitches = numSwitches;
    
    // Total Enlaces: n niveles * N enlaces por nivel
    stats.totalLinks = n * numHosts;
  }

  // --- WK-RECURSIVE ---
  else if (type === "wk") {
    const k = params.k || 4;
    const l = params.l || 3; 
    const N = Math.pow(k, l);

    // WK es altamente simétrico y regular (salvo las esquinas abiertas globales)
    stats.symmetry = "Yes (Vertex-symmetric)";
    stats.homogeneity = "Mostly (Corners degree K-1)";

    // Grado: Constante K (K-1 enlaces internos + 1 expansión)
    stats.degree = k;

    stats.hopCount = Math.pow(2, l) - 1;

    // Bisección aproximada (Enlaces físicos)
    stats.bisectionWidth = k; 

    stats.connectivity = k - 1;
    stats.totalSwitches = N;

    // Total Enlaces (Aristas):
    // Suma de grados / 2.
    // Grado total interno = (N * K) - K (puertos libres)
    stats.totalLinks = (N * k - k) / 2; 
  }

  return stats;
};

export default function TopologyStats({ type, params }) {
  const stats = useMemo(() => calculateMetrics(type, params), [type, params]);

  return (
    <div className="absolute top-4 right-4 z-50 w-80 p-4 font-sans text-sm bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200">
      
      <h3 className="pb-2 mb-3 text-base font-bold text-gray-800 border-b border-gray-300">
        Topology Analysis (Physical)
      </h3>
      
      <div className="flex flex-col gap-3">
        <StatRow label="Symmetry" value={stats.symmetry} />
        <StatRow label="Homogeneity" value={stats.homogeneity} />
        <StatRow label="Switch Degree" value={stats.degree} />
        <StatRow label="Hop Count" value={stats.hopCount} />
        <StatRow label="Bisection BW" value={`${stats.bisectionWidth.toLocaleString()} links`} />
        <StatRow label="Connectivity" value={stats.connectivity} />
        
        <div className="my-1 border-t border-gray-200" />
        
        <StatRow label="Total Switches" value={stats.totalSwitches.toLocaleString()} highlight />
        <StatRow label="Total Links" value={stats.totalLinks.toLocaleString()} highlight />
      </div>
    </div>
  );
}

const StatRow = ({ label, value, highlight = false }) => (
  <div className="flex flex-row justify-between items-start gap-3">
    {/* Etiqueta */}
    <span className="text-gray-600 font-semibold shrink-0 whitespace-nowrap">
      {label}:
    </span>
    
    {/* Valor */}
    <span className={`text-right break-words leading-tight ${highlight ? 'text-indigo-600 font-bold' : 'text-gray-900 font-medium'}`}>
      {value}
    </span>
  </div>
);
