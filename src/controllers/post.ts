import Post from "../models/post";
import { Request, Response } from "express";

const addNewPost = async (req:Request, res:Response) => {
    try {
        const photos = req.body.photos || [];
        const { likes = 0, ...rest } = req.body;
        const post = new Post({ likes, photos, ...rest });
        await post.save();
        res.status(201).send(post);
    } catch (error) {
        res.status(400).send(error);
    }
};

const getAllPosts = async (req:Request, res:Response) => {
    try {
        const posts = await Post.find();  
        res.send(posts);
    } catch (error) {
        res.status(400).send(error);
    }
};


const getPostById = async (req:Request, res:Response) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (post) res.send(post);
        else res.status(404).send("Post not found");
    } catch (error) {
        res.status(400).send(error);
    }
};

const getPostBySender = async (req:Request, res:Response) => {
    try {
        console.log(req.query.sender);
        const posts = await Post.find({ sender: { $regex: `^${req.query.sender}$`, $options: "i" } });
        if (posts.length > 0) res.send(posts);
        else res.status(404).send("No posts found for this sender");
    } catch (error) {
        res.status(400).send(error);
    }
};

const updatePost = async (req:Request, res:Response) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.postId, req.body, {
            new: true,
        });
        if (post) res.send(post);
        else res.status(404).send("Post not found");
    } catch (error) {
        res.status(400).send(error);
    }
};

const deletePost = async (req:Request, res:Response) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.postId);
        if (deletedPost) res.status(201).send("Post deleted successfully");
        else res.status(404).send("Post not found");
    } catch (error) {
        res.status(400).send(error);
    }
}


export default {
    addNewPost,
    getAllPosts,
    getPostById,
    getPostBySender,
    updatePost,
    deletePost
};