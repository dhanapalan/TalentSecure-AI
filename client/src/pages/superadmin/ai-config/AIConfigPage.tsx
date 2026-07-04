import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import settingsService, { SystemSettings } from "../../../services/settingsService";

type Tab = "model" | "prompts" | "quotas";

const TAB_META: Record<Tab, { title: string; subtitle: string }> = {
  model: { title: "Model Settings", subtitle: "Which model powers question generation" },
  prompts: { title: "Prompt Templates", subtitle: "Templates used by the AI question generator" },
  quotas: { title: "Usage Quotas", subtitle: "Limits on AI generation usage" },
};

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

export default function AIConfigPage() {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get("tab");
  const tab: Tab = raw === "prompts" || raw === "quotas" ? raw : "model";

  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setSettings(await settingsService.getSettings());
      } catch (error) {
        toast.error("Failed to load AI configuration");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const set = (key: string, value: unknown) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = async (keys: string[]) => {
    setSaving(true);
    try {
      const payload: SystemSettings = {};
      for (const k of keys) payload[k] = settings[k];
      await settingsService.updateSettings(payload);
      toast.success("AI configuration saved");
    } catch (error) {
      toast.error("Failed to save configuration");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const meta = TAB_META[tab];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{meta.title}</h2>
        <p className="text-gray-600 mt-1">{meta.subtitle}</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-600">Loading configuration...</div>
      ) : (
        <div className="max-w-2xl space-y-6">
          {tab === "model" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <select
                    value={String(settings["ai.provider"] ?? "groq")}
                    onChange={(e) => set("ai.provider", e.target.value)}
                    className={inputClass}
                  >
                    <option value="groq">Groq</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={String(settings["ai.model"] ?? "")}
                    onChange={(e) => set("ai.model", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature ({Number(settings["ai.temperature"] ?? 0.4)})
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={Number(settings["ai.temperature"] ?? 0.4)}
                    onChange={(e) => set("ai.temperature", Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Lower = more deterministic, higher = more varied questions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    min={256}
                    max={32768}
                    value={Number(settings["ai.max_tokens"] ?? 2048)}
                    onChange={(e) => set("ai.max_tokens", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
              <SaveButton
                saving={saving}
                onClick={() => save(["ai.provider", "ai.model", "ai.temperature", "ai.max_tokens"])}
              />
            </div>
          )}

          {tab === "prompts" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MCQ Generation Prompt
                </label>
                <textarea
                  rows={4}
                  value={String(settings["ai.prompt_mcq"] ?? "")}
                  onChange={(e) => set("ai.prompt_mcq", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Placeholders: {"{count}"}, {"{topic}"}, {"{difficulty}"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation Prompt
                </label>
                <textarea
                  rows={3}
                  value={String(settings["ai.prompt_explanation"] ?? "")}
                  onChange={(e) => set("ai.prompt_explanation", e.target.value)}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">Placeholders: {"{answer}"}</p>
              </div>
              <SaveButton
                saving={saving}
                onClick={() => save(["ai.prompt_mcq", "ai.prompt_explanation"])}
              />
            </div>
          )}

          {tab === "quotas" && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Generations (platform)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={Number(settings["ai.quota_daily_generations"] ?? 200)}
                    onChange={(e) => set("ai.quota_daily_generations", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Generations (per college)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={Number(settings["ai.quota_per_college_daily"] ?? 50)}
                    onChange={(e) => set("ai.quota_per_college_daily", Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Token Budget
                </label>
                <input
                  type="number"
                  min={0}
                  step={100000}
                  value={Number(settings["ai.quota_monthly_tokens"] ?? 2000000)}
                  onChange={(e) => set("ai.quota_monthly_tokens", Number(e.target.value))}
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Generation stops for the month once this budget is spent
                </p>
              </div>
              <SaveButton
                saving={saving}
                onClick={() =>
                  save([
                    "ai.quota_daily_generations",
                    "ai.quota_per_college_daily",
                    "ai.quota_monthly_tokens",
                  ])
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {saving ? "Saving..." : "Save Configuration"}
    </button>
  );
}
