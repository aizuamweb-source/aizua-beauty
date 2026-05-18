"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  slug: string;
  name: string;
  name_es?: string | null;
  name_en?: string | null;
  price: number;
  compare_price?: number | null;
  cost_price?: number | null;
  active: boolean;
  stock?: number | null;
  category?: string | null;
  supplier?: string | null;
  aliexpress_url?: string | null;
  images?: string[] | null;
  rating?: number | null;
  review_count?: number | null;
};

type Stats = { active: number; inactive: number };

interface Props {
  initialProducts: Product[];
  totalCount: number;
  page: number;
  initialSearch: string;
  initialActive: string;
  initialCategory: string;
  categories: string[];
  stats: Stats;
}

export default function ProductsClient({
  initialProducts, totalCount, page, initialSearch, initialActive, initialCategory, categories, stats,
}: Props) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceVal, setPriceVal] = useState("");
  const totalPages = Math.ceil(totalCount / 20);

  // Navigate with filters
  function goTo(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    if (params.page && params.page !== 1) sp.set("page", String(params.page));
    if (params.search) sp.set("search", String(params.search));
    if (params.active) sp.set("active", String(params.active));
    if (params.category) sp.set("category", String(params.category));
    router.push("/admin/products?" + sp.toString());
  }

  // Toggle active
  const toggleActive = useCallback(async (product: Product) => {
    setSaving(product.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, active: !product.active }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, active: !p.active } : p));
      }
    } finally {
      setSaving(null);
    }
  }, []);

  // Save price
  const savePrice = useCallback(async (product: Product) => {
    const val = parseFloat(priceVal);
    if (isNaN(val) || val <= 0) return;
    setSaving(product.id);
    try {
      const res = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, price: val }),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, price: val } : p));
        setEditingPrice(null);
      }
    } finally {
      setSaving(null);
    }
  }, [priceVal]);

  const displayName = (p: Product) => p.name_es || p.name || p.slug;
  const firstImage = (p: Product) => (p.images && p.images.length > 0) ? p.images[0] : null;

  return (
    <div>
      {/* Stats */}
      <div className="stat-row">
        <div className="stat-box">
          <div className="num">{stats.active + stats.inactive}</div>
          <div className="lbl">Total beauty</div>
        </div>
        <div className="stat-box">
          <div className="num" style={{ color: "#2d8a3e" }}>{stats.active}</div>
          <div className="lbl">Activos</div>
        </div>
        <div className="stat-box">
          <div className="num" style={{ color: "#c0392b" }}>{stats.inactive}</div>
          <div className="lbl">Inactivos</div>
        </div>
        <div className="stat-box">
          <div className="num">{totalCount}</div>
          <div className="lbl">Filtrados</div>
        </div>
      </div>

      <div className="adm-card">
        <h2>📦 Productos Beauty</h2>

        {/* Filters */}
        <div className="form-row">
          <input
            className="input"
            type="search"
            placeholder="Buscar por nombre..."
            defaultValue={initialSearch}
            style={{ maxWidth: "260px" }}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) goTo({ search: undefined, active: initialActive || undefined, category: initialCategory || undefined });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                goTo({ search: (e.target as HTMLInputElement).value || undefined, active: initialActive || undefined, category: initialCategory || undefined });
              }
            }}
          />
          <select
            className="input"
            style={{ maxWidth: "140px" }}
            value={initialActive}
            onChange={(e) => goTo({ search: initialSearch || undefined, active: e.target.value || undefined, category: initialCategory || undefined })}
          >
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <select
            className="input"
            style={{ maxWidth: "160px" }}
            value={initialCategory}
            onChange={(e) => goTo({ search: initialSearch || undefined, active: initialActive || undefined, category: e.target.value || undefined })}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>Img</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Proveedor</th>
                <th style={{ width: 90 }}>PVP €</th>
                <th style={{ width: 80 }}>Coste €</th>
                <th style={{ width: 70 }}>Stock</th>
                <th style={{ width: 60 }}>Activo</th>
                <th style={{ width: 100 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "#9b7a69" }}>No hay productos</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    {firstImage(p)
                      ? <img src={firstImage(p)!} alt="" className="img-thumb" onError={(e) => (e.currentTarget.style.display = "none")} />
                      : <div className="img-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🌸</div>}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: "13px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {displayName(p)}
                    </div>
                    <div style={{ fontSize: "11px", color: "#9b7a69" }}>{p.slug}</div>
                  </td>
                  <td>
                    {p.category && <span className="badge" style={{ background: "#fce4ec", color: "#880e4f" }}>{p.category}</span>}
                  </td>
                  <td>
                    <span style={{ fontSize: "12px", color: "#6b4c3b" }}>{p.supplier || "—"}</span>
                  </td>
                  <td>
                    {editingPrice === p.id ? (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <input
                          className="input price-field"
                          type="number"
                          step="0.01"
                          value={priceVal}
                          onChange={(e) => setPriceVal(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") savePrice(p);
                            if (e.key === "Escape") setEditingPrice(null);
                          }}
                        />
                        <button className="btn btn-primary" onClick={() => savePrice(p)} disabled={saving === p.id}>✓</button>
                      </div>
                    ) : (
                      <span
                        style={{ cursor: "pointer", borderBottom: "1px dashed #c0906b" }}
                        onClick={() => { setEditingPrice(p.id); setPriceVal(String(p.price)); }}
                        title="Click para editar precio"
                      >
                        {p.price.toFixed(2)} €
                      </span>
                    )}
                  </td>
                  <td style={{ color: "#9b7a69", fontSize: "13px" }}>
                    {p.cost_price != null ? `${p.cost_price.toFixed(2)} €` : "—"}
                  </td>
                  <td style={{ fontSize: "13px" }}>
                    {p.stock != null ? p.stock : "—"}
                  </td>
                  <td>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={p.active}
                        disabled={saving === p.id}
                        onChange={() => toggleActive(p)}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <a
                        href={`https://beauty.aizualabs.com/es/product/${p.slug}`}
                        target="_blank"
                        className="ext-link"
                      >
                        🔗 Ver
                      </a>
                      {p.aliexpress_url && (
                        <a href={p.aliexpress_url} target="_blank" className="ext-link">
                          🛒 Ali
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 && (
              <a href="#" onClick={(e) => { e.preventDefault(); goTo({ page: page - 1, search: initialSearch || undefined, active: initialActive || undefined, category: initialCategory || undefined }); }}>
                ← Anterior
              </a>
            )}
            <span className="cur">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <a href="#" onClick={(e) => { e.preventDefault(); goTo({ page: page + 1, search: initialSearch || undefined, active: initialActive || undefined, category: initialCategory || undefined }); }}>
                Siguiente →
              </a>
            )}
            <span style={{ color: "#9b7a69", marginLeft: "8px" }}>{totalCount} productos</span>
          </div>
        )}
      </div>
    </div>
  );
}
