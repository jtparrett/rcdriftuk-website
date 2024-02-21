import type { Events, Tracks } from "@prisma/client";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { dateWithoutTimezone } from "~/utils/dateWithoutTimezone";
import { Link } from "@remix-run/react";
import { getEventDate } from "~/utils/getEventDate";

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
  return (
    <Flex rounded="md" bgColor="gray.900" p={4} alignItems="center" gap={4}>
      {showAvatar && event.eventTrack?.image && (
        <Box
          w={16}
          h={16}
          rounded="full"
          overflow="hidden"
          borderWidth={1}
          borderColor="gray.500"
        >
          <Link to={`/calendar/${event.eventTrack.slug}`}>
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
        <styled.span fontSize="sm" color="gray.500">
          {event.eventTrack?.name ?? event.track}
        </styled.span>

        <styled.h3 fontSize="lg" fontWeight="bold" textWrap="balance">
          {event.name}
        </styled.h3>
        <styled.span fontSize="sm" color="gray.300" fontWeight="semibold">
          {getEventDate(
            dateWithoutTimezone(event.startDate),
            dateWithoutTimezone(event.endDate)
          )}
        </styled.span>
      </Box>

      <Box>
        <LinkButton to={`/events/${event.id}`} variant="secondary" size="sm">
          See Info
        </LinkButton>
      </Box>
    </Flex>
  );
};
