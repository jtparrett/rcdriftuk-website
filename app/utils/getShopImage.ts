import { Shops } from "@prisma/client";

export const getShopImage = (shop: Shops) => {
  switch (shop) {
    case Shops.ASBO:
      return "/shops/asbo-social.jpeg";
    case Shops.DRIFTMANJI:
      return "/shops/driftmanji-logo.jpeg";
    case Shops.RCPACE:
      return "/shops/PACE-logo.jpg";
    case Shops.RCKITOUT:
      return "/shops/rckitout-logo.jpg";
    case Shops.SLIDEDYNAMICS:
      return "/shops/slide-dynamics-social.jpg";
    case Shops.MODELSHOPDIRECT:
      return "/shops/model-shop-direct.jpg";
    default:
      throw new Error(`Unsupported shop in getShopImage: ${shop}`);
  }
};
