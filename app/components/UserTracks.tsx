import { Box, Center, Flex, styled } from "~/styled-system/jsx";
import { LinkButton } from "./Button";
import { RiAddCircleFill, RiAddLine } from "react-icons/ri";
import { Link } from "react-router";
import type { GetUser } from "~/utils/getUser.server";

export const UserTracks = ({ user }: { user: GetUser }) => {
  return (
    <Box borderBottomWidth={1} borderColor="gray.800">
      <Box px={3} pt={3}>
        <styled.p fontSize="sm" fontWeight="semibold" mb={1}>
          Your Tracks
        </styled.p>

        {(user?.Tracks.length ?? 0) <= 0 && (
          <LinkButton
            to="/tracks/new"
            variant="outline"
            size="xs"
            fontSize="xs"
          >
            Register a Track <RiAddCircleFill />
          </LinkButton>
        )}
      </Box>

      {(user?.Tracks.length ?? 0) > 0 && (
        <Flex pl={3} pb={3} overflow="auto">
          {user?.Tracks.map(({ track }) => (
            <Box
              key={track.id}
              w={12}
              overflow="hidden"
              textAlign="center"
              flex="none"
              mr={2}
            >
              <Box w="full" h={12} overflow="hidden" rounded="full">
                <Link to={`/tracks/${track.slug}`}>
                  <styled.img
                    src={track.image}
                    w="full"
                    h="full"
                    alt={track.name}
                  />
                </Link>
              </Box>
              <styled.span
                fontSize="xs"
                mt={1}
                w="full"
                display="block"
                overflow="hidden"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
              >
                {track.name}
              </styled.span>
            </Box>
          ))}

          <Box w={12} textAlign="center" flex="none" mr={2}>
            <Link to="/tracks/new">
              <Center w="full" h={12} rounded="full" bgColor="gray.800">
                <RiAddLine />
              </Center>
              <styled.span fontSize="xs" mt={1}>
                Add
              </styled.span>
            </Link>
          </Box>
        </Flex>
      )}
    </Box>
  );
};
