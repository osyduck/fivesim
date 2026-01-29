import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiveSimClient } from '../src/client';
import { AuthenticationError, RateLimitError, NoNumbersError } from '../src/errors';
import { OrderStatus } from '../src/types';
import axios from 'axios';

vi.mock('axios');

const mockedAxios = axios as any;

describe('FiveSimClient', () => {
    let client: FiveSimClient;
    let mockCreate: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock axios.create to return a mock axios instance
        const mockAxiosInstance = {
            get: vi.fn(),
            interceptors: {
                response: {
                    use: vi.fn((success: any, error: any) => {
                        mockAxiosInstance._errorHandler = error;
                    }),
                },
            },
            _errorHandler: null as any,
        };

        mockCreate = vi.fn(() => mockAxiosInstance);
        mockedAxios.create = mockCreate;

        client = new FiveSimClient({ apiKey: 'test-api-key' });
    });

    describe('constructor', () => {
        it('should create axios instance with correct config', () => {
            expect(mockCreate).toHaveBeenCalledWith({
                baseURL: 'https://5sim.net/v1',
                timeout: 30000,
                headers: {
                    Authorization: 'Bearer test-api-key',
                    Accept: 'application/json',
                },
            });
        });

        it('should use custom baseUrl if provided', () => {
            new FiveSimClient({ apiKey: 'test-key', baseUrl: 'https://custom.api' });
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'https://custom.api',
                })
            );
        });

        it('should use custom timeout if provided', () => {
            new FiveSimClient({ apiKey: 'test-key', timeout: 60000 });
            expect(mockCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    timeout: 60000,
                })
            );
        });
    });

    describe('getProfile', () => {
        it('should fetch user profile', async () => {
            const mockProfile = {
                id: 123,
                email: 'test@example.com',
                balance: 10.50,
                rating: 'good',
                default_country: { name: 'Russia', iso: 'ru', prefix: '7' },
                default_operator: 'any',
                default_forwarding: 0,
                freeze_balance: 0,
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockProfile });
            (client as any).client.get = mockGet;

            const result = await client.getProfile();

            expect(mockGet).toHaveBeenCalledWith('/user/profile');
            expect(result).toEqual(mockProfile);
        });
    });

    describe('getCountries', () => {
        it('should fetch list of countries', async () => {
            const mockCountries = {
                russia: { name: 'Russia', iso: 'ru', prefix: '7' },
                indonesia: { name: 'Indonesia', iso: 'id', prefix: '62' },
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockCountries });
            (client as any).client.get = mockGet;

            const result = await client.getCountries();

            expect(mockGet).toHaveBeenCalledWith('/guest/countries');
            expect(result).toEqual(mockCountries);
        });
    });

    describe('getPrices', () => {
        it('should fetch prices with query parameters', async () => {
            const mockPrices = {
                telegram: {
                    any: { cost: 0.5, count: 100 },
                },
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockPrices });
            (client as any).client.get = mockGet;

            const result = await client.getPrices({ country: 'russia', product: 'telegram' });

            expect(mockGet).toHaveBeenCalledWith('/guest/prices?country=russia&product=telegram');
            expect(result).toEqual(mockPrices);
        });

        it('should fetch prices without parameters', async () => {
            const mockPrices = {};

            const mockGet = vi.fn().mockResolvedValue({ data: mockPrices });
            (client as any).client.get = mockGet;

            await client.getPrices();

            expect(mockGet).toHaveBeenCalledWith('/guest/prices');
        });
    });

    describe('getProducts', () => {
        it('should fetch products for country and operator', async () => {
            const mockProducts = {
                telegram: { category: 'social', qty: 50, price: 0.5 },
                whatsapp: { category: 'social', qty: 30, price: 0.6 },
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockProducts });
            (client as any).client.get = mockGet;

            const result = await client.getProducts('russia', 'any');

            expect(mockGet).toHaveBeenCalledWith('/guest/products/russia/any');
            expect(result).toEqual(mockProducts);
        });
    });

    describe('buyActivation', () => {
        it('should buy activation number', async () => {
            const mockOrder = {
                id: 12345,
                phone: '79001234567',
                operator: 'mts',
                product: 'telegram',
                price: 0.5,
                status: OrderStatus.PENDING,
                expires: '2024-01-01T12:00:00Z',
                sms: [],
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            const result = await client.buyActivation({
                country: 'russia',
                operator: 'any',
                product: 'telegram',
            });

            expect(mockGet).toHaveBeenCalledWith('/user/buy/activation/russia/any/telegram');
            expect(result).toEqual(mockOrder);
        });

        it('should include forwarding parameter if provided', async () => {
            const mockOrder = { id: 123, phone: '79001234567' } as any;
            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            await client.buyActivation({
                country: 'russia',
                operator: 'any',
                product: 'telegram',
                forwarding: '+1234567890',
            });

            expect(mockGet).toHaveBeenCalledWith('/user/buy/activation/russia/any/telegram?forwarding=1');
        });
    });

    describe('checkOrder', () => {
        it('should check order status', async () => {
            const mockOrder = {
                id: 12345,
                phone: '79001234567',
                operator: 'mts',
                product: 'telegram',
                price: 0.5,
                status: OrderStatus.RECEIVED,
                expires: '2024-01-01T12:00:00Z',
                sms: [
                    {
                        created_at: '2024-01-01T11:00:00Z',
                        date: '2024-01-01T11:00:00Z',
                        sender: 'Telegram',
                        text: 'Your code is 12345',
                        code: '12345',
                    },
                ],
            };

            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            const result = await client.checkOrder(12345);

            expect(mockGet).toHaveBeenCalledWith('/user/check/12345');
            expect(result).toEqual(mockOrder);
            expect(result.sms).toHaveLength(1);
            expect(result.sms[0].code).toBe('12345');
        });
    });

    describe('finishOrder', () => {
        it('should finish an order', async () => {
            const mockOrder = {
                id: 12345,
                status: OrderStatus.FINISHED,
            } as any;

            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            const result = await client.finishOrder(12345);

            expect(mockGet).toHaveBeenCalledWith('/user/finish/12345');
            expect(result.status).toBe(OrderStatus.FINISHED);
        });
    });

    describe('cancelOrder', () => {
        it('should cancel an order', async () => {
            const mockOrder = {
                id: 12345,
                status: OrderStatus.CANCELED,
            } as any;

            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            const result = await client.cancelOrder(12345);

            expect(mockGet).toHaveBeenCalledWith('/user/cancel/12345');
            expect(result.status).toBe(OrderStatus.CANCELED);
        });
    });

    describe('banNumber', () => {
        it('should ban a number', async () => {
            const mockOrder = {
                id: 12345,
                status: OrderStatus.BANNED,
            } as any;

            const mockGet = vi.fn().mockResolvedValue({ data: mockOrder });
            (client as any).client.get = mockGet;

            const result = await client.banNumber(12345);

            expect(mockGet).toHaveBeenCalledWith('/user/ban/12345');
            expect(result.status).toBe(OrderStatus.BANNED);
        });
    });

    describe('getOrderHistory', () => {
        it('should fetch order history with parameters', async () => {
            const mockHistory = {
                data: [
                    { id: 1, phone: '79001234567' },
                    { id: 2, phone: '79007654321' },
                ],
            } as any;

            const mockGet = vi.fn().mockResolvedValue({ data: mockHistory });
            (client as any).client.get = mockGet;

            const result = await client.getOrderHistory({
                category: 'activation' as any,
                limit: 10,
                offset: 0,
            });

            expect(mockGet).toHaveBeenCalledWith('/user/orders?category=activation&limit=10&offset=0');
            expect(result.data).toHaveLength(2);
        });

        it('should fetch order history without parameters', async () => {
            const mockHistory = { data: [] } as any;
            const mockGet = vi.fn().mockResolvedValue({ data: mockHistory });
            (client as any).client.get = mockGet;

            await client.getOrderHistory();

            expect(mockGet).toHaveBeenCalledWith('/user/orders');
        });
    });

    describe('Error Handling', () => {
        it('should throw AuthenticationError on 401', async () => {
            const mockGet = vi.fn().mockRejectedValue({
                response: { status: 401, data: 'Unauthorized' },
            });
            (client as any).client.get = mockGet;

            await expect(client.getProfile()).rejects.toThrow(AuthenticationError);
        });

        it('should throw RateLimitError on 429', async () => {
            const mockGet = vi.fn().mockRejectedValue({
                response: { status: 429, data: 'Too many requests' },
            });
            (client as any).client.get = mockGet;

            await expect(client.getProfile()).rejects.toThrow(RateLimitError);
        });

        it('should throw NoNumbersError when no numbers available', async () => {
            const mockGet = vi.fn().mockRejectedValue({
                response: { status: 400, data: 'no free phones' },
            });
            (client as any).client.get = mockGet;

            await expect(client.buyActivation({
                country: 'russia',
                operator: 'any',
                product: 'telegram',
            })).rejects.toThrow(NoNumbersError);
        });
    });
});
