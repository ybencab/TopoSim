import { useEffect, useRef } from "preact/hooks";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function Toroide({ params }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;

    // --- VALIDACIÓN DE PARÁMETROS Y LÍMITES ---
    const size = params?.size;
    const dims = params?.dimensions;

    let maxSize = 20;
    if (dims === 3) maxSize = 8;

    const minSize = 3;
    const isInvalidParams = !size || !dims || ![2, 3].includes(dims);
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
        errorText = 'Supported dimensions: 2 or 3.';
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
    
    // Enlaces normales - Gris
    const materialLink = new THREE.LineBasicMaterial({ color: 0x999999, opacity: 0.6, transparent: true });
    
    // Enlaces circulares (wrap-around) - Verde
    const materialWrapLink = new THREE.LineBasicMaterial({ color: 0xff0000, opacity: 0.7, transparent: true });

    const nodes = [];

    // --- GENERACIÓN DE NODOS ---
    const range = [...Array(size).keys()];
    const geometrySphere = new THREE.SphereGeometry(dims === 3 ? 0.12 : 0.15, 16, 16);

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
    }

    // --- GENERACIÓN DE ENLACES ---
    const connectCurved = (a, b, material) => {
      const posA = nodes[a].position;
      const posB = nodes[b].position;
      
      const midPoint = new THREE.Vector3(
        (posA.x + posB.x) / 2,
        (posA.y + posB.y) / 2,
        (posA.z + posB.z) / 2
      );
      
      const distance = posA.distanceTo(posB);
      const elevation = distance * 0.2;
      
      const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
      const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
      
      if (perpendicular.length() < 0.1) {
        perpendicular.set(0, 0, 1);
      }
      
      midPoint.add(perpendicular.multiplyScalar(elevation));
      
      const curve = new THREE.QuadraticBezierCurve3(posA, midPoint, posB);
      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      scene.add(line);
    };

    const connect = (a, b, customMaterial = materialLink) => {
      const points = [nodes[a].position, nodes[b].position];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, customMaterial);
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
          
          if (i < size - 1) {
            connect(index, indexAt(i + 1, j));
          } else {
            connectCurved(index, indexAt(0, j), materialWrapLink);
          }
          
          if (j < size - 1) {
            connect(index, indexAt(i, j + 1));
          } else {
            connectCurved(index, indexAt(i, 0), materialWrapLink);
          }
        }
      }
    } else if (dims === 3) {
      for (let i of range) {
        for (let j of range) {
          for (let k of range) {
            const index = indexAt(i, j, k);
            
            if (i < size - 1) {
              connect(index, indexAt(i + 1, j, k));
            } else {
              connectCurved(index, indexAt(0, j, k), materialWrapLink);
            }
            
            if (j < size - 1) {
              connect(index, indexAt(i, j + 1, k));
            } else {
              connectCurved(index, indexAt(i, 0, k), materialWrapLink);
            }
            
            if (k < size - 1) {
              connect(index, indexAt(i, j, k + 1));
            } else {
              connectCurved(index, indexAt(i, j, 0), materialWrapLink);
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
      materialWrapLink.dispose();
    };
  }, [params]);

  return <div ref={mountRef} class="w-full h-full" />;
}
