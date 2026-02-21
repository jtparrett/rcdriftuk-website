import { useId } from "react";
import { Box, Flex, styled } from "~/styled-system/jsx";
import { css } from "~/styled-system/css";
import { motion } from "motion/react";
import { capitalCase } from "change-case";
import { getDriverRank, getRankColor, RANKS } from "~/utils/getDriverRank";
import type { Values } from "~/utils/values";

const LEFT_PHOTO =
  "M375.7,358l-36.6-36.6-.9-.9V58.7L282.6,3H3v554.8l55.7,55.7h190.2l126.9-126.9v-128.5Z";
const LEFT_FRAME =
  "M346.7,315.4l32,32v-6.2l-32-32v6.2ZM346.7,296l32,32v6.2l-32-32v-6.2ZM346.7,282.7l32,32v6.2l-32-32v-6.2ZM346.7,269.5l32,32v6.2l-32-32v-6.2ZM346.7,256.2l32,32v6.2l-32-32v-6.2ZM346.7,242.9l32,32v6.2l-32-32v-6.2ZM346.7,229.7l32,32v6.2l-32-32v-6.2ZM346.7,216.4l32,32v6.2l-32-32v-6.2ZM378.7,356.8v229.6l-30,30H57.4L0,559V0h283.9l57.4,57.4v261.9l37.4,37.4ZM375.7,358l-36.6-36.6-.9-.9V58.7L282.6,3H3v554.8l55.7,55.7h190.2l126.9-126.9v-128.5ZM301.3,4h36v36l-36-36Z";

const RIGHT_PHOTO =
  "M3,486.6l126.9,126.9h190.2s55.7-55.7,55.7-55.7V3s-279.6,0-279.6,0l-55.7,55.7v260.7s0,1.2,0,1.2l-.9.9L3,358v128.5Z";
const RIGHT_FRAME =
  "M32,309.2L0,341.2v6.2s32-32,32-32v-6.2ZM32,302.2L0,334.2v-6.2s32-32,32-32v6.2ZM32,288.9L0,320.9v-6.2s32-32,32-32v6.2ZM32,275.7L0,307.7v-6.2s32-32,32-32v6.2ZM32,262.4L0,294.4v-6.2s32-32,32-32v6.2ZM32,249.2L0,281.2v-6.2s32-32,32-32v6.2ZM32,235.9L0,267.9v-6.2s32-32,32-32v6.2ZM32,222.6L0,254.7v-6.2s32-32,32-32v6.2ZM37.4,319.4V57.4S94.9,0,94.9,0h283.9v559s-57.4,57.4-57.4,57.4H30s-30-30-30-30v-229.6s37.4-37.4,37.4-37.4ZM3,486.6l126.9,126.9h190.2s55.7-55.7,55.7-55.7V3s-279.6,0-279.6,0l-55.7,55.7v260.7s0,1.2,0,1.2l-.9.9L3,358v128.5ZM41.4,40V4h36s-36,36-36,36Z";

const getCardTheme = (rank: Values<typeof RANKS>) => {
  const [bg1, bg2] = getRankColor(rank);
  switch (rank) {
    case RANKS.UNRANKED:
      return {
        frameLight: "#5a6270",
        frameDark: "#2a2e38",
        bg: [bg1, bg2],
        accent: "#8090a0",
        shine: "rgba(255,255,255,0.06)",
        glow: "rgba(107,114,128,0.12)",
        badge: ["#2a2e38", "#1e2128"],
        badgeRing: "#4a5060",
      };
    case RANKS.STEEL:
      return {
        frameLight: "#8a9aaa",
        frameDark: "#3a4a5a",
        bg: [bg1, bg2],
        accent: "#9aaabc",
        shine: "rgba(255,255,255,0.08)",
        glow: "rgba(90,106,122,0.2)",
        badge: ["#2a3444", "#1a2430"],
        badgeRing: "#6a7a8a",
      };
    case RANKS.BRONZE:
      return {
        frameLight: "#daa060",
        frameDark: "#8b5a1a",
        bg: [bg1, bg2],
        accent: "#e8b040",
        shine: "rgba(218,165,32,0.12)",
        glow: "rgba(205,127,50,0.25)",
        badge: ["#3e2a0b", "#2a1c06"],
        badgeRing: "#cd7f32",
      };
    case RANKS.SILVER:
      return {
        frameLight: "#e0e0e0",
        frameDark: "#707070",
        bg: [bg1, bg2],
        accent: "#e0e0e0",
        shine: "rgba(255,255,255,0.1)",
        glow: "rgba(176,176,176,0.2)",
        badge: ["#3a3d42", "#2a2d32"],
        badgeRing: "#c0c0c0",
      };
    case RANKS.GOLD:
      return {
        frameLight: "#ffe44d",
        frameDark: "#b8860b",
        bg: [bg1, bg2],
        accent: "#ffdd40",
        shine: "rgba(255,215,0,0.12)",
        glow: "rgba(255,215,0,0.25)",
        badge: ["#3a3010", "#2a2208"],
        badgeRing: "#ffd700",
      };
    case RANKS.PLATINUM:
      return {
        frameLight: "#80d8ff",
        frameDark: "#1565c0",
        bg: [bg1, bg2],
        accent: "#90dcff",
        shine: "rgba(79,195,247,0.1)",
        glow: "rgba(79,195,247,0.25)",
        badge: ["#122840", "#0c1e30"],
        badgeRing: "#4fc3f7",
      };
    case RANKS.DIAMOND:
      return {
        frameLight: "#60ffff",
        frameDark: "#0097a7",
        bg: [bg1, bg2],
        accent: "#60f0ff",
        shine: "rgba(0,229,255,0.12)",
        glow: "rgba(0,229,255,0.3)",
        badge: ["#0e2838", "#081c28"],
        badgeRing: "#00e5ff",
      };
    default:
      return {
        frameLight: "#5a6270",
        frameDark: "#2a2e38",
        bg: [bg1, bg2],
        accent: "#8090a0",
        shine: "rgba(255,255,255,0.06)",
        glow: "rgba(107,114,128,0.12)",
        badge: ["#2a2e38", "#1e2128"],
        badgeRing: "#4a5060",
      };
  }
};

export type DriverCardProps = {
  firstName?: string | null;
  lastName?: string | null;
  image?: string | null;
  driverNo?: number;
  elo?: number;
  ranked?: boolean;
  team?: string | null;
  side?: "left" | "right";
};

export const DriverCard = ({
  firstName,
  lastName,
  image,
  driverNo,
  elo = 1000,
  ranked = false,
  team,
  side = "left",
}: DriverCardProps) => {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const rank = getDriverRank(elo, ranked);
  const theme = getCardTheme(rank);
  const eloDisplay = Math.round(elo);
  const isLeft = side === "left";

  const photoPath = isLeft ? LEFT_PHOTO : RIGHT_PHOTO;
  const framePath = isLeft ? LEFT_FRAME : RIGHT_FRAME;

  const clipId = `clip-${id}`;
  const frameGradId = `fg-${id}`;
  const fadeGradId = `fade-${id}`;
  const vignetteId = `vig-${id}`;
  const shimmerGradId = `shim-${id}`;

  return (
    <Box
      pos="relative"
      w="full"
      className={css({ aspectRatio: "378.7 / 616.4" })}
      style={{
        filter: `drop-shadow(0 0 20px ${theme.glow}) drop-shadow(0 12px 32px rgba(0,0,0,0.5))`,
      }}
    >
      <svg
        viewBox="0 0 378.7 616.4"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
        }}
      >
        <defs>
          <clipPath id={clipId}>
            <path d={photoPath} />
          </clipPath>
          <linearGradient id={frameGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.frameLight} />
            <stop offset="100%" stopColor={theme.frameDark} />
          </linearGradient>
          <linearGradient id={fadeGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="30%" stopColor="rgba(0,0,0,0)" />
            <stop offset="60%" stopColor={`${theme.bg[1]}aa`} />
            <stop offset="100%" stopColor={theme.bg[1]} />
          </linearGradient>
          <radialGradient id={vignetteId} cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor={`${theme.bg[1]}80`} />
          </radialGradient>
          <linearGradient id={shimmerGradId} gradientTransform="rotate(115)">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="42%" stopColor="transparent" />
            <stop offset="46%" stopColor={theme.shine} />
            <stop offset="50%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="54%" stopColor={theme.shine} />
            <stop offset="58%" stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Photo */}
        <image
          href={image ?? "/blank-driver-right.jpg"}
          x="0"
          y="0"
          width="378.7"
          height="616.4"
          preserveAspectRatio="xMidYMin slice"
          clipPath={`url(#${clipId})`}
        />

        {/* Vignette */}
        <rect
          x="0"
          y="0"
          width="378.7"
          height="616.4"
          fill={`url(#${vignetteId})`}
          clipPath={`url(#${clipId})`}
        />

        {/* Bottom fade */}
        <rect
          x="0"
          y="0"
          width="378.7"
          height="616.4"
          fill={`url(#${fadeGradId})`}
          clipPath={`url(#${clipId})`}
        />

        {/* Shimmer */}
        <g clipPath={`url(#${clipId})`}>
          <motion.rect
            x="-200"
            y="-300"
            width="800"
            height="1200"
            fill={`url(#${shimmerGradId})`}
            animate={{ x: [-250, 250], y: [-250, 250] }}
            transition={{
              duration: 2.5,
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 6,
              repeatType: "reverse",
            }}
          />
        </g>

        {/* Frame border */}
        <path d={framePath} fill={`url(#${frameGradId})`} />
      </svg>

      {/* HTML overlays */}
      <Box pos="absolute" inset={0} pointerEvents="none">
        {/* Driver number */}
        {driverNo !== undefined && (
          <styled.span
            pos="absolute"
            top="2%"
            right={isLeft ? undefined : "4%"}
            left={isLeft ? "4%" : undefined}
            fontWeight="black"
            fontSize="3xl"
            lineHeight={1}
            opacity={0.6}
            fontStyle="italic"
            textShadow="0 2px 10px rgba(0,0,0,0.9)"
            zIndex={3}
          >
            #{driverNo}
          </styled.span>
        )}

        {/* Name — bottom, opposite side from the big angular cut */}
        <Box
          pos="absolute"
          bottom="10%"
          left={isLeft ? "4%" : undefined}
          right={isLeft ? undefined : "4%"}
          textAlign={isLeft ? "left" : "right"}
          zIndex={3}
          maxW="60%"
        >
          <styled.p
            fontWeight="black"
            textTransform="uppercase"
            fontSize="2xl"
            lineHeight={1}
            letterSpacing="tight"
            textShadow="0 2px 10px rgba(0,0,0,0.9)"
          >
            {firstName}
          </styled.p>
          <styled.p
            fontWeight="bold"
            textTransform="uppercase"
            fontSize="sm"
            lineHeight={1.15}
            opacity={0.7}
            textShadow="0 1px 6px rgba(0,0,0,0.9)"
            mt={0.5}
          >
            {lastName}
          </styled.p>
          {team && (
            <styled.p
              fontSize="xs"
              opacity={0.4}
              mt={0.5}
              lineHeight={1.1}
              textShadow="0 1px 4px rgba(0,0,0,0.8)"
            >
              {team}
            </styled.p>
          )}
        </Box>

        {/* Rank badge — bottom corner near the big angular cut */}
        <Flex
          pos="absolute"
          bottom="4%"
          right={isLeft ? "10%" : undefined}
          left={isLeft ? undefined : "10%"}
          zIndex={5}
          flexDir="column"
          align="center"
          gap={0}
        >
          <styled.img
            src={`/badges/${rank}.png`}
            w={9}
            h={9}
            display="block"
            style={{
              filter: `drop-shadow(0 2px 8px rgba(0,0,0,0.7))`,
            }}
          />
          <styled.p
            fontWeight="extrabold"
            fontSize="2xs"
            textTransform="uppercase"
            letterSpacing="widest"
            style={{ color: theme.accent }}
            textShadow="0 1px 4px rgba(0,0,0,0.8)"
            mt={-0.5}
          >
            {capitalCase(rank)}
          </styled.p>
        </Flex>
      </Box>
    </Box>
  );
};
