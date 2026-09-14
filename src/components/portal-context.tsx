import { createContext, type ReactNode, useContext } from "react";

const PortalContainerContext = createContext<HTMLElement | DocumentFragment | undefined>(undefined);

export function PortalProvider({
  container,
  children,
}: {
  container: HTMLElement | DocumentFragment;
  children?: ReactNode;
}) {
  return <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>;
}

export function usePortalContainer(): HTMLElement | DocumentFragment | undefined {
  return useContext(PortalContainerContext);
}
