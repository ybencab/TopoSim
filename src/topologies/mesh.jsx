import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Mesh({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // --- VALIDACIÓN DE PARÁMETROS ---
    const size = params?.size;
    const dims = params?.dimensions;

    if (!size || size <= 0 || ![2, 3, 4].includes(dims)) {
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "red";
      msg.style.padding = "1rem";
      msg.textContent = 'Invalid parameters: "size" must be > 0 and "dimensions" must be 2, 3, or 4.';
      mount.appendChild(msg);
      return;
    }

    // --- SETUP BÁSICO ---
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4); // Gris claro estándar

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // --- MATERIALES ---
    const materialLink = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.6, transparent: true });

    const nodes = [];
    const positions = [];

    // Función para crear color en 4D
    const getColorForW = (w, maxW) => {
      const hue = (w / maxW) * 0.7; 
      return new THREE.Color().setHSL(hue, 0.8, 0.5);
    };

    // --- GENERACIÓN DE NODOS ---
    const range = [...Array(size).keys()];
    
    if (dims === 2) {
      for (let i of range) {
        for (let j of range) {
          const material = new THREE.MeshPhongMaterial({ color: 0x1565c0 }); // Azul estándar
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), material);
          node.position.set(i - size / 2, 0, j - size / 2);
          scene.add(node);
          nodes.push(node);
          positions.push([i, 0, j]);
        }
      }
    } else if (dims === 3) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            const material = new THREE.MeshPhongMaterial({ color: 0x1565c0 }); // Azul estándar
            const node = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), material);
            node.position.set(i - size / 2, j - size / 2, k - size / 2);
            scene.add(node);
            nodes.push(node);
            positions.push([i, j, k]);
          }
        }
      }
    } else if (dims === 4) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            for (let w of range) {
              const color = getColorForW(w, size - 1);
              const material = new THREE.MeshPhongMaterial({ color });
              const node = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), material);
              
              const offset = (w - size / 2) * 0.3;
              node.position.set(
                i - size / 2 + offset,
                j - size / 2 + offset,
                k - size / 2 + offset
              );
              scene.add(node);
              nodes.push(node);
              positions.push([i, j, k, w]);
            }
          }
        }
      }
    }

    // --- GENERACIÓN DE ENLACES ---
    const connect = (a, b) => {
      const points = [nodes[a].position, nodes[b].position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, materialLink);
      scene.add(line);
    };

    const indexAt = (i, j, k = 0, w = 0) => {
      if (dims === 2) return i * size + j;
      if (dims === 3) return i * size * size + j * size + k;
      return i * size * size * size + j * size * size + k * size + w;
    };

    if (dims === 2) {
      for (let i of range) {
        for (let j of range) {
          const index = indexAt(i, j);
          if (i < size - 1) connect(index, indexAt(i + 1, j));
          if (j < size - 1) connect(index, indexAt(i, j + 1));
        }
      }
    } else if (dims === 3) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            const index = indexAt(i, j, k);
            if (i < size - 1) connect(index, indexAt(i + 1, j, k));
            if (j < size - 1) connect(index, indexAt(i, j + 1, k));
            if (k < size - 1) connect(index, indexAt(i, j, k + 1));
          }
        }
      }
    } else if (dims === 4) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            for (let w of range) {
              const index = indexAt(i, j, k, w);
              if (i < size - 1) connect(index, indexAt(i + 1, j, k, w));
              if (j < size - 1) connect(index, indexAt(i, j + 1, k, w));
              if (k < size - 1) connect(index, indexAt(i, j, k + 1, w));
              if (w < size - 1) connect(index, indexAt(i, j, k, w + 1));
            }
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
      if (mount) mount.removeChild(renderer.domElement);
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
