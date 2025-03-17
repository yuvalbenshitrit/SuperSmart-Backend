import express from "express";
const router = express.Router();
import multer from "multer";

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Uploads a file
 *     description: Uploads a file to the server
 *     tags: [Files]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: The URL of the uploaded file
 *                   example: "http://example.com/storage/1234567890.txt"
 *       400:
 *         description: Bad request
 */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'storage/')
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split('.')
            .filter(Boolean) 
            .slice(1)
            .join('.')
        cb(null, Date.now() + "." + ext)
    }
})

const upload = multer({ storage: storage });

const base = process.env.DOMAIN_BASE;

router.post('/', upload.single("file"), function (req, res) {
    console.log("router.post(/file: " + base + req.file?.path)
    res.status(200).send({ url: base + "/" + req.file?.path })
});

router.post('/multiple', upload.array("files", 10), function (req, res) {
    const urls = (req.files as Express.Multer.File[])?.map(file => base + "/" + file.path)
    console.log("router.post(/file: " + urls)
    res.status(200).send(urls)
}
);


export = router;