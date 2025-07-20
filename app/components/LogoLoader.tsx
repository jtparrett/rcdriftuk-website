import { css } from "~/styled-system/css";
import { styled } from "~/styled-system/jsx";

export const LogoLoader = () => {
  return (
    <styled.svg viewBox="0 0 89.39 84" w="64px" h="64px">
      <path
        fill="none"
        strokeWidth={1}
        stroke="var(--colors-brand\.500)"
        strokeDasharray="100"
        className={css({
          animation: "logo 1.8s linear infinite",
        })}
        d="M88.77,14.6l-11.62,33.16c-1.19,3.57-4.57,5.86-8.34,5.86h-11.02l7.74,30.38h-28.3l-9.73-30.38H10.82l7.45-21.55h37.83l3.28-9.53H12.61L0,0h78.44c7.55,0,12.81,7.45,10.33,14.6Z"
      />
    </styled.svg>
  );
};
