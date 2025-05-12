import type { Events } from "@prisma/client";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { Link } from "react-router";
import { getEventDate } from "~/utils/getEventDate";
import { RiArrowRightSLine, RiCheckLine } from "react-icons/ri";
import { isPast } from "date-fns";
import { LinkOverlay } from "./LinkOverlay";

interface QueriedEvent
  extends Omit<
    Events,
    "startDate" | "endDate" | "createdAt" | "updatedAt" | "ticketReleaseDate"
  > {
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  ticketReleaseDate: Date | null;
  eventTrack: {
    slug: string;
    name: string;
    image: string;
  } | null;
}

interface Props {
  event: QueriedEvent;
  showAvatar?: boolean;
}

export const EventCard = ({ event, showAvatar = false }: Props) => {
  const hasPast = isPast(new Date(event.endDate));
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

  return (
    <Flex
      rounded="xl"
      bgColor="gray.900"
      borderWidth={1}
      borderColor="gray.800"
      p={4}
      alignItems="center"
      gap={4}
      pos="relative"
      opacity={hasPast ? 0.65 : 1}
      overflow="hidden"
    >
      {hasPast && (
        <styled.span
          bgColor="gray.800"
          pos="absolute"
          top={3}
          right={3}
          rounded="sm"
          px={3}
          py={1}
          fontSize="sm"
          fontWeight="semibold"
          zIndex={2}
          display="flex"
          alignItems="center"
          gap={1}
        >
          Finished <RiCheckLine />
        </styled.span>
      )}

      {showAvatar && (event.cover || event.eventTrack?.image) && (
        <Box
          w={16}
          h={16}
          rounded="full"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.500"
        >
          <Link
            to={
              event.eventTrack?.slug
                ? `/tracks/${event.eventTrack.slug}`
                : `/events/${event.id}`
            }
          >
            <styled.img
              src={event.cover || event.eventTrack?.image}
              w="full"
              h="full"
              objectFit="cover"
            />
          </Link>
        </Box>
      )}

      <Box flex={1}>
        <styled.span fontSize="xs" color="gray.500">
          {event.eventTrack?.name ?? event.track}
        </styled.span>

        <LinkOverlay to={`/events/${event.id}`}>
          <styled.h3
            fontSize="lg"
            fontWeight="extrabold"
            textWrap="balance"
            lineHeight={1.1}
          >
            {event.name}
          </styled.h3>
        </LinkOverlay>

        <styled.p fontSize="sm" color="gray.300" fontWeight="semibold" mb={2}>
          {getEventDate(startDate, endDate)}
        </styled.p>

        <LinkButton
          to={`/events/${event.id}`}
          variant="secondary"
          size="xs"
          pos="relative"
          zIndex={4}
        >
          Event Info <RiArrowRightSLine />
        </LinkButton>
      </Box>
    </Flex>
  );
};
