const express = require('express');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs').promises;
const sharp = require('sharp');

const app = express();
const port = 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const normalMapsDir = path.join(__dirname, 'public', 'normalmaps');

async function ensureDirectories() {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(normalMapsDir, { recursive: true });
}

ensureDirectories();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

app.post('/upload', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const md5 = crypto.createHash('md5').update(req.file.buffer).digest('hex');
        const fileExtension = path.extname(req.file.originalname);
        const originalFileName = `${md5}${fileExtension}`;
        const normalMapFileName = `${md5}_normal.png`;
        const depthMapFileName = `${md5}_depth.png`;

        const originalFilePath = path.join(uploadsDir, originalFileName);
        const normalMapFilePath = path.join(normalMapsDir, normalMapFileName);
        const depthMapFilePath = path.join(normalMapsDir, depthMapFileName);

        if (await fs.access(originalFilePath).then(() => true).catch(() => false)) {
            return res.json({ originalFileName, normalMapFileName, depthMapFileName });
        }

        await fs.writeFile(originalFilePath, req.file.buffer);

        const image = sharp(req.file.buffer);
        const metadata = await image.metadata();
        const { width, height } = metadata;

        const normalMapBuffer = await image
            .greyscale()
            .normalise()
            .raw()
            .toBuffer();

        const depthMapBuffer = await image
            .greyscale()
            .normalise()
            .blur(5)
            .raw()
            .toBuffer();

        await sharp(normalMapBuffer, { raw: { width, height, channels: 1 } })
            .png()
            .toFile(normalMapFilePath);

        await sharp(depthMapBuffer, { raw: { width, height, channels: 1 } })
            .png()
            .toFile(depthMapFilePath);

        res.json({ originalFileName, normalMapFileName, depthMapFileName });
    } catch (error) {
        console.error('Error processing file:', error);
        res.status(500).send('Error processing file.');
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});