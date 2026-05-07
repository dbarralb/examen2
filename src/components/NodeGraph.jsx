import { useEffect, useRef, useState } from "react";
import { ACTION_KINDS } from "../data/actionTypes.js";

const NT_I = "I";
const NT_N = "N";
const NT_R = "R";

// Wheel graph: center (0) + 4 outer (1=top, 2=right, 3=bottom, 4=left)
const NODE_POSITIONS = [
  { id: 0, cx: 50, cy: 48 },
  { id: 1, cx: 50, cy: 14 },
  { id: 2, cx: 84, cy: 48 },
  { id: 3, cx: 50, cy: 82 },
  { id: 4, cx: 16, cy: 48 },
];

const ADJACENCY = {
  0: [1, 2, 3, 4],
  1: [0, 2, 4],
  2: [0, 1, 3],
  3: [0, 2, 4],
  4: [0, 1, 3],
};

const EDGES = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [2, 3], [3, 4], [4, 1],
];

const TYPE_LABEL = { [NT_I]: "I", [NT_N]: "N", [NT_R]: "✦" };
const TYPE_CLASS = {
  [NT_I]: "ng-node--inspect",
  [NT_N]: "ng-node--interact",
  [NT_R]: "ng-node--resonance",
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateNodeTypes(forcedType) {
  if (forcedType === "inspection") return shuffle([NT_I, NT_I, NT_I, NT_N, NT_R]);
  if (forcedType === "interaction") return shuffle([NT_N, NT_N, NT_N, NT_I, NT_R]);
  return shuffle([NT_I, NT_I, NT_N, NT_N, NT_R]);
}

function computeResult(path, nodeTypes) {
  let iCount = 0;
  let nCount = 0;
  let rBonus = 0;
  for (const id of path) {
    const t = nodeTypes[id];
    if (t === NT_I) iCount++;
    else if (t === NT_N) nCount++;
    else if (t === NT_R) rBonus++;
  }
  return {
    actionKind: nCount > iCount ? ACTION_KINDS.INTERACTION : ACTION_KINDS.INSPECTION,
    resonanceBonus: rBonus,
  };
}

export function NodeGraph({ onResult, onCancel, timerSeconds = 15, forcedGraphType = null }) {
  const [nodeTypes, setNodeTypes] = useState(() => generateNodeTypes(forcedGraphType));
  const [path, setPath] = useState([0]);
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [phase, setPhase] = useState("playing"); // "playing" | "done"
  const intervalRef = useRef(null);

  useEffect(() => {
    setNodeTypes(generateNodeTypes(forcedGraphType));
    setPath([0]);
    setTimeLeft(timerSeconds);
    setPhase("playing");
  }, [forcedGraphType, timerSeconds]);

  useEffect(() => {
    if (phase !== "playing") return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(intervalRef.current);
  }, [phase]);

  useEffect(() => {
    if (timeLeft === 0 && phase === "playing") {
      window.clearInterval(intervalRef.current);
      setPhase("done");
      onResult(computeResult(path, nodeTypes));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  function confirmPath(currentPath, currentTypes) {
    if (phase !== "playing") return;
    window.clearInterval(intervalRef.current);
    setPhase("done");
    onResult(computeResult(currentPath, currentTypes));
  }

  function handleTap(nodeId) {
    if (phase !== "playing") return;
    const current = path[path.length - 1];
    if (nodeId === current || path.includes(nodeId)) return;
    if (!ADJACENCY[current].includes(nodeId)) return;

    const next = [...path, nodeId];
    setPath(next);

    if (next.length === NODE_POSITIONS.length) {
      window.clearInterval(intervalRef.current);
      setPhase("done");
      onResult(computeResult(next, nodeTypes));
    }
  }

  const currentId = path[path.length - 1];
  const reachable = phase === "playing"
    ? ADJACENCY[currentId].filter((id) => !path.includes(id))
    : [];
  const timerPct = Math.round((timeLeft / timerSeconds) * 100);

  return (
    <div className="nodegraph">
      <div className="nodegraph-timer-track">
        <div
          className={`nodegraph-timer-fill${timeLeft <= 5 ? " nodegraph-timer-fill--urgent" : ""}`}
          style={{ width: `${timerPct}%` }}
        />
        <span className="nodegraph-timer-num">{timeLeft}s</span>
      </div>

      <svg
        className="nodegraph-svg"
        viewBox="0 0 100 100"
        aria-label="Grafo de accion"
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
          const type = nodeTypes[id];
          const visited = path.includes(id);
          const isCurrent = id === currentId;
          const isReachable = reachable.includes(id);
          return (
            <g
              key={id}
              onClick={() => handleTap(id)}
              onKeyDown={(e) => e.key === "Enter" && handleTap(id)}
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

      <p className="nodegraph-path-info">
        Recorrido: {path.length}&thinsp;/&thinsp;{NODE_POSITIONS.length}
      </p>

      <div className="nodegraph-btns">
        <button
          type="button"
          className="nodegraph-btn nodegraph-btn--confirm"
          disabled={path.length < 2 || phase !== "playing"}
          onClick={() => confirmPath(path, nodeTypes)}
        >
          Ejecutar
        </button>
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
