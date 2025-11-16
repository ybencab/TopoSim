import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Mesh({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // Validación de parámetros
    const size = params?.size;
    const dims = params?.dimensions;

    if (!size || size <= 0 || ![2, 3].includes(dims)) {
      // Mostrar mensaje de error en lugar de renderizar la topología
      while (mount.firstChild) mount.removeChild(mount.firstChild);
      const msg = document.createElement("div");
      msg.style.color = "red";
      msg.style.padding = "1rem";
      msg.textContent =
        'Invalid parameters: "size" must be > 0 and "dimensions" must be 2 or 3.';
      mount.appendChild(msg);
      return;
    }

    while (mount.firstChild) mount.removeChild(mount.firstChild); // Limpiar escena previa

    // Escena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4);

    // Cámara
    const camera = new THREE.PerspectiveCamera(
      75,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(5, 5, 5);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // Luz
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(10, 10, 10);
    scene.add(light);

    // Controles
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    // Materiales
    const materialNode = new THREE.MeshPhongMaterial({ color: 0x1565c0 });
    const materialLink = new THREE.LineBasicMaterial({ color: 0x999999 });

    const nodes = [];
    const positions = [];

    // Generar nodos
    const range = [...Array(size).keys()];
    if (dims === 2) {
      for (let i of range) {
        for (let j of range) {
          const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            materialNode
          );
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
            const node = new THREE.Mesh(
              new THREE.SphereGeometry(0.1, 16, 16),
              materialNode
            );
            node.position.set(i - size / 2, j - size / 2, k - size / 2);
            scene.add(node);
            nodes.push(node);
            positions.push([i, j, k]);
          }
        }
      }
    }

    // Crear enlaces
    const connect = (a, b) => {
      const points = [nodes[a].position, nodes[b].position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, materialLink);
      scene.add(line);
    };

    const indexAt = (i, j, k = 0) => {
      if (dims === 2) return i * size + j;
      return i * size * size + j * size + k;
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
      mount.removeChild(renderer.domElement);
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
