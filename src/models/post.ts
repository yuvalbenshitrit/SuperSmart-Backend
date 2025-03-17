import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.String, ref: "User", required: true },//ID of the user
    content: String,
    createdAt: { type: Date, default: Date.now },
    likes: { type: Number, default: 0 },
    likesBy: { type: [mongoose.Schema.Types.String], default: [] },
    photos: { type: [String], default: [] },
    senderProfilePicture: { type: String }
})

export default mongoose.model("Post", postSchema);

