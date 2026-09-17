export async function ensureShareholderEmailColumn(db: any): Promise<void> {
  const { results } = await db.prepare('PRAGMA table_info(shareholders)').all();
  const hasEmail = (results as Array<{ name: string }>).some(col => col.name === 'email');
  if (!hasEmail) {
    await db.prepare('ALTER TABLE shareholders ADD COLUMN email TEXT').run();
  }
}
