import { AnimatePresence, motion } from "motion/react";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { TrackSnippet } from "~/components/TrackSnippet";
import { css } from "~/styled-system/css";
import { Box } from "~/styled-system/jsx";
import { TrackTypes } from "~/utils/enums";
import notFoundInvariant from "~/utils/notFoundInvariant";
import { prisma } from "~/utils/prisma.server";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const slug = z.string().parse(params.slug);

  const track = await prisma.tracks.findUnique({
    where: {
      slug,
    },
  });

  notFoundInvariant(track);

  return track;
};

const MapTrackDrawer = () => {
  const track = useLoaderData<typeof loader>();

  return (
    <AnimatePresence>
      <motion.div
        key={track.slug}
        className={css({
          display: "flex",
          flexDirection: "column",
          pos: "absolute",
          bottom: 4,
          top: 4,
          left: 4,
          zIndex: 1,
          w: "500px",
          maxW: "calc(100% - 32px)",
          bgColor: "gray.950",
          borderTopRadius: "2xl",
          borderColor: "gray.800",
          borderWidth: 1,
          rounded: "2xl",
          overflow: "hidden",
        })}
        initial={{ x: "-110%" }}
        animate={{ x: 0 }}
        exit={{ x: "-110%" }}
        transition={{ duration: 0.5, ease: "anticipate" }}
      >
        <LinkButton
          to="../"
          variant="ghost"
          p={1}
          fontSize="2xl"
          pos="absolute"
          top={2}
          right={2}
        >
          <RiCloseCircleFill />
        </LinkButton>

        <Box flex={1} overflow="auto">
          <TrackSnippet track={track} />
        </Box>

        <Box p={4}>
          <LinkButton to={`/tracks/${track.slug}`} w="full">
            View {track.types.includes(TrackTypes.SHOPS) ? "Shop" : "Track"}{" "}
            Profile
          </LinkButton>
        </Box>
      </motion.div>
    </AnimatePresence>
  );
};

export default MapTrackDrawer;
