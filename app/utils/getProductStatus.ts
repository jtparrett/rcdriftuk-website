import { ProductStatus } from "@prisma/client";

export const getProductStatus = (status: ProductStatus) => {
  switch (status) {
    case ProductStatus.IN_STOCK:
      return "In Stock";
    case ProductStatus.SOLD_OUT:
      return "Sold Out";
    case ProductStatus.BACKORDER:
      return "Backorder";
    default:
      return "Unknown";
  }
};
