import numberToWords from "number-to-words";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { DriverCard } from "~/components/DriverCard";
import { sumScores } from "~/utils/sumScores";
import { getDriverNumber } from "~/utils/getDriverNumber";
import type { OverviewLoaderData } from "~/routes/tournaments.$id.overview";
import { getBestRegionalElo } from "~/utils/getBestRegionalElo";

interface QualifyingRunProps {
  lap: NonNullable<OverviewLoaderData["nextQualifyingLap"]>;
  judges: OverviewLoaderData["judges"];
  scoreFormula: OverviewLoaderData["scoreFormula"];
  driverNumbers: OverviewLoaderData["driverNumbers"];
}

export const QualifyingRun = ({
  lap,
  judges,
  scoreFormula,
  driverNumbers,
}: QualifyingRunProps) => {
  const qualiJudgingComplete = lap.scores.length === judges.length;

  const score = sumScores(
    lap.scores,
    judges.length,
    scoreFormula,
    lap.penalty,
    judges.map((j) => j.id),
  );

  return (
    <Flex w="full" maxW="600px" containerType="inline-size" px="2.7cqi">
      <Box flex="none" w="40cqi">
        <DriverCard
          firstName={lap.driver.user.firstName}
          lastName={lap.driver.user.lastName}
          image={lap.driver.user.image}
          driverNo={getDriverNumber(lap.driver, driverNumbers)}
          elo={getBestRegionalElo(lap.driver.user).bestElo}
          ranked={lap.driver.user.ranked}
          team={lap.driver.user.team}
        />
      </Box>

      <Box
        bgColor="gray.900"
        textAlign="center"
        borderColor="gray.400"
        ml="-26.7cqi"
        mt="6cqi"
        pl="29.3cqi"
        borderWidth={2}
        borderLeftWidth="0"
        flex={1}
      >
        <Box bgColor="gray.800" mb="0.7cqi" p="1.3cqi 0">
          <styled.p fontWeight="bold" color="gray.300" fontSize="2.7cqi">
            {numberToWords.toOrdinal(lap.round).toUpperCase()} QUALIFYING RUN
          </styled.p>
        </Box>

        <Box bgColor="gray.800" mb="0.7cqi">
          <Box p="6.7cqi">
            {qualiJudgingComplete && (
              <styled.p
                fontWeight="black"
                fontStyle="italic"
                lineHeight={1.1}
                bgGradient="to-b"
                gradientFrom="white"
                gradientTo="gray.500"
                backgroundClip="text"
                color="transparent"
                textShadow="0 0 10px rgba(0,0,0,0.2)"
                fontSize="21.3cqi"
              >
                {score}
              </styled.p>
            )}
          </Box>
        </Box>

        {lap.penalty < 0 && (
          <styled.p color="brand.500" fontSize="2.3cqi">
            Penalty: {lap.penalty}
          </styled.p>
        )}

        <Flex gap="0.7cqi">
          {lap.scores.map((score, i) => (
            <Box key={i} flex={1} bgColor="gray.800" p="1.3cqi 4cqi">
              <styled.p fontWeight="semibold" fontSize="2.3cqi">
                JUDGE {String.fromCharCode(65 + i)}
              </styled.p>
              <styled.p fontWeight="extrabold" fontSize="3.3cqi">
                {score.score}
              </styled.p>
            </Box>
          ))}
        </Flex>
      </Box>
    </Flex>
  );
};
