/**
 * Devuelve el nombre localizado de un producto.
 * Prioridad: name_{locale} > name_en > name (campo original)
 */
export function getLocalizedName(
  product: Record<string, unknown>,
  locale: string
): string {
  const key = `name_${locale}`;
  if (product[key] && typeof product[key] === "string") return product[key] as string;
  if (product.name_en && typeof product.name_en === "string") return product.name_en as string;
  if (typeof product.name === "string") return product.name as string;
  if (product.name && typeof product.name === "object") {
    const obj = product.name as Record<string, string>;
    return obj[locale] ?? obj["en"] ?? Object.values(obj)[0] ?? "";
  }
  return "";
}
