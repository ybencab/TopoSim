# Network Topology Simulator

An interactive 3D visualization tool for interconnection network architectures. This project renders complex topologies and calculates theoretical metrics in real-time, designed for students, researchers, and computer architecture enthusiasts.

## Key Features

* **Interactive 3D Visualization**: Full orbital controls (zoom, rotate, pan) to inspect the network structure from any angle.
* **Supported Topologies**:
    * **Mesh**: Supports 2D, 3D, and even 4D visualization (using hypercube projection).
    * **Torus**: Similar to Mesh but with wrap-around links visualized as curved connections.
    * **Fat Tree (k-ary n-tree)**: Hierarchical visualization showing Hosts, Switches, and Core layers.
    * **WK-Recursive**: A scalable, recursive topology visualization.
* **Real-Time Metric Calculation**: A floating panel that mathematically analyzes the selected topology based on current parameters:
    * Symmetry & Homogeneity.
    * Switch Degree & Connectivity.
    * Bisection Bandwidth (Physical Links).
    * Hop Count (Diameter).

## Tech Stack

* **Core**: [Preact](https://preactjs.com/) (Fast 3kB alternative to React).
* **3D Graphics**: [Three.js](https://threejs.org/) (Direct implementation via hooks).
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (v4).
* **Build Tool**: [Vite](https://vitejs.dev/).

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
* **Node.js** (Latest version recommended).
* **npm** (Usually comes installed with Node.js).

## Installation & Usage

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ybencab/TopoSim.git
    cd TopoSim
    ```

2.  **Install dependencies**
    This project uses modern lightweight libraries. Install them using npm:
    ```bash
    npm install
    ```

3.  **Start development server**
    This will start the Vite local server:
    ```bash
    npm run dev
    ```

4.  **Open in browser**
    Visit the URL shown in your terminal (usually `http://localhost:5173`).

## Project Structure

* `/src/components`: UI components (Selector, Canvas, Stats panel).
* `/src/topologies`: The Three.js logic for each specific network type (Mesh, Torus, etc.).
* `/src/app.jsx`: Main entry point connecting the UI and the Canvas.

## Customization

You can adjust default parameters for topologies in `src/components/topology_selector.jsx` or modify the rendering limits in individual topology files to support larger networks (performance depends on client hardware).

---
