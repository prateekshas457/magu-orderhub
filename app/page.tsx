"use client";
import React, { useMemo, useState } from "react";

type OrderItem = {
  name: string;
  qty: number;
};

type Order = {
  id: string;
  customer: string;
  product: string;
  qty: number;
  value: number;
  due: string;
  stage: string;
  items?: OrderItem[];
};

type OrderForm = {
  id: string;
  customer: string;
  product: string;
  qty: number;
  value: number;
  due: string;
  stage: string;
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
  const [appName] = useState("Magu OrderHub");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [view, setView] = useState<"summary" | "kanban" | "picklist">(
    "summary"
  );

  const [orders, setOrders] = useState<Order[]>([]);
  const [stages, setStages] = useState<string[]>([...DEFAULT_STAGES]);
  const [history, setHistory] = useState<Action[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<OrderForm>({
    id: "",
    customer: "",
    product: "",
    qty: 1,
    value: 0,
    due: "",
    stage: stages[0],
  });

  // --- Undo ---
  const pushHistory = (action: Action) =>
    setHistory((h) => [action, ...h].slice(0, 50));

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

  // --- Orders ---
  const addOrder = (o: Order) => {
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

  // --- Stages ---
  const addStage = (name: string) => setStages((s) => [...s, name]);
  const renameStage = (index: number, name: string) =>
    setStages((s) => s.map((x, i) => (i === index ? name : x)));
  const removeStage = (index: number) =>
    setStages((s) => s.filter((_, i) => i !== index));

  // --- Login ---
  const login = (name: string) => {
    setUser({ name });
    setLoggedIn(true);
  };

  // --- Helpers ---
  const overdue = (dueDate?: string) => {
    if (!dueDate) return false;
    const d = new Date(dueDate + "T00:00:00");
    const today = new Date();
    return d < today;
  };

  // --- Views ---
  const SummaryView = () => (
    <div className="p-4 grid gap-3">
      {orders.map((o) => (
        <div
          key={o.id}
          onClick={() => setView("kanban")}
          className="p-3 rounded-2xl bg-white shadow-sm flex justify-between items-center cursor-pointer"
        >
          <div>
            <div className="text-sm font-medium">
              {o.customer}{" "}
              <span className="text-xs text-gray-500">({o.id})</span>
            </div>
            <div className="text-xs text-gray-600">{o.product}</div>
          </div>
          <div className="text-right">
            <div className="text-xs">{o.stage}</div>
            <div
              className={`text-sm ${
                overdue(o.due) ? "text-red-600 font-semibold" : "text-gray-700"
              }`}
            >
              {o.due || "—"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const KanbanView = () => (
    <div className="p-3 overflow-x-auto">
      <div className="flex gap-4 min-w-[1000px]">
        {stages.map((s) => (
          <div key={s} className="w-72 bg-[#fbf8f4] rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">{s}</div>
            </div>
            <div className="flex flex-col gap-3">
              {orders
                .filter((o) => o.stage === s)
                .map((o) => (
                  <div key={o.id} className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">{o.customer}</div>
                        <div className="text-xs text-gray-500">{o.product}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div
                          className={`mb-2 ${
                            overdue(o.due) ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          {o.due || "—"}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const idx = stages.indexOf(o.stage);
                              const nextStage =
                                stages[Math.min(stages.length - 1, idx + 1)];
                              if (nextStage) moveOrder(o.id, nextStage);
                            }}
                            className="px-2 py-1 text-xs rounded bg-[#efe3d2]"
                          >
                            Move
                          </button>
                          <button
                            onClick={() =>
                              setOrders((prev) =>
                                prev.filter((x) => x.id !== o.id)
                              )
                            }
                            className="px-2 py-1 text-xs rounded bg-white border"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PickListView = () => (
    <div className="p-4">
      {orders.length === 0 ? (
        <div className="p-4 rounded bg-white shadow-sm">No orders to show.</div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="p-3 bg-white rounded-lg shadow-sm flex justify-between"
            >
              <div>
                <div className="font-medium">{o.product}</div>
                <div className="text-xs text-gray-600">
                  Customer: {o.customer} | Stage: {o.stage}
                </div>
              </div>
              <div className="text-xl font-semibold">{o.qty}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- Render ---
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
          {view === "summary" && <SummaryView />}
          {view === "kanban" && <KanbanView />}
          {view === "picklist" && <PickListView />}
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
              <input
                placeholder="Order ID"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
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
