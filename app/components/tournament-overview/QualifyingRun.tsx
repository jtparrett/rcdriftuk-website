import numberToWords from "number-to-words";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { motion } from "motion/react";
import { DriverCard } from "~/components/DriverCard";
import { sumScores } from "~/utils/sumScores";
import { getDriverNumber } from "~/utils/getDriverNumber";
import type { OverviewLoaderData } from "~/routes/tournaments.$id.overview";

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
    <Flex w="fit-content" align="center">
      <motion.div
        initial={{ x: -80, opacity: 0, filter: "blur(8px)" }}
        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{
          duration: 0.4,
          ease: "easeOut",
        }}
        style={{
          width: "240px",
          maxWidth: "full",
          flex: "none",
        }}
      >
        <DriverCard
          firstName={lap.driver.user.firstName}
          lastName={lap.driver.user.lastName}
          image={lap.driver.user.image}
          driverNo={getDriverNumber(lap.driver, driverNumbers)}
          elo={lap.driver.user.elo}
          ranked={lap.driver.user.ranked}
          team={lap.driver.user.team}
        />
      </motion.div>

      {qualiJudgingComplete && (
        <Box ml={-40} pl={40} bgColor="gray.900" textAlign="center">
          <Box mb={1} bgColor="gray.800" py={2}>
            <styled.p fontWeight="semibold">
              {numberToWords.toOrdinal(lap.round).toUpperCase()} QUALIFYING RUN
            </styled.p>
          </Box>

          <Box bgColor="gray.800" mb={1}>
            <styled.p
              fontSize={{ base: "4xl", md: "128px" }}
              fontWeight="black"
              fontStyle="italic"
              letterSpacing="tight"
              lineHeight={1.1}
              p={10}
            >
              {score}
            </styled.p>

            <Flex justify="space-around" alignItems="flex-end">
              {Array.from(new Array(99)).map((_, i) => {
                return (
                  <Box
                    key={i}
                    h={i % 2 === 0 ? 4 : 2}
                    w="1px"
                    bgColor={score > i ? "brand.500" : "gray.500"}
                  />
                );
              })}
            </Flex>
          </Box>

          {lap.penalty < 0 && (
            <styled.p fontSize="sm" color="brand.500">
              Penalty: {lap.penalty}
            </styled.p>
          )}

          <Flex gap={1}>
            {lap.scores.map((score, i) => (
              <Box key={i} flex={1} px={6} bgColor="gray.800" p={2}>
                <styled.p fontSize="sm" fontWeight="semibold">
                  JUDGE {String.fromCharCode(65 + i)}
                </styled.p>
                <styled.p fontSize="xl" fontWeight="extrabold">
                  {score.score}
                </styled.p>
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Flex>
  );
};
