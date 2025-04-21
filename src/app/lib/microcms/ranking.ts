import { productType } from "@/types/types";
import { createClient } from "microcms-js-sdk";

export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_SERVICE_DOMAIN!,
  apiKey: process.env.NEXT_PUBLIC_API_KEY!,
});

export const getAllProducts = async () => {
  const allProducts = await client.getList<productType>({
    endpoint: "rumini_ranking",
  });
  return allProducts;
};

export const getDetailProduct = async (contentId: string) => {
  const detailProduct = await client.getListDetail<productType>({
    endpoint: "rumini_ranking",
    contentId,
  });

    return detailProduct;
  };