import { Router } from "express";
import ChatController from "../controllers/chat";

const router = Router();

// Fix: Use proper arrow function syntax and ES6 template string
router.get("/chat/:cartId", (req, res) => {
  ChatController.getCartMessages(req, res);
});

router.post("/chat/:cartId", (req, res) => {
  ChatController.addCartMessage(req, res);
});

export default router;