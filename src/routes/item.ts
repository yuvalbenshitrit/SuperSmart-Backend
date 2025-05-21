import { Router } from "express";
import itemController from "../controllers/item";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post("/", (req, res) => {
  itemController.createItem(req, res);
});

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     tags: [Items]
 *     responses:
 *       200:
 *         description: List of items
 */
router.get("/", itemController.getItems);

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item details
 *       404:
 *         description: Item not found
 */
router.get("/:id", (req, res) => {
  itemController.getItemById(req, res);
});

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update item by ID
 *     tags: [Items]
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Item updated successfully
 *       404:
 *         description: Item not found
 */
router.put("/:id", (req, res) => {
  itemController.updateItem(req, res);
});

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete item by ID
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully
 *       404:
 *         description: Item not found
 */
router.delete("/:id", (req, res) => {
  itemController.deleteItem(req, res);
});

/**
 * @swagger
 * /items/analyze-receipt:
 *   post:
 *     summary: Analyze a receipt image to extract product information using Gemini AI
 *     tags: [Items]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receiptImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Successfully extracted product information.
 *       400:
 *         description: Invalid request or missing image.
 *       500:
 *         description: Error analyzing receipt.
 */
router.post("/analyze-receipt", upload.single("receiptImage"), (req, res) => {
  itemController.analyzeReceipt(req, res);
});

/**
 * @swagger
 * /items/price-changes:
 *   get:
 *     summary: Get price changes since a given timestamp or for specific products
 *     tags: [Items]
 *     parameters:
 *       - in: query
 *         name: lastCheckedTimestamp
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO 8601 timestamp to filter price changes
 *       - in: query
 *         name: productIds
 *         schema:
 *           type: string
 *         description: Comma-separated list of product IDs to filter price changes
 *     responses:
 *       200:
 *         description: List of price changes
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Internal server error
 */
router.get("/price-changes", (req, res) => {
  itemController.checkPriceChanges(req, res);
});

/**
 * @swagger
 * /items/{productId}/predict:
 *   post:
 *     summary: Predict the price change of an item at a specific store using Gemini AI
 *     tags: [Items]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the product to predict the price for.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storeId:
 *                 type: string
 *                 description: ID of the store to predict the price at.
 *     responses:
 *       200:
 *         description: Successfully predicted the price change.
 *       400:
 *         description: Missing or invalid productId or storeId.
 *       404:
 *         description: Item not found.
 *       500:
 *         description: Could not generate a price prediction.
 */
router.post("/:productId/predict", (req, res) => {
  itemController.predictPriceChange(req, res);
});

/**
 * @swagger
 * /items/{productId}/predict:
 *   get:
 *     summary: Predict item details
 *     tags:
 *       - Items
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the product
 *     responses:
 *       200:
 *         description: Prediction successful
 *       400:
 *         description: Bad request
 */
export default router;
