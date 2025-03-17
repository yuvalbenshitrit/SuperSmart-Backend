import { Router } from "express";
import { createStore, getStores, getStoreById, updateStore, deleteStore } from "../controllers/store";

const router = Router();

router.post("/", createStore);
router.get("/", getStores);
router.get("/:id", getStoreById);
router.put("/:id", updateStore);
router.delete("/:id", deleteStore);

export default router;