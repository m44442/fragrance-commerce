type productType = {
    id: number,
    title: string,
    price: number,
    category: string,
    brand: string,
    description: string,
    thumbnail: { url: string},
    createdAt: string,
    updatedAt: string,
    rank: number
};

export type { productType };