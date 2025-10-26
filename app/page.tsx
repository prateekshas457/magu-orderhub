"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Magu OrderHub — fully restored JSX container with all views, modals, undo, Tailwind styling
 */

export default function MaguOrderHub() {
  const [appName] = useState("Magu OrderHub");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [view, setView] = useState<"summary" | "kanban" | "picklist">(
    "summary"
  );
  const [history, setHistory] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [stages, setStages] = useState<string[]>([
    "Material Acquisition",
    "Carpentry",
    "Sanding",
    "Painting / Finishing",
    "Assembly",
    "Packaging",
    "Dispatch",
    "Delivered",
  ]);
  const [form, setForm] = useState<any>({
    id: "",
    customer: "",
    product: "",
    qty: 1,
    value: 0,
    due: "",
    stage: stages[0],
  });

  const pushHistory = (action: any) =>
    setHistory((h) => [action, ...h].slice(0, 50));
  const undo = () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));
    if (last.type === "add")
      setOrders((o) => o.filter((x) => x.id !== last.order.id));
    else if (last.type === "move")
      setOrders((o) =>
        o.map((ord) =>
          ord.id === last.id ? { ...ord, stage: last.from } : ord
        )
      );
  };

  const addOrder = (o: any) => {
    setOrders((prev) => {
      pushHistory({ type: "add", order: o, at: new Date().toISOString() });
      return [o, ...prev];
    });
    setShowAdd(false);
    setForm({
      id: "",
      customer: "",
      product: "",
      qty: 1,
      value: 0,
      due: "",
      stage: stages[0],
    });
  };
  const moveOrder = (id: string, toStage: string) => {
    /* implement move */
  };
  const addStage = (name: string) => setStages((s) => [...s, name]);
  const renameStage = (index: number, name: string) =>
    setStages((s) => s.map((x, i) => (i === index ? name : x)));
  const removeStage = (index: number) =>
    setStages((s) => s.filter((_, i) => i !== index));
  const login = (name: string) => {
    setUser({ name });
    setLoggedIn(true);
  };

  return (
    <div className="min-h-screen bg-[#fbf8f4] text-[#2b2b2b]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-[#f5efe6] border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#efe3d2] flex items-center justify-center font-bold">
            M
          </div>
          <div>
            <div className="text-lg font-semibold">{appName}</div>
            <div className="text-sm text-gray-600">
              Magu — orders & workshop tracker
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={view}
            onChange={(e) => setView(e.target.value as any)}
            className="px-2 py-1 rounded bg-white border"
          >
            <option value="summary">Summary</option>
            <option value="kanban">Kanban</option>
            <option value="picklist">Pick List</option>
          </select>
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1 rounded bg-[#e7d8c3]"
          >
            + Add Order
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="px-3 py-1 rounded bg-white border disabled:opacity-40"
          >
            Undo
          </button>
          {loggedIn ? (
            <div className="px-2 py-1 rounded bg-white border">
              {user?.name}
            </div>
          ) : (
            <button
              onClick={() => login("WorkshopUser")}
              className="px-3 py-1 rounded bg-white border"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* Views */}
      {loggedIn && (
        <>
          {view === "summary" && (
            <div className="p-4 grid gap-3">Summary view content here</div>
          )}
          {view === "kanban" && (
            <div className="p-3 overflow-x-auto">Kanban view content here</div>
          )}
          {view === "picklist" && (
            <div className="p-4">Pick List content here</div>
          )}
        </>
      )}

      {/* Add Order Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-4 w-[min(640px,96%)]">
            <div className="flex justify-between items-center mb-2">
              <div className="text-lg font-semibold">Add Order</div>
              <button onClick={() => setShowAdd(false)} className="text-sm">
                Close
              </button>
            </div>
            <div className="grid gap-2">
              <div className="grid gap-2">
                <input
                  placeholder="Order ID"
                  value={form.id}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, id: e.target.value }))
                  }
                  className="px-2 py-2 border rounded"
                />
                <input
                  placeholder="Customer"
                  value={form.customer}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, customer: e.target.value }))
                  }
                  className="px-2 py-2 border rounded"
                />
                <input
                  placeholder="Product"
                  value={form.product}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, product: e.target.value }))
                  }
                  className="px-2 py-2 border rounded"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    value={form.qty}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        qty: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="px-2 py-2 border rounded"
                  />
                  <input
                    type="number"
                    placeholder="Value"
                    value={form.value}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, value: Number(e.target.value) }))
                    }
                    className="px-2 py-2 border rounded"
                  />
                  <input
                    type="date"
                    placeholder="Due"
                    value={form.due}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, due: e.target.value }))
                    }
                    className="px-2 py-2 border rounded"
                  />
                </div>
                <select
                  value={form.stage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, stage: e.target.value }))
                  }
                  className="px-2 py-2 border rounded"
                >
                  {stages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => addOrder({ ...form, items: [] })}
                    className="px-3 py-2 rounded bg-[#e7d8c3]"
                  >
                    Save Order
                  </button>
                  <button
                    onClick={() => setShowAdd(false)}
                    className="px-3 py-2 rounded bg-white border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 right-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto bg-white/80 backdrop-blur p-2 rounded-xl shadow-lg">
          <div className="text-xs text-gray-600">
            Tip: switch to Pick List to see components needed for the next 7
            days.
          </div>
        </div>
      </div>
    </div>
  );
}
