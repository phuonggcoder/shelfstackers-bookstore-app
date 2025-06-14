import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBooks, getCategories } from '../services/api';
import { Book, Category } from '../types';

interface DataContextType {
  books: Book[];
  categories: Category[];
  isLoading: boolean;
}

const DataContext = createContext<DataContextType>({
  books: [],
  categories: [],
  isLoading: true,
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedBooks, fetchedCategories] = await Promise.all([
          getBooks(),
          getCategories(),
        ]);
        setBooks(fetchedBooks);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DataContext.Provider value={{ books, categories, isLoading }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext); 