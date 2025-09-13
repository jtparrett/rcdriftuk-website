import { Box } from "~/styled-system/jsx";

type BlurEffectProps = {
  intensity?: number;
  position?: "top" | "bottom" | "left" | "right";
};

export default function ProgressiveBlur({
  intensity = 100,
  position = "top",
}: BlurEffectProps) {
  const intensityFactor = intensity / 50;

  const blurLayers = [
    { blur: `${1 * intensityFactor}px`, maskStart: 0, maskEnd: 25, zIndex: 1 },
    { blur: `${3 * intensityFactor}px`, maskStart: 25, maskEnd: 75, zIndex: 2 },
    {
      blur: `${6 * intensityFactor}px`,
      maskStart: 75,
      maskEnd: 100,
      zIndex: 3,
    },
  ];

  const positionAttributes = {
    bottom: {
      bottom: 0,
      left: 0,
      right: 0,
      height: `${intensity}%`,
      width: "100%",
    },
    top: { top: 0, left: 0, right: 0, height: `${intensity}%`, width: "100%" },
    left: {
      left: 0,
      top: 0,
      bottom: 0,
      width: `${intensity}%`,
      height: "100%",
    },
    right: {
      right: 0,
      top: 0,
      bottom: 0,
      width: `${intensity}%`,
      height: "100%",
    },
  };

  const gradientDirection = {
    bottom: "to bottom",
    top: "to top",
    left: "to left",
    right: "to right",
  };

  return (
    <Box pos="absolute" zIndex={0} style={positionAttributes[position]}>
      {blurLayers.map((layer, index) => (
        <Box
          key={index}
          pos="absolute"
          inset={0}
          pointerEvents="none"
          style={{
            zIndex: layer.zIndex,
            backdropFilter: `blur(${layer.blur})`,
            WebkitBackdropFilter: `blur(${layer.blur})`,
            maskImage: `linear-gradient(${gradientDirection[position]}, transparent ${layer.maskStart}%, black ${layer.maskEnd}%)`,
            WebkitMaskImage: `linear-gradient(${gradientDirection[position]}, transparent ${layer.maskStart}%, black ${layer.maskEnd}%)`,
          }}
        />
      ))}
    </Box>
  );
}
