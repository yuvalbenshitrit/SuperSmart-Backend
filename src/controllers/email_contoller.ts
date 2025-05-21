import { Request, Response } from "express";
import { sendCartEmail } from "../services/emailService";

const handleSendCartEmail = async (req: Request, res: Response) => {
  const { email, cart } = req.body;

  if (!email || !cart) {
    return res.status(400).json({ error: "Missing email or cart" });
  }

  try {
    await sendCartEmail(email, cart);
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("Failed to send email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};

export default {
  sendCartEmail: handleSendCartEmail,
};


