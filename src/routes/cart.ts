import express from "express";
import {
  createCart,
  getCartById,
  getCartsByUser,
  updateCart,
  deleteCart,
} from "../controllers/cart";

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
router.post("/", (req, res) => {
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
router.get("/:id", (req, res) => {
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
router.get("/", (req, res) => {
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
router.put("/:id", (req, res) => {
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
router.delete("/:id", (req, res) => {
  deleteCart(req, res);
});

export default router;
