import { useEffect } from "react";
import { ClientOnly } from "~/components/ClientOnly";
import { styled, Box, Container } from "~/styled-system/jsx";

const Page = () => {
  useEffect(() => {
    try {
      // @ts-ignore
      (global.window.adsbygoogle = global.window.adsbygoogle || []).push({});
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <Container py={4} px={2} maxW={1100}>
      <ClientOnly>
        <Box
          pt="52.5%"
          pos="relative"
          rounded="xl"
          bgColor="gray.800"
          overflow="hidden"
        >
          <styled.iframe
            src="https://www.youtube.com/embed/live_stream?channel=UCzxW07KOXZc9huwyDId7prw"
            pos="absolute"
            w="full"
            h="full"
            inset={0}
          />
        </Box>
      </ClientOnly>

      <ins
        className="adsbygoogle"
        style={{ display: "block !important" }}
        data-ad-client="ca-pub-8123266196289449"
        data-ad-slot="9623572443"
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </Container>
  );
};

export default Page;
