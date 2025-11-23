import { useMemo } from 'react';
import type { ScaffoldGraph } from '../../lib/scaffold/model';

interface Scaffold2DElevationProps {
  graph: ScaffoldGraph;
}

export function Scaffold2DElevation({ graph }: Scaffold2DElevationProps) {
  const drawing = useMemo(() => {
    const bays = graph.bays;
    const lifts = graph.lifts;

    if (bays.length === 0 || lifts.length === 0) {
      return null;
    }

    const totalLength = bays.reduce((sum, bay) => sum + bay.length_m, 0);
    const maxHeight = Math.max(...lifts.map(l => l.height_m));
    const liftHeight = graph.meta.params?.lift_m || 2;

    const padding = 30;
    const viewWidth = 300;
    const viewHeight = 200;
    const drawWidth = viewWidth - 2 * padding;
    const drawHeight = viewHeight - 2 * padding;

    const scaleX = drawWidth / totalLength;
    const scaleY = drawHeight / maxHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = padding + (drawWidth - totalLength * scale) / 2;
    const offsetY = padding;

    const toX = (lengthM: number) => offsetX + lengthM * scale;
    const toY = (heightM: number) => offsetY + drawHeight - heightM * scale;

    const elements: JSX.Element[] = [];

    let cumulativeLength = 0;
    const bayPositions: number[] = [];
    for (const bay of bays) {
      bayPositions.push(cumulativeLength);
      cumulativeLength += bay.length_m;
    }
    bayPositions.push(cumulativeLength);

    for (let liftIdx = 0; liftIdx <= lifts.length; liftIdx++) {
      const heightM = liftIdx === 0 ? 0 : lifts[liftIdx - 1].height_m;
      const y = toY(heightM);

      for (let bayIdx = 0; bayIdx < bayPositions.length; bayIdx++) {
        const x = toX(bayPositions[bayIdx]);

        if (liftIdx < lifts.length) {
          const nextHeightM = liftIdx === 0 ? liftHeight : lifts[liftIdx].height_m;
          const nextY = toY(nextHeightM);
          elements.push(
            <line
              key={`standard-${bayIdx}-${liftIdx}`}
              x1={x}
              y1={y}
              x2={x}
              y2={nextY}
              stroke="#667eea"
              strokeWidth="2"
            />
          );
        }
      }
    }

    for (let liftIdx = 0; liftIdx <= lifts.length; liftIdx++) {
      const heightM = liftIdx === 0 ? 0 : lifts[liftIdx - 1].height_m;
      const y = toY(heightM);

      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx++) {
        const x1 = toX(bayPositions[bayIdx]);
        const x2 = toX(bayPositions[bayIdx + 1]);
        elements.push(
          <line
            key={`ledger-${bayIdx}-${liftIdx}`}
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke="#667eea"
            strokeWidth="1.5"
          />
        );
      }
    }

    for (let liftIdx = 0; liftIdx <= lifts.length; liftIdx++) {
      const heightM = liftIdx === 0 ? 0 : lifts[liftIdx - 1].height_m;
      const y = toY(heightM);

      for (let bayIdx = 0; bayIdx < bayPositions.length; bayIdx++) {
        const x = toX(bayPositions[bayIdx]);
        elements.push(
          <line
            key={`transom-${bayIdx}-${liftIdx}`}
            x1={x - 3}
            y1={y}
            x2={x + 3}
            y2={y}
            stroke="#667eea"
            strokeWidth="1"
          />
        );
      }
    }

    for (let liftIdx = 1; liftIdx < lifts.length; liftIdx++) {
      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx += 5) {
        if (bayIdx + 1 < bayPositions.length) {
          const x1 = toX(bayPositions[bayIdx]);
          const x2 = toX(bayPositions[bayIdx + 1]);
          const y1 = toY(lifts[liftIdx - 1].height_m);
          const y2 = toY(lifts[liftIdx].height_m);
          elements.push(
            <line
              key={`diagonal-${bayIdx}-${liftIdx}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#667eea"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          );
        }
      }
    }

    if (lifts.length > 0) {
      const topY = toY(lifts[lifts.length - 1].height_m);
      const guardOffset = 5;
      for (let bayIdx = 0; bayIdx < bayPositions.length - 1; bayIdx++) {
        const x1 = toX(bayPositions[bayIdx]);
        const x2 = toX(bayPositions[bayIdx + 1]);
        elements.push(
          <line
            key={`guardrail-${bayIdx}`}
            x1={x1}
            y1={topY - guardOffset}
            x2={x2}
            y2={topY - guardOffset}
            stroke="#ffffff"
            strokeWidth="1"
          />
        );
        elements.push(
          <line
            key={`toeboard-${bayIdx}`}
            x1={x1}
            y1={topY + 2}
            x2={x2}
            y2={topY + 2}
            stroke="#ffffff"
            strokeWidth="2"
          />
        );
      }
    }

    elements.push(
      <text
        key="label-length"
        x={offsetX + (totalLength * scale) / 2}
        y={viewHeight - 5}
        fill="#e5e5e5"
        fontSize="8"
        textAnchor="middle"
      >
        {totalLength.toFixed(1)}m
      </text>
    );

    elements.push(
      <text
        key="label-height"
        x={5}
        y={offsetY + drawHeight / 2}
        fill="#e5e5e5"
        fontSize="8"
        textAnchor="start"
        transform={`rotate(-90 5 ${offsetY + drawHeight / 2})`}
      >
        {maxHeight.toFixed(1)}m
      </text>
    );

    elements.push(
      <text
        key="label-lift"
        x={viewWidth - 5}
        y={offsetY + 10}
        fill="#999"
        fontSize="7"
        textAnchor="end"
      >
        Lift: {liftHeight.toFixed(1)}m
      </text>
    );

    return elements;
  }, [graph]);

  if (!drawing) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-[#666] text-sm">No scaffold data</p>
      </div>
    );
  }

  return (
    <svg viewBox="0 0 300 200" className="w-full h-full">
      {drawing}
    </svg>
  );
}
