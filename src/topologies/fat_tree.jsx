import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function FatTree({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // --- VALIDACIÓN DE PARÁMETROS Y LÍMITES ---
    const k = params?.k || 2; 
    const n = params?.n || 3;

    // Límites individuales
    const minK = 2, maxK = 4;
    const minN = 2, maxN = 5;

    // Cálculo de carga
    const numHosts = Math.pow(k, n);
    
    // Validaciones
    const isParamsInvalid = k < minK || k > maxK || n < minN || n > maxN;
    const isTooLarge = numHosts > 1024; // Límite de seguridad global (ej. 8^4 es demasiado)

    if (isParamsInvalid || isTooLarge) {
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "#d32f2f";
      msg.style.padding = "2rem";
      msg.style.textAlign = "center";
      msg.style.fontFamily = "sans-serif";

      let errorText = "";

      if (isTooLarge) {
        // Mensaje específico si la combinación explota exponencialmente
        errorText = `
          <strong>Topology too massive</strong><br/><br/>
          Hosts generated: ${numHosts.toLocaleString()}<br/>
          (Limit: 1,024)<br/>
          Try reducing K or N.
        `;
      } else {
        // Mensaje de rangos estándar
        errorText = `
          <strong>Parameters out of range</strong><br/><br/>
          K (Arity): ${k} (Allowed: ${minK} - ${maxK})<br/>
          N (Stages): ${n} (Allowed: ${minN} - ${maxN})
        `;
      }

      msg.innerHTML = errorText;
      mount.appendChild(msg);
      return;
    }

    // --- SETUP BÁSICO ---
    const numSwitchesPerStage = Math.pow(k, n - 1);
    
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4); // Gris claro estándar

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const totalWidth = Math.max(numHosts, numSwitchesPerStage) * 2;
    camera.position.set(0, n * 3, totalWidth * 0.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, n, 0);
    
    // Iluminación
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // --- MATERIALES ---
    // Paleta Unificada: Host (Azul), Switch (Gris Azulado), Core (Rojo)
    const matHost = new THREE.MeshPhongMaterial({ color: 0x1565c0 }); 
    const matSwitch = new THREE.MeshPhongMaterial({ color: 0x607d8b }); 
    const matCore = new THREE.MeshPhongMaterial({ color: 0xd32f2f });

    const matLinkHost = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.8, transparent: true });
    const matLinkInter = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.5, transparent: true });

    // --- GEOMETRÍA ---
    const hostGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const switchGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);

    const hosts = [];
    const switches = [];

    // Helper para centrar objetos en el eje X
    const getX = (index, totalCount, spacing = 1.5) => {
      return (index - (totalCount - 1) / 2) * spacing;
    };

    // 1. Crear Nodos Finales (Hosts) - Nivel Y=0
    for (let i = 0; i < numHosts; i++) {
      const mesh = new THREE.Mesh(hostGeo, matHost);
      mesh.position.set(getX(i, numHosts, 1.2), 0, 0);
      scene.add(mesh);
      hosts.push(mesh);
    }

    // 2. Crear Switches - Niveles Y = 2, 4, 6...
    for (let stage = 0; stage < n; stage++) {
      const stageSwitches = [];
      const stageY = (stage + 1) * 2;
      
      for (let i = 0; i < numSwitchesPerStage; i++) {
        // Asignamos material normal o Core según la etapa
        const isCore = stage === n - 1;
        const mesh = new THREE.Mesh(switchGeo, isCore ? matCore : matSwitch);
        
        mesh.position.set(getX(i, numSwitchesPerStage, 1.2 * k), stageY, 0);
        scene.add(mesh);
        stageSwitches.push(mesh);
      }
      switches.push(stageSwitches);
    }

    // --- CONEXIONES (WIRING) ---
    const drawLine = (objA, objB, material) => {
      const pts = [objA.position, objB.position];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geo, material);
      scene.add(line);
    };

    // A. Conectar Hosts a la primera etapa de Switches (Stage 0)
    for (let h = 0; h < numHosts; h++) {
      const targetSwitchIndex = Math.floor(h / k);
      if (switches[0][targetSwitchIndex]) {
        drawLine(hosts[h], switches[0][targetSwitchIndex], matLinkHost);
      }
    }

    // B. Conectar Etapas entre sí (Butterfly Pattern)
    for (let stage = 0; stage < n - 1; stage++) {
      const currentStage = switches[stage];
      const nextStage = switches[stage + 1];
      const blockSize = Math.pow(k, stage); 
      
      for (let i = 0; i < numSwitchesPerStage; i++) {
        const group = Math.floor(i / (blockSize * k));
        const offset = i % blockSize;
        
        for (let p = 0; p < k; p++) {
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

    // Limpieza
    return () => {
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      hostGeo.dispose();
      switchGeo.dispose();
      matHost.dispose();
      matSwitch.dispose();
      matCore.dispose();
      matLinkHost.dispose();
      matLinkInter.dispose();
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
