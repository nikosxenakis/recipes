import { Router, type Request, type Response, type NextFunction, type Router as RouterType } from "express";
import { z } from "zod";
import { getUsersCollection } from "../db.ts";

const router: RouterType = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const collection = await getUsersCollection();
    const docs = await collection
      .find({}, { projection: { _id: 0, name: 1 } })
      .sort({ name: 1 })
      .toArray();
    res.json({ users: docs.map((d) => d.name) });
  } catch (err) {
    next(err);
  }
});

const userBodySchema = z.object({
  name: z.string().min(1).max(60).trim(),
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = userBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid user", details: parsed.error.issues });
      return;
    }
    const collection = await getUsersCollection();
    await collection.updateOne(
      { name: parsed.data.name },
      { $setOnInsert: { name: parsed.data.name } },
      { upsert: true }
    );
    const docs = await collection.find({}, { projection: { _id: 0, name: 1 } }).sort({ name: 1 }).toArray();
    res.status(201).json({ users: docs.map((d) => d.name) });
  } catch (err) {
    next(err);
  }
});

export default router;
