import { getRecipesCollection, getUsersCollection, closeDb } from "./db.ts";

const SEED_USERS = ["Argirw", "Christine", "Nikos", "Paula"];

async function migrate(): Promise<void> {
  const recipes = await getRecipesCollection();
  const users = await getUsersCollection();

  // 1. Flatten {name:"X"} → "X" on creator.
  const creatorRes = await recipes.updateMany(
    { "creator.name": { $exists: true } },
    [{ $set: { creator: "$creator.name" } }]
  );
  console.log(`creators flattened: ${creatorRes.modifiedCount}`);

  // 2. Same for every comment.user.
  const commentRes = await recipes.updateMany(
    { "comments.user.name": { $exists: true } },
    [
      {
        $set: {
          comments: {
            $map: {
              input: "$comments",
              as: "c",
              in: {
                $mergeObjects: [
                  "$$c",
                  {
                    user: {
                      $cond: [
                        { $eq: [{ $type: "$$c.user" }, "object"] },
                        "$$c.user.name",
                        "$$c.user",
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
    ]
  );
  console.log(`comment users flattened: ${commentRes.modifiedCount}`);

  // 3. Seed canonical users.
  for (const name of SEED_USERS) {
    await users.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }
  const all = await users.find({}, { projection: { _id: 0, name: 1 } }).sort({ name: 1 }).toArray();
  console.log(`users in collection: ${all.map((u) => u.name).join(", ")}`);
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    void closeDb();
  });
