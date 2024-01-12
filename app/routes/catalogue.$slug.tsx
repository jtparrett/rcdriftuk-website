import { useLoaderData } from "@remix-run/react";
import { styled, Flex, Box, Spacer, Divider } from "~/styled-system/jsx";
import { LinkButton } from "~/components/Button";
import { getShopImage } from "~/utils/getShopImage";
import { prisma } from "~/utils/prisma.server";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { getShopName } from "~/utils/getShopName";
import { RiLink, RiMapPinFill } from "react-icons/ri/index.js";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: `RC Drift UK | ${data?.title}`,
      description: data?.description,
      "og:title": `RC Drift UK | ${data?.title}`,
      "og:description": data?.description,
      "og:image": data?.image,
    },
  ];
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const product = await prisma.products.findFirst({
    where: {
      slug: params.slug,
    },
  });

  if (!product) {
    throw new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }

  return product;
};

const CatalogueListingPage = () => {
  const product = useLoaderData<typeof loader>();

  return (
    <Box pt={4}>
      <Flex flexDir={{ base: "column", md: "row" }}>
        <Box flex={1} overflow="hidden" rounded="lg">
          <styled.img src={product.image} w="full" />
        </Box>
        <Box p={{ base: 4, md: 12 }} flex={1}>
          <styled.h1 fontWeight="extrabold" fontSize="3xl" mb={2}>
            {product?.title}
          </styled.h1>

          <styled.p dangerouslySetInnerHTML={{ __html: product.description }} />

          <Divider borderColor="gray.700" my={6} />

          <Flex gap={4} alignItems="center">
            <Box w={12} h={12} rounded="full" overflow="hidden" pos="relative">
              <styled.img
                src={getShopImage(product.shop)}
                pos="absolute"
                inset={0}
                objectFit="cover"
              />
            </Box>
            <Box>
              <Flex alignItems="center" gap={1}>
                <styled.span>{getShopName(product.shop)}</styled.span>
                <RiMapPinFill />
              </Flex>
            </Box>
            <Spacer />
            <LinkButton
              to={product.url}
              target="_blank"
              data-splitbee-event="Clicked to Buy"
            >
              Visit Shop <RiLink />
            </LinkButton>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default CatalogueListingPage;
