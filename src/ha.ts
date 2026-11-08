import {
  getAuth,
  createConnection,
  subscribeEntities,
  subscribeConfig,
  callService,
  ERR_INVALID_AUTH,
  type AuthData,
  type Connection,
  type HassEntities,
  type HassConfig,
} from "home-assistant-js-websocket";
import type { Area, Device, EntityEntry, ServiceCall } from "./rooms.ts";

const TOKEN_KEY = "hv-tokens";
const saveTokens = (data: AuthData | null) => {
  try {
    data ? localStorage.setItem(TOKEN_KEY, JSON.stringify(data)) : localStorage.removeItem(TOKEN_KEY);
  } catch {}
};
const loadTokens = async (): Promise<AuthData | null> => {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export interface Registries {
  areas: Area[];
  devices: Device[];
  entities: EntityEntry[];
}

export interface Handlers {
  states: (states: HassEntities) => void;
  registries: (r: Registries) => void;
  config: (c: HassConfig) => void;
}

export interface HA {
  conn: Connection;
  call: (action: ServiceCall, entityId: string, data?: Record<string, unknown>) => Promise<unknown>;
}

/** Logs in (redirecting to HA's own login page when needed), connects, and keeps the socket alive. */
export async function connect(h: Handlers): Promise<HA> {
  // HA is same-origin through the proxy, so hassUrl is just our origin and the login redirect stays in-app.
  const auth = await getAuth({ hassUrl: location.origin, saveTokens, loadTokens });
  // The library never strips ?code=&auth_callback=1; a reload would re-exchange the used code.
  if (location.search) history.replaceState(null, "", location.pathname);

  // A replaced demo HA invalidates saved tokens. Drop them and ask for login again,
  // the same way a later reconnect does.
  let conn: Connection;
  try {
    conn = await createConnection({ auth });
  } catch (err) {
    if (err === ERR_INVALID_AUTH) {
      saveTokens(null);
      location.replace(location.pathname);
      return new Promise(() => {});
    }
    throw err;
  }
  conn.addEventListener("reconnect-error", (_c, err) => {
    if (err === ERR_INVALID_AUTH) {
      saveTokens(null);
      location.reload();
    }
  });

  subscribeEntities(conn, h.states);
  subscribeConfig(conn, h.config);

  const fetchRegistries = async () => {
    const [areas, devices, display] = await Promise.all([
      conn.sendMessagePromise<Area[]>({ type: "config/area_registry/list" }),
      conn.sendMessagePromise<Device[]>({ type: "config/device_registry/list" }),
      conn.sendMessagePromise<{ entities: EntityEntry[] }>({ type: "config/entity_registry/list_for_display" }),
    ]);
    h.registries({ areas, devices, entities: display.entities });
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refetch = () => {
    clearTimeout(timer);
    timer = setTimeout(() => fetchRegistries().catch(console.error), 500);
  };
  for (const ev of ["area_registry_updated", "device_registry_updated", "entity_registry_updated"]) {
    conn.subscribeEvents(refetch, ev);
  }
  conn.addEventListener("ready", refetch); // reconnect: subscriptions restore themselves, registries don't
  await fetchRegistries();

  // Sleeping iPads drop the socket without a close event (same watchdog as HA's connection-mixin).
  const ping = async () => {
    const timeout = new Promise((_, rej) => setTimeout(rej, 15000));
    await Promise.race([conn.ping(), timeout]).catch(() => conn.reconnect(true));
  };
  setInterval(ping, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) ping();
  });

  return {
    conn,
    call: (a, entityId, data) => callService(conn, a.domain, a.service, data, { entity_id: entityId }),
  };
}
