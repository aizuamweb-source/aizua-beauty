"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

type OrderItem = {
  name?: string;
  product_slug?: string;
  quantity?: number;
  price?: number;
  aliexpress_url?: string | null;
  product_name_es?: string | null;
};

type Order = {
  id: string;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_country?: string | null;
  total_amount: number;
  currency?: string;
  status?: string | null;
  items?: OrderItem[] | null;
  stripe_checkout_session_id?: string | null;
};

type Stats = { orders: number; revenue: number };

interface Props {
  orders: Order[];
  totalCount: number;
  page: number;
  days: number;
  initialSearch: string;
  stats: Stats;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  paid: { bg: "#e8f5e9", color: "#2e7d32" },
  completed: { bg: "#e8f5e9", color: "#2e7d32" },
  pending: { bg: "#fff8e1", color: "#f57f17" },
  processing: { bg: "#e3f2fd", color: "#1565c0" },
  cancelled: { bg: "#fce4ec", color: "#b71c1c" },
  refunded: { bg: "#f3e5f5", color: "#6a1b9a" },
};

function statusStyle(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  return STATUS_COLORS[s] ?? { bg: "#f5f5f5", color: "#555" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function OrdersClient({
  orders, totalCount, page, days, initialSearch, stats,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState(initialSearch);
  const totalPages = Math.ceil(totalCount / 20);

  function goTo(params: Record<string, string | number | undefined>) {
    const sp = new URLSearchParams();
    if (params.page && params.page !== 1) sp.set("page", String(params.page));
    if (params.search) sp.set("search", String(params.search));
    if (params.days && params.days !== 30) sp.set("days", String(params.days));
    router.push("/admin/orders?" + sp.toString());
  }

  const avgOrder = stats.orders > 0 ? stats.revenue / stats.orders : 0;

  return (
    <div>
      {/* Stats */}
      <div className="stat-row">
        <div className="stat-box">
          <div className="num">{stats.orders}</div>
          <div className="lbl">Pedidos ({days}d)</div>
        </div>
        <div className="stat-box">
          <div className="num" style={{ color: "#2d8a3e" }}>
            {stats.revenue.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </div>
          <div className="lbl">Ingresos ({days}d)</div>
        </div>
        <div className="stat-box">
          <div className="num">{avgOrder.toFixed(2)} €</div>
          <div className="lbl">Ticket medio</div>
        </div>
        <div className="stat-box">
          <div className="num">{totalCount}</div>
          <div className="lbl">Filtrados</div>
        </div>
      </div>

      <div className="adm-card">
        <h2>🛍️ Pedidos Beauty</h2>

        {/* Filters */}
        <div className="form-row">
          <input
            className="input"
            type="search"
            placeholder="Buscar por email..."
            value={search}
            style={{ maxWidth: "260px" }}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value) goTo({ days, search: undefined });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") goTo({ days, search: search || undefined });
            }}
          />
          {[7, 30, 90, 365].map((d) => (
            <button
              key={d}
              className={"btn" + (days === d ? " btn-primary" : "")}
              style={{ minWidth: "60px" }}
              onClick={() => goTo({ days: d, search: initialSearch || undefined })}
            >
              {d}d
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="adm-table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 130 }}>Fecha</th>
                <th>Cliente</th>
                <th style={{ width: 60 }}>País</th>
                <th style={{ width: 80 }}>Total</th>
                <th style={{ width: 90 }}>Estado</th>
                <th>Productos</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "#9b7a69" }}>
                    No hay pedidos en este período
                  </td>
                </tr>
              )}
              {orders.map((order) => {
                const expanded = expandedId === order.id;
                const items = order.items ?? [];
                return (
                  <Fragment key={order.id}>
                    <tr
                      style={{ cursor: items.length > 0 ? "pointer" : "default" }}
                      onClick={() => items.length > 0 && setExpandedId(expanded ? null : order.id)}
                    >
                      <td style={{ fontSize: "12px", color: "#6b4c3b", whiteSpace: "nowrap" }}>
                        {formatDate(order.created_at)}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: "13px" }}>
                          {order.customer_name || "—"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9b7a69" }}>
                          {order.customer_email || ""}
                        </div>
                      </td>
                      <td style={{ fontSize: "13px", textAlign: "center" }}>
                        {order.customer_country || "—"}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: "14px", whiteSpace: "nowrap" }}>
                        {order.total_amount.toFixed(2)} {order.currency || "€"}
                      </td>
                      <td>
                        {order.status && (
                          <span
                            className="badge"
                            style={{
                              background: statusStyle(order.status).bg,
                              color: statusStyle(order.status).color,
                            }}
                          >
                            {order.status}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: "12px", color: "#6b4c3b" }}>
                        {items.length > 0 ? (
                          <span>
                            {items.length === 1
                              ? (items[0].product_name_es || items[0].name || items[0].product_slug || "1 producto")
                              : `${items.length} productos`}
                            {items.length > 0 && (
                              <span style={{ color: "#c0906b", marginLeft: "6px" }}>
                                {expanded ? "▲" : "▼"}
                              </span>
                            )}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                    {expanded && items.length > 0 && (
                      <tr style={{ background: "#fdf8f5" }}>
                        <td colSpan={6} style={{ padding: "12px 16px" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr>
                                <th style={{ fontSize: "11px", color: "#9b7a69", fontWeight: 600, textAlign: "left", padding: "4px 8px", borderBottom: "1px solid #e8ddd5" }}>Producto</th>
                                <th style={{ fontSize: "11px", color: "#9b7a69", fontWeight: 600, textAlign: "center", padding: "4px 8px", borderBottom: "1px solid #e8ddd5", width: 60 }}>Cant.</th>
                                <th style={{ fontSize: "11px", color: "#9b7a69", fontWeight: 600, textAlign: "right", padding: "4px 8px", borderBottom: "1px solid #e8ddd5", width: 80 }}>Precio</th>
                                <th style={{ fontSize: "11px", color: "#9b7a69", fontWeight: 600, textAlign: "center", padding: "4px 8px", borderBottom: "1px solid #e8ddd5", width: 100 }}>AliExpress</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, idx) => (
                                <tr key={idx}>
                                  <td style={{ padding: "6px 8px", fontSize: "12px" }}>
                                    <div style={{ fontWeight: 500 }}>
                                      {item.product_name_es || item.name || item.product_slug || "—"}
                                    </div>
                                    {item.product_slug && (
                                      <div style={{ fontSize: "10px", color: "#9b7a69" }}>{item.product_slug}</div>
                                    )}
                                  </td>
                                  <td style={{ padding: "6px 8px", fontSize: "12px", textAlign: "center" }}>
                                    {item.quantity ?? 1}
                                  </td>
                                  <td style={{ padding: "6px 8px", fontSize: "12px", textAlign: "right", whiteSpace: "nowrap" }}>
                                    {item.price != null ? `${item.price.toFixed(2)} €` : "—"}
                                  </td>
                                  <td style={{ padding: "6px 8px", textAlign: "center" }}>
                                    {item.aliexpress_url ? (
                                      <a
                                        href={item.aliexpress_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ext-link"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        🛒 Ali
                                      </a>
                                    ) : (
                                      <span style={{ color: "#ccc", fontSize: "11px" }}>—</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {order.stripe_checkout_session_id && (
                            <div style={{ marginTop: "8px", fontSize: "11px", color: "#9b7a69" }}>
                              Stripe: <code style={{ fontSize: "11px" }}>{order.stripe_checkout_session_id}</code>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {page > 1 && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goTo({ page: page - 1, days, search: initialSearch || undefined });
                }}
              >
                ← Anterior
              </a>
            )}
            <span className="cur">Página {page} de {totalPages}</span>
            {page < totalPages && (
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goTo({ page: page + 1, days, search: initialSearch || undefined });
                }}
              >
                Siguiente →
              </a>
            )}
            <span style={{ color: "#9b7a69", marginLeft: "8px" }}>{totalCount} pedidos</span>
          </div>
        )}
      </div>
    </div>
  );
}
