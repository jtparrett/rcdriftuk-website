import { Flex, AspectRatio, Box, styled } from "~/styled-system/jsx";
import { ProductStatus } from "./ProductStatus";
import { LinkOverlay } from "./LinkOverlay";
import type { loader } from "~/routes/marketplace._index";

interface Props {
  product: Awaited<ReturnType<typeof loader>>["products"][number];
}

export const ProductCard = ({ product }: Props) => {
  return (
    <styled.article pos="relative">
      <Box pos="relative">
        <Box pos="absolute" top={2} right={2} zIndex={1}>
          <ProductStatus status={product.status} />
        </Box>

        <AspectRatio
          w="full"
          ratio={1.2}
          pos="relative"
          overflow="hidden"
          rounded="md"
          mb={2}
        >
          <styled.img src={product.image} w="full" pos="absolute" inset={0} />
        </AspectRatio>
      </Box>
      <LinkOverlay to={`/marketplace/${product.slug}`}>
        <Flex alignItems="flex-start" gap={2}>
          <Box w={8} h={8} rounded="full" overflow="hidden">
            <styled.img
              src={product.Tracks?.image ?? ""}
              w="full"
              h="full"
              objectFit="cover"
              display="block"
            />
          </Box>
          <Box flex={1}>
            <styled.h1
              fontWeight="semibold"
              textWrap="balance"
              fontSize="sm"
              lineHeight={1.2}
            >
              {product.title}
            </styled.h1>
          </Box>
        </Flex>
      </LinkOverlay>
    </styled.article>
  );
};
