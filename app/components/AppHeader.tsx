import { Box, Flex, Spacer, styled } from "~/styled-system/jsx";
import { useDelayedLoader } from "./Header";

export const AppHeader = () => {
  const isNavigating = useDelayedLoader();

  return (
    <>
      <Flex
        pos="fixed"
        top="-135px"
        w="full"
        zIndex={15}
        bgColor="rgba(12, 12, 12, 0.75)"
        backdropFilter="blur(10px)"
        shadow="2xl"
        borderBottomWidth={1}
        borderColor="gray.900"
        flexDir="column"
        justifyContent="flex-end"
        h="200px"
        transform="translate3d(0, 0, 0)"
      >
        <Flex h="65px" alignItems="center" px={4}>
          <styled.img w={140} src="/rcdriftuk-26.svg" alt="RC Drift UK" />
          <Spacer />
          {isNavigating && (
            <Box
              w={5}
              h={5}
              rounded="full"
              borderWidth={2}
              borderColor="gray.800"
              borderTopColor="brand.500"
              animation="spin 1s linear infinite"
            />
          )}
        </Flex>
      </Flex>

      <Box h="65px" w="full" />
    </>
  );
};
