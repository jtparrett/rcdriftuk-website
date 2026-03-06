import { useEffect, useRef } from "react";
import numberToWords from "number-to-words";
import { useMotionValue, useSpring } from "motion/react";
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

  const scoreRef = useRef<HTMLParagraphElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 1500, bounce: 0 });

  useEffect(() => {
    if (qualiJudgingComplete) {
      motionValue.set(score);
    }
  }, [qualiJudgingComplete, score, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (scoreRef.current) {
        scoreRef.current.textContent = latest.toFixed(2);
      }
    });
    return unsubscribe;
  }, [springValue]);

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

      <Flex
        direction="column"
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

        <Flex flex={1} direction="column" justify="center" bgColor="gray.800" mb="0.7cqi" overflow="hidden">
          <Box p="4cqi 2cqi">
            {qualiJudgingComplete && (
              <styled.p
                ref={scoreRef}
                fontWeight="black"
                fontStyle="italic"
                lineHeight={1.1}
                bgGradient="to-b"
                gradientFrom="white"
                gradientTo="gray.500"
                backgroundClip="text"
                color="transparent"
                textShadow="0 0 10px rgba(0,0,0,0.2)"
                fontSize="15cqi"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
              >
                0.00
              </styled.p>
            )}
          </Box>
        </Flex>

        <Flex gap="0.7cqi">
          {judges.map((judge, i) => {
            const judgeLabel =
              judge.alias || `JUDGE ${String.fromCharCode(65 + i)}`;
            const judgeScore = lap.scores.find((s) => s.judgeId === judge.id);

            return (
              <Box key={judge.id} flex={1} bgColor="gray.800" p="1.3cqi 4cqi">
                <styled.p
                  fontWeight="semibold"
                  fontSize="2.3cqi"
                  textTransform="uppercase"
                >
                  {judgeLabel}
                </styled.p>
                <styled.p
                  fontWeight="extrabold"
                  fontSize="3.3cqi"
                  fontVariantNumeric="tabular-nums"
                >
                  {qualiJudgingComplete ? judgeScore?.score ?? "—" : "—"}
                </styled.p>
              </Box>
            );
          })}

          {lap.penalty < 0 && (
            <Box flex={1} bgColor="brand.500" color="white" p="1.3cqi 4cqi">
              <styled.p
                fontWeight="semibold"
                fontSize="2.3cqi"
                textTransform="uppercase"
              >
                PENALTY
              </styled.p>
              <styled.p fontWeight="extrabold" fontSize="3.3cqi">
                {lap.penalty}
              </styled.p>
            </Box>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};
