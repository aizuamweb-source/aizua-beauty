"use client";
import { useEffect, useRef, useState } from "react";

/* ── Circuit Board Canvas ── */
export function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    let raf: number;
    let traces: { x: number; y: number }[][] = [];
    let nodes: { x: number; y: number; r: number; phase: number }[] = [];
    let W = 0, H = 0;

    function resize() {
      const r = devicePixelRatio || 1;
      W = c!.offsetWidth;
      H = c!.offsetHeight;
      c!.width = W * r;
      c!.height = H * r;
      ctx.setTransform(r, 0, 0, r, 0, 0);
      generateCircuit();
    }

    function generateCircuit() {
      traces = [];
      nodes = [];
      const cx = W / 2;
      const cy = H / 2;
      const NUM_TRACES = 60;

      for (let i = 0; i < NUM_TRACES; i++) {
        const angle0 = (Math.PI * 2 / NUM_TRACES) * i + (Math.random() - 0.5) * 0.3;
        const len = 80 + Math.random() * (Math.min(W, H) * 0.45);
        const segments: { x: number; y: number }[] = [];
        let x = cx + Math.cos(angle0) * (40 + Math.random() * 30);
        let y = cy + Math.sin(angle0) * (40 + Math.random() * 30);
        segments.push({ x, y });

        const steps = 2 + Math.floor(Math.random() * 4);
        const stepLen = len / steps;
        let dir = angle0;

        for (let s = 0; s < steps; s++) {
          if (s > 0 && Math.random() > 0.4) {
            dir = Math.round(dir / (Math.PI / 4)) * (Math.PI / 4) + (Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4);
          }
          x += Math.cos(dir) * stepLen;
          y += Math.sin(dir) * stepLen;
          segments.push({ x, y });
        }

        traces.push(segments);
        const last = segments[segments.length - 1];
        nodes.push({ x: last.x, y: last.y, r: 2 + Math.random() * 2.5, phase: Math.random() * Math.PI * 2 });
      }

      for (let j = 0; j < 30; j++) {
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: 1.5 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    let t = 0;
    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      // Draw traces
      for (let i = 0; i < traces.length; i++) {
        const seg = traces[i];
        ctx.beginPath();
        ctx.moveTo(seg[0].x, seg[0].y);
        for (let s = 1; s < seg.length; s++) {
          ctx.lineTo(seg[s].x, seg[s].y);
        }
        ctx.strokeStyle = "rgba(0,160,140,0.22)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Draw glowing nodes
      for (let n = 0; n < nodes.length; n++) {
        const nd = nodes[n];
        const glow = 0.3 + 0.4 * Math.sin(t * 1.5 + nd.phase);

        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,160,140,${(glow * 0.28).toFixed(3)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(nd.x, nd.y, nd.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,201,177,${(glow * 0.7 + 0.2).toFixed(3)})`;
        ctx.fill();
      }

      // Traveling pulses
      for (let i = 0; i < traces.length; i++) {
        const seg = traces[i];
        if (seg.length < 2) continue;
        const progress = ((t * 0.3 + i * 0.17) % 1);
        let totalLen = 0;
        const lengths: number[] = [];
        for (let s = 1; s < seg.length; s++) {
          const dx = seg[s].x - seg[s - 1].x;
          const dy = seg[s].y - seg[s - 1].y;
          const l = Math.sqrt(dx * dx + dy * dy);
          lengths.push(l);
          totalLen += l;
        }
        const target = progress * totalLen;
        let acc = 0;
        for (let s = 0; s < lengths.length; s++) {
          if (acc + lengths[s] >= target) {
            const frac = (target - acc) / lengths[s];
            const px = seg[s].x + (seg[s + 1].x - seg[s].x) * frac;
            const py = seg[s].y + (seg[s + 1].y - seg[s].y) * frac;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,201,177,0.8)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0,201,177,0.15)";
            ctx.fill();
            break;
          }
          acc += lengths[s];
        }
      }

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

/* ── Countdown Timer ── */
export function CountdownTimer({ locale }: { locale: string }) {
  const [time, setTime] = useState("23:59:59");

  useEffect(() => {
    function tick() {
      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      const diff = Math.max(0, end.getTime() - now.getTime());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime(
        `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`
      );
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: "#0F172A",
        textAlign: "center",
        padding: "10px 20px",
        fontSize: "13px",
        color: "rgba(255,255,255,0.7)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {locale === "es" ? "Oferta termina en:" : "Offer ends in:"}{" "}
      <strong
        style={{
          color: "#ef4444",
          fontSize: "15px",
          marginLeft: "6px",
          fontFamily: "'Courier New', monospace",
          letterSpacing: "0.1em",
        }}
      >
        {time}
      </strong>
    </div>
  );
}

/* ── Spotlight wrapper for product cards ── */
export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty("--mx", x + "%");
    el.style.setProperty("--my", y + "%");
  }

  return (
    <div ref={ref} className={`spotlight-wrap ${className || ""}`} onMouseMove={handleMove}>
      {children}
    </div>
  );
}
