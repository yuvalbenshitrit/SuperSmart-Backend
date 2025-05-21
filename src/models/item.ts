import mongoose, { Schema, Document } from "mongoose";

export interface NutritionInfo {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  sodium: number;
  calcium: number | null;
  vitamin_c: number | null;
  cholesterol: number;
}

export interface IPrice {
  date: Date;
  price: number;
}

export interface IStorePrice {
  storeId: mongoose.Types.ObjectId;
  prices: IPrice[];
}

export interface IItem extends Document {
  name: string;
  category: string;
  storePrices: IStorePrice[];
  image?: string; 
  code?: string;  
  barcode?: string; 
  nutrition: NutritionInfo;
  
}

const priceSchema = new Schema<IPrice>({
  date: { type: Date, required: true },
  price: { type: Number, required: true },
});

const storePriceSchema = new Schema<IStorePrice>({
  storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
  prices: { type: [priceSchema], default: [] },
});

const itemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    storePrices: { type: [storePriceSchema], default: [] },
    image: { type: String }, 
    code: { type: String },  
    barcode: { type: String }, 
    nutrition: {
      protein: { type: Number, required: true },
      fat: { type: Number, required: true },
      carbs: { type: Number, required: true },
      calories: { type: Number, required: true },
      sodium: { type: Number, required: true },
      calcium: { type: Number, default: null },
      vitamin_c: { type: Number, default: null },
      cholesterol: { type: Number, required: true },
    },
    
  },
  { timestamps: true }
);

const itemModel = mongoose.model<IItem>("Item", itemSchema);

export default itemModel;