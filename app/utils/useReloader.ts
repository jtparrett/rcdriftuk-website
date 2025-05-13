import { useRevalidator } from "react-router";
import { useEffect } from "react";

export const useReloader = (interval: number = 10000) => {
  const revalidator = useRevalidator();

  useEffect(() => {
    const session = setInterval(() => revalidator.revalidate(), interval);

    return () => {
      clearInterval(session);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
