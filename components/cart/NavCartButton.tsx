"use client";

import { useCart } from "@/lib/cart/CartContext";

interface NavCartButtonProps {
  locale: string;
}

export default function NavCartButton({ locale }: NavCartButtonProps) {
  const { totalItems, openCart } = useCart();
  const isEs = locale === "es";

  return (
    <button
      onClick={openCart}
      className="relative flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors"
      aria-label={isEs ? "Abrir carrito" : "Open cart"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
          {totalItems > 9 ? "9+" : totalItems}
        </span>
      )}
      <span className="sr-only">{isEs ? "Carrito" : "Cart"}</span>
    </button>
  );
}
