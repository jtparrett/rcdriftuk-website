import pluralize from "pluralize";
import { Box, styled } from "~/styled-system/jsx";
import type { TrackTypes } from "~/utils/enums";

interface Props {
  track: {
    cover: string | null;
    name: string;
    types: TrackTypes[];
    address: string | null;
    description: string | null;
    image: string;
  };
}

export const TrackSnippet = ({ track }: Props) => {
  return (
    <>
      <Box pos="relative" mb={-16} zIndex={-1} bgColor="gray.900" minH="100px">
        {track.cover && <styled.img src={track.cover} w="full" />}
        <Box
          pos="absolute"
          inset={0}
          bgGradient="to-b"
          gradientTo="black"
          gradientFrom="transparent"
          zIndex={1}
        />
      </Box>
      <Box textAlign="center" p={4} pt={track.cover ? 0 : 4}>
        <Box
          w={32}
          h={32}
          rounded="full"
          overflow="hidden"
          borderWidth={2}
          borderColor="gray.500"
          mx="auto"
          mb={2}
        >
          <styled.img src={track.image} w="full" h="full" objectFit="cover" />
        </Box>

        <styled.h1
          fontWeight="extrabold"
          fontSize="2xl"
          textWrap="balance"
          lineHeight="1.1"
        >
          {track.name}
        </styled.h1>

        <styled.span fontSize="sm" fontWeight="medium">
          {track.types.map(pluralize.singular).join(" | ")}
        </styled.span>

        {track.address && (
          <styled.p fontSize="sm" color="gray.500" mt={1} maxW={200} mx="auto">
            {track.address}
          </styled.p>
        )}
      </Box>

      {track.description && (
        <Box p={4} bgColor="gray.900" rounded="lg" mx={4}>
          <styled.p
            color="gray.500"
            fontSize="sm"
            textWrap="balance"
            whiteSpace="pre-line"
          >
            {track.description}
          </styled.p>
        </Box>
      )}
    </>
  );
};
