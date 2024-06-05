import type { Events, Tracks } from "@prisma/client";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { dateWithoutTimezone } from "~/utils/dateWithoutTimezone";
import { Link } from "@remix-run/react";
import { getEventDate } from "~/utils/getEventDate";
import { RiArrowRightSLine, RiCheckLine } from "react-icons/ri";
import { isPast } from "date-fns";

interface QueriedEvent
  extends Omit<Events, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  eventTrack: Tracks | null;
}

interface Props {
  event: QueriedEvent;
  showAvatar?: boolean;
}

export const EventCard = ({ event, showAvatar = false }: Props) => {
  const hasPast = isPast(dateWithoutTimezone(event.endDate));

  return (
    <Flex
      rounded="md"
      bgColor="gray.900"
      p={4}
      alignItems="center"
      gap={4}
      pos="relative"
      opacity={hasPast ? 0.65 : 1}
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

      {showAvatar && event.eventTrack?.image && (
        <Box
          w={16}
          h={16}
          rounded="full"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.500"
        >
          <Link to={`/tracks/${event.eventTrack.slug}`}>
            <styled.img
              src={event.eventTrack.image}
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

        <styled.h3
          fontSize="lg"
          fontWeight="black"
          textWrap="balance"
          lineHeight={1.1}
        >
          {event.name}
        </styled.h3>

        <styled.p fontSize="sm" color="gray.300" fontWeight="semibold" mb={2}>
          {getEventDate(
            dateWithoutTimezone(event.startDate),
            dateWithoutTimezone(event.endDate)
          )}
        </styled.p>

        <LinkButton to={`/events/${event.id}`} variant="secondary" size="xs">
          Event Info <RiArrowRightSLine />
        </LinkButton>
      </Box>
    </Flex>
  );
};
