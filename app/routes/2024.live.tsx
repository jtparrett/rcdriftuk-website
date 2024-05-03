import { ClientOnly } from "~/components/ClientOnly";
import { styled, Box, Container } from "~/styled-system/jsx";

const Page = () => {
  return (
    <Container py={4} px={2} maxW={1100}>
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

      <ClientOnly>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8123266196289449"
          crossOrigin="anonymous"
        ></script>

        <ins
          className="adsbygoogle"
          style={{ display: "block !important" }}
          data-ad-client="ca-pub-8123266196289449"
          data-ad-slot="9623572443"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
      </ClientOnly>
    </Container>
  );
};

export default Page;
