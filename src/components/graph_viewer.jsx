import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Graph3DViewer() {
  const mountRef = useRef(null);

  useEffect(() => {
    // --- Escena ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(50, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    // --- Luz ---
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(10, 10, 10);
    scene.add(directional);

    // --- Malla cúbica 3×3×3 ---
    const size = 3;
    const nodes = [];
    const edges = [];
    for (let x = 0; x < size; x++)
      for (let y = 0; y < size; y++)
        for (let z = 0; z < size; z++)
          nodes.push([x - 1, y - 1, z - 1]);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const [x1, y1, z1] = nodes[i];
        const [x2, y2, z2] = nodes[j];
        const d = Math.abs(x1 - x2) + Math.abs(y1 - y2) + Math.abs(z1 - z2);
        if (d === 1) edges.push([nodes[i], nodes[j]]);
      }
    }

    // --- Nodos ---
    const nodeGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0x66ccff });
    for (const [x, y, z] of nodes) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(x, y, z);
      scene.add(node);
    }

    // --- Aristas ---
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    for (const [a, b] of edges) {
      const points = [new THREE.Vector3(...a), new THREE.Vector3(...b)];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, edgeMat);
      scene.add(line);
    }

    // --- Controles de cámara ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // --- Animación ---
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // --- Limpieza ---
    return () => {
      mountRef.current.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}
