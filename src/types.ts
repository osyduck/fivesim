/**
 * Configuration options for FiveSimClient
 */
export interface FiveSimConfig {
    /** Your 5sim.net API key */
    apiKey: string;
    /** Optional custom base URL (default: https://5sim.net/v1) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}

/**
 * User profile and balance information
 */
export interface UserProfile {
    id: number;
    email: string;
    balance: number;
    rating: string;
    default_country: {
        name: string;
        iso: string;
        prefix: string;
    };
    default_operator: string;
    default_forwarding: number;
    freeze_balance: number;
}

/**
 * Country information
 */
export interface Country {
    iso: Record<string, number>;
    prefix: Record<string, number>;
    text_en: string;
    text_ru: string;
    [key: string]: any; // For virtual provider properties like virtual21, virtual4, etc.
}

/**
 * Product information
 */
export interface Product {
    category: string;
    qty: number;
    price: number;
}

/**
 * Price information for a product
 */
export interface Price {
    [operator: string]: {
        cost: number;
        count: number;
        rate?: number;
        rate1?: number;
        rate3?: number;
        rate24?: number;
        rate72?: number;
        rate168?: number;
        rate720?: number;
    };
}

/**
 * Prices response - nested structure: country -> product -> operators
 */
export type PriceList = Record<string, Record<string, Price>>;

/**
 * SMS message structure
 */
export interface SMS {
    created_at: string;
    date: string;
    sender: string;
    text: string;
    code: string;
}

/**
 * Order status values
 */
export enum OrderStatus {
    PENDING = 'PENDING',
    RECEIVED = 'RECEIVED',
    CANCELED = 'CANCELED',
    TIMEOUT = 'TIMEOUT',
    FINISHED = 'FINISHED',
    BANNED = 'BANNED',
}

/**
 * Order category
 */
export enum OrderCategory {
    HOSTING = 'hosting',
    ACTIVATION = 'activation',
}

/**
 * Order object returned when buying a number
 */
export interface Order {
    id: number;
    phone: string;
    operator: string;
    product: string;
    price: number;
    status: OrderStatus;
    expires: string;
    sms: SMS[];
    created_at?: string;
    country?: string;
    forwarding?: boolean;
    forwarding_number?: string;
}

/**
 * Order history response
 */
export interface OrderHistory {
    data: Order[];
}

/**
 * Options for buying an activation number
 */
export interface BuyActivationOptions {
    /** Country code or 'any' */
    country: string;
    /** Operator name or 'any' */
    operator: string;
    /** Product/service name */
    product: string;
    /** Optional forwarding number */
    forwarding?: string;
}

/**
 * Options for buying a hosting number
 */
export interface BuyHostingOptions {
    /** Country code or 'any' */
    country: string;
    /** Operator name or 'any' */
    operator: string;
    /** Product/service name */
    product: string;
}

/**
 * Options for fetching order history
 */
export interface OrderHistoryOptions {
    /** Order category: 'hosting' or 'activation' */
    category?: OrderCategory;
    /** Number of records to return */
    limit?: number;
    /** Offset for pagination */
    offset?: number;
}

/**
 * Options for fetching prices
 */
export interface GetPricesOptions {
    /** Country code (optional) */
    country?: string;
    /** Product/service name (optional) */
    product?: string;
}

/**
 * List of countries response
 */
export type CountryList = Record<string, Country>;

/**
 * List of products response
 */
export type ProductList = Record<string, Product>;
