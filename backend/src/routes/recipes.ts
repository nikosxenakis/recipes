import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from 'express';
import { z } from 'zod';
import type { Filter, Sort } from 'mongodb';
import { getRecipesCollection } from '../db.ts';
import { recipeInputSchema, type Recipe } from '../schemas.ts';
import { mapToCategoryKey } from '../categories.ts';

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
