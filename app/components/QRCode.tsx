import { useEffect, useRef } from "react";
import { styled } from "~/styled-system/jsx";
import QR from "qrcode";

interface Props {
  value: string;
  width?: number;
}

export const QRCode = ({ value, width = 100 }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    QR.toCanvas(
      canvasRef.current,
      value,
      {
        margin: 3,
        color: {
          light: "#000000",
          dark: "#ffffff",
        },
        width,
      },
      function (error) {
        if (error) console.error(error);
      }
    );
  }, [value, width]);

  return <styled.canvas ref={canvasRef} />;
};
