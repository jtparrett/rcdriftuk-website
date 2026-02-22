import { Box, Flex, styled } from "~/styled-system/jsx";
import { motion } from "motion/react";
import { css } from "~/styled-system/css";
import { RiArrowLeftDoubleFill, RiArrowRightDoubleFill } from "react-icons/ri";
import { DriverCard } from "~/components/DriverCard";
import { getDriverNumber } from "~/utils/getDriverNumber";
import type { OverviewLoaderData } from "~/routes/tournaments.$id.overview";

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
      align="center"
      py={4}
      px={2}
      gap={0}
      w="full"
      _after={{
        content: '""',
        pos: "absolute",
        w: 0.5,
        h: "full",
        left: "50%",
        bgGradient: "to-b",
        gradientFrom: "gray.300",
        gradientTo: "gray.900",
        transform: "skewX(-10deg)",
      }}
    >
      <Flex
        flex={1}
        justify="center"
        align="center"
        p={2}
        transition="all 0.4s ease-in-out"
        style={{
          opacity:
            winnerId === battle.driverLeftId || !battleJudgingComplete
              ? 1
              : 0.35,
          transform:
            winnerId === battle.driverLeftId
              ? "scale(1.05)"
              : winnerId && winnerId !== battle.driverLeftId
                ? "scale(0.92)"
                : "scale(1)",
          filter:
            winnerId && winnerId !== battle.driverLeftId
              ? "saturate(0.3)"
              : "saturate(1)",
        }}
      >
        <motion.div
          initial={{ x: -100, opacity: 0, filter: "blur(8px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className={css({ w: "full", maxW: "240px" })}
        >
          <DriverCard
            side="left"
            firstName={battle.driverLeft?.user.firstName}
            lastName={battle.driverLeft?.user.lastName}
            image={battle.driverLeft?.user.image}
            driverNo={getDriverNumber(battle.driverLeft, driverNumbers)}
            elo={battle.driverLeft?.user.elo}
            ranked={battle.driverLeft?.user.ranked}
            team={battle.driverLeft?.user.team}
          />
        </motion.div>
      </Flex>

      <Flex
        w="140px"
        flex="none"
        justifyContent="center"
        flexDir="column"
        pos="relative"
        zIndex={2}
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
              fontSize="2xl"
              fontWeight="black"
              fontStyle="italic"
              textTransform="uppercase"
              letterSpacing="wider"
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
                    ? "-50%"
                    : "50%";

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
                  <Box w="fit-content" mx="auto" textAlign="center" mb={0.5}>
                    <styled.p
                      fontWeight="bold"
                      fontSize="xs"
                      w="full"
                      whiteSpace="nowrap"
                      textOverflow="ellipsis"
                      overflow="hidden"
                      display={{
                        base: "none",
                        md: "block",
                      }}
                    >
                      Judge {i + 1}
                    </styled.p>
                    <Flex align="center" justify="center">
                      <Box
                        style={{
                          opacity: winnerDirection === "left" ? 1 : 0.3,
                        }}
                      >
                        <RiArrowLeftDoubleFill />
                      </Box>
                      <styled.p
                        lineHeight={1}
                        fontSize={{ base: "sm", md: "lg" }}
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
        justify="center"
        align="center"
        p={2}
        transition="all 0.4s ease-in-out"
        style={{
          opacity:
            winnerId === battle.driverRightId || !battleJudgingComplete
              ? 1
              : 0.35,
          transform:
            winnerId === battle.driverRightId
              ? "scale(1.05)"
              : winnerId && winnerId !== battle.driverRightId
                ? "scale(0.92)"
                : "scale(1)",
          filter:
            winnerId && winnerId !== battle.driverRightId
              ? "saturate(0.3)"
              : "saturate(1)",
        }}
      >
        <motion.div
          initial={{ x: 100, opacity: 0, filter: "blur(8px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
          }}
          className={css({ w: "full", maxW: "240px" })}
        >
          <DriverCard
            side="right"
            firstName={battle.driverRight?.user.firstName}
            lastName={battle.driverRight?.user.lastName}
            image={battle.driverRight?.user.image}
            driverNo={getDriverNumber(battle.driverRight, driverNumbers)}
            elo={battle.driverRight?.user.elo}
            ranked={battle.driverRight?.user.ranked}
            team={battle.driverRight?.user.team}
          />
        </motion.div>
      </Flex>
    </Flex>
  );
};
