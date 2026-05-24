import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import multer from 'multer';
import type { Filter, Sort } from 'mongodb';
import { getRecipesCollection } from '../db.ts';
import { recipeInputSchema, type Recipe } from 'recipes-shared';
import { mapToCategoryKey } from 'recipes-shared/categories';
import { getVisionExtractor, VisionExtractorError } from '../llm/index.ts';
import { rateLimit } from '../middleware/rateLimit.ts';

const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
});
const extractRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

const router: RouterType = Router();

const stringArray = z
  .union([z.string(), z.array(z.string())])
  .transform((v): string[] => (Array.isArray(v) ? v : [v]).map((s) => s.trim()).filter((s) => s.length > 0));

const querySchema = z.object({
  q: stringArray.default([]),
  category: stringArray.default([]),
  creator: stringArray.default([]),
  sort: z.enum(['title', '-title', 'createdAt', '-createdAt']).default('title'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10)
});

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = querySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid query', details: parsed.error.issues });
      return;
    }
    const { q, category, creator, sort, page, pageSize } = parsed.data;

    const filter: Filter<Recipe> = {};
    const and: Filter<Recipe>[] = [];

    for (const term of q) {
      const escaped = escapeRegExp(term);
      and.push({
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          { 'ingredients.items': { $regex: escaped, $options: 'i' } }
        ]
      });
    }
    if (category.length > 0) {
      const mapped = Array.from(new Set(category.map((c) => mapToCategoryKey(c))));
      and.push({ category: { $in: mapped } });
    }
    if (creator.length > 0) {
      and.push({
        $or: [
          { 'creator.name': { $in: creator } },
          { creator: { $in: creator } }
        ]
      });
    }
    if (and.length > 0) {
      filter.$and = and;
    }

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortSpec: Sort = { [sortField]: sortOrder };

    const collection = await getRecipesCollection();
    const total = await collection.countDocuments(filter);
    const items = await collection
      .find(filter, { projection: { _id: 0 } })
      .sort(sortSpec)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    res.json({ items, page, pageSize, total });
  } catch (err) {
    next(err);
  }
});

let metaCache: { categories: string[]; creators: string[] } | null = null;

router.get('/meta', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!metaCache) {
      const collection = await getRecipesCollection();
      const rawCategories = await collection.distinct('category');
      const rawCreators = await collection.distinct('creator');
      const creators = new Set<string>();
      for (const c of rawCreators) {
        if (typeof c === 'string' && c.length > 0) {
          creators.add(c);
        } else if (c && typeof c === 'object' && 'name' in c && typeof (c as { name: unknown }).name === 'string') {
          creators.add((c as { name: string }).name);
        }
      }
      metaCache = {
        categories: rawCategories.filter((c) => typeof c === 'string').sort(),
        creators: Array.from(creators).sort()
      };
    }
    res.json(metaCache);
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

// If ADMIN_API_KEY is set in the environment, POST requires it; otherwise the
// endpoint is open. Lets the operator lock writes by setting the env var.
function optionalAdminApiKey(req: Request, res: Response, next: NextFunction): void {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    next();
    return;
  }
  const provided = req.header('x-api-key');
  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  next();
}

router.post('/', optionalAdminApiKey, async (req: Request, res: Response, next: NextFunction) => {
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
    metaCache = null;
    res.status(201).json({ recipe });
  } catch (err) {
    next(err);
  }
});

router.post('/extract', extractRateLimit, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const extractor = getVisionExtractor();
    if (!extractor) {
      res.status(503).json({ error: 'Vision extractor is not configured' });
      return;
    }
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Missing image upload (field name: image)' });
      return;
    }
    if (!file.mimetype.startsWith('image/')) {
      res.status(400).json({ error: 'Upload must be an image' });
      return;
    }

    const extracted = await extractor.extractRecipe(file.buffer, file.mimetype);
    if (!extracted) {
      res.status(422).json({ error: "This image doesn't look like a recipe." });
      return;
    }
    res.json({ recipe: extracted });
  } catch (err) {
    if (err instanceof VisionExtractorError) {
      const status = err.status === 'permanent' ? 422 : 502;
      const message = err.status === 'permanent'
        ? "Could not read a recipe from this image."
        : "Recipe extraction service is unavailable. Try again in a moment.";
      console.error('Vision extractor:', err.message);
      res.status(status).json({ error: message });
      return;
    }
    next(err);
  }
});

router.put('/:id', optionalAdminApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = recipeInputSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid recipe', details: parsed.error.issues });
      return;
    }
    const id = String(req.params.id);
    const recipe: Recipe = { ...parsed.data, id };
    const collection = await getRecipesCollection();
    const result = await collection.replaceOne({ id }, { ...recipe });
    if (result.matchedCount === 0) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    metaCache = null;
    res.json({ recipe });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', optionalAdminApiKey, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await getRecipesCollection();
    const result = await collection.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    metaCache = null;
    res.status(204).send();
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
