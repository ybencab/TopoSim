import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// --- LÓGICA MATEMÁTICA ---
const generateWK = (k, l) => {
  const nodes = [];
  const links = [];
  const N = Math.pow(k, l);

  // Función recursiva para colocar nodos
  const calculatePositions = (level, centerX, centerY, radius, startAngle = Math.PI / 2) => {
    const angleStep = (2 * Math.PI) / k;
    for (let i = 0; i < k; i++) {
      const angle = startAngle + i * angleStep;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      if (level === 1) {
        nodes.push(new THREE.Vector3(x, y, 0));
      } else {
        const scaleFactor = k > 3 ? 0.35 : 0.45;
        calculatePositions(level - 1, x, y, radius * scaleFactor, startAngle);
      }
    }
  };

  calculatePositions(l, 0, 0, 10 * l);

  // 1. Enlaces internos (Bloques base)
  for (let i = 0; i < N; i += k) {
    for (let u = 0; u < k; u++) {
      for (let v = u + 1; v < k; v++) {
        links.push([i + u, i + v]);
      }
    }
  }

  // 2. Enlaces recursivos (Inter-bloques)
  for (let level = l; level >= 2; level--) {
    const blockSize = Math.pow(k, level);
    const subBlockSize = Math.pow(k, level - 1);
    const numBlocks = N / blockSize;

    for (let b = 0; b < numBlocks; b++) {
      const blockStart = b * blockSize;
      for (let i = 0; i < k; i++) {
        for (let j = i + 1; j < k; j++) {
          let suffixJ = 0;
          for (let d = 0; d < level - 1; d++) suffixJ = suffixJ * k + j;
          
          let suffixI = 0;
          for (let d = 0; d < level - 1; d++) suffixI = suffixI * k + i;

          const u = blockStart + (i * subBlockSize) + suffixJ;
          const v = blockStart + (j * subBlockSize) + suffixI;

          links.push([u, v]);
        }
      }
    }
  }
  return { nodes, links };
};

// --- COMPONENTE VISUAL ---
export default function WKRecursiveTopology({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    
    // Validación de parámetros
    const k = params?.k || 4;
    const l = params?.l || 3;

    // --- LÍMITES (SUPERIORES E INFERIORES) ---
    const minK = 3, maxK = 8;
    const minL = 1, maxL = 5;

    if (k < minK || k > maxK || l < minL || l > maxL) {
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "#d32f2f";
      msg.style.padding = "2rem";
      msg.style.textAlign = "center";
      msg.style.fontFamily = "sans-serif";
      msg.innerHTML = `
        <strong>Parameters out of range</strong><br/><br/>
        K (Nodes/Block): ${k} (Allowed: ${minK} - ${maxK})<br/>
        L (Levels): ${l} (Allowed: ${minL} - ${maxL})
      `;
      mount.appendChild(msg);
      return;
    }

    // --- SETUP BÁSICO ---
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4); // Gris claro estándar

    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(20, 20, 20);
    scene.add(pointLight);

    // Generar datos
    const { nodes: nodePositions, links } = generateWK(k, l);

    // --- GENERACIÓN DE NODOS ---
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);

    const material = new THREE.MeshPhongMaterial({ color: 0x1565c0 }); 
    const mesh = new THREE.InstancedMesh(geometry, material, nodePositions.length);
    
    const dummy = new THREE.Object3D();
    
    nodePositions.forEach((pos, i) => {
      // 1. Detección de nodo abierto (Todos los dígitos en base K son iguales)
      let isOpenNode = true;
      let temp = i;
      let lastDigit = temp % k;
      
      // Chequeamos los 'l' dígitos
      for (let d = 0; d < l; d++) {
        if (temp % k !== lastDigit) {
          isOpenNode = false;
          break;
        }
        temp = Math.floor(temp / k);
      }

      // 2. Configurar posición y escala
      dummy.position.copy(pos);
      
      // Aumentamos el tamaño de los nodos "abiertos" (Lógica original x2)
      const scale = isOpenNode ? 2 : 1.0; 
      dummy.scale.set(scale, scale, scale);
      
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);

    // --- GENERACIÓN DE ENLACES ---
    const linkPoints = [];
    links.forEach(([src, dst]) => {
      linkPoints.push(nodePositions[src]);
      linkPoints.push(nodePositions[dst]);
    });
    
    const linkGeometry = new THREE.BufferGeometry().setFromPoints(linkPoints);
    const linkMaterial = new THREE.LineBasicMaterial({ 
      color: 0x999999, 
      opacity: 0.6, 
      transparent: true 
    });
    const linkSegments = new THREE.LineSegments(linkGeometry, linkMaterial);
    scene.add(linkSegments);

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Limpieza
    return () => {
      if (mount) mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      linkGeometry.dispose();
      linkMaterial.dispose();
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
