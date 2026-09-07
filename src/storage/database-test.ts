import { getDatabase } from "./database";

export async function testDatabase() {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{
    count: number;
  }>("SELECT COUNT(*) as count FROM user_preferences");

  console.log("Battery Intelligence DB ready:", result?.count ?? 0);
}
