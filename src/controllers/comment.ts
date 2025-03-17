import Comment from "../models/comment";
import { Request, Response } from "express";
import mongoose from "mongoose";

const createComment = async (req:Request, res:Response) => {
    try {
        const comment = new Comment(req.body);
        await comment.save();
        res.status(200).json(comment);
    } catch (error) {
        res.status(400).send(error);
    }
};


const getAllComments = async (req:Request, res:Response) => {
    try {
        const comments = await Comment.find();
        res.json(comments);
    } catch (error) {
        res.status(400).send(error);
    }
};

const getCommentsByPostId = async (req:Request, res:Response) => {
    try {
        const comments = await Comment.find({ postId: req.params.postId });
        res.json(comments);
    } catch (error) {
        res.status(400).send(error);
    }
   
};

const updateComment = async (req: Request, res: Response) => {
    try {
        const comment = await Comment.findByIdAndUpdate(
            req.params.commentId, 
            req.body, 
            { new: true }
        );

        // Check if the comment exists
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        // Return the updated comment
        res.status(200).json(comment);
    } catch (error) {
        // Handle validation errors, invalid IDs, etc.
        res.status(400).json({ message: "Invalid request", error });
    }
};

const deleteComment = async (req: Request, res: Response) => {
    try {
        const { commentId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ message: "Invalid comment ID" });
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId);

        if (!deletedComment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
};

const deleteAllComments = async (req: Request, res: Response) => {
    try {
        await Comment.deleteMany({});
        res.status(200).json({ message: "All comments deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error });
    }
}




export default {
    createComment,
    getAllComments,
    getCommentsByPostId,
    updateComment,
    deleteComment,
    deleteAllComments,
};