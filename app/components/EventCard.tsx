import type { Events, Tracks } from "@prisma/client";
import { format } from "date-fns";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { RiCalendar2Fill, RiMapPin2Fill, RiTimeFill } from "react-icons/ri";
import { dateWithoutTimezone } from "~/utils/dateWithoutTimezone";
import { Link } from "@remix-run/react";

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
    <Flex rounded="md" bgColor="gray.900" p={4} alignItems="center" gap={2}>
      {showAvatar && event.eventTrack?.image && (
        <Box w={16} h={16} rounded="full" overflow="hidden">
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
        <styled.h3 fontSize="lg" fontWeight="bold" textWrap="balance">
          {event.name}
        </styled.h3>

        <Flex fontSize="sm" fontWeight="medium" alignItems="center" gap={1}>
          <RiMapPin2Fill />
          <styled.span>{event.eventTrack?.name ?? event.track}</styled.span>
        </Flex>

        <Flex gap={2} flexWrap="wrap">
          <Flex alignItems="center" gap={1} fontWeight="medium">
            <styled.span fontSize="sm">
              <RiCalendar2Fill />
            </styled.span>
            <styled.span fontSize="sm">
              {format(new Date(event.startDate), "dd/MM/yyyy")}
            </styled.span>
          </Flex>

          <Flex alignItems="center" gap={1} fontWeight="medium">
            <styled.span fontSize="sm">
              <RiTimeFill />
            </styled.span>
            <styled.span fontSize="sm">
              {format(dateWithoutTimezone(event.startDate), "HH:mm")}-
              {format(dateWithoutTimezone(event.endDate), "HH:mm")}
            </styled.span>
          </Flex>
        </Flex>
      </Box>

      <Box>
        <LinkButton to={`/events/${event.id}`} variant="secondary" size="sm">
          See Info
        </LinkButton>
      </Box>
    </Flex>
  );
};
