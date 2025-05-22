// routes/supermarkets.ts
import express from 'express';
const router = express.Router();

const supermarkets = [
  { id: '1', name: 'שופרסל', address: 'תל אביב', lat: 31.99857283571794, lng: 34.74241094567454 },
  { id: '2', name: 'רמי לוי', address: 'ירושלים', lat: 31.7683, lng: 35.2137 },
  { id: '3', name: 'מגה', address: 'חיפה', lat: 32.7940, lng: 34.9896 }
];
//31.99857283571794, 34.74241094567454
router.get('/mapSupermarkets', (req, res) => {
  res.json(supermarkets);
});

export default router;
