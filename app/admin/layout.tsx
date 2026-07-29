import Link from "next/link";

// Admin layout — shell visual. Auth checks are per-page (Server Components).
// La página /admin/login no requiere auth; el resto redirige si no hay cookie.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Admin — AizuaBeauty</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8f4f1; color: #2d1f1f; min-height: 100vh; }
          .adm-wrap { display: flex; min-height: 100vh; }
          .adm-sidebar { width: 220px; background: #1a0a0a; color: #f5e6d8; flex-shrink: 0; display: flex; flex-direction: column; }
          .adm-logo { padding: 20px 16px; font-size: 14px; font-weight: 700; letter-spacing: 0.05em; color: #f0c060; border-bottom: 1px solid rgba(255,255,255,0.07); }
          .adm-logo span { display: block; font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.5); margin-top: 2px; letter-spacing: 0.1em; text-transform: uppercase; }
          .adm-nav { flex: 1; padding: 16px 0; }
          .adm-nav a { display: flex; align-items: center; gap: 8px; padding: 10px 16px; color: rgba(255,255,255,0.7); text-decoration: none; font-size: 13px; transition: background 0.15s, color 0.15s; }
          .adm-nav a:hover { background: rgba(240,192,96,0.12); color: #f0c060; }
          .adm-nav .sep { height: 1px; background: rgba(255,255,255,0.06); margin: 8px 16px; }
          .adm-footer { padding: 16px; border-top: 1px solid rgba(255,255,255,0.07); }
          .adm-footer a { color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: none; display: block; }
          .adm-footer a:hover { color: rgba(255,255,255,0.7); }
          .adm-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
          .adm-main { flex: 1; overflow: auto; padding: 24px; }
          .adm-card { background: white; border-radius: 10px; border: 1px solid #e8ddd5; padding: 20px; margin-bottom: 20px; }
          .adm-card h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1a0a0a; }
          .adm-table-wrap { overflow-x: auto; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 12px; background: #faf6f3; color: #6b4c3b; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e8ddd5; }
          td { padding: 8px 12px; border-bottom: 1px solid #f0e8e2; vertical-align: middle; }
          tr:hover td { background: #fdf8f5; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
          .badge-active { background: #d1f5d3; color: #1a6621; }
          .badge-inactive { background: #fde8e8; color: #8b1a1a; }
          .badge-beauty { background: #fce4ec; color: #880e4f; }
          .badge-external { background: #f3e5f5; color: #4a148c; }
          .btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: background 0.15s; text-decoration: none; }
          .btn-primary { background: #1a0a0a; color: white; }
          .btn-primary:hover { background: #3a1a1a; }
          .btn-ghost { background: transparent; color: #6b4c3b; border: 1px solid #e8ddd5; }
          .btn-ghost:hover { background: #f8f4f1; }
          .btn-danger { background: #fde8e8; color: #8b1a1a; border: 1px solid #f5c0c0; }
          .btn-danger:hover { background: #f5c0c0; }
          .input { width: 100%; padding: 8px 12px; border: 1px solid #e8ddd5; border-radius: 6px; font-size: 13px; color: #2d1f1f; background: white; outline: none; }
          .input:focus { border-color: #c0906b; box-shadow: 0 0 0 2px rgba(192,144,107,0.15); }
          .form-row { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
          .pagination { display: flex; align-items: center; gap: 8px; margin-top: 16px; font-size: 13px; }
          .pagination a, .pagination span { padding: 6px 12px; border-radius: 6px; text-decoration: none; border: 1px solid #e8ddd5; color: #6b4c3b; }
          .pagination a:hover { background: #f8f4f1; }
          .pagination .cur { background: #1a0a0a; color: white; border-color: #1a0a0a; }
          .price-field { width: 80px; }
          .img-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; background: #f0e8e2; }
          .toggle-wrap { display: flex; align-items: center; }
          .toggle { position: relative; display: inline-block; width: 36px; height: 20px; }
          .toggle input { opacity: 0; width: 0; height: 0; }
          .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #ccc; border-radius: 20px; transition: 0.3s; }
          .toggle-slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
          input:checked + .toggle-slider { background: #2d8a3e; }
          input:checked + .toggle-slider:before { transform: translateX(16px); }
          .ext-link { color: #c0906b; font-size: 11px; text-decoration: none; }
          .ext-link:hover { text-decoration: underline; }
          .stat-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
          .stat-box { background: white; border: 1px solid #e8ddd5; border-radius: 10px; padding: 16px 20px; min-width: 120px; }
          .stat-box .num { font-size: 24px; font-weight: 700; color: #1a0a0a; }
          .stat-box .lbl { font-size: 11px; color: #9b7a69; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.05em; }
          @media (max-width: 768px) {
            .adm-wrap { flex-direction: column; }
            .adm-sidebar { width: 100%; }
            .adm-nav { display: flex; flex-wrap: wrap; padding: 8px; gap: 4px; }
            .adm-nav a { padding: 6px 10px; font-size: 11px; }
            .adm-footer { display: none; }
            .adm-main { padding: 16px; }
          }
        `}</style>
      </head>
      <body>
        <div className="adm-wrap">
          <aside className="adm-sidebar">
            <div className="adm-logo">
              🌸 AizuaBeauty
              <span>Panel Admin</span>
            </div>
            <nav className="adm-nav">
              <Link href="/admin/products"><span>📦</span> Productos</Link>
              <Link href="/admin/orders"><span>🛒</span> Pedidos</Link>
              <div className="sep" />
              <Link href="https://beauty.aizualabs.com/es" target="_blank"><span>🔗</span> Ver tienda</Link>
              <Link href="https://supabase.com/dashboard/project/nxcnykpsooolxruwmifu" target="_blank"><span>🗄️</span> Supabase</Link>
            </nav>
            <div className="adm-footer">
              <Link href="/admin/logout">⟵ Cerrar sesión</Link>
            </div>
          </aside>
          <div className="adm-content">
            <div className="adm-main">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
