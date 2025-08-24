import { Book } from '../types';
import { getBookById, getBooks } from './api';
import googleBooksService from './googleBooksService';

export interface HybridSearchParams {
  query: string;
  includeLocal?: boolean;
  includeGoogle?: boolean;
  maxResults?: number;
  category?: string;
  author?: string;
  sortBy?: 'relevance' | 'title' | 'price' | 'rating';
  order?: 'asc' | 'desc';
}

export interface HybridSearchResult {
  localBooks: Book[];
  googleBooks: any[];
  combined: any[];
  totalResults: number;
  searchTime: number;
}

export interface BookComparison {
  localBook?: Book;
  googleBook?: any;
  similarity: number;
  isLocal: boolean;
  isGoogle: boolean;
}

class HybridBookService {
  /**
   * Tìm kiếm hybrid - kết hợp local và Google Books
   */
  async hybridSearch(params: HybridSearchParams): Promise<HybridSearchResult> {
    const startTime = Date.now();
    const { query, includeLocal = true, includeGoogle = true, maxResults = 20 } = params;

    try {
      const promises: Promise<any>[] = [];

      // Tìm kiếm local books
      if (includeLocal) {
        promises.push(this.searchLocalBooks(query, maxResults));
      }

      // Tìm kiếm Google Books
      if (includeGoogle) {
        promises.push(this.searchGoogleBooks(query, maxResults));
      }

      const results = await Promise.allSettled(promises);
      
      let localBooks: Book[] = [];
      let googleBooks: any[] = [];

      // Xử lý kết quả local
      if (includeLocal && results[0].status === 'fulfilled') {
        localBooks = results[0].value;
      }

      // Xử lý kết quả Google
      if (includeGoogle && results[1]?.status === 'fulfilled') {
        googleBooks = results[1].value;
      }

      // Kết hợp và loại bỏ trùng lặp
      const combined = this.combineAndDeduplicate(localBooks, googleBooks, query);
      
      // Sắp xếp kết quả
      const sortedCombined = this.sortResults(combined, params.sortBy, params.order);

      const searchTime = Date.now() - startTime;

      return {
        localBooks,
        googleBooks,
        combined: sortedCombined.slice(0, maxResults),
        totalResults: localBooks.length + googleBooks.length,
        searchTime,
      };
    } catch (error) {
      console.error('Hybrid search error:', error);
      throw new Error('Failed to perform hybrid search');
    }
  }

  /**
   * Tìm kiếm sách trong local database
   */
  private async searchLocalBooks(query: string, maxResults: number): Promise<Book[]> {
    try {
      const allBooks = await getBooks();
      
      // Filter theo query
      const filteredBooks = allBooks.filter(book => {
        const searchText = query.toLowerCase();
        return (
          book.title.toLowerCase().includes(searchText) ||
          book.author.toLowerCase().includes(searchText) ||
          book.description.toLowerCase().includes(searchText) ||
          book.publisher.toLowerCase().includes(searchText)
        );
      });

      return filteredBooks.slice(0, maxResults);
    } catch (error) {
      console.error('Local search error:', error);
      return [];
    }
  }

  /**
   * Tìm kiếm sách trên Google Books
   */
  private async searchGoogleBooks(query: string, maxResults: number): Promise<any[]> {
    try {
      const response = await googleBooksService.searchBooks({
        q: query,
        maxResults,
        orderBy: 'relevance',
      });

      return response.items?.map(book => 
        googleBooksService.convertGoogleBookToLocalFormat(book)
      ) || [];
    } catch (error) {
      console.error('Google Books search error:', error);
      return [];
    }
  }

  /**
   * Kết hợp và loại bỏ trùng lặp giữa local và Google books
   */
  private combineAndDeduplicate(localBooks: Book[], googleBooks: any[], query: string): any[] {
    const combined: any[] = [];
    const seenTitles = new Set<string>();
    const seenISBNs = new Set<string>();

    // Thêm local books trước
    localBooks.forEach(book => {
      combined.push({
        ...book,
        source: 'local',
        isLocal: true,
        isGoogle: false,
      });
      
      seenTitles.add(book.title.toLowerCase());
      if (book.isbn) {
        seenISBNs.add(book.isbn);
      }
    });

    // Thêm Google books, loại bỏ trùng lặp
    googleBooks.forEach(book => {
      const titleLower = book.title.toLowerCase();
      const isbn = book.isbn;
      
      // Kiểm tra trùng lặp theo title hoặc ISBN
      const isDuplicate = seenTitles.has(titleLower) || (isbn && seenISBNs.has(isbn));
      
      if (!isDuplicate) {
        combined.push({
          ...book,
          source: 'google_books',
          isLocal: false,
          isGoogle: true,
        });
        
        seenTitles.add(titleLower);
        if (isbn) {
          seenISBNs.add(isbn);
        }
      }
    });

    return combined;
  }

  /**
   * Sắp xếp kết quả theo tiêu chí
   */
  private sortResults(books: any[], sortBy?: string, order: 'asc' | 'desc' = 'desc'): any[] {
    if (!sortBy) return books;

    return books.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'rating':
          comparison = (a.averageRating || 0) - (b.averageRating || 0);
          break;
        case 'relevance':
        default:
          // Ưu tiên local books trước
          if (a.isLocal && !b.isLocal) return -1;
          if (!a.isLocal && b.isLocal) return 1;
          return 0;
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * So sánh sách local và Google books
   */
  async compareBooks(localBookId: string, googleBookId: string): Promise<BookComparison> {
    try {
      const [localBook, googleBook] = await Promise.all([
        getBookById(localBookId),
        googleBooksService.getBookById(googleBookId),
      ]);

      const similarity = this.calculateSimilarity(localBook, googleBook);

      return {
        localBook,
        googleBook: googleBooksService.convertGoogleBookToLocalFormat(googleBook),
        similarity,
        isLocal: true,
        isGoogle: true,
      };
    } catch (error) {
      console.error('Book comparison error:', error);
      throw new Error('Failed to compare books');
    }
  }

  /**
   * Tính độ tương đồng giữa hai cuốn sách
   */
  private calculateSimilarity(book1: any, book2: any): number {
    let similarity = 0;
    let totalChecks = 0;

    // So sánh title
    if (book1.title && book2.title) {
      const titleSimilarity = this.stringSimilarity(book1.title, book2.title);
      similarity += titleSimilarity;
      totalChecks++;
    }

    // So sánh author
    if (book1.author && book2.author) {
      const authorSimilarity = this.stringSimilarity(book1.author, book2.author);
      similarity += authorSimilarity;
      totalChecks++;
    }

    // So sánh ISBN
    if (book1.isbn && book2.isbn) {
      if (book1.isbn === book2.isbn) {
        similarity += 1;
      }
      totalChecks++;
    }

    return totalChecks > 0 ? similarity / totalChecks : 0;
  }

  /**
   * Tính độ tương đồng giữa hai chuỗi
   */
  private stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Tính khoảng cách Levenshtein
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Tìm kiếm sách theo danh mục (hybrid)
   */
  async searchByCategory(categoryId: string, includeGoogle = true): Promise<HybridSearchResult> {
    try {
      // Lấy sách local theo category
      const localBooks = await this.getLocalBooksByCategory(categoryId);
      
      let googleBooks: any[] = [];
      
      // Tìm kiếm Google Books theo category name
      if (includeGoogle && localBooks.length > 0) {
        const categoryName = localBooks[0].categories?.[0]?.name;
        if (categoryName) {
          googleBooks = await this.searchGoogleBooks(categoryName, 20);
        }
      }

      const combined = this.combineAndDeduplicate(localBooks, googleBooks, '');

      return {
        localBooks,
        googleBooks,
        combined,
        totalResults: localBooks.length + googleBooks.length,
        searchTime: 0,
      };
    } catch (error) {
      console.error('Category search error:', error);
      throw new Error('Failed to search by category');
    }
  }

  /**
   * Lấy sách local theo category
   */
  private async getLocalBooksByCategory(categoryId: string): Promise<Book[]> {
    try {
      const allBooks = await getBooks();
      return allBooks.filter(book => 
        book.categories.some(cat => cat._id === categoryId)
      );
    } catch (error) {
      console.error('Get local books by category error:', error);
      return [];
    }
  }

  /**
   * Tìm kiếm sách theo tác giả (hybrid)
   */
  async searchByAuthor(author: string, maxResults = 20): Promise<HybridSearchResult> {
    const params: HybridSearchParams = {
      query: author,
      includeLocal: true,
      includeGoogle: true,
      maxResults,
    };

    return this.hybridSearch(params);
  }
}

export default new HybridBookService();




