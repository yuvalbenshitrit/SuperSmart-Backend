import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "yuval056@gmail.com",
    pass: process.env.EMAIL_PASS, 
  },
});

// Modified to handle both string arrays and object arrays
interface CartItem {
  name?: string;
  productName?: string;
  title?: string;
  quantity?: number;
  price?: number;
  store?: string;
  storeName?: string;
  storeLocation?: string;
}

export async function sendCartEmail(email: string, cart: (string | CartItem)[]) {
  const subject = "🛒 העגלה שלך מהאפליקציה";
  
  // Convert each cart item to a string representation
  const itemTexts = cart.map(item => {
    // If item is a string, use it directly
    if (typeof item === 'string') {
      return `- ${item}`;
    }
    // If item is an object with name property
    else if (item && typeof item === 'object') {
      const name = item.name || item.productName || item.title || 'פריט';
      const quantity = item.quantity ? ` (כמות: ${item.quantity})` : '';
      const price = item.price ? ` - ₪${item.price}` : '';
      
      // Add store information if available
      const storeName = item.store || item.storeName || '';
      const storeInfo = storeName ? ` [${storeName}${item.storeLocation ? ` - ${item.storeLocation}` : ''}]` : '';
      
      return `- ${name}${quantity}${price}${storeInfo}`;
    }
    // Fallback
    return `- פריט לא מזוהה`;
  });
  
  const body = "שלום! זאת העגלה ששמרת:\n\n" + itemTexts.join("\n");

  await transporter.sendMail({
    from: "yuval056@gmail.com",
    to: email,
    subject,
    text: body,
  });
}
