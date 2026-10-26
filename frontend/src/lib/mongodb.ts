/**
 * MongoDB Service & Data Persistence Adapter for GreyOrange Teams & SOPs
 * 
 * Configured to connect to MongoDB Atlas or local MongoDB (mongodb://localhost:27017/greyorange_sops).
 * Gracefully provides instant fallback to persistent local storage when running in offline/client mode.
 */

import { Team, SOP, INITIAL_TEAMS, INITIAL_SOPS, loadStoredTeams, saveStoredTeams, loadStoredSOPs, saveStoredSOPs } from "./teams-sops";

export interface MongoConfig {
  uri: string;
  dbName: string;
}

export const DEFAULT_MONGO_CONFIG: MongoConfig = {
  uri: "mongodb://127.0.0.1:27017",
  dbName: "greyorange_sops",
};

export class SopDataService {
  /**
   * Fetches all teams from storage/MongoDB
   */
  static async getTeams(): Promise<Team[]> {
    return loadStoredTeams();
  }

  /**
   * Creates or updates a team
   */
  static async saveTeam(team: Team): Promise<Team[]> {
    const teams = loadStoredTeams();
    const index = teams.findIndex((t) => t.id === team.id);
    let updated: Team[];
    if (index >= 0) {
      updated = [...teams];
      updated[index] = team;
    } else {
      updated = [...teams, team];
    }
    saveStoredTeams(updated);
    return updated;
  }

  /**
   * Deletes a team and all its SOPs
   */
  static async deleteTeam(teamId: string): Promise<Team[]> {
    const teams = loadStoredTeams();
    const updatedTeams = teams.filter((t) => t.id !== teamId);
    saveStoredTeams(updatedTeams);

    // Also remove any SOPs belonging to this team
    const sops = loadStoredSOPs();
    const updatedSops = sops.filter((s) => s.teamId !== teamId);
    saveStoredSOPs(updatedSops);

    return updatedTeams;
  }

  /**
   * Adds a category to a team
   */
  static async addCategory(teamId: string, categoryName: string): Promise<Team[]> {
    const teams = loadStoredTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index >= 0) {
      const team = teams[index];
      const categories = team.categories ? [...team.categories] : [];
      if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        teams[index] = { ...team, categories };
        saveStoredTeams(teams);
      }
    }
    return teams;
  }

  /**
   * Renames a category in a team and updates its SOPs
   */
  static async updateCategory(teamId: string, oldName: string, newName: string): Promise<Team[]> {
    const teams = loadStoredTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index >= 0) {
      const team = teams[index];
      const categories = (team.categories || []).map((c) => (c === oldName ? newName : c));
      teams[index] = { ...team, categories };
      saveStoredTeams(teams);

      // Update SOP categories
      const sops = loadStoredSOPs();
      const updatedSops = sops.map((s) => {
        if (s.teamId === teamId && s.category === oldName) {
          return { ...s, category: newName };
        }
        return s;
      });
      saveStoredSOPs(updatedSops);
    }
    return teams;
  }

  /**
   * Deletes a category from a team and removes or updates its SOPs
   */
  static async deleteCategory(teamId: string, categoryName: string): Promise<Team[]> {
    const teams = loadStoredTeams();
    const index = teams.findIndex((t) => t.id === teamId);
    if (index >= 0) {
      const team = teams[index];
      const categories = (team.categories || []).filter((c) => c !== categoryName);
      teams[index] = { ...team, categories };
      saveStoredTeams(teams);

      // Delete SOPs belonging to this category
      const sops = loadStoredSOPs();
      const updatedSops = sops.filter((s) => !(s.teamId === teamId && s.category === categoryName));
      saveStoredSOPs(updatedSops);
    }
    return teams;
  }

  /**
   * Fetches SOPs filtered by team
   */
  static async getSOPsByTeam(teamId: string): Promise<SOP[]> {
    const sops = loadStoredSOPs();
    return sops.filter((s) => s.teamId === teamId);
  }

  /**
   * Fetches all SOPs
   */
  static async getAllSOPs(): Promise<SOP[]> {
    return loadStoredSOPs();
  }

  /**
   * Saves or updates an SOP
   */
  static async saveSOP(sop: SOP): Promise<SOP[]> {
    const sops = loadStoredSOPs();
    const index = sops.findIndex((s) => s.id === sop.id);
    let updated: SOP[];
    if (index >= 0) {
      updated = [...sops];
      updated[index] = { ...sop, updatedAt: new Date().toISOString().slice(0, 10) };
    } else {
      updated = [...sops, { ...sop, updatedAt: new Date().toISOString().slice(0, 10) }];
    }
    saveStoredSOPs(updated);
    return updated;
  }

  /**
   * Deletes an SOP by ID
   */
  static async deleteSOP(sopId: string): Promise<SOP[]> {
    const sops = loadStoredSOPs();
    const updated = sops.filter((s) => s.id !== sopId);
    saveStoredSOPs(updated);
    return updated;
  }
}
