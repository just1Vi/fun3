import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

const publicDir = path.join(__dirname, 'public');
const newsDir = path.join(publicDir, 'news');

app.use(express.static(publicDir, { extensions: ['html'] }));

app.get('/api/news', async (_req, res) => {
  try {
    const files = await fs.readdir(newsDir);
    const jsonFiles = files.filter((f) => f.toLowerCase().endsWith('.json'));

    const items = [];
    for (const file of jsonFiles) {
      try {
        const fullPath = path.join(newsDir, file);
        const raw = await fs.readFile(fullPath, 'utf-8');
        const data = JSON.parse(raw);
        // Add computed fields
        data.id = path.basename(file, '.json');
        // Normalize date
        data.date = data.date || '1970-01-01';
        items.push(data);
      } catch (err) {
        console.error('Failed to parse news file:', file, err);
      }
    }

    items.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load news' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PopScope server running on http://localhost:${PORT}`);
});