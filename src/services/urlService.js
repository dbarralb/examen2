import { playerRoles } from "../data/roles.js";

function trimTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export function getAppBaseUrl() {
  const configuredUrl = trimTrailingSlash(import.meta.env.VITE_PUBLIC_APP_URL);
  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, "");
}

function buildUrl(params) {
  const query = new URLSearchParams(params);
  return `${getAppBaseUrl()}?${query.toString()}`;
}

export function getGmUrl() {
  return buildUrl({ screen: "gm" });
}

export function getPlayerUrl(roleId) {
  return buildUrl({ screen: "player", role: roleId });
}

export function getPlayerMonitorUrl(roleId) {
  return buildUrl({ screen: "player", role: roleId, view: "gm-monitor" });
}

export function getDeviceUrl(roleId, { code } = {}) {
  const params = { screen: "device", role: roleId };
  if (code) {
    params.code = code;
  }
  return buildUrl(params);
}

export function getRoleSessionCode(session, roleId, lobby = null) {
  return lobby?.roleClaims?.[roleId]?.sessionCode || session?.playerCodes?.[roleId] || "";
}

export function getAllSessionUrls(session = {}, lobby = null) {
  const players = playerRoles.map((role) => ({
    roleId: role.id,
    label: role.label,
    playerUrl: getPlayerUrl(role.id),
    deviceUrl: getDeviceUrl(role.id, { code: getRoleSessionCode(session, role.id, lobby) }),
  }));

  return {
    gmUrl: getGmUrl(),
    players,
  };
}
