import { Events } from "@prisma/client";
import { format } from "date-fns";
import { BsClock, BsPinMap } from "react-icons/bs/index.js";
import { styled, Box, Flex } from "~/styled-system/jsx";
import { LinkButton } from "./Button";

interface QueriedEvent
  extends Omit<Events, "startDate" | "endDate" | "createdAt" | "updatedAt"> {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  event: QueriedEvent;
}

export const EventCard = ({ event }: Props) => {
  return (
    <Flex rounded="md" bgColor="brand.500" p={4} alignItems="center" gap={2}>
      <Box flex={1}>
        <styled.h3 fontSize="lg" fontWeight="bold" textWrap="balance">
          {event.name}
        </styled.h3>

        <Flex alignItems="center" gap={1} fontWeight="medium">
          <styled.span fontSize="sm">
            <BsClock />
          </styled.span>
          <styled.span fontSize="sm">
            {format(new Date(event.startDate), "HH:mm")}-
            {format(new Date(event.endDate), "HH:mm")}
          </styled.span>
        </Flex>

        <Flex fontSize="sm" fontWeight="medium" alignItems="center" gap={1}>
          <BsPinMap />
          <styled.span>{event.track}</styled.span>
        </Flex>
      </Box>

      <Box>
        <LinkButton to={event.link} target="_blank" variant="secondary">
          See Info
        </LinkButton>
      </Box>
    </Flex>
  );
};
