import { useCallback, useEffect, useRef, useState } from "react";

const NT_START = "START";
const NT_EXIT  = "EXIT";
const NT_DATA  = "DATA";
const NT_VOID  = "VOID";
const NT_BOOST = "BOOST";
const NT_NOISE = "NOISE";

const NODE_TYPE_CHARGE = {
  [NT_START]: 0,
  [NT_EXIT]:  0,
  [NT_DATA]:  1,
  [NT_VOID]:  0,
  [NT_BOOST]: 2,
  [NT_NOISE]: -1,
};

const TYPE_LABEL = {
  [NT_START]: "S",
  [NT_EXIT]:  "X",
  [NT_DATA]:  "◆",
  [NT_VOID]:  "○",
  [NT_BOOST]: "✦",
  [NT_NOISE]: "✗",
};

const TYPE_CLASS = {
  [NT_START]: "ng-node--start",
  [NT_EXIT]:  "ng-node--exit",
  [NT_DATA]:  "ng-node--data",
  [NT_VOID]:  "ng-node--void",
  [NT_BOOST]: "ng-node--boost",
  [NT_NOISE]: "ng-node--noise",
};

// 10 fixed positions in an irregular 4-col × 3-row grid (viewBox 0 0 110 110)
const NODE_POSITIONS = [
  { id: 0, cx: 15, cy: 37 },  // START — always here (col 0, row 1)
  { id: 1, cx: 15, cy: 73 },  // col 0, row 2
  { id: 2, cx: 40, cy: 18 },  // col 1, row 0
  { id: 3, cx: 40, cy: 55 },  // col 1, row 1
  { id: 4, cx: 40, cy: 91 },  // col 1, row 2
  { id: 5, cx: 70, cy: 18 },  // col 2, row 0
  { id: 6, cx: 70, cy: 55 },  // col 2, row 1
  { id: 7, cx: 70, cy: 91 },  // col 2, row 2
  { id: 8, cx: 95, cy: 37 },  // col 3, row 1 — EXIT candidate
  { id: 9, cx: 95, cy: 73 },  // col 3, row 2 — EXIT candidate
];

const ADJACENCY = {
  0: [1, 2, 3],
  1: [0, 3, 4],
  2: [0, 3, 5],
  3: [0, 1, 2, 4, 5, 6],
  4: [1, 3, 6, 7],
  5: [2, 3, 6, 8],
  6: [3, 4, 5, 7, 8, 9],
  7: [4, 6, 9],
  8: [5, 6, 9],
  9: [6, 7, 8],
};

// Derive edge list from adjacency (unique pairs only)
const EDGES = (() => {
  const seen = new Set();
  const result = [];
  for (const [a, neighbors] of Object.entries(ADJACENCY)) {
    for (const b of neighbors) {
      const key = [Math.min(Number(a), b), Math.max(Number(a), b)].join("-");
      if (!seen.has(key)) { seen.add(key); result.push([Number(a), b]); }
    }
  }
  return result;
})();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function bfsReachable(startId, exitId) {
  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur === exitId) return true;
    for (const nb of ADJACENCY[cur] || []) {
      if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
    }
  }
  return false;
}

// Node type pool for 8 free slots (excluding START and EXIT)
const TYPE_POOL = [NT_DATA, NT_DATA, NT_DATA, NT_DATA, NT_BOOST, NT_BOOST, NT_NOISE, NT_VOID];

function generateGraph() {
  const START_ID = 0;
  const exitCandidates = [8, 9, 7, 5]; // prefer right side

  for (let attempt = 0; attempt < 12; attempt++) {
    const exitId = exitCandidates[Math.floor(Math.random() * (attempt < 6 ? 2 : exitCandidates.length))];
    const remaining = NODE_POSITIONS.map(n => n.id).filter(id => id !== START_ID && id !== exitId);
    const shuffledTypes = shuffle(TYPE_POOL);
    const nodeTypes = { [START_ID]: NT_START, [exitId]: NT_EXIT };
    remaining.forEach((id, i) => { nodeTypes[id] = shuffledTypes[i]; });

    if (bfsReachable(START_ID, exitId)) {
      return { nodeTypes, exitId };
    }
  }

  // Deterministic fallback
  const nodeTypes = { 0: NT_START, 9: NT_EXIT };
  [1, 2, 3, 4, 5, 6, 7, 8].forEach((id, i) => {
    nodeTypes[id] = TYPE_POOL[i];
  });
  return { nodeTypes, exitId: 9 };
}

function computeCharge(path, nodeTypes) {
  return path.reduce((sum, id) => sum + (NODE_TYPE_CHARGE[nodeTypes[id]] || 0), 0);
}

export function NodeGraph({ onResult, onCancel, timerSeconds = 10 }) {
  const [graph, setGraph] = useState(() => generateGraph());
  const [path, setPath] = useState([0]);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [phase, setPhase] = useState("playing"); // "playing" | "done"
  const intervalRef = useRef(null);

  // Reset when re-mounted
  useEffect(() => {
    const g = generateGraph();
    setGraph(g);
    setPath([0]);
    setTimeLeft(timerSeconds);
    setPhase("playing");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          window.clearInterval(intervalRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [phase]);

  // Timer expired → fail
  const handleTimeExpired = useCallback(() => {
    if (phase !== "playing") return;
    setPhase("done");
    onResult({ charge: 0, success: false });
  }, [phase, onResult]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "playing") {
      handleTimeExpired();
    }
  }, [timeLeft, phase, handleTimeExpired]);

  function handleTap(nodeId) {
    if (phase !== "playing") return;
    const current = path[path.length - 1];
    if (nodeId === current || path.includes(nodeId)) return;
    if (!ADJACENCY[current]?.includes(nodeId)) return;

    const next = [...path, nodeId];
    setPath(next);

    if (nodeId === graph.exitId) {
      window.clearInterval(intervalRef.current);
      setPhase("done");
      onResult({ charge: Math.max(0, computeCharge(next, graph.nodeTypes)), success: true });
    }
  }

  const currentId = path[path.length - 1];
  const reachable = phase === "playing"
    ? (ADJACENCY[currentId] || []).filter(id => !path.includes(id))
    : [];
  const timerPct = Math.round((timeLeft / timerSeconds) * 100);
  const currentCharge = Math.max(0, computeCharge(path, graph.nodeTypes));

  return (
    <div className="nodegraph">
      <div className="nodegraph-timer-track">
        <div
          className={`nodegraph-timer-fill${timeLeft <= 3 ? " nodegraph-timer-fill--urgent" : ""}`}
          style={{ width: `${timerPct}%` }}
        />
        <span className="nodegraph-timer-num">{timeLeft}s</span>
      </div>

      <svg
        className="nodegraph-svg"
        viewBox="0 0 110 110"
        aria-label="Red de conexion"
      >
        {EDGES.map(([a, b]) => {
          const nA = NODE_POSITIONS[a];
          const nB = NODE_POSITIONS[b];
          const pA = path.indexOf(a);
          const pB = path.indexOf(b);
          const linked = pA >= 0 && pB >= 0 && Math.abs(pA - pB) === 1;
          return (
            <line
              key={`${a}-${b}`}
              x1={nA.cx} y1={nA.cy}
              x2={nB.cx} y2={nB.cy}
              className={`nodegraph-edge${linked ? " nodegraph-edge--active" : ""}`}
            />
          );
        })}

        {NODE_POSITIONS.map(({ id, cx, cy }) => {
          const type = graph.nodeTypes[id];
          const visited = path.includes(id);
          const isCurrent = id === currentId;
          const isReachable = reachable.includes(id);
          return (
            <g
              key={id}
              onClick={() => handleTap(id)}
              onKeyDown={e => e.key === "Enter" && handleTap(id)}
              className={[
                "nodegraph-node",
                TYPE_CLASS[type],
                isCurrent ? "nodegraph-node--current" : "",
                visited && !isCurrent ? "nodegraph-node--visited" : "",
                isReachable ? "nodegraph-node--reachable" : "",
              ].filter(Boolean).join(" ")}
              role="button"
              tabIndex={0}
              aria-label={`Nodo ${TYPE_LABEL[type]}`}
              aria-pressed={visited}
            >
              <circle cx={cx} cy={cy} r="14" className="nodegraph-hit" />
              <circle cx={cx} cy={cy} r="9" className="nodegraph-ring" />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="nodegraph-label"
              >
                {TYPE_LABEL[type]}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="nodegraph-status-row">
        <p className="nodegraph-charge-info">
          Carga: <strong>{currentCharge}</strong>
        </p>
        <p className="nodegraph-path-info">
          Nodos: {path.length}&thinsp;/&thinsp;{NODE_POSITIONS.length}
        </p>
      </div>

      <div className="nodegraph-legend" aria-label="Leyenda de la red">
        <span><b className="nodegraph-legend-data">◆</b> +1</span>
        <span><b className="nodegraph-legend-boost">✦</b> +2</span>
        <span><b className="nodegraph-legend-noise">✗</b> -1</span>
        <span><b className="nodegraph-legend-exit">X</b> Salida</span>
      </div>

      <div className="nodegraph-btns">
        <button
          type="button"
          className="nodegraph-btn nodegraph-btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
