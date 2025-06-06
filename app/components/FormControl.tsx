import type { ComponentProps } from "react";
import { css } from "~/styled-system/css";
import { Box, styled } from "~/styled-system/jsx";
import { token } from "~/styled-system/tokens";

interface Props extends ComponentProps<typeof Box> {
  error?: string;
  children: React.ReactNode;
}

export const FormControl = ({ error, children, ...props }: Props) => {
  return (
    <Box
      {...props}
      style={{
        // @ts-expect-error
        "--border-color": error
          ? token("colors.brand.500")
          : token("colors.gray.800"),
      }}
      className={css({
        "& > *": {
          borderColor: "var(--border-color) !important",
        },
      })}
    >
      {children}
      {error && (
        <styled.p color="brand.500" fontSize="sm">
          {error}
        </styled.p>
      )}
    </Box>
  );
};
