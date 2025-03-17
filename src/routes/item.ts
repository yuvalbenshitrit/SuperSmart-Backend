import { Router } from "express";
import itemController from "../controllers/item";
const router = Router();

router.post("/", itemController.createItem);
router.get("/", itemController.getItems);
router.get("/:id",(req, res) => {
    itemController.getItemById(req, res);
  });
router.put("/:id", (req, res) => {
    itemController.updateItem(req, res);
  });
router.delete("/:id",(req, res) => {
    itemController.deleteItem(req, res);
  }); 

export default router;