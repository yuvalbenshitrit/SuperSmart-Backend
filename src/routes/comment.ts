import express from "express";
const router = express.Router();
import commentController from "../controllers/comment";

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: The Comments API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Comment:
 *       type: object
 *       required:
 *         - postId
 *         - content
 *       properties:
 *         postId:
 *           type: string
 *           description: The ID of the post this comment belongs to
 *         content:
 *           type: string
 *           description: The content of the comment
 *       example:
 *         postId: '1234'
 *         content: 'This is a comment'
 */



/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Gets all comments
 *     description: Retrieves all comments
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: List of all comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/", commentController.getAllComments);

/**
 * @swagger
 * /comments/{postId}:
 *   get:
 *     summary: Gets comments by post ID
 *     description: Retrieves all comments for a specific post
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the post
 *     responses:
 *       200:
 *         description: List of comments for the specified post
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Post not found
 */
router.get("/:postId", commentController.getCommentsByPostId);

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Creates a new comment
 *     description: Creates a new comment
 *     tags: [Comments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               postId:
 *                 type: string
 *                 description: The ID of the post
 *                 example: "12345"
 *               sender:
 *                 type: string
 *                 description: The sender of the comment
 *                 example: "John Doe"
 *               content:
 *                 type: string
 *                 description: The content of the comment
 *                 example: "This is a comment."
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The creation date of the comment
 *                 example: "2023-10-01T12:00:00Z"
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 */

router.post("/", commentController.createComment);

/**
 * @swagger
 * /comments/{commentId}:
 *   put:
 *     summary: Updates a comment
 *     description: Updates a comment by its ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: The updated comment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.put("/:commentId", (req,res)=>{commentController.updateComment(req,res)});

/**
 * @swagger
 * /comments/{commentId}:
 *   delete:
 *     summary: Deletes a comment
 *     description: Deletes a comment by its ID
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the comment
 *     responses:
 *       200:
 *         description: The deleted comment
 *       400:
 *         description: Bad request
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:commentId", (req,res)=>{commentController.deleteComment(req,res)});

/**
 * @swagger
 * /comments:
 *   delete:
 *     summary: Deletes all comments
 *     description: Removes all comments from the database
 *     tags: [Comments]
 *     responses:
 *       200:
 *         description: All comments deleted
 *       500:
 *         description: Internal server error
 */
router.delete("/", commentController.deleteAllComments);

export default router;
