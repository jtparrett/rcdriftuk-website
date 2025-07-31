import type { CarSetupChanges } from "@prisma/client";
import { Box, styled } from "~/styled-system/jsx";
import { getCarSetupLabel, CAR_SETUP_CHANGE_TYPES } from "~/utils/carSetup";
import { capitalCase } from "change-case";

interface Props {
  history: CarSetupChanges[];
}

export const CarSetupSummary = ({ history }: Props) => {
  // Get the latest value for each setup type
  const currentSetup = history.reduce(
    (acc, change) => {
      // Only keep the latest value for each type (since history is ordered by id desc)
      if (!acc[change.type]) {
        acc[change.type] = change;
      }
      return acc;
    },
    {} as Record<string, CarSetupChanges>,
  );

  // Get the setup types in the order defined in the constant
  const setupTypeOrder = Object.values(CAR_SETUP_CHANGE_TYPES);

  // Sort the setup entries according to the defined order
  const setupEntries = Object.values(currentSetup).sort((a, b) => {
    const indexA = setupTypeOrder.indexOf(a.type);
    const indexB = setupTypeOrder.indexOf(b.type);
    return indexA - indexB;
  });

  if (setupEntries.length === 0) {
    return (
      <Box textAlign="center" py={8} color="gray.500">
        <styled.p>No setup data recorded yet</styled.p>
      </Box>
    );
  }

  return (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={4}>
      {setupEntries.map((setup) => {
        const label = capitalCase(setup.type.replace(/_/g, " "));
        const value = getCarSetupLabel(setup.type, setup.value);

        return (
          <Box
            key={setup.id}
            p={3}
            bgColor="gray.900"
            rounded="lg"
            borderWidth={1}
            borderColor="gray.800"
          >
            <styled.div
              fontSize="xs"
              color="gray.400"
              mb={1}
              fontWeight="medium"
            >
              {label}
            </styled.div>
            <styled.div fontSize="lg" fontWeight="semibold" color="white">
              {value}
            </styled.div>
          </Box>
        );
      })}
    </Box>
  );
};
