import { ProductStatus as Status } from "@prisma/client";
import { Box } from "~/styled-system/jsx";
import { getProductStatus } from "~/utils/getProductStatus";

interface Props {
  status: Status;
}

export const ProductStatus = ({ status }: Props) => {
  const inStock = status === Status.IN_STOCK;
  const soldOut = status === Status.SOLD_OUT;
  const backorder = status === Status.BACKORDER;
  const bgColor = inStock
    ? "green.200"
    : soldOut
      ? "red.200"
      : backorder
        ? "blue.200"
        : "gray.200";

  const fgColor = inStock
    ? "green.700"
    : soldOut
      ? "red.700"
      : backorder
        ? "blue.700"
        : "gray.700";

  return (
    <Box
      bgColor={bgColor}
      rounded="md"
      display="inline-block"
      fontSize="xs"
      fontWeight="semibold"
      px={2}
      py={0.5}
      color={fgColor}
    >
      {getProductStatus(status)}
    </Box>
  );
};
