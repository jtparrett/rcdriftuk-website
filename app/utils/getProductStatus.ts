import { ProductStatus } from "~/utils/enums";

export const getProductStatus = (status: ProductStatus) => {
  switch (status) {
    case ProductStatus.IN_STOCK:
      return "In stock";
    case ProductStatus.SOLD_OUT:
      return "Sold out";
    case ProductStatus.BACKORDER:
      return "Backorder";
    default:
      return "Unknown";
  }
};
