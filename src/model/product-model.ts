import type { Product, Brand, Category } from "../../generated/prisma/client";

export type ProductResponse = {
  id: number;
  name: string;
  brand: Brand;
  manufacturer: string;
  category: Category;
  price: number;
  cost_price: number;
  stock: number;
  created_at: Date;
  updated_at: Date;
};

export type ProductPublicResponse = {
  id: number;
  name: string;
  brand: Brand;
  manufacturer: string;
  category: Category;
  price: number;
  stock: number;
};

export type CreateProductRequest = {
  name: string;
  brand: Brand;
  manufacturer?: string;
  price: number;
  cost_price: number;
  category?: Category;
  stock?: number;
};

export type UpdateProductRequest = {
  id: number;
  name?: string;
  brand?: Brand;
  manufacturer?: string;
  price?: number;
  cost_price?: number;
  category?: Category;
  stock?: number;
};

export type SearchProductRequest = {
  name?: string;
  brand?: Brand;
  manufacturer?: string;
  category?: Category;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  page: number;
  size: number;
  sort_by?: "price" | "stock" | "created_at";
  sort_order?: "asc" | "desc";
};

export function toProductResponse(product: Product): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    manufacturer: product.manufacturer,
    category: product.category,
    price: product.price,
    cost_price: product.cost_price,
    stock: product.stock,
    created_at: product.created_at,
    updated_at: product.updated_at,
  };
}

export function toProductPublicResponse(
  product: Product,
): ProductPublicResponse {
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    manufacturer: product.manufacturer,
    category: product.category,
    price: product.price,
    stock: product.stock,
  };
}
