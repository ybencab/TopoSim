import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function FatTree({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // Validación de parámetros
    // k = aridad (número de puertos hacia abajo/arriba)
    // n = número de etapas de switches
    const k = params?.k || 2; 
    const n = params?.n || 3;

    // Calculamos el número total de nodos finales para evitar colgar el navegador
    const numHosts = Math.pow(k, n);
    const numSwitchesPerStage = Math.pow(k, n - 1);

    if (numHosts > 256 || n > 5) {
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "red";
      msg.style.padding = "1rem";
      msg.textContent = `Topology too large to render efficiently (Hosts: ${numHosts}). Try k=2, n=4 or k=4, n=3.`;
      mount.appendChild(msg);
      return;
    }

    while (mount.firstChild) mount.removeChild(mount.firstChild);

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Cámara (ajustada para ver el árbol de frente)
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    // Posicionar cámara centrada y alejada
    const totalWidth = Math.max(numHosts, numSwitchesPerStage) * 2;
    camera.position.set(0, n * 3, totalWidth * 0.8);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Luz
    const ambientLight = new THREE.AmbientLight(0x666666);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    // Ajustar el target para que rote sobre el centro del árbol
    controls.target.set(0, n, 0);

    // --- MATERIALES ---
    const matHost = new THREE.MeshPhongMaterial({ color: 0x4caf50 }); // Verde
    const matSwitch = new THREE.MeshPhongMaterial({ color: 0x2196f3 }); // Azul
    const matLinkHost = new THREE.LineBasicMaterial({ color: 0x81c784, opacity: 0.8, transparent: true });
    const matLinkInter = new THREE.LineBasicMaterial({ color: 0xbbdefb, opacity: 0.5, transparent: true });

    // --- GEOMETRÍA ---
    const hostGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const switchGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);

    // Arrays para guardar referencias y posiciones
    // hosts[i]
    // switches[stage][index]
    const hosts = [];
    const switches = [];

    // Helper para centrar objetos en el eje X
    const getX = (index, totalCount, spacing = 1.5) => {
      return (index - (totalCount - 1) / 2) * spacing;
    };

    // 1. Crear Nodos Finales (Hosts) - Nivel Y=0
    for (let i = 0; i < numHosts; i++) {
      const mesh = new THREE.Mesh(hostGeo, matHost);
      // Espaciamos los hosts un poco más juntos
      mesh.position.set(getX(i, numHosts, 1.2), 0, 0);
      scene.add(mesh);
      hosts.push(mesh);
    }

    // 2. Crear Switches - Niveles Y = 2, 4, 6...
    for (let stage = 0; stage < n; stage++) {
      const stageSwitches = [];
      const stageY = (stage + 1) * 2;
      
      for (let i = 0; i < numSwitchesPerStage; i++) {
        const mesh = new THREE.Mesh(switchGeo, matSwitch);
        mesh.position.set(getX(i, numSwitchesPerStage, 1.2 * k), stageY, 0);
        
        // Colorear diferente la etapa raíz (Core)
        if (stage === n - 1) {
            mesh.material = new THREE.MeshPhongMaterial({ color: 0xe91e63 }); // Rosa/Rojo para Core
        }
        
        scene.add(mesh);
        stageSwitches.push(mesh);
      }
      switches.push(stageSwitches);
    }

    // --- CONEXIONES (WIRING) ---

    // Función auxiliar para dibujar línea
    const drawLine = (objA, objB, material) => {
      const pts = [objA.position, objB.position];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, material);
      scene.add(line);
    };

    // A. Conectar Hosts a la primera etapa de Switches (Stage 0)
    // Cada switch de la etapa 0 maneja 'k' hosts.
    for (let h = 0; h < numHosts; h++) {
      const targetSwitchIndex = Math.floor(h / k);
      if (switches[0][targetSwitchIndex]) {
        drawLine(hosts[h], switches[0][targetSwitchIndex], matLinkHost);
      }
    }

    // B. Conectar Etapas entre sí (Butterfly Pattern)
    // Algoritmo para k-ary n-tree / Butterfly Fat Tree
    for (let stage = 0; stage < n - 1; stage++) {
      const currentStage = switches[stage];
      const nextStage = switches[stage + 1];
      
      // La "anchura" del bloque de permutación depende de la etapa.
      // En cada etapa, el patrón de conexión se expande.
      const blockSize = Math.pow(k, stage); 
      
      for (let i = 0; i < numSwitchesPerStage; i++) {
        // Determinamos a qué switches de la siguiente etapa conecta el switch 'i'.
        // Un switch en Fat Tree se conecta a 'k' padres.
        
        const group = Math.floor(i / (blockSize * k));
        const offset = i % blockSize;
        
        for (let p = 0; p < k; p++) {
          // Fórmula de permutación Butterfly para determinar el índice destino
          const targetIndex = group * (blockSize * k) + (p * blockSize) + offset;
          
          if (nextStage[targetIndex]) {
            drawLine(currentStage[i], nextStage[targetIndex], matLinkInter);
          }
        }
      }
    }

    // Animación
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [params]);

  return <div ref={mountRef} style={{ width: "100%", height: "100%" }} />;
}