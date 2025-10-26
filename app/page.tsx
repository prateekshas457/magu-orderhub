"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Fully typed Magu OrderHub React component
 * - Undo/History typed
 * - Orders typed
 * - Stages typed
 */

type OrderItem = { name: string; qty: number };

export type Order = {
  id: string;
  customer: string;
  product: string;
  qty: number;
  value: number;
  due: string;
  stage: string;
  assigned?: string;
  notes?: string;
  items?: OrderItem[];
};

type Action =
  | { type: "add"; order: Order; at: string }
  | { type: "move"; id: string; from: string; to: string; at: string };

const DEFAULT_STAGES = [
  "Material Acquisition",
  "Carpentry",
  "Sanding",
  "Painting / Finishing",
  "Assembly",
  "Packaging",
  "Dispatch",
  "Delivered",
];

export default function MaguOrderHub() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stages, setStages] = useState<string[]>([...DEFAULT_STAGES]);

  const [history, setHistory] = useState<Action[]>([]);
  const pushHistory = (action: Action) => {
    setHistory((h) => [action, ...h].slice(0, 50));
  };

  const undo = () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));

    if (last.type === "add") {
      setOrders((o) => o.filter((x) => x.id !== last.order.id));
    } else if (last.type === "move") {
      setOrders((o) =>
        o.map((ord) =>
          ord.id === last.id ? { ...ord, stage: last.from } : ord
        )
      );
    }
  };

  const addOrder = (o: Order) => {
    setOrders((prev) => {
      pushHistory({ type: "add", order: o, at: new Date().toISOString() });
      return [o, ...prev];
    });
  };

  const moveOrder = (id: string, toStage: string) => {
    setOrders((prev) => {
      const prevOrder = prev.find((o) => o.id === id);
      if (!prevOrder) return prev;
      pushHistory({
        type: "move",
        id,
        from: prevOrder.stage,
        to: toStage,
        at: new Date().toISOString(),
      });
      return prev.map((o) => (o.id === id ? { ...o, stage: toStage } : o));
    });
  };

  const addStage = (name: string) => setStages((s) => [...s, name]);
  const renameStage = (index: number, name: string) =>
    setStages((s) => s.map((x, i) => (i === index ? name : x)));
  const removeStage = (index: number) =>
    setStages((s) => s.filter((_, i) => i !== index));

  return <div>Magu OrderHub - Fully typed version ready for build</div>;
}
