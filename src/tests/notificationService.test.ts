import axios from 'axios';
import { io, notifyCartPriceChanges } from '../services/websocket';
import cartModel from '../models/cart';
import {

checkPriceChanges,
checkRecentPriceChanges,
checkProductPrices,
findCartsWithProduct,
handleCartPriceChanges,
getCartPriceDrops
} from '../services/notification-service';

// Mock dependencies
jest.mock('axios');
jest.mock('../services/websocket', () => ({
io: { emit: jest.fn() },
notifyCartPriceChanges: jest.fn()
}));
jest.mock('../models/cart');

// Mock localStorage for Node.js environment
interface MockStorage {
  getItem: jest.Mock;
  setItem: jest.Mock;
  removeItem: jest.Mock;
  clear: jest.Mock;
  length: number;
  key: jest.Mock;
}

global.localStorage = {
getItem: jest.fn(),
setItem: jest.fn(),
removeItem: jest.fn(),
clear: jest.fn(),
length: 0,
key: jest.fn()
} as MockStorage;

describe('Notification Service', () => {
beforeEach(() => {
    jest.clearAllMocks();
});

describe('checkPriceChanges', () => {
    it('should fetch price changes since a given timestamp', async () => {
        const mockTimestamp = new Date('2023-01-01');
        const mockResponse = { data: [{ productId: '123', oldPrice: 10, newPrice: 8 }] };
        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const result = await checkPriceChanges(mockTimestamp);
        
        expect(axios.get).toHaveBeenCalledWith(
            'http://localhost:3000/items/price-changes',
            { params: { lastCheckedTimestamp: mockTimestamp.toISOString() } }
        );
        expect(result).toEqual(mockResponse);
    });

    it('should throw an error if the API call fails', async () => {
        const mockTimestamp = new Date('2023-01-01');
        const mockError = new Error('API Error');
        (axios.get as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(checkPriceChanges(mockTimestamp)).rejects.toThrow('API Error');
    });
});

describe('checkRecentPriceChanges', () => {
    it('should use stored timestamp if available', async () => {
        const storedTimestamp = '2023-01-01T00:00:00.000Z';
        const mockResponse = { data: [{ productId: '123', oldPrice: 10, newPrice: 8 }] };
        
        (localStorage.getItem as jest.Mock).mockReturnValueOnce(storedTimestamp);
        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const result = await checkRecentPriceChanges();

        expect(localStorage.getItem).toHaveBeenCalledWith('lastPriceCheckTimestamp');
        expect(axios.get).toHaveBeenCalledWith(
            'http://localhost:3000/items/price-changes',
            { params: { lastCheckedTimestamp: storedTimestamp } }
        );
        expect(result).toEqual(mockResponse);
    });

    it('should use epoch date if no stored timestamp exists', async () => {
        const mockResponse = { data: [] };
        
        (localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        await checkRecentPriceChanges();

        expect(axios.get).toHaveBeenCalledWith(
            'http://localhost:3000/items/price-changes',
            { params: { lastCheckedTimestamp: new Date(0).toISOString() } }
        );
    });
});

describe('checkProductPrices', () => {
    it('should fetch price changes for specified product IDs', async () => {
        const productIds = ['123', '456'];
        const mockResponse = { data: [{ productId: '123', oldPrice: 10, newPrice: 8 }] };
        
        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const result = await checkProductPrices(productIds);

        expect(axios.get).toHaveBeenCalledWith(
            'http://localhost:3000/items/price-changes',
            { params: { productIds: '123,456' } }
        );
        expect(result).toEqual(mockResponse);
    });

    it('should return empty data array for empty product IDs', async () => {
        const result = await checkProductPrices([]);
        
        expect(axios.get).not.toHaveBeenCalled();
        expect(result).toEqual({ data: [] });
    });
});

describe('findCartsWithProduct', () => {
    it('should find carts containing a specific product', async () => {
        const productId = '123';
        const mockCarts = [
            {
                _id: { toString: () => 'cart1' },
                ownerId: 'user1',
                participants: ['user1', 'user2'],
                notifications: true
            }
        ];

        (cartModel.find as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockReturnThis(),
            then: jest.fn((callback) => Promise.resolve(callback(mockCarts)))
        });

        const result = await findCartsWithProduct(productId);

        expect(cartModel.find).toHaveBeenCalledWith({ 'items.productId': productId });
        expect(result).toEqual([{
            _id: 'cart1',
            ownerId: 'user1',
            participants: ['user1', 'user2'],
            notifications: true
        }]);
    });

    it('should return empty array on error', async () => {
        const productId = '123';
        
        (cartModel.find as jest.Mock).mockImplementationOnce(() => {
            throw new Error('Database error');
        });

        const result = await findCartsWithProduct(productId);
        expect(result).toEqual([]);
    });
});

describe('handleCartPriceChanges', () => {
    it('should notify users about price changes', async () => {
        const priceChange = { productId: '123', oldPrice: 10, newPrice: 8 };
        
        await handleCartPriceChanges(priceChange);

        expect(notifyCartPriceChanges).toHaveBeenCalledWith(
            io,
            priceChange,
            expect.objectContaining({ findCartsWithProduct })
        );
    });
});

describe('getCartPriceDrops', () => {
    it('should fetch cart price drops', async () => {
        const mockData = [{ cartId: 'cart1', productId: '123', oldPrice: 10, newPrice: 8 }];
        const mockResponse = { data: mockData };
        
        (axios.get as jest.Mock).mockResolvedValueOnce(mockResponse);

        const result = await getCartPriceDrops();

        expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/carts/price-drops');
        expect(result).toEqual(mockData);
    });

    it('should throw an error if the API call fails', async () => {
        const mockError = new Error('API Error');
        
        (axios.get as jest.Mock).mockRejectedValueOnce(mockError);

        await expect(getCartPriceDrops()).rejects.toThrow('API Error');
    });
});
});