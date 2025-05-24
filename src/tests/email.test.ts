import request from 'supertest';
import express from 'express';
import emailRoutes from '../routes/email_routes';
import * as emailService from '../services/emailService';

const app = express();
app.use(express.json());
app.use(emailRoutes);

describe('Email Controller - sendCartEmail', () => {
  const fakeCart = [
    { name: "Milk", quantity: 2, price: 10, store: "SuperShop" },
    "Bananas"
  ];

  it('should return 400 if email or cart is missing', async () => {
    const res = await request(app).post('/send-cart-email').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Missing email or cart" });
  });

  it('should return 200 and success message if email is sent', async () => {
    const spy = jest.spyOn(emailService, 'sendCartEmail').mockResolvedValueOnce();

    const res = await request(app).post('/send-cart-email').send({
      email: 'test@example.com',
      cart: fakeCart,
    });

    expect(spy).toHaveBeenCalledWith('test@example.com', fakeCart);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Email sent successfully" });

    spy.mockRestore();
  });

  it('should return 500 if sendCartEmail throws an error', async () => {
    const spy = jest.spyOn(emailService, 'sendCartEmail').mockRejectedValueOnce(new Error("SMTP Error"));

    const res = await request(app).post('/send-cart-email').send({
      email: 'test@example.com',
      cart: fakeCart,
    });

    expect(spy).toHaveBeenCalled();
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Failed to send email" });

    spy.mockRestore();
  });
});
