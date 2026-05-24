import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import recipesRouter from './routes/recipes.ts';
import usersRouter from './routes/users.ts';

export function createApp(): Express {
  const app = express();
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.use('/api/recipes', recipesRouter);
  app.use('/api/users', usersRouter);

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

const app = createApp();
export default app;
