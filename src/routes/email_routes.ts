import express from "express";
import  emailController  from "../controllers/email_contoller"

const router = express.Router();

/**
 * @swagger
 * /api/email/send-cart-email:
 *   post:
 *     summary: Send an email with cart details
 *     tags: [Email]
 *     description: Sends an email containing the details of a user's shopping cart
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - cartItems
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address of the recipient
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: ID of the product
 *                     name:
 *                       type: string
 *                       description: Name of the product
 *                     price:
 *                       type: number
 *                       description: Price of the product
 *                     quantity:
 *                       type: integer
 *                       description: Quantity of the product in cart
 *     responses:
 *       200:
 *         description: Email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Cart email sent successfully
 *       400:
 *         description: Bad request - invalid input data
 *       500:
 *         description: Server error while sending email
 */
router.post("/send-cart-email", (req, res) => {
    
    emailController.sendCartEmail(req, res);
});

export default router;