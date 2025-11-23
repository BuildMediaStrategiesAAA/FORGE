import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { ScaffoldGraph } from '../../lib/scaffold/model';

interface Scaffold3DModelProps {
  graph: ScaffoldGraph;
}

function ScaffoldMesh({ graph }: { graph: ScaffoldGraph }) {
  const { standards, ledgers, transoms, diagonals, planks } = useMemo(() => {
    const bays = graph.bays;
    const lifts = graph.lifts;

    if (bays.length === 0 || lifts.length === 0) {
      return { standards: [], ledgers: [], transoms: [], diagonals: [], planks: [] };
    }

    const totalLength = bays.reduce((sum, bay) => sum + bay.length_m, 0);
    const maxHeight = Math.max(...lifts.map(l => l.height_m));
    const depthM = 1.5;

    const scale = Math.max(totalLength, maxHeight, depthM);

    let cumulativeLength = 0;
    const bayPositions: number[] = [];
    for (const bay of bays) {
      bayPositions.push(cumulativeLength);
      cumulativeLength += bay.length_m;
    }
    bayPositions.push(cumulativeLength);

    const liftHeights: number[] = [0];
    for (const lift of lifts) {
      liftHeights.push(lift.height_m);
    }

    const toScaled = (val: number) => (val / scale) * 10;

    const standardsList: JSX.Element[] = [];
    const ledgersList: JSX.Element[] = [];
    const transomsList: JSX.Element[] = [];
    const diagonalsList: JSX.Element[] = [];
    const planksList: JSX.Element[] = [];

    for (let bayIdx = 0; bayIdx < bayPositions.length; bayIdx++) {
      for (let d = 0; d <= 1; d++) {
        const x = toScaled(bayPositions[bayIdx]);
        const z = d === 0 ? 0 : toScaled(depthM);

        for (let liftIdx = 0; liftIdx < liftHeights.length - 1; liftIdx++) {
          const y1 = toScaled(liftHeights[liftIdx]);
          const y2 = toScaled(liftHeights[liftIdx + 1]);
          const height = y2 - y1;

          standardsList.push(
            <mesh key={`std-${bayIdx}-${d}-${liftIdx}`} position={[x, (y1 + y2) / 2, z]}>
              <cylinderGeometry args={[0.03, 0.03, height, 8]} />
              <meshStandardMaterial color="#667eea" />
            </mesh>
          );
        }
      }
    }

    for (let liftIdx = 0; liftIdx < liftHeights.length; liftIdx++) {
      const y = toScaled(liftHeights[liftIdx]);

      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx++) {
        const x1 = toScaled(bayPositions[bayIdx]);
        const x2 = toScaled(bayPositions[bayIdx + 1]);
        const length = x2 - x1;

        for (let d = 0; d <= 1; d++) {
          const z = d === 0 ? 0 : toScaled(depthM);
          ledgersList.push(
            <mesh
              key={`ledger-${bayIdx}-${liftIdx}-${d}`}
              position={[(x1 + x2) / 2, y, z]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.025, 0.025, length, 8]} />
              <meshStandardMaterial color="#8899ff" />
            </mesh>
          );
        }
      }

      for (let bayIdx = 0; bayIdx < bayPositions.length; bayIdx++) {
        const x = toScaled(bayPositions[bayIdx]);
        const z1 = 0;
        const z2 = toScaled(depthM);
        const depth = z2 - z1;

        transomsList.push(
          <mesh
            key={`transom-${bayIdx}-${liftIdx}`}
            position={[x, y, (z1 + z2) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.025, 0.025, depth, 8]} />
            <meshStandardMaterial color="#8899ff" />
          </mesh>
        );
      }
    }

    for (let liftIdx = 1; liftIdx < liftHeights.length; liftIdx++) {
      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx += 5) {
        if (bayIdx + 1 < bayPositions.length) {
          const x1 = toScaled(bayPositions[bayIdx]);
          const x2 = toScaled(bayPositions[bayIdx + 1]);
          const y1 = toScaled(liftHeights[liftIdx - 1]);
          const y2 = toScaled(liftHeights[liftIdx]);
          const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
          const angle = Math.atan2(y2 - y1, x2 - x1);

          for (let d = 0; d <= 1; d++) {
            const z = d === 0 ? 0 : toScaled(depthM);
            diagonalsList.push(
              <mesh
                key={`diag-${bayIdx}-${liftIdx}-${d}`}
                position={[(x1 + x2) / 2, (y1 + y2) / 2, z]}
                rotation={[0, 0, angle]}
              >
                <cylinderGeometry args={[0.015, 0.015, length, 8]} />
                <meshStandardMaterial color="#5566dd" />
              </mesh>
            );
          }
        }
      }
    }

    for (let liftIdx = 1; liftIdx < liftHeights.length; liftIdx++) {
      const y = toScaled(liftHeights[liftIdx]);
      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx++) {
        const x1 = toScaled(bayPositions[bayIdx]);
        const x2 = toScaled(bayPositions[bayIdx + 1]);
        const length = x2 - x1;
        const depth = toScaled(depthM);

        planksList.push(
          <mesh key={`plank-${bayIdx}-${liftIdx}`} position={[(x1 + x2) / 2, y + 0.05, depth / 2]}>
            <boxGeometry args={[length, 0.05, depth]} />
            <meshStandardMaterial color="#aa8866" opacity={0.6} transparent />
          </mesh>
        );
      }
    }

    return {
      standards: standardsList,
      ledgers: ledgersList,
      transoms: transomsList,
      diagonals: diagonalsList,
      planks: planksList,
    };
  }, [graph]);

  return (
    <group>
      {standards}
      {ledgers}
      {transoms}
      {diagonals}
      {planks}
    </group>
  );
}

export function Scaffold3DModel({ graph }: Scaffold3DModelProps) {
  if (graph.bays.length === 0 || graph.lifts.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#666] text-sm">No scaffold data</p>
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [15, 10, 15], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <ScaffoldMesh graph={graph} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      <gridHelper args={[20, 20, '#333', '#1a1a1a']} />
    </Canvas>
  );
}
