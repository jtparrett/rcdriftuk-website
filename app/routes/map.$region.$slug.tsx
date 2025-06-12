import { startOfDay } from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { RiCloseCircleFill } from "react-icons/ri";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { z } from "zod";
import { LinkButton } from "~/components/Button";
import { EventCard } from "~/components/EventCard";
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
    include: {
      events: {
        where: {
          startDate: {
            gte: startOfDay(new Date()),
          },
        },
        include: {
          eventTrack: true,
        },
        orderBy: {
          startDate: "asc",
        },
      },
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
          zIndex: 500,
          w: "500px",
          maxW: "calc(100% - 32px)",
          bgColor: "gray.950",
          borderTopRadius: "2xl",
          borderColor: "gray.800",
          borderWidth: 1,
          rounded: "4xl",
          overflow: "auto",
        })}
        initial={{ x: "-110%" }}
        animate={{ x: 0 }}
        exit={{ x: "-110%" }}
        transition={{ duration: 0.5, ease: "anticipate" }}
      >
        <Box overflow="visible" h="0px" pos="sticky" top={0} left={0}>
          <LinkButton
            to="../"
            variant="ghost"
            p={1}
            fontSize="2xl"
            m={4}
            ml="auto"
            display="block"
            w="fit-content"
          >
            <RiCloseCircleFill />
          </LinkButton>
        </Box>

        <Box flex={1}>
          <TrackSnippet track={track} />

          {track.events[0] && (
            <Box m={4} pos="relative" zIndex={0}>
              <EventCard event={track.events[0]} showAvatar={false} />
            </Box>
          )}
        </Box>

        <Box
          px={6}
          pb={6}
          pos="sticky"
          bottom={0}
          mt={4}
          bgGradient="to-t"
          gradientFrom="gray.950"
          gradientTo="transparent"
        >
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
