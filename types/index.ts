export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  price: number;
  description: string;
  cover_image: string[];
  stock: number;
  publication_date: string;
  publisher: string;
  weight: number;
  dimensions: string;
  language: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
  __v: number;
} 