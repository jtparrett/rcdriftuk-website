import { useEffect, useRef } from "react";
import { Box, styled } from "~/styled-system/jsx";
import QR from "qrcode";

interface Props {
  value: string;
  width?: number;
}

export const QRCode = ({ value, width = 90 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QR.toCanvas(
      canvasRef.current,
      value,
      {
        margin: 3,
        color: {
          light: "#ec1a55",
          dark: "#ffffff",
        },
        width,
      },
      function (error) {
        if (error) console.error(error);
      }
    );
  }, [value, width]);

  return (
    <Box width={width + "px"} overflow="hidden" rounded="lg">
      <styled.canvas ref={canvasRef} w="full" />
    </Box>
  );
};
