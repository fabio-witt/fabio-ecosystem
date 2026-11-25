import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type ResetTab = () => void;
const TabReselectContext = createContext<Map<string, ResetTab> | null>(null);

export function TabReselectProvider({ children }: { children: ReactNode }) {
  const [handlers] = useState(() => new Map<string, ResetTab>());
  return (
    <TabReselectContext.Provider value={handlers}>
      {children}
    </TabReselectContext.Provider>
  );
}

export function useTabReselect(tab: string, reset: ResetTab) {
  const handlers = useContext(TabReselectContext);
  useEffect(() => {
    handlers?.set(tab, reset);
    return () => {
      if (handlers?.get(tab) === reset) handlers.delete(tab);
    };
  }, [handlers, tab, reset]);
}

export function useTabReselectHandlers() {
  return useContext(TabReselectContext);
}
