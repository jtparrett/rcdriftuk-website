import { Box, Container, Flex } from "~/styled-system/jsx";
import { useIsApp } from "~/utils/AppContext";
import { useIsEmbed } from "~/utils/EmbedContext";

export const TabsBar = ({ children }: { children: React.ReactNode }) => {
  const isApp = useIsApp();
  const isEmbed = useIsEmbed();

  return (
    <Box
      pos="sticky"
      style={
        {
          "--top": isApp || isEmbed ? "0px" : "64px",
        } as React.CSSProperties
      }
      top="var(--top)"
      zIndex={10}
      bgColor="rgba(12, 12, 12, 0.75)"
      backdropFilter="blur(10px)"
      borderBottomWidth={1}
      borderColor="gray.900"
    >
      <Container px={2} maxW={1100}>
        <Box overflowX="auto" w="full" scrollbar="hidden">
          <Flex gap={0.5} py={2} alignItems="center">
            {children}
          </Flex>
        </Box>
      </Container>
    </Box>
  );
};
