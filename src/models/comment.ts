import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.String, ref: "Post", required: true },
    sender: { type: mongoose.Schema.Types.String, ref: "User", required: true },//ID of the user
    content: String,
    createdAt: { type: Date, default: Date.now },
    senderProfilePicture: { type: String }

});

export default mongoose.model("Comment", commentSchema);