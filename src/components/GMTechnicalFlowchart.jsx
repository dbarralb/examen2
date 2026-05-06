import { useMemo, useState } from "react";
import { NBadge } from "./e2";
import {
  DOOR_STATES,
  LOCKER_STATES,
  PANEL_STATES,
  getScenarioScopedTargetKey,
} from "../data/scenarioContent.js";
import { firebasePatch } from "../services/firebaseClient.js";
import { normalizeRemoteList } from "../services/remoteState.js";

const SCENARIO_ID = "almacen";
const FLOW_VARIANTS = ["A", "B"];

const STATUS_LABELS = {
  pending: "pendiente",
  available: "disponible",
  active: "activo",
  complete: "completado",
  blocked: "bloqueado",
};

const STATUS_BADGES = {
  pending: "muted",
  available: "info",
  active: "warning",
  complete: "success",
  blocked: "danger",
};

const FLOW_LANES = [
  {
    id: "locker",
    title: "Taquilla / modulo",
    nodes: [
      {
        id: "initial-locker",
        title: "Lectura inicial A/B",
        variants: ["A", "B"],
        overlays: {
          before: ["LOCKER_LOCKED_A", "LOCKER_MECHANISM_B"],
          after: ["LOCKER_MISSING_OTHER_HALF_A", "LOCKER_MISSING_OTHER_HALF_B"],
        },
        condition: "Inicio -> los jugadores tienen que observar la taquilla en A y B y comunicar que cada variante muestra una mitad distinta del cierre.",
        evidence: ["hotspotStates", "inspectionDiscoveries"],
        getStatus: ({ hasLockerProgress }) => hasLockerProgress ? "complete" : "active",
      },
      {
        id: "contradictions",
        title: "Contradicciones registradas",
        variants: ["A", "B"],
        overlays: {
          before: ["BOX_DUPLICATE_AB", "BALLS_COUNT_AB", "LOCKER_DETAIL_AB"],
          after: ["RESONANCE_READY"],
        },
        condition: "Variante A/B -> los jugadores tienen que inspeccionar caja, balones o taquillas para registrar contradicciones y cargar resonancia.",
        evidence: ["contradiccionTaquillas", "resonance.value", "queuedActions"],
        getStatus: ({ flags, resonanceValue, hasQueuedLockerInspection }) => {
          if (flags.contradiccionTaquillas || resonanceValue > 0) return "complete";
          if (hasQueuedLockerInspection) return "available";
          return "pending";
        },
      },
      {
        id: "locker-fusion",
        title: "Taquilla fusionada",
        variants: ["A+B"],
        overlays: {
          before: ["LOCKER_LOCKED_A", "LOCKER_MECHANISM_B"],
          after: ["LOCKER_FUSION_AB"],
        },
        condition: "A+B -> los jugadores tienen que manipular la taquilla durante un pulso con 6 o mas de resonancia disponible.",
        evidence: ["lockerFusionDone", "LOCKER_FUSION", "resonance.spent"],
        debugAction: "fuseLocker",
        getStatus: ({ lockerStates, flags, resonanceValue, hasQueuedLockerInteraction }) => {
          if (lockerStates.every((state) => state === LOCKER_STATES.FUSION || state === LOCKER_STATES.OPEN)) return "complete";
          if (flags.contradiccionTaquillas && resonanceValue >= 6) return "available";
          if (hasQueuedLockerInteraction) return "active";
          return "blocked";
        },
      },
      {
        id: "locker-open",
        title: "Taquilla abierta",
        variants: ["A+B"],
        overlays: {
          before: ["LOCKER_FUSION_AB"],
          after: ["LOCKER_OPEN_FUSED_AB", "NOTE_PANEL_MODULE_AB"],
        },
        condition: "A+B -> despues de fusionarla, los jugadores tienen que manipular otra vez la taquilla para abrirla.",
        evidence: ["LOCKER_OPEN", "moduleSyncAvailable"],
        debugAction: "openLocker",
        getStatus: ({ lockerStates, anyLockerFusion }) => {
          if (lockerStates.every((state) => state === LOCKER_STATES.OPEN)) return "complete";
          if (anyLockerFusion) return "available";
          return "blocked";
        },
      },
      {
        id: "module-available",
        title: "Modulo disponible",
        variants: ["A+B"],
        overlays: {
          before: ["LOCKER_OPEN_FUSED_AB"],
          after: ["MODULE_SYNC_01", "NOTE_PANEL_MODULE_01"],
        },
        condition: "A+B -> al abrir la taquilla fusionada, los jugadores pueden ver y recoger el modulo y la nota.",
        evidence: ["moduleSyncAvailable", "mecanismoFisicoLiberado"],
        getStatus: ({ flags }) => flags.moduleSyncAvailable ? "complete" : "pending",
      },
    ],
  },
  {
    id: "panel",
    title: "Panel / salida",
    nodes: [
      {
        id: "panel-initial",
        title: "Panel incompleto A/B",
        variants: ["A", "B"],
        overlays: {
          before: ["PANEL_NEEDS_MODULE_A", "PANEL_READER_B"],
          after: ["PANEL_MISSING_OTHER_HALF_A", "PANEL_MISSING_OTHER_HALF_B"],
        },
        condition: "Inicio -> los jugadores tienen que observar el panel en A y B y entender que una variante muestra interfaz y la otra muestra lectura/conexion.",
        evidence: ["PANEL_NEEDS_MODULE", "inspectionDiscoveries"],
        getStatus: ({ hasPanelProgress }) => hasPanelProgress ? "complete" : "active",
      },
      {
        id: "module-inserted",
        title: "Modulo insertado",
        variants: ["A+B"],
        overlays: {
          before: ["MODULE_SYNC_01", "PANEL_NEEDS_MODULE_A", "PANEL_READER_B"],
          after: ["MODULE_INSERTED_AB"],
        },
        condition: "A+B -> los jugadores tienen que llevar el modulo de sincronizacion al panel y usar interaccion sobre el panel de salida.",
        evidence: ["moduleSyncInserted"],
        debugAction: "insertModule",
        getStatus: ({ flags }) => flags.moduleSyncInserted ? "complete" : flags.moduleSyncAvailable ? "available" : "blocked",
      },
      {
        id: "panel-fusion",
        title: "Panel fusionado",
        variants: ["A+B"],
        overlays: {
          before: ["MODULE_INSERTED_AB"],
          after: ["PANEL_FUSION_AB"],
        },
        condition: "A+B -> cuando el modulo encaja, el sistema tiene que alinear el panel de A y B en un unico panel fusionado.",
        evidence: ["PANEL_FUSION", "moduleSyncInserted"],
        debugAction: "insertModule",
        getStatus: ({ panelStates, flags }) => {
          if (panelStates.every((state) => state === PANEL_STATES.FUSION || state === PANEL_STATES.OK)) return "complete";
          if (flags.moduleSyncInserted) return "active";
          if (flags.moduleSyncAvailable) return "available";
          return "blocked";
        },
      },
      {
        id: "panel-ok",
        title: "Panel validado",
        variants: ["A+B"],
        overlays: {
          before: ["PANEL_FUSION_AB"],
          after: ["PANEL_OK_AB"],
        },
        condition: "A+B -> con el panel fusionado, los jugadores tienen que inspeccionar o introducir el codigo reconstruido.",
        evidence: ["codigoAlmacenCompleto", "PANEL_OK"],
        debugAction: "validatePanel",
        getStatus: ({ panelStates, anyPanelFusion }) => {
          if (panelStates.every((state) => state === PANEL_STATES.OK)) return "complete";
          if (anyPanelFusion) return "available";
          return "blocked";
        },
      },
      {
        id: "door-open",
        title: "Salida abierta",
        variants: ["A+B"],
        overlays: {
          before: ["PANEL_OK_AB", "DOOR_LOCKED_AB"],
          after: ["DOOR_OPEN_AB"],
        },
        condition: "A+B -> con codigo completo y panel validado, los jugadores tienen que ejecutar intentar_salida para abrir la puerta.",
        evidence: ["almacenSalidaLista", "DOOR_OPEN"],
        debugAction: "openDoor",
        getStatus: ({ flags, doorStates }) => (
          flags.almacenSalidaLista || doorStates.every((state) => state === DOOR_STATES.OPEN)
            ? "complete"
            : "blocked"
        ),
      },
    ],
  },
];

function scoped(targetId, variant) {
  return getScenarioScopedTargetKey(SCENARIO_ID, variant, targetId);
}

function getVariantStates(hotspotStates, targetId, fallback) {
  return FLOW_VARIANTS.map((variant) => hotspotStates?.[scoped(targetId, variant)] || fallback);
}

function getStatusContext(remoteState) {
  const gameState = remoteState?.gameState || {};
  const flags = gameState.flags || {};
  const hotspotStates = gameState.hotspotStates || {};
  const queuedActions = normalizeRemoteList(remoteState?.queuedActions);
  const pulseState = remoteState?.pulseState || {};
  const lockerStates = getVariantStates(hotspotStates, "taquillas", LOCKER_STATES.LOCKED);
  const panelStates = getVariantStates(hotspotStates, "panel_salida", PANEL_STATES.NEEDS_MODULE);
  const doorStates = getVariantStates(hotspotStates, "puerta", DOOR_STATES.LOCKED);

  return {
    flags,
    hotspotStates,
    inspectionDiscoveries: gameState.inspectionDiscoveries || {},
    resonanceValue: Number(gameState.resonance?.value || 0),
    resonanceSpent: Number(gameState.resonance?.spent || 0),
    pulseStatus: pulseState.status || "idle",
    lockerStates,
    panelStates,
    doorStates,
    hasLockerProgress: lockerStates.some((state) => state !== LOCKER_STATES.LOCKED) || flags.contradiccionTaquillas,
    hasPanelProgress: panelStates.some((state) => state !== PANEL_STATES.NEEDS_MODULE) || flags.moduleSyncInserted,
    anyLockerFusion: lockerStates.some((state) => state === LOCKER_STATES.FUSION || state === LOCKER_STATES.OPEN),
    anyPanelFusion: panelStates.some((state) => state === PANEL_STATES.FUSION || state === PANEL_STATES.OK),
    hasQueuedLockerInspection: queuedActions.some((action) => action.target === "taquillas" && String(action.card || "").toLowerCase().includes("inspeccion")),
    hasQueuedLockerInteraction: queuedActions.some((action) => action.target === "taquillas" && String(action.card || "").toLowerCase().includes("interaccion")),
  };
}

function buildDebugPatch(actionId) {
  const patch = {};
  const setBoth = (targetId, state) => {
    for (const variant of FLOW_VARIANTS) {
      patch[`gameState/hotspotStates/${scoped(targetId, variant)}`] = state;
    }
  };

  if (actionId === "fuseLocker") {
    setBoth("taquillas", LOCKER_STATES.FUSION);
    patch["gameState/flags/lockerFusionDone"] = true;
    patch["gameState/flags/mecanismoFisicoLocalizado"] = true;
  }

  if (actionId === "openLocker") {
    setBoth("taquillas", LOCKER_STATES.OPEN);
    patch["gameState/flags/lockerFusionDone"] = true;
    patch["gameState/flags/mecanismoFisicoLocalizado"] = true;
    patch["gameState/flags/mecanismoFisicoLiberado"] = true;
    patch["gameState/flags/moduleSyncAvailable"] = true;
  }

  if (actionId === "insertModule") {
    setBoth("taquillas", LOCKER_STATES.OPEN);
    setBoth("panel_salida", PANEL_STATES.FUSION);
    patch["gameState/flags/moduleSyncAvailable"] = true;
    patch["gameState/flags/moduleSyncInserted"] = true;
  }

  if (actionId === "validatePanel") {
    setBoth("panel_salida", PANEL_STATES.OK);
    patch["gameState/flags/moduleSyncInserted"] = true;
    patch["gameState/flags/codigoAlmacenCompleto"] = true;
    patch["gameState/flags/almacenSalidaLista"] = true;
  }

  if (actionId === "openDoor") {
    setBoth("panel_salida", PANEL_STATES.OK);
    setBoth("puerta", DOOR_STATES.OPEN);
    patch["gameState/flags/codigoAlmacenCompleto"] = true;
    patch["gameState/flags/almacenSalidaLista"] = true;
    patch["gameState/flags/almacenCompletado"] = true;
  }

  return patch;
}

function FlowNode({ node, context, debugEnabled, onDebugAction, isBusy }) {
  const status = node.getStatus(context);
  const badgeStatus = STATUS_BADGES[status] || "muted";

  return (
    <article className={`gm-flow-node gm-flow-node--${status}`}>
      <header className="gm-flow-node__header">
        <div>
          <span className="gm-flow-node__kicker">{node.variants.join(" / ")}</span>
          <h4>{node.title}</h4>
        </div>
        <NBadge status={badgeStatus}>{STATUS_LABELS[status]}</NBadge>
      </header>

      <div className="gm-flow-node__overlays">
        <div>
          <span>Antes</span>
          {node.overlays.before.map((overlay) => <code key={overlay}>{overlay}</code>)}
        </div>
        <div>
          <span>Despues</span>
          {node.overlays.after.map((overlay) => <code key={overlay}>{overlay}</code>)}
        </div>
      </div>

      <p className="gm-flow-node__condition">
        <span>Condicion</span>
        {node.condition}
      </p>

      <div className="gm-flow-node__evidence">
        {node.evidence.map((item) => <span key={item}>{item}</span>)}
      </div>

      {debugEnabled && node.debugAction && (
        <button
          type="button"
          className="gm-flow-debug-btn"
          onClick={() => onDebugAction(node.debugAction, node.title)}
          disabled={isBusy}
        >
          Marcar fase
        </button>
      )}
    </article>
  );
}

export function GMTechnicalFlowchart({ remoteState, onRefresh, onStatus }) {
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const context = useMemo(() => getStatusContext(remoteState), [remoteState]);
  const completeCount = useMemo(() => (
    FLOW_LANES.flatMap((lane) => lane.nodes).filter((node) => node.getStatus(context) === "complete").length
  ), [context]);
  const totalCount = FLOW_LANES.reduce((sum, lane) => sum + lane.nodes.length, 0);

  async function handleDebugAction(actionId, label) {
    const patch = buildDebugPatch(actionId);
    setBusyAction(actionId);
    try {
      await firebasePatch("", patch);
      onStatus?.(`Organigrama debug: ${label}.`);
      await onRefresh?.();
    } catch {
      onStatus?.("No se pudo forzar la fase del organigrama.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="gm-flowchart" aria-label="Organigrama tecnico de overlays">
      <div className="gm-flowchart__toolbar">
        <div className="gm-flowchart__summary">
          <NBadge status={completeCount === totalCount ? "success" : "info"}>
            {completeCount}/{totalCount} fases
          </NBadge>
          <NBadge status={context.pulseStatus === "idle" ? "muted" : "warning"}>
            pulso {context.pulseStatus}
          </NBadge>
          <NBadge status={context.resonanceValue >= 6 ? "success" : context.resonanceValue > 0 ? "warning" : "muted"}>
            resonancia {context.resonanceValue}
          </NBadge>
        </div>
        <label className="gm-flowchart__debug-toggle">
          <input
            type="checkbox"
            checked={debugEnabled}
            onChange={(event) => setDebugEnabled(event.target.checked)}
          />
          Debug de flujo
        </label>
      </div>

      <div className="gm-flowchart__lanes">
        {FLOW_LANES.map((lane) => (
          <section key={lane.id} className="gm-flow-lane">
            <header className="gm-flow-lane__title">
              <h3>{lane.title}</h3>
              <span>A / B / A+B</span>
            </header>
            <div className="gm-flow-lane__nodes">
              {lane.nodes.map((node) => (
                <FlowNode
                  key={node.id}
                  node={node}
                  context={context}
                  debugEnabled={debugEnabled}
                  onDebugAction={handleDebugAction}
                  isBusy={Boolean(busyAction)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
