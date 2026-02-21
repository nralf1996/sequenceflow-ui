"use client";

import { useEffect, useState } from "react";

type Config = {
  companyName: string;
  tone: "friendly" | "formal" | "direct";
  rules: {
    empathyEnabled: boolean;
    allowDiscount: boolean;
    maxDiscountAmount: number | null;
  };
  signature: string;
};

type SupportResponse = {
  status: string;
  confidence: number;
  draft: {
    subject: string;
    body: string;
  };
  actions: any[];
  reasons: string[];
};

export default function AgentPage() {
  const [config, setConfig] = useState<Config>({
    companyName: "",
    tone: "friendly",
    rules: {
      empathyEnabled: true,
      allowDiscount: false,
      maxDiscountAmount: null,
    },
    signature: "",
  });

  const [preview, setPreview] = useState<SupportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Load config
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/agent-config");
      const data = await res.json();
      setConfig(data);
    }
    load();
  }, []);

  async function saveConfig() {
    await fetch("/api/agent-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
  }

  async function generatePreview() {
    setLoading(true);
    setPreview(null);

    const res = await fetch("/api/support/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: "Order #1234 arrived damaged",
        body: "Hi, my product arrived damaged. What can you do?",
        channel: "email",
        customer: {
          name: "John Doe",
          email: "john@example.com",
          language: "nl",
        },
        order: {
          orderId: "1234",
          productName: "Office Chair",
          pricePaid: 199,
          currency: "EUR",
        },
      }),
    });

    const data = await res.json();
    setPreview(data);
    setLoading(false);
  }

  function confidenceColor(score: number) {
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.6) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="p-10 text-white bg-slate-950 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Support Agent Config</h1>

      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="block mb-2">Company Name</label>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              value={config.companyName}
              onChange={(e) =>
                setConfig({ ...config, companyName: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block mb-2">Tone</label>
            <select
              className="w-full p-2 bg-slate-800 rounded"
              value={config.tone}
              onChange={(e) =>
                setConfig({
                  ...config,
                  tone: e.target.value as Config["tone"],
                })
              }
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="direct">Direct</option>
            </select>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                className="mr-2"
                checked={config.rules.empathyEnabled}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: {
                      ...config.rules,
                      empathyEnabled: e.target.checked,
                    },
                  })
                }
              />
              Enable empathy
            </label>
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                className="mr-2"
                checked={config.rules.allowDiscount}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: {
                      ...config.rules,
                      allowDiscount: e.target.checked,
                      maxDiscountAmount: e.target.checked
                        ? config.rules.maxDiscountAmount ?? 10
                        : null,
                    },
                  })
                }
              />
              Allow discount
            </label>
          </div>

          {config.rules.allowDiscount && (
            <div>
              <label className="block mb-2">Max discount (€)</label>
              <input
                type="number"
                className="w-full p-2 bg-slate-800 rounded"
                value={config.rules.maxDiscountAmount ?? 0}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    rules: {
                      ...config.rules,
                      maxDiscountAmount: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          )}

          <div>
            <label className="block mb-2">Signature</label>
            <textarea
              className="w-full p-2 bg-slate-800 rounded"
              value={config.signature}
              onChange={(e) =>
                setConfig({ ...config, signature: e.target.value })
              }
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={saveConfig}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
            >
              Save Config
            </button>

            <button
              type="button"
              onClick={generatePreview}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded"
            >
              Generate Preview
            </button>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded border border-slate-800">
          <h2 className="text-xl font-semibold mb-4">AI Preview</h2>

          {loading && <p className="text-slate-400">Generating...</p>}

          {preview && (
            <div className="space-y-4 text-sm">
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={
                    preview.status === "NEEDS_HUMAN"
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {preview.status}
                </span>
              </div>

              <div>
                <strong>Confidence:</strong>{" "}
                <span className={confidenceColor(preview.confidence)}>
                  {(preview.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div>
                <strong>Subject:</strong>
                <div className="mt-1">{preview.draft?.subject}</div>
              </div>

              <div>
                <strong>Body:</strong>
                <div className="mt-1 whitespace-pre-wrap">
                  {preview.draft?.body}
                </div>
              </div>

              {preview.reasons?.length > 0 && (
                <div>
                  <strong>Reasons:</strong>
                  <ul className="list-disc ml-6 mt-1 text-red-400">
                    {preview.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}