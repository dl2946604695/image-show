import express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';
import authRouter from './routes/auth';
import photosRouter from './routes/photos';
import { initMockData } from './data/store';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 },
  useTempFiles: false,
}));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/thumbnails', express.static(path.join(process.cwd(), 'thumbnails')));

app.use('/api/auth', authRouter);
app.use('/api/photos', photosRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

async function start() {
  await initMockData();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);