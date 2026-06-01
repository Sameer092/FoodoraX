export * from './database.types';
export * from './navigation.types';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends Coordinates {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PaymentSheet {
  paymentIntent: string;
  ephemeralKey: string;
  customer: string;
  publishableKey: string;
}

export interface SearchFilters {
  query?: string;
  cuisineType?: string[];
  minRating?: number;
  maxDeliveryTime?: number;
  maxDeliveryFee?: number;
  isOpen?: boolean;
  isFeatured?: boolean;
  sortBy?: 'rating' | 'delivery_time' | 'delivery_fee' | 'distance' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
