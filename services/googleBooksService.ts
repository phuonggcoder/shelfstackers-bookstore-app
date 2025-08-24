import axios from 'axios';

const GOOGLE_BOOKS_API_BASE_URL = 'https://www.googleapis.com/books/v1';

export interface GoogleBook {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    publisher?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    imageLinks?: {
      smallThumbnail?: string;
      thumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    language?: string;
    previewLink?: string;
    infoLink?: string;
  };
  saleInfo?: {
    listPrice?: {
      amount: number;
      currencyCode: string;
    };
    retailPrice?: {
      amount: number;
      currencyCode: string;
    };
    buyLink?: string;
  };
}

export interface GoogleBooksSearchResponse {
  kind: string;
  totalItems: number;
  items?: GoogleBook[];
}

export interface GoogleBooksSearchParams {
  q: string;
  maxResults?: number;
  startIndex?: number;
  orderBy?: 'relevance' | 'newest';
  printType?: 'all' | 'books' | 'magazines';
  filter?: 'partial' | 'full' | 'free-ebooks' | 'paid-ebooks' | 'ebooks';
  langRestrict?: string;
  key?: string;
}

class GoogleBooksService {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Tìm kiếm sách trên Google Books
   */
  async searchBooks(params: GoogleBooksSearchParams): Promise<GoogleBooksSearchResponse> {
    try {
      const queryParams = new URLSearchParams({
        q: params.q,
        maxResults: (params.maxResults || 20).toString(),
        startIndex: (params.startIndex || 0).toString(),
        orderBy: params.orderBy || 'relevance',
        printType: params.printType || 'all',
        filter: params.filter || 'partial',
        ...(params.langRestrict && { langRestrict: params.langRestrict }),
        ...(this.apiKey && { key: this.apiKey }),
      });

      const response = await axios.get(
        `${GOOGLE_BOOKS_API_BASE_URL}/volumes?${queryParams.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Google Books search error:', error);
      throw new Error('Failed to search Google Books');
    }
  }

  /**
   * Lấy thông tin chi tiết sách từ Google Books
   */
  async getBookById(bookId: string): Promise<GoogleBook> {
    try {
      const queryParams = new URLSearchParams({
        ...(this.apiKey && { key: this.apiKey }),
      });

      const response = await axios.get(
        `${GOOGLE_BOOKS_API_BASE_URL}/volumes/${bookId}?${queryParams.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Google Books get book error:', error);
      throw new Error('Failed to get book from Google Books');
    }
  }

  /**
   * Tìm kiếm sách theo tác giả
   */
  async searchBooksByAuthor(author: string, maxResults = 20): Promise<GoogleBooksSearchResponse> {
    return this.searchBooks({
      q: `inauthor:"${author}"`,
      maxResults,
      orderBy: 'relevance',
    });
  }

  /**
   * Tìm kiếm sách theo danh mục
   */
  async searchBooksByCategory(category: string, maxResults = 20): Promise<GoogleBooksSearchResponse> {
    return this.searchBooks({
      q: `subject:"${category}"`,
      maxResults,
      orderBy: 'relevance',
    });
  }

  /**
   * Tìm kiếm sách miễn phí
   */
  async searchFreeBooks(query: string, maxResults = 20): Promise<GoogleBooksSearchResponse> {
    return this.searchBooks({
      q: query,
      maxResults,
      filter: 'free-ebooks',
      orderBy: 'relevance',
    });
  }

  /**
   * Chuyển đổi Google Book sang format tương thích với Book interface
   */
  convertGoogleBookToLocalFormat(googleBook: GoogleBook): any {
    const volumeInfo = googleBook.volumeInfo;
    const saleInfo = googleBook.saleInfo;

    return {
      _id: googleBook.id,
      title: volumeInfo.title || 'Unknown Title',
      author: volumeInfo.authors?.join(', ') || 'Unknown Author',
      description: volumeInfo.description || '',
      price: saleInfo?.retailPrice?.amount || saleInfo?.listPrice?.amount || 0,
      stock: 0, // Google Books không có thông tin stock
      cover_image: [
        volumeInfo.imageLinks?.large ||
        volumeInfo.imageLinks?.medium ||
        volumeInfo.imageLinks?.small ||
        volumeInfo.imageLinks?.thumbnail ||
        '',
      ],
      thumbnail: volumeInfo.imageLinks?.thumbnail || '',
      publication_date: volumeInfo.publishedDate || '',
      publisher: volumeInfo.publisher || '',
      language: volumeInfo.language || 'en',
      categories: volumeInfo.categories?.map(cat => ({ name: cat, _id: cat })) || [],
      pageCount: volumeInfo.pageCount,
      averageRating: volumeInfo.averageRating,
      ratingsCount: volumeInfo.ratingsCount,
      isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
             volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier,
      previewLink: volumeInfo.previewLink,
      infoLink: volumeInfo.infoLink,
      buyLink: saleInfo?.buyLink,
      source: 'google_books',
      featured: false,
    };
  }

  /**
   * Tìm kiếm nâng cao với nhiều tham số
   */
  async advancedSearch(params: {
    title?: string;
    author?: string;
    publisher?: string;
    subject?: string;
    isbn?: string;
    maxResults?: number;
  }): Promise<GoogleBooksSearchResponse> {
    const queryParts: string[] = [];

    if (params.title) {
      queryParts.push(`intitle:"${params.title}"`);
    }
    if (params.author) {
      queryParts.push(`inauthor:"${params.author}"`);
    }
    if (params.publisher) {
      queryParts.push(`inpublisher:"${params.publisher}"`);
    }
    if (params.subject) {
      queryParts.push(`subject:"${params.subject}"`);
    }
    if (params.isbn) {
      queryParts.push(`isbn:${params.isbn}`);
    }

    const query = queryParts.join(' ');
    
    return this.searchBooks({
      q: query,
      maxResults: params.maxResults || 20,
      orderBy: 'relevance',
    });
  }
}

// Export instance mặc định (không có API key)
export default new GoogleBooksService();

// Export class để có thể tạo instance với API key
export { GoogleBooksService };





