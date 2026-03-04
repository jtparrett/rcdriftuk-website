import { Box, Flex, styled } from "~/styled-system/jsx";
import { motion } from "motion/react";
import { RiArrowLeftDoubleFill, RiArrowRightDoubleFill } from "react-icons/ri";
import { DriverCard } from "~/components/DriverCard";
import { getDriverNumber } from "~/utils/getDriverNumber";
import type { OverviewLoaderData } from "~/routes/tournaments.$id.overview";
import { getBestRegionalElo } from "~/utils/getBestRegionalElo";

interface BattleViewProps {
  battle: NonNullable<OverviewLoaderData["nextBattle"]>;
  judges: OverviewLoaderData["judges"];
  driverNumbers: OverviewLoaderData["driverNumbers"];
}

export const BattleView = ({
  battle,
  judges,
  driverNumbers,
}: BattleViewProps) => {
  const battleJudgingComplete = battle.BattleVotes.length >= judges.length;

  const winThreshold = Math.floor(judges.length / 2 + 1);
  const battleVotesLeft = battle.BattleVotes.filter(
    (vote) => vote.winnerId === battle.driverLeftId,
  );
  const battleVotesRight = battle.BattleVotes.filter(
    (vote) => vote.winnerId === battle.driverRightId,
  );
  const winnerId =
    battleVotesLeft.length >= winThreshold
      ? battle.driverLeftId
      : battleVotesRight.length >= winThreshold
        ? battle.driverRightId
        : undefined;

  return (
    <Flex
      overflow="hidden"
      pos="relative"
      zIndex={0}
      px={4}
      w="full"
      maxW="800px"
      containerType="inline-size"
    >
      <Flex
        flex={1}
        maxW="30cqi"
        transition="all 0.4s ease-in-out"
        style={{
          transform:
            winnerId === battle.driverLeftId
              ? "scale(1)"
              : winnerId && winnerId !== battle.driverLeftId
                ? "scale(0.88)"
                : "scale(1)",
          filter:
            winnerId && winnerId !== battle.driverLeftId
              ? "brightness(0.3)"
              : "brightness(1)",
        }}
      >
        <Box w="30cqi">
          <DriverCard
            side="left"
            firstName={battle.driverLeft?.user.firstName}
            lastName={battle.driverLeft?.user.lastName}
            image={battle.driverLeft?.user.image}
            driverNo={getDriverNumber(battle.driverLeft, driverNumbers)}
            elo={battle.driverLeft?.user ? getBestRegionalElo(battle.driverLeft.user).bestElo : undefined}
            ranked={battle.driverLeft?.user.ranked}
            team={battle.driverLeft?.user.team}
          />
        </Box>
      </Flex>

      <Flex
        flex={1}
        justifyContent="center"
        flexDir="column"
        pos="relative"
        zIndex={-1}
        bgColor="gray.900"
        borderColor="gray.500"
        my="4.5%"
        borderTopWidth={2}
        borderBottomWidth={2}
        mx="-20cqi"
        px="20cqi"
        _after={{
          content: '""',
          pos: "absolute",
          w: 0.5,
          h: "full",
          left: "50%",
          bgColor: "gray.500",
          transform: "skewX(-11deg)",
          zIndex: -1,
        }}
      >
        {!battleJudgingComplete && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.3,
              ease: "backOut",
              delay: 0.3,
            }}
          >
            <styled.p
              textAlign="center"
              color="gray.500"
              fontWeight="black"
              fontStyle="italic"
              textTransform="uppercase"
              letterSpacing="wider"
              fontSize="3cqi"
            >
              vs
            </styled.p>
          </motion.div>
        )}
        {battleJudgingComplete && (
          <>
            {battle.BattleVotes.map((vote, i) => {
              const winnerDirection =
                vote.winnerId === null
                  ? undefined
                  : vote.winnerId === battle.driverLeftId
                    ? "left"
                    : "right";

              const winnerX =
                vote.winnerId === null
                  ? "0%"
                  : vote.winnerId === battle.driverLeftId
                    ? "-25%"
                    : "25%";

              const judgeLabel =
                vote.judge?.alias || `Judge ${i + 1}`;

              return (
                <motion.div
                  key={i}
                  animate={{ x: winnerX }}
                  transition={{
                    duration: 1,
                    ease: "anticipate",
                    delay: 0.1 * i,
                  }}
                >
                  <Box
                    w="fit-content"
                    mx="auto"
                    textAlign="center"
                    mb="0.25cqi"
                  >
                    <styled.p
                      fontWeight="bold"
                      w="full"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      display={{ base: "none", md: "block" }}
                      fontSize="1.5cqi"
                    >
                      {judgeLabel}
                    </styled.p>
                    <Flex align="center" justify="center" fontSize="2.25cqi">
                      <Box
                        style={{
                          opacity: winnerDirection === "left" ? 1 : 0.3,
                        }}
                      >
                        <RiArrowLeftDoubleFill />
                      </Box>
                      <styled.p
                        lineHeight={1}
                        fontWeight="extrabold"
                        fontStyle="italic"
                        textTransform="uppercase"
                      >
                        {vote.omt ? "OMT" : "Advance"}
                      </styled.p>
                      <Box
                        style={{
                          opacity: winnerDirection === "right" ? 1 : 0.3,
                        }}
                      >
                        <RiArrowRightDoubleFill />
                      </Box>
                    </Flex>
                  </Box>
                </motion.div>
              );
            })}
          </>
        )}
      </Flex>

      <Flex
        flex={1}
        maxW="30cqi"
        transition="all 0.4s ease-in-out"
        style={{
          transform:
            winnerId === battle.driverRightId
              ? "scale(1)"
              : winnerId && winnerId !== battle.driverRightId
                ? "scale(0.88)"
                : "scale(1)",
          filter:
            winnerId && winnerId !== battle.driverRightId
              ? "brightness(0.3)"
              : "brightness(1)",
        }}
      >
        <Box w="30cqi">
          <DriverCard
            side="right"
            firstName={battle.driverRight?.user.firstName}
            lastName={battle.driverRight?.user.lastName}
            image={battle.driverRight?.user.image}
            driverNo={getDriverNumber(battle.driverRight, driverNumbers)}
            elo={battle.driverRight?.user ? getBestRegionalElo(battle.driverRight.user).bestElo : undefined}
            ranked={battle.driverRight?.user.ranked}
            team={battle.driverRight?.user.team}
          />
        </Box>
      </Flex>
    </Flex>
  );
};
