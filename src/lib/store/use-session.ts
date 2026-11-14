import { useSyncExternalStore } from "react";
import {
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSession,
  type Session,
} from "./session";

const subscribeNothing = () => () => {};

/**
 * The visitor's session, or null during server render and hydration.
 * Screens show a loading state for null instead of a misleading empty state.
 */
export function useSession(): Session | null {
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
  return hydrated ? session : null;
}
