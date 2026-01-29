import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
    FiveSimConfig,
    UserProfile,
    Order,
    OrderHistory,
    OrderHistoryOptions,
    BuyActivationOptions,
    BuyHostingOptions,
    GetPricesOptions,
    CountryList,
    ProductList,
    PriceList,
} from './types';
import {
    FiveSimError,
    AuthenticationError,
    RateLimitError,
    ServiceUnavailableError,
    NoNumbersError,
} from './errors';

/**
 * 5sim.net API Client
 */
export class FiveSimClient {
    private client: AxiosInstance;

    constructor(config: FiveSimConfig) {
        const baseURL = config.baseUrl || 'https://5sim.net/v1';

        this.client = axios.create({
            baseURL,
            timeout: config.timeout || 30000,
            headers: {
                Authorization: `Bearer ${config.apiKey}`,
                Accept: 'application/json',
            },
        });

        // Add error interceptor
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Handle API errors and convert to custom error types
     */
    private handleError(error: AxiosError): Error {
        if (!error.response) {
            return new FiveSimError(error.message || 'Network error');
        }

        const { status, data } = error.response;

        switch (status) {
            case 401:
                return new AuthenticationError();
            case 429:
                return new RateLimitError();
            case 503:
                return new ServiceUnavailableError();
            case 400:
                // Check if it's a "no numbers" error
                const message = typeof data === 'string' ? data : (data as any)?.message || '';
                if (message.toLowerCase().includes('no') || message.toLowerCase().includes('not available')) {
                    return new NoNumbersError(message);
                }
                return new FiveSimError(message || 'Bad request', status, data);
            default:
                const msg = typeof data === 'string' ? data : (data as any)?.message || 'Unknown error';
                return new FiveSimError(msg, status, data);
        }
    }

    /**
     * Get user profile and balance
     * @returns User profile information
     */
    async getProfile(): Promise<UserProfile> {
        const { data } = await this.client.get<UserProfile>('/user/profile');
        return data;
    }

    /**
     * Get order history
     * @param options - Options for filtering history
     * @returns Order history
     */
    async getOrderHistory(options?: OrderHistoryOptions): Promise<OrderHistory> {
        const params = new URLSearchParams();
        if (options?.category) params.append('category', options.category);
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset !== undefined) params.append('offset', options.offset.toString());

        const queryString = params.toString();
        const url = `/user/orders${queryString ? `?${queryString}` : ''}`;

        const { data } = await this.client.get<OrderHistory>(url);
        return data;
    }

    /**
     * Get list of available countries (guest access)
     * @returns List of countries
     */
    async getCountries(): Promise<CountryList> {
        const { data } = await this.client.get<CountryList>('/guest/countries');
        return data;
    }

    /**
     * Get products for a specific country and operator (guest access)
     * @param country - Country code or 'any'
     * @param operator - Operator name or 'any'
     * @returns List of products
     */
    async getProducts(country: string, operator: string): Promise<ProductList> {
        const { data } = await this.client.get<ProductList>(`/guest/products/${country}/${operator}`);
        return data;
    }

    /**
     * Get prices for products (guest access)
     * @param options - Options for filtering prices
     * @returns Price information
     */
    async getPrices(options?: GetPricesOptions): Promise<PriceList> {
        const params = new URLSearchParams();
        if (options?.country) params.append('country', options.country);
        if (options?.product) params.append('product', options.product);

        const queryString = params.toString();
        const url = `/guest/prices${queryString ? `?${queryString}` : ''}`;

        const { data } = await this.client.get<PriceList>(url);
        return data;
    }

    /**
     * Buy an activation number
     * @param options - Options for buying activation
     * @returns Order information with phone number
     */
    async buyActivation(options: BuyActivationOptions): Promise<Order> {
        const { country, operator, product, forwarding } = options;
        const params = new URLSearchParams();
        if (forwarding) params.append('forwarding', '1');

        const queryString = params.toString();
        const url = `/user/buy/activation/${country}/${operator}/${product}${queryString ? `?${queryString}` : ''}`;

        const { data } = await this.client.get<Order>(url);
        return data;
    }

    /**
     * Buy a hosting number
     * @param options - Options for buying hosting
     * @returns Order information with phone number
     */
    async buyHosting(options: BuyHostingOptions): Promise<Order> {
        const { country, operator, product } = options;
        const { data } = await this.client.get<Order>(`/user/buy/hosting/${country}/${operator}/${product}`);
        return data;
    }

    /**
     * Check order status and retrieve SMS messages
     * @param id - Order ID
     * @returns Updated order information with SMS
     */
    async checkOrder(id: number): Promise<Order> {
        const { data } = await this.client.get<Order>(`/user/check/${id}`);
        return data;
    }

    /**
     * Finish an order after receiving SMS
     * @param id - Order ID
     * @returns Updated order status
     */
    async finishOrder(id: number): Promise<Order> {
        const { data } = await this.client.get<Order>(`/user/finish/${id}`);
        return data;
    }

    /**
     * Cancel an order and get refund
     * @param id - Order ID
     * @returns Updated order status
     */
    async cancelOrder(id: number): Promise<Order> {
        const { data } = await this.client.get<Order>(`/user/cancel/${id}`);
        return data;
    }

    /**
     * Ban a number if it's already used on the target service
     * @param id - Order ID
     * @returns Updated order status
     */
    async banNumber(id: number): Promise<Order> {
        const { data } = await this.client.get<Order>(`/user/ban/${id}`);
        return data;
    }
}
