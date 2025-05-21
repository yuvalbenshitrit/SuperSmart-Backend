import express from "express";
import  emailController  from "../controllers/email_contoller"

const router = express.Router();

router.post("/send-cart-email", (req, res) => {
	
	emailController.sendCartEmail(req, res);
});

export default router;

