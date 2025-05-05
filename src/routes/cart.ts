import express from "express";
import {
  createCart,
  getCartById,
  getCartsByUser,
  updateCart,
  deleteCart,
  addParticipantToCart,
  removeParticipantFromCart,
} from "../controllers/cart";
import { authMiddleware } from "../controllers/auth"; // Assuming you have an auth middleware


const router = express.Router();

/**
 * @swagger
 * /carts:
 *   post:
 *     summary: Create a new cart
 *     tags: [Carts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               ownerId:
 *                 type: string
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       201:
 *         description: Cart created successfully
 */
router.post("/", authMiddleware, (req, res) => {
  createCart(req, res);
});

/**
 * @swagger
 * /carts/{id}:
 *   get:
 *     summary: Get cart by ID
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart details
 *       404:
 *         description: Cart not found
 */
router.get("/:id", authMiddleware, (req, res) => {
  getCartById(req, res);
});

/**
 * @swagger
 * /carts:
 *   get:
 *     summary: Get all carts for a user
 *     tags: [Carts]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of carts
 */
router.get("/", authMiddleware, (req, res) => {
  getCartsByUser(req, res);
});

/**
 * @swagger
 * /carts/{id}:
 *   put:
 *     summary: Update cart by ID
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Cart updated successfully
 *       404:
 *         description: Cart not found
 */
router.put("/:id", authMiddleware, (req, res) => {
  updateCart(req, res);
});

/**
 * @swagger
 * /carts/{id}:
 *   delete:
 *     summary: Delete cart by ID
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cart deleted successfully
 *       404:
 *         description: Cart not found
 */
router.delete("/:id", authMiddleware, (req, res) => {
  deleteCart(req, res);
});

/**
 * @swagger
 * /carts/{id}/participants:
 *   put:
 *     summary: Add a participant to a cart by email
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant added successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Cart or user not found
 */
router.put("/:id/participants", authMiddleware, (req, res) => {
  addParticipantToCart(req, res);
});

/**
 * @swagger
 * /carts/{id}/participants/remove:
 *   put:
 *     summary: Remove a participant from a cart by user ID
 *     tags: [Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIdToRemove:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant removed successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Cart or user not found
 */
router.put("/:id/participants/remove", authMiddleware, (req, res) => {
  removeParticipantFromCart(req, res);
});


export default router;
