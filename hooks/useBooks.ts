import { useState, useCallback, useEffect } from 'react';
import { getBooksByCategory } from '../services/api';
import { Book } from '../types';

export const useBooks = (categoryId: string) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getBooksByCategory(String(categoryId));
      setBooks(data);
    } catch (err) {
      setError('Không có sách nào trong danh mục này.');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const refreshBooks = useCallback(() => {
    fetchBooks();
  }, [fetchBooks]);

  return {
    books,
    loading,
    error,
    refreshBooks,
  };
};
