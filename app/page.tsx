"use client";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Magu OrderHub — single-file starter React component
 * - Mobile-first layout (Tailwind classes)
 * - Login stub (simple username)
 * - Editable stages
 * - Kanban + Summary + Pick List views
 * - Undo for Add / Move
 * - Beige-themed (Magu brand)
 *
 * Drop this into a Next.js page (app/page.tsx or pages/index.tsx) and install Tailwind.
 */

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

const SAMPLE_ORDERS = [
  {
    id: "MAGU-2401",
    customer: "Priya Sharma",
    product: "Alice Crib + Toddler Rail",
    qty: 1,
    value: 38500,
    due: "2025-11-15",
    stage: "Material Acquisition",
    assigned: "Eshwar",
    notes: "Dusty blush finish, engraving Aanya",
    items: [
      { name: "Side Rail", qty: 2 },
      { name: "Slat Panel", qty: 2 },
      { name: "Toddler Rail", qty: 1 },
    ],
  },
  {
    id: "MAGU-2402",
    customer: "Rahul Verma",
    product: "Willa Junior Bed",
    qty: 1,
    value: 46500,
    due: "2025-11-30",
    stage: "Carpentry",
    assigned: "Karthik",
    notes: "Natural finish",
    items: [
      { name: "Headboard", qty: 1 },
      { name: "Side Rails", qty: 2 },
    ],
  },
];

const SAMPLE_BOM = [
  { product: "Alice Crib", component: "Side Rail", per: 2 },
  { product: "Alice Crib", component: "Slat Panel", per: 2 },
  { product: "Alice Crib + Toddler Rail", component: "Toddler Rail", per: 1 },
  { product: "Willa Junior Bed", component: "Headboard", per: 1 },
  { product: "Clover Pouffe", component: "Pouffe Shell", per: 1 },
];

export default function MaguOrderHub() {
  const [appName] = useState("Magu OrderHub");
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const [stages, setStages] = useState(() => [...DEFAULT_STAGES]);
  const [orders, setOrders] = useState(() => SAMPLE_ORDERS);
  const [bom] = useState(() => SAMPLE_BOM);

  const [view, setView] = useState("summary"); // summary | kanban | picklist

  // simple undo history stack
  const [history, setHistory] = useState([]);
  const pushHistory = (action) => {
    setHistory((h) => {
      const next = [action, ...h].slice(0, 50);
      return next;
    });
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

  // Add order form modal state
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    id: "",
    customer: "",
    product: "",
    qty: 1,
    value: 0,
    due: "",
    stage: stages[0],
  });

  // Editable stages: add / rename / reorder
  const addStage = (name) => setStages((s) => [...s, name]);
  const renameStage = (index, name) =>
    setStages((s) => s.map((x, i) => (i === index ? name : x)));
  const removeStage = (index) =>
    setStages((s) => s.filter((_, i) => i !== index));

  // Move order to next stage (or specific stage)
  const moveOrder = (id, toStage) => {
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

  const addOrder = (o) => {
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

  // Pick list calculation (next 7 days by default)
  const [asOf, setAsOf] = useState(() => new Date().toISOString().slice(0, 10));
  const windowDays = 7;
  const pickWindowOrders = useMemo(() => {
    const today = new Date(asOf);
    const end = new Date(today);
    end.setDate(today.getDate() + windowDays);
    return orders.filter((o) => {
      if (!o.due) return false;
      const d = new Date(o.due + "T00:00:00");
      return d >= today && d <= end && o.stage !== "Delivered";
    });
  }, [orders, asOf]);

  const pickList = useMemo(() => {
    const compTotals = {};
    pickWindowOrders.forEach((o) => {
      // look up BOM entries matching product name (naive match)
      bom.forEach((b) => {
        if (
          o.product.includes(b.product.split(" ")[0]) ||
          o.product === b.product ||
          o.product.startsWith(b.product)
        ) {
          const needed = (b.per || 1) * (o.qty || 1);
          compTotals[b.component] = compTotals[b.component] || {
            qty: 0,
            orders: new Set(),
          };
          compTotals[b.component].qty += needed;
          compTotals[b.component].orders.add(o.id);
        }
      });
      // also include itemized list if present
      if (o.items) {
        o.items.forEach((it) => {
          compTotals[it.name] = compTotals[it.name] || {
            qty: 0,
            orders: new Set(),
          };
          compTotals[it.name].qty += it.qty * (o.qty || 1);
          compTotals[it.name].orders.add(o.id);
        });
      }
    });
    return Object.entries(compTotals).map(([k, v]) => ({
      component: k,
      qty: v.qty,
      orders: Array.from(v.orders),
    }));
  }, [pickWindowOrders, bom]);

  // Simple login stub
  const login = (name) => {
    setUser({ name });
    setLoggedIn(true);
  };

  // Helpers
  const overdue = (dueDate) => {
    if (!dueDate) return false;
    const d = new Date(dueDate + "T00:00:00");
    const today = new Date();
    const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
    return diff < 0;
  };

  // UI pieces
  const Header = () => (
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
          onChange={(e) => setView(e.target.value)}
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
          <div className="px-2 py-1 rounded bg-white border">{user?.name}</div>
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
  );

  const SummaryView = () => (
    <div className="p-4 grid gap-3">
      {orders.map((o) => (
        <div
          key={o.id}
          onClick={() => {
            setView("kanban");
          }}
          className="p-3 rounded-2xl bg-white shadow-sm flex justify-between items-center"
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
                          className={`${
                            overdue(o.due) ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          {o.due || "—"}
                        </div>
                        <div className="mt-2 flex gap-1">
                          <button
                            onClick={() => {
                              // advance to next stage
                              const idx = stages.indexOf(o.stage);
                              const next =
                                stages[Math.min(stages.length - 1, idx + 1)];
                              if (next) moveOrder(o.id, next);
                            }}
                            className="px-2 py-1 text-xs rounded bg-[#efe3d2]"
                          >
                            Move
                          </button>
                          <button
                            onClick={() => {
                              setOrders((prev) =>
                                prev.filter((x) => x.id !== o.id)
                              );
                            }}
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
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm">As of</label>
        <input
          type="date"
          value={asOf}
          onChange={(e) => setAsOf(e.target.value)}
          className="px-2 py-1 rounded border"
        />
        <div className="text-sm text-gray-600">
          Window: next {windowDays} days
        </div>
      </div>
      {pickList.length === 0 ? (
        <div className="p-4 rounded bg-white shadow-sm">
          No components required in the selected window.
        </div>
      ) : (
        <div className="grid gap-3">
          {pickList.map((c) => (
            <div
              key={c.component}
              className="p-3 bg-white rounded-lg shadow-sm flex justify-between"
            >
              <div>
                <div className="font-medium">{c.component}</div>
                <div className="text-xs text-gray-600">
                  Orders: {c.orders.join(", ")}
                </div>
              </div>
              <div className="text-xl font-semibold">{c.qty}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fbf8f4] text-[#2b2b2b]">
      <Header />
      {!loggedIn && (
        <div className="p-6 text-center text-sm text-gray-600">
          Please login to use Magu OrderHub (this demo logs you in locally).
        </div>
      )}
      {loggedIn && (
        <div>
          {view === "summary" && <SummaryView />}
          {view === "kanban" && <KanbanView />}
          {view === "picklist" && <PickListView />}
        </div>
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
                  onClick={() => {
                    addOrder({ ...form, items: [] });
                  }}
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
