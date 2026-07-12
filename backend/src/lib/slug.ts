export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || Date.now().toString();
}

export async function makeUniqueSlug(
  name: string,
  existingSlugs: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name);
  if (!(await existingSlugs(base))) return base;
  let i = 2;
  while (await existingSlugs(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
