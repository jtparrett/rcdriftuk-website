import { Shops } from "@prisma/client";

export const getShopName = (shop: Shops) => {
  switch (shop) {
    case Shops.ASBO:
      return "ASBO";
    case Shops.DRIFTMANJI:
      return "DriftManji";
    case Shops.RCPACE:
      return "PACE";
    case Shops.RCKITOUT:
      return "RCKitOut";
    case Shops.SLIDEDYNAMICS:
      return "Slide Dynamics";
    case Shops.MODELSHOPDIRECT:
      return "RC ModelShop Direct";
    default:
      throw new Error(`Unsupported shop in getShopName: ${shop}`);
  }
};
