import { createContext, useContext } from 'react';

/** True below the brand bar: screens then skip their own top safe-area padding. */
const TopInsetHandled = createContext(false);
export const TopInsetProvider = TopInsetHandled.Provider;
export function useTopInsetHandled() {
  return useContext(TopInsetHandled);
}
