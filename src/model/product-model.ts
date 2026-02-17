import type {
  Product,
  Brand,
  Category,
  ProductLogAction,
} from "../../generated/prisma/client";

export type ProductResponse = {
  id: number;
  name: string;
  brand: Brand;
  manufacturer: string;
  category: Category;
  price: number;
  cost_price: number;
  stock: number;
  image_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ProductPublicResponse = {
  id: number;
  name: string;
  brand: Brand;
  manufacturer: string;
  category: Category;
  image_url: string | null;
  price: number;
  stock: number;
};

export type CreateProductRequest = {
  name: string;
  brand: Brand;
  manufacturer: string;
  price: number;
  cost_price: number;
  category?: Category;
  stock?: number;
  image?: File;
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
  image?: File;
  delete_image?: boolean;
  stock_action?: ProductLogAction;
};

export type SearchProductRequest = {
  name?: string;
  brand?: Brand;
  manufacturer?: string;
  category?: Category;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  is_deleted?: boolean;
  page: number;
  size: number;
  sort_by?: "price" | "stock" | "created_at";
  sort_order?: "asc" | "desc";
};

export type RestoreProductRequest = {
  id: number;
  name?: string;
};

export type DeleteProductRequest = {
  id: number;
};

export type GetDetailedProductRequest = {
  id: number;
};

export type CheckProductExistRequest = {
  id: number;
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
    image_url: product.image_url,
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
    image_url: product.image_url,
  };
}
