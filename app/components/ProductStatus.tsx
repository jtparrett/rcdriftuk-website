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
  const stockColor = inStock
    ? "green.500"
    : soldOut
    ? "red.500"
    : backorder
    ? "blue.500"
    : "gray.500";

  return (
    <Box
      bgColor={stockColor}
      rounded="md"
      display="inline-block"
      fontSize="xs"
      fontWeight="semibold"
      px={2}
      py={0.5}
    >
      {getProductStatus(status)}
    </Box>
  );
};
