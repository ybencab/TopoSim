import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Mesh({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // --- VALIDACIÓN DE PARÁMETROS Y LÍMITES ---
    const size = params?.size;
    const dims = params?.dimensions;

    // 1. Definir límites según la dimensión para evitar colapsar el navegador
    let maxSize = 25; // Límite para 2D
    if (dims === 3) maxSize = 10;
    if (dims === 4) maxSize = 5;

    const minSize = 2;

    // 2. Comprobar validez
    const isInvalidParams = !size || !dims || ![2, 3, 4].includes(dims);
    const isOutOrRange = size < minSize || size > maxSize;

    if (isInvalidParams || isOutOrRange) {
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "#d32f2f";
      msg.style.padding = "2rem";
      msg.style.textAlign = "center";
      msg.style.fontFamily = "sans-serif";
      
      let errorText = 'Invalid parameters.';
      if (isOutOrRange) {
        errorText = `
          <strong>Size out of range for ${dims}D</strong><br/><br/>
          Size: ${size} <br/>
          Allowed: ${minSize} - ${maxSize}
        `;
      } else {
        errorText = 'Supported dimensions: 2, 3, or 4.';
      }

      msg.innerHTML = errorText;
      mount.appendChild(msg);
      return;
    }

    // --- SETUP BÁSICO ---
    while (mount.firstChild) mount.removeChild(mount.firstChild);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4); // Gris claro estándar

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(size, size, size * 1.5);

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
    // Usamos el Azul Unificado (0x1565c0) para todas las dimensiones
    const materialNode = new THREE.MeshPhongMaterial({ color: 0x1565c0 });
    const materialLink = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.6, transparent: true });

    const nodes = [];
    // Nota: 'positions' se guardaba en tu código original pero no se usaba después,
    // se puede omitir si solo usamos nodes[x].position.

    // --- GENERACIÓN DE NODOS ---
    const range = [...Array(size).keys()];
    
    // Geometría reutilizable
    const geometrySphere = new THREE.SphereGeometry(dims === 4 ? 0.08 : 0.1, 16, 16);

    if (dims === 2) {
      for (let i of range) {
        for (let j of range) {
          const node = new THREE.Mesh(geometrySphere, materialNode);
          node.position.set(i - size / 2, j - size / 2, 0);
          scene.add(node);
          nodes.push(node);
        }
      }
    } else if (dims === 3) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            const node = new THREE.Mesh(geometrySphere, materialNode);
            node.position.set(i - size / 2, j - size / 2, k - size / 2);
            scene.add(node);
            nodes.push(node);
          }
        }
      }
    } else if (dims === 4) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            for (let w of range) {
              // En 4D usamos el mismo material azul unificado
              const node = new THREE.Mesh(geometrySphere, materialNode);
              
              const offset = (w - size / 2) * 0.3;
              node.position.set(
                i - size / 2 + offset,
                j - size / 2 + offset,
                k - size / 2 + offset
              );
              scene.add(node);
              nodes.push(node);
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
      // Limpieza de recursos Three.js
      geometrySphere.dispose();
      materialNode.dispose();
      materialLink.dispose();
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
