import { useMemo, useState } from "react";
import { AccessScreen } from "./screens/AccessScreen.jsx";
import { RoleSelectScreen } from "./screens/RoleSelectScreen.jsx";
import { WaitingScreen } from "./screens/WaitingScreen.jsx";
import { PlayerScreen } from "./screens/PlayerScreen.jsx";
import { GMScreen } from "./screens/GMScreen.jsx";
import { DeviceScreen } from "./screens/DeviceScreen.jsx";
import { GameCursor } from "./components/GameCursor.jsx";
import { hasValidStoredGmSessionCode } from "./services/sessionAccess.js";

const routes = {
  access: AccessScreen,
  roles: RoleSelectScreen,
  waiting: WaitingScreen,
  player: PlayerScreen,
  gm: GMScreen,
  device: DeviceScreen,
};

function getInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  return params.get("screen") || "access";
}

function getInitialParams() {
  return new URLSearchParams(window.location.search);
}

export default function App() {
  const [locationState, setLocationState] = useState(() => ({
    screen: getInitialRoute(),
    params: getInitialParams(),
  }));
  const requestedScreen = locationState.screen === "gm" && !hasValidStoredGmSessionCode()
    ? "access"
    : locationState.screen;
  const Screen = routes[requestedScreen] || AccessScreen;

  const navigation = useMemo(
    () => ({
      go(screen, nextParams = {}) {
        const params = new URLSearchParams({ screen });

        Object.entries(nextParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
          }
        });

        window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`);
        setLocationState({ screen, params });
      },
    }),
    []
  );

  return (
    <>
      <Screen navigation={navigation} params={locationState.params} />
      <GameCursor />
    </>
  );
}
