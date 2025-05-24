import nodemailer from 'nodemailer';
import { sendCartEmail } from '../services/emailService';

// Mock nodemailer
jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn().mockImplementation((mailOptions) => Promise.resolve(mailOptions))
    })
}));

describe('Email Service', () => {
    const mockTransporter = nodemailer.createTransport();
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should send email with string items', async () => {
        const email = 'test@example.com';
        const cart = ['Apple', 'Banana', 'Orange'];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- Apple\n- Banana\n- Orange')
        });
    });

    it('should send email with object items using name property', async () => {
        const email = 'test@example.com';
        const cart = [
            { name: 'Apple', quantity: 2, price: 5.99, store: 'FruitStore', storeLocation: 'Center' }
        ];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- Apple (כמות: 2) - ₪5.99 [FruitStore - Center]')
        });
    });

    it('should send email with object items using productName when name is not available', async () => {
        const email = 'test@example.com';
        const cart = [
            { productName: 'Apple', quantity: 2, price: 5.99 }
        ];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- Apple (כמות: 2) - ₪5.99')
        });
    });

    it('should send email with object items using title when name and productName are not available', async () => {
        const email = 'test@example.com';
        const cart = [
            { title: 'Apple', price: 5.99 }
        ];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- Apple - ₪5.99')
        });
    });

    it('should use default "פריט" when no name properties are available', async () => {
        const email = 'test@example.com';
        const cart = [
            { price: 5.99 }
        ];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- פריט - ₪5.99')
        });
    });

    it('should use storeName when store is not available', async () => {
        const email = 'test@example.com';
        const cart = [
            { name: 'Apple', storeName: 'SuperMarket' }
        ];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: expect.stringContaining('- Apple [SuperMarket]')
        });
    });

    it('should handle mixed string and object items', async () => {
        const email = 'test@example.com';
        const cart = [
            'Simple item',
            { name: 'Complex item', quantity: 3, price: 10.50 }
        ];
        
        await sendCartEmail(email, cart);
        
        const sentEmail = (mockTransporter.sendMail as jest.Mock).mock.calls[0][0];
        expect(sentEmail.text).toContain('- Simple item');
        expect(sentEmail.text).toContain('- Complex item (כמות: 3) - ₪10.5');
    });

    it('should handle empty cart arrays', async () => {
        const email = 'test@example.com';
        const cart: (string | { 
            name?: string;
            productName?: string;
            title?: string;
            quantity?: number;
            price?: number;
            store?: string;
            storeName?: string;
            storeLocation?: string;
        })[] = [];
        
        await sendCartEmail(email, cart);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith({
            from: 'yuval056@gmail.com',
            to: email,
            subject: '🛒 העגלה שלך מהאפליקציה',
            text: 'שלום! זאת העגלה ששמרת:\n\n'
        });
    });
});