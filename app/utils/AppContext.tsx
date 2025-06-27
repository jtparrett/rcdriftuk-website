import { createContext, useContext } from "react";

const AppContext = createContext<boolean>(false);

export const AppProvider = AppContext.Provider;

export const useIsApp = () => {
  return useContext(AppContext);
};

export const HiddenApp = ({ children }: { children: React.ReactNode }) => {
  const hidden = useContext(AppContext);

  return hidden ? null : <>{children}</>;
};
