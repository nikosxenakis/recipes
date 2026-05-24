import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { getRecipesCollection } from '../db.ts';
import { recipeInputSchema, type Recipe } from '../schemas.ts';

const router: RouterType = Router();

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await getRecipesCollection();
    const recipes = await collection.find({}, { projection: { _id: 0 } }).toArray();
    res.json({ recipes });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await getRecipesCollection();
    const recipe = await collection.findOne({ id: req.params.id }, { projection: { _id: 0 } });
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
});

function requireAdminApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    res.status(503).json({ error: 'Write endpoint is not configured' });
    return;
  }
  const provided = req.header('x-api-key');
  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  next();
}

router.post('/', requireAdminApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = recipeInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid recipe', details: parsed.error.issues });
      return;
    }
    const id = parsed.data.id ?? slugify(parsed.data.title);
    const recipe: Recipe = { ...parsed.data, id };
    const collection = await getRecipesCollection();
    const existing = await collection.findOne({ id }, { projection: { _id: 1 } });
    if (existing) {
      res.status(409).json({ error: `Recipe with id "${id}" already exists` });
      return;
    }
    await collection.insertOne({ ...recipe });
    res.status(201).json({ recipe });
  } catch (err) {
    next(err);
  }
});

const COMBINING_MARKS = /\p{M}/gu;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default router;
