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

    let maxSize = 25;
    if (dims === 3) maxSize = 10;
    if (dims === 4) maxSize = 5;

    const minSize = 2;
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
    scene.background = new THREE.Color(0xf4f4f4); 

    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(size * 1.5, size * 2.5, size * 3.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // --- MATERIALES ---
    const materialNode = new THREE.MeshPhongMaterial({ color: 0x1565c0 });
    
    // 1. Enlace normal (Intra-cubo: X, Y, Z) - Gris
    const materialLink = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.6, transparent: true });
    
    // 2. Enlace 4D (Inter-cubo: W) - Rojo para diferenciar
    const materialHyperLink = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.8, transparent: true });

    const nodes = [];

    const getColorForW = (w, maxW) => {
      const hue = (w / maxW) * 0.7; 
      return new THREE.Color().setHSL(hue, 0.8, 0.5);
    };

    // --- GENERACIÓN DE NODOS ---
    const range = [...Array(size).keys()];
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
              const color = getColorForW(w, size - 1);
              const material4D = new THREE.MeshPhongMaterial({ color });
              const node = new THREE.Mesh(geometrySphere, material4D);
              
              const offsetBase = (w - size / 2) * 1.2; 
              const offsetVertical = (w - size / 2) * 2; 

              node.position.set(
                i - size / 2 + offsetBase,
                j - size / 2 + offsetVertical, 
                k - size / 2 + offsetBase
              );
              scene.add(node);
              nodes.push(node);
            }
          }
        }
      }
    }

    // --- GENERACIÓN DE ENLACES ---
    // Modificamos connect para aceptar un material personalizado
    const connect = (a, b, customMaterial = materialLink) => {
      const points = [nodes[a].position, nodes[b].position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, customMaterial);
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
              
              // Enlaces normales (X, Y, Z) -> materialLink (gris)
              if (i < size - 1) connect(index, indexAt(i + 1, j, k, w), materialLink);
              if (j < size - 1) connect(index, indexAt(i, j + 1, k, w), materialLink);
              if (k < size - 1) connect(index, indexAt(i, j, k + 1, w), materialLink);
              
              // Enlace de la 4ta dimensión (W) -> materialHyperLink (ROJO)
              if (w < size - 1) connect(index, indexAt(i, j, k, w + 1), materialHyperLink);
            }
          }
        }
      }
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mount) mount.removeChild(renderer.domElement);
      geometrySphere.dispose();
      materialNode.dispose();
      materialLink.dispose();
      materialHyperLink.dispose(); // Limpiamos el nuevo material
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
