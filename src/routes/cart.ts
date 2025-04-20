import express from "express";
import {
  createCart,
  getCartById,
  getCartsByUser,
  updateCart,
  deleteCart,
} from "../controllers/cart";

const router = express.Router();

router.post("/", createCart);
router.get("/:id",(req,res)=>{
    console.log("Fetching cart with ID:", req.params.id);
    res.send("Fetching cart with ID: " + req.params.id);
    getCartById(req, res);
}) ; 


router.get("/", getCartsByUser); // example: /?userId=xyz
router.put("/:id", updateCart);
router.delete("/:id", deleteCart);

export default router;