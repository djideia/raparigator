"use client";

import { createContext, useContext } from "react";

const TabActivityContext = createContext(true);

export function TabActivityProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return <TabActivityContext.Provider value={active}>{children}</TabActivityContext.Provider>;
}

export function useIsTabActive() {
  return useContext(TabActivityContext);
}
