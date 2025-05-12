import { Link, useLoaderData } from "react-router";
import { styled, Flex, Box, Spacer } from "~/styled-system/jsx";
import { LinkButton } from "~/components/Button";
import { ProductStatus as Status } from "~/utils/enums";
import { prisma } from "~/utils/prisma.server";
import { RiLink } from "react-icons/ri";
import { ProductStatus } from "~/components/ProductStatus";
import type { Route } from "./+types/catalogue.$slug";

export const meta: Route.MetaFunction = ({ data }) => {
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

export const loader = async ({ params }: Route.LoaderArgs) => {
  const product = await prisma.products.findFirst({
    where: {
      slug: params.slug,
    },
    include: {
      Tracks: true,
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
  const inStock = product.status === Status.IN_STOCK;
  const backorder = product.status === Status.BACKORDER;
  const buttonText = inStock
    ? "Buy Now"
    : backorder
      ? "Backorder Now"
      : "View Product";

  return (
    <Box pt={4}>
      <Flex flexDir={{ base: "column", md: "row" }} alignItems="flex-start">
        <Box flex={1} overflow="hidden" rounded="lg">
          <styled.img src={product.image} w="full" />
        </Box>
        <Box px={{ base: 4, md: 12 }} flex={1}>
          <ProductStatus status={product.status} />

          <styled.h1
            fontWeight="extrabold"
            fontSize="3xl"
            mb={6}
            mt={4}
            lineHeight={1.1}
            textWrap="balance"
          >
            {product?.title}
          </styled.h1>

          {product.description && (
            <styled.p
              fontSize="sm"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          <Flex
            gap={4}
            alignItems="center"
            rounded="xl"
            borderWidth={1}
            p={4}
            mt={6}
            borderColor="gray.700"
          >
            <Link to={`/tracks/${product.Tracks?.slug}`}>
              <Flex gap={2} alignItems="center">
                <Box
                  w={12}
                  h={12}
                  rounded="full"
                  overflow="hidden"
                  pos="relative"
                >
                  <styled.img
                    src={product.Tracks?.image ?? ""}
                    pos="absolute"
                    inset={0}
                    objectFit="cover"
                  />
                </Box>
                <Box>
                  <styled.span fontWeight="bold">
                    {product.Tracks?.name}
                  </styled.span>
                </Box>
              </Flex>
            </Link>

            <Spacer />

            <LinkButton
              to={product.url}
              target="_blank"
              data-splitbee-event="Clicked to Buy"
            >
              {buttonText} <RiLink />
            </LinkButton>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default CatalogueListingPage;
