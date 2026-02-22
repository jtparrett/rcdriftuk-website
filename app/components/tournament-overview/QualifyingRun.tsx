import numberToWords from "number-to-words";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { motion } from "motion/react";
import { DriverCard } from "~/components/DriverCard";
import { sumScores } from "~/utils/sumScores";
import { RightInfoBox } from "./RightInfoBox";
import { getDriverNumber } from "~/utils/getDriverNumber";
import type { OverviewLoaderData } from "~/routes/tournaments.$id.overview";

interface QualifyingRunProps {
  lap: NonNullable<OverviewLoaderData["nextQualifyingLap"]>;
  judges: OverviewLoaderData["judges"];
  scoreFormula: OverviewLoaderData["scoreFormula"];
  driverNumbers: OverviewLoaderData["driverNumbers"];
  isEmbed: boolean;
}

export const QualifyingRun = ({
  lap,
  judges,
  scoreFormula,
  driverNumbers,
  isEmbed,
}: QualifyingRunProps) => {
  const qualiJudgingComplete = lap.scores.length === judges.length;

  return (
    <Flex w={isEmbed ? 800 : 600} maxW="full" align="center" gap={0}>
      <Box w="45%" p={3} pl={4} flex="none">
        <motion.div
          initial={{ x: -80, opacity: 0, filter: "blur(8px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
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
      </Box>

      <Flex flex={1} flexDir="column" gap={1} justify="center" py={6}>
        {!qualiJudgingComplete && (
          <RightInfoBox delay={0}>
            <styled.p
              fontWeight="semibold"
              fontSize={{ base: "md", md: "xl" }}
            >
              {numberToWords.toOrdinal(lap.round)} Qualifying Run
            </styled.p>
          </RightInfoBox>
        )}

        {qualiJudgingComplete && (
          <>
            <RightInfoBox>
              <styled.p
                fontSize={{ base: "4xl", md: "100px" }}
                fontWeight="black"
                pr={10}
              >
                {sumScores(
                  lap.scores,
                  judges.length,
                  scoreFormula,
                  lap.penalty,
                  judges.map((j) => j.id),
                )}
              </styled.p>
            </RightInfoBox>

            {lap.penalty < 0 && (
              <RightInfoBox>
                <styled.p fontSize="sm" color="brand.500">
                  Penalty: {lap.penalty}
                </styled.p>
              </RightInfoBox>
            )}

            {lap.scores.map((score, i) => (
              <RightInfoBox key={i} delay={0.1 * (i + 1)}>
                <styled.p fontSize="sm">
                  Judge {i + 1}: {score.score}
                </styled.p>
              </RightInfoBox>
            ))}
          </>
        )}
      </Flex>
    </Flex>
  );
};
