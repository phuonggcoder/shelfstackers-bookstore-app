import { useCallback, useEffect, useState } from 'react';
import { getBooksByCategory } from '../services/api';
import { Book } from '../types';

export const useCategoryBooks = (categoryId: string) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    if (!categoryId) return;
    
    try {
      setLoading(true);
      const data = await getBooksByCategory(categoryId);
      setBooks(data);
      setError(null);
    } catch (err) {
      setError('Không thể tải sách trong danh mục này.');
      console.error('Error fetching category books:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  return { books, loading, error, refetch: fetchBooks };
};
