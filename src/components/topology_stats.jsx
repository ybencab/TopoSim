import { useMemo } from "preact/hooks";

const calculateMetrics = (type, params) => {
  const stats = {
    symmetry: "No",
    degree: 0,
    homogeneity: "No",
    bisectionBandwidth: 0,
    hopCount: 0,
    connectivity: 0,
    totalSwitches: 0,
    totalLinks: 0,
  };

  // --- MESH ---
  // Parámetros: tamaño (k), dimensiones (n)
  if (type === "mesh") {
    const k = params.size;
    const n = params.dimensions;
    const N = Math.pow(k, n);

    stats.symmetry = "No (Asymmetric at edges)";
    stats.homogeneity = "No (Corners degree n, center 2n)";
    stats.degree = `Max: ${2 * n}, Min: ${n}`;
    
    // Bisección: cortar por la mitad rompe k^(n-1) enlaces  bidireccionales
    // Enlaces unidireccionales = 2 * k^(n-1)
    stats.bisectionBandwidth = 2 * Math.pow(k, n - 1);
    
    // Hop Count / Diámetro: n * (k - 1)
    stats.hopCount = n * (k - 1);
    
    // Connectivity: Degree of the corner node
    stats.connectivity = n;
    
    stats.totalSwitches = N;
    
    // Enlaces: n * k^(n-1) * (k-1) son enlaces bidireccionales
    // Multiplicamos por 2 para unidireccionales
    stats.totalLinks = 2 * n * Math.pow(k, n - 1) * (k - 1);
  }

  // --- FAT TREE (k-ary n-tree) ---
  // Parámetros: k (puertos), n (etapas/niveles)
  else if (type === "fat_tree") {
    const k = params.k;
    const n = params.n;
    const numSwitches = n * Math.pow(k, n - 1);

    stats.symmetry = "No (Hierarchical)";
    stats.homogeneity = "Yes (Fixed degree 2k)";
    stats.degree = 2 * k;
    
    // Bisección: Determinada por la raíz.
    // La capacidad total de bisección es NumHosts * 1 (full bisection) / 2 mitades
    // Enlaces unidireccionales cruzando el corte: k^n
    stats.bisectionBandwidth = Math.pow(k, n); 
    
    // Hop Count: Subir a la raíz (n) + Bajar al destino (n) = 2n
    stats.hopCount = 2 * n; 
    
    stats.connectivity = k; // Enlaces mínimos a cortar para aislar un subárbol
    
    stats.totalSwitches = numSwitches;
    
    // Enlaces: 
    // - Hosts a primera etapa: k^n
    // - Entre etapas (n-1 niveles): (n-1) * k^n
    // Total bidireccional = n * k^n
    // Total unidireccional = 2 * n * k^n
    stats.totalLinks = 2 * n * Math.pow(k, n);
  }

// --- WK-RECURSIVE ---
  else if (type === "wk") {
    // Parámetros: k (nodos en bloque base), l (nivel de expansión)
    const k = params.k || 4;
    const l = params.l || 3;
    const N = Math.pow(k, l);

    // WK es altamente simétrico y regular (salvo las esquinas abiertas globales)
    stats.symmetry = "Yes (Vertex-symmetric)";
    stats.homogeneity = "Mostly (Corners degree K-1)";

    // Grado: Constante K (K-1 enlaces internos + 1 expansión)
    stats.degree = k;

    // Bisection Bandwidth: 
    // En el nivel superior es un grafo completo de K bloques. 
    // Cortar por la mitad rompe (K/2 * K/2) enlaces virtuales.
    // Multiplicamos por 2 para ancho de banda unidireccional.
    stats.bisectionBandwidth = 2 * Math.floor((k * k) / 4);

    // Hop Count (Diámetro): D = 2^L - 1
    // Esta es una de las ventajas clave de WK, diámetro pequeño independiente de K.
    stats.hopCount = Math.pow(2, l) - 1;

    // Conectividad: K-1 (Grado del bloque virtual)
    stats.connectivity = k - 1;

    stats.totalSwitches = N;

    // Enlaces Totales:
    // Cada nodo tiene grado K, excepto los K "corners" globales que tienen K-1.
    // Total puertos usados = N*K - K (puertos abiertos).
    // Son enlaces unidireccionales en esta métrica.
    stats.totalLinks = N * k - k; 
  }

  return stats;
};

export default function TopologyStats({ type, params }) {
  const stats = useMemo(() => calculateMetrics(type, params), [type, params]);

  return (
    <div className="absolute top-4 right-4 z-50 w-80 p-4 font-sans text-sm bg-white/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-200">
      
      <h3 className="pb-2 mb-3 text-base font-bold text-gray-800 border-b border-gray-300">
        Topology Analysis
      </h3>
      
      { /* Grid de datos */ }
      <div className="flex flex-col gap-3">
        <StatRow label="Symmetry" value={stats.symmetry} />
        <StatRow label="Homogeneity" value={stats.homogeneity} />
        <StatRow label="Switch Degree" value={stats.degree} />
        <StatRow label="Hop Count (Ø)" value={stats.hopCount} />
        <StatRow label="Bisection BW" value={stats.bisectionBandwidth} />
        <StatRow label="Connectivity" value={stats.connectivity} />
        
        <div className="my-1 border-t border-gray-200" />
        
        <StatRow label="Total Switches" value={stats.totalSwitches.toLocaleString()} highlight />
        <StatRow label="Total Links" value={stats.totalLinks.toLocaleString()} highlight />
      </div>

      <div className="mt-4 text-xs italic text-gray-500 leading-tight opacity-80">
        * Diameter in cycles is assumed equal to Hop Count (1 cycle/hop).
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
