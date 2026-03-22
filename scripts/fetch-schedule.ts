import fs from "fs";
import path from "path";

const PADRES_TEAM_ID = 135;
const CACHE_DIR = path.join(import.meta.dirname, "cache");

export interface PadresGame {
  date: string;       // YYYY-MM-DD
  opponent: string;
  dayNight: "day" | "night" | "tbd";
}

export async function fetchPadresSchedule(year: number): Promise<PadresGame[]> {
  const cacheFile = path.join(CACHE_DIR, `padres_schedule_${year}.json`);

  // Return cached version if available
  if (fs.existsSync(cacheFile)) {
    console.log(`  Using cached Padres schedule for ${year}`);
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as PadresGame[];
  }

  console.log(`  Fetching Padres ${year} home game schedule from MLB Stats API...`);
  const url =
    `https://statsapi.mlb.com/api/v1/schedule?teamId=${PADRES_TEAM_ID}&season=${year}&gameType=R&sportId=1`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  Warning: MLB API returned ${res.status} for ${year}. Skipping.`);
    return [];
  }

  const json = await res.json() as {
    dates?: {
      date: string;
      games?: {
        officialDate: string;
        dayNight: string;
        teams: {
          home: { team: { id: number; name: string } };
          away: { team: { id: number; name: string } };
        };
        status?: { abstractGameState?: string };
      }[];
    }[];
  };

  const homeGames: PadresGame[] = [];

  for (const dateEntry of json.dates ?? []) {
    for (const game of dateEntry.games ?? []) {
      // Only include home games at Petco Park
      if (game.teams.home.team.id !== PADRES_TEAM_ID) continue;
      // Skip postponed/cancelled games
      const state = game.status?.abstractGameState ?? "";
      if (state === "Postponed" || state === "Cancelled") continue;

      homeGames.push({
        date: game.officialDate,
        opponent: game.teams.away.team.name,
        dayNight: (game.dayNight as "day" | "night") ?? "tbd",
      });
    }
  }

  console.log(`  Found ${homeGames.length} Padres home games in ${year}`);

  // Cache result
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(homeGames, null, 2));

  return homeGames;
}
