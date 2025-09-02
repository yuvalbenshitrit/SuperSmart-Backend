import { sendCartEmail } from '../services/emailService';
import nodemailer from 'nodemailer';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn().mockReturnValue({
        verify: jest.fn().mockResolvedValue(true),
        sendMail: jest.fn().mockImplementation(() => Promise.resolve({ response: '250 Message sent' })),
    }),
}));

describe('Email Service', () => {
    let sendMailMock: jest.Mock;

    beforeEach(() => {
        sendMailMock = nodemailer.createTransport().sendMail as jest.Mock;
        sendMailMock.mockClear();
    });

    it('should send email with empty cart', async () => {
        const email = 'test@example.com';
        await sendCartEmail(email, []);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].to).toBe(email);
        expect(sendMailMock.mock.calls[0][0].text).toContain('שלום! זאת העגלה ששמרת:');
    });

    it('should send email with string cart items', async () => {
        const email = 'test@example.com';
        const cart = ['חלב', 'לחם', 'ביצים'];

        await sendCartEmail(email, cart);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].to).toBe(email);
        expect(sendMailMock.mock.calls[0][0].text).toContain('- חלב');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- לחם');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- ביצים');
    });

    it('should send email with object cart items', async () => {
        const email = 'test@example.com';
        const cart = [
            { name: 'חלב', quantity: 2, price: 5.90, store: 'שופרסל', storeLocation: 'קריית אונו' },
            { productName: 'לחם', quantity: 1, price: 7.50 },
            { title: 'ביצים', price: 12.90, storeName: 'רמי לוי' }
        ];

        await sendCartEmail(email, cart);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].to).toBe(email);
        expect(sendMailMock.mock.calls[0][0].text).toContain('- חלב (כמות: 2) - ₪5.9 [שופרסל - קריית אונו]');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- לחם (כמות: 1) - ₪7.5');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- ביצים - ₪12.9 [רמי לוי]');
    });

    it('should send email with mixed string and object cart items', async () => {
        const email = 'test@example.com';
        const cart = [
            'שוקולד',
            { name: 'חלב', quantity: 2, price: 5.90 },
            'גבינה'
        ];

        await sendCartEmail(email, cart);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].to).toBe(email);
        expect(sendMailMock.mock.calls[0][0].text).toContain('- שוקולד');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- חלב (כמות: 2) - ₪5.9');
        expect(sendMailMock.mock.calls[0][0].text).toContain('- גבינה');
    });

    it('should use fallback name when no name is provided in object', async () => {
        const email = 'test@example.com';
        const cart = [{ quantity: 3, price: 10 }];

        await sendCartEmail(email, cart);

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock.mock.calls[0][0].text).toContain('- פריט (כמות: 3) - ₪10');
    });

    it('should handle error when sending email fails', async () => {
        sendMailMock.mockRejectedValueOnce(new Error('Failed to send email'));

        const email = 'test@example.com';

        await expect(sendCartEmail(email, ['item'])).rejects.toThrow('Failed to send email');
    });
});