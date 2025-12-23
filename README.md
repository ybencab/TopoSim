# TopoSim

An interactive 3D visualization tool for interconnection network architectures. This project renders complex topologies and calculates theoretical metrics in real-time, designed for students, researchers, and computer architecture enthusiasts.

## Key Features

* **Interactive 3D Visualization**: Full orbital controls (zoom, rotate, pan) to inspect the network structure from any angle.
* **Supported Topologies**:
    * **Mesh**: Configurable by dimensions ($n$) and size ($k$).
    * **Fat Tree (k-ary n-tree)**: Hierarchical visualization of switches and hosts.
* **Real-Time Metric Calculation**: A floating panel that mathematically analyzes the selected topology:
    * Symmetry & Homogeneity.
    * Switch Degree & Connectivity.
    * Bisection Bandwidth.
    * Hop Count (Diameter) & Total Links/Switches.

* **Core**: [Preact](https://preactjs.com/) (Fast 3kB alternative to React).
* **3D Graphics**: [Three.js](https://threejs.org/) ecosystem (`@react-three/fiber` & `@react-three/drei`).
* **Styling**: [Tailwind CSS](https://tailwindcss.com/).
* **Build Tool**: [Vite](https://vitejs.dev/).

## Installation & Usage

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ybencab/TopoSim.git
    cd TopoSim
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start development server**
    ```bash
    npm run dev
    ```

4.  **Open in browser**
    Visit `http://localhost:8080` (or the port shown in your terminal).
