import { createContext, useContext } from "react";

const EmbedContext = createContext<boolean>(false);

export const EmbedProvider = EmbedContext.Provider;

export const HiddenEmbed = ({ children }: { children: React.ReactNode }) => {
  const hidden = useContext(EmbedContext);

  return hidden ? null : <>{children}</>;
};

export const useIsEmbed = () => {
  return useContext(EmbedContext);
};
