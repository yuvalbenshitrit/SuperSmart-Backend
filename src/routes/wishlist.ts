import express from "express";
import {
  createWishlist,
  getWishlistById,
  getWishlistsByUser,
  updateWishlist,
  deleteWishlist,
  addProductToWishlist,
  removeProductFromWishlist,
  getOrCreateSingleWishlist, // Import the new controller
  getWishlistByUserId, // Import the new controller
} from "../controllers/wishlist";

const router = express.Router();

/**
 * @swagger
 * /wishlists:
 *   post:
 *     summary: Create a new wishlist
 *     tags: [Wishlists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               userId:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Wishlist created successfully
 */
router.post("/", (req, res) => {
  createWishlist(req, res);
});

/**
 * @swagger
 * /wishlists:
 *   get:
 *     summary: Get all wishlists for a user
 *     tags: [Wishlists]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of wishlists
 */
router.get("/", (req, res) => {
  getWishlistsByUser(req, res);
});

/**
 * @swagger
 * /wishlists/{id}:
 *   get:
 *     summary: Get wishlist by ID
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist details
 *       404:
 *         description: Wishlist not found
 */
router.get("/:id", (req, res) => {
  getWishlistById(req, res);
});

/**
 * @swagger
 * /wishlists/{id}:
 *   put:
 *     summary: Update wishlist by ID
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
 *       404:
 *         description: Wishlist not found
 */
router.put("/:id", (req, res) => {
  updateWishlist(req, res);
});

/**
 * @swagger
 * /wishlists/{id}:
 *   delete:
 *     summary: Delete wishlist by ID
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist deleted successfully
 *       404:
 *         description: Wishlist not found
 */
router.delete("/:id", (req, res) => {
  deleteWishlist(req, res);
});

/**
 * @swagger
 * /wishlists/{id}/products:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Wishlists]
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
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *       404:
 *         description: Wishlist not found
 */
router.post("/:id/products", (req, res) => {
  addProductToWishlist(req, res);
});

/**
 * @swagger
 * /wishlists/{id}/products:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Wishlists]
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
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *       404:
 *         description: Wishlist not found
 */
router.delete("/:id/products", (req, res) => {
  removeProductFromWishlist(req, res);
});

/**
 * @swagger
 * /wishlists/single:
 *   get:
 *     summary: Get or create a single wishlist for a user
 *     tags: [Wishlists]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user's single wishlist
 *       400:
 *         description: Missing or invalid userId
 */
router.get("/single", (req, res) => {
  getOrCreateSingleWishlist(req, res);
});

/**
 * @swagger
 * /wishlists/user/{userId}:
 *   get:
 *     summary: Get a user's wishlist by userId
 *     tags: [Wishlists]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user's wishlist
 *       404:
 *         description: Wishlist not found
 */
router.get("/user/:userId", (req, res) => {
  getWishlistByUserId(req, res);
});

export default router;
