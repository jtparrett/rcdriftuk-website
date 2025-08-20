import { useState } from "react";
import { Select } from "~/components/Select";
import { Box, Container, styled } from "~/styled-system/jsx";
import type { Route } from "./+types/fdr";

const CHASSIS_RATIOS = {
  "Yokomo YD-2": 2.6,
  "Yokomo MD1.0": 2.6,
  "Yokomo MD2.0": 2.6,
  "Yokomo SD1.0": 2.6,
  "Yokomo RD2.0": 2.6,
  "MST RMX 2.0": 3.08,
  "MST RMX 2.5": 3.08,
  "MST FMX 2.0": 3.08,
  "MST FXX 2.0": 3.08,
  "Reve D RDX": 2.6,
  "Team Associated DC10": 2.6,
  "Rhino Racing Shark": 2.6,
  "Overdose GALM": 2.86,
} as const;

function calculateFDR(pinion: number, spur: number, internalRatio: number) {
  return ((spur / pinion) * internalRatio).toFixed(2);
}

export const meta: Route.MetaFunction = () => {
  return [
    { title: `RC Drift UK | FDR Calculator` },
    { name: "description", content: "Calculate your FDR" },
    {
      property: "og:image",
      content: "https://rcdrift.uk/og-image.jpg",
    },
  ];
};

const Page = () => {
  const [chassis, setChassis] =
    useState<keyof typeof CHASSIS_RATIOS>("Yokomo YD-2");
  const [pinion, setPinion] = useState<number>(28);
  const [spur, setSpur] = useState<number>(84);

  return (
    <Container maxW={400} px={2} py={12}>
      <styled.h1 mb={4} fontWeight="extrabold" fontSize="2xl">
        FDR Calculator
      </styled.h1>

      <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
        Chassis
      </styled.label>
      <Select
        mb={2}
        value={chassis}
        onChange={(e) => {
          const value = e.target.value;
          setChassis(value as keyof typeof CHASSIS_RATIOS);
        }}
      >
        {Object.keys(CHASSIS_RATIOS).map((chassis) => (
          <option key={chassis} value={chassis}>
            {chassis}
          </option>
        ))}
      </Select>

      <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
        Pinion
      </styled.label>
      <Select
        mb={2}
        value={pinion}
        onChange={(e) => setPinion(Number(e.target.value))}
      >
        {Array.from({ length: 44 }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </Select>

      <styled.label display="block" mb={1} fontSize="sm" color="gray.400">
        Spur
      </styled.label>
      <Select value={spur} onChange={(e) => setSpur(Number(e.target.value))}>
        {Array.from({ length: 160 }, (_, i) => (
          <option key={i} value={i + 1}>
            {i + 1}
          </option>
        ))}
      </Select>

      <Box textAlign="center" bgColor="gray.800" rounded="md" p={4} mt={4}>
        <styled.p fontFamily="mono" fontSize="2xl" fontWeight="bold">
          FDR = {calculateFDR(pinion, spur, CHASSIS_RATIOS[chassis])}
        </styled.p>
      </Box>
    </Container>
  );
};

export default Page;
