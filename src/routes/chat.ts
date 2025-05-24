import { Router } from "express";
import ChatController from "../controllers/chat";

const router = Router();

router.get("/:cartId", (req, res) => {
  ChatController.getCartMessages(req, res);
});

router.post("/:cartId", (req, res) => {
  ChatController.addCartMessage(req, res);
});

export default router;