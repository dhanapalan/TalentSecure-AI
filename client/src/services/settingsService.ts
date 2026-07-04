import api from "../lib/api";

/** Flat key/value map, e.g. { "platform.name": "GradLogic", "ai.temperature": 0.4 } */
export type SystemSettings = Record<string, unknown>;

class SettingsService {
  async getSettings(): Promise<SystemSettings> {
    const response = await api.get("/superadmin/settings");
    return response.data?.data || {};
  }

  /** Upserts only the keys provided. */
  async updateSettings(settings: SystemSettings): Promise<void> {
    await api.put("/superadmin/settings", { settings });
  }
}

export default new SettingsService();
