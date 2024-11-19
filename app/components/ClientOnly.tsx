import type { ReactNode } from "react";
import { useEffect, useState } from "react";

let isHydrating = true;

interface Props {
  children?: ReactNode;
}

export const ClientOnly = ({ children }: Props) => {
  const [isHydrated, setIsHydrated] = useState(!isHydrating);

  useEffect(() => {
    isHydrating = false;
    setIsHydrated(true);
  }, []);

  if (isHydrated) {
    return <>{children}</>;
  } else {
    return null;
  }
};
