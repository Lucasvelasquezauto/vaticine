/**
 * Rotten Tomatoes (Tomatometer) - snapshot manual
 * Fuente: PDF "Películas nominadas Oscar 2026" (valores y N/A)
 * Fecha del snapshot: 2026-02-01 (America/Bogota)
 *
 * Puedes editar cualquier número cuando quieras.
 */
export type RottenEntry = { title: string; score: number | null };

export const ROTTEN_SNAPSHOT_DATE = "2026-02-01";

export const ROTTEN_BY_TITLE: RottenEntry[] = [
  { title: "All the Empty Rooms", score: null },
  { title: "A Friend of Dorothy", score: null },
  { title: "Arco", score: 93 },
  { title: "Armed Only with a Camera: The Life and Death of Brent Renaud", score: null },
  { title: "Avatar: Fire and Ash", score: 71 },
  { title: "Blue Moon", score: 93 },
  { title: "Bugonia", score: 88 },
  { title: "Butterfly", score: null },
  { title: "Butcher's Stain", score: null },
  { title: "Children No More: Were and Are Gone", score: null },
  { title: "Come See Me in the Good Light", score: 100 },
  { title: "Cutting Through Rocks", score: 100 },
  { title: "Diane Warren: Relentless", score: 86 },
  { title: "Elio", score: 83 },
  { title: "F1", score: 84 },
  { title: "Forevergreen", score: null },
  { title: "Frankenstein", score: 77 },
  { title: "Hamnet", score: 86 },
  { title: "If I Had Legs I'd Kick You", score: 93 },
  { title: "It Was Just an Accident", score: 97 },
  { title: "Jane Austen's Period Drama", score: null },
  { title: "Jurassic World Rebirth", score: 58 },
  { title: "Kokuho", score: 100 },
  { title: "KPop Demon Hunters", score: 95 },
  { title: "Little Amélie or the Character of Rain", score: 98 },
  { title: "Marty Supreme", score: 94 },
  { title: "Mr. Nobody Against Putin", score: 100 },
  { title: "One Battle After Another", score: 98 },
  { title: "Perfectly a Strangeness", score: null },
  { title: "Retirement Plan", score: null },
  { title: "Sentimental Value", score: 96 },
  { title: "Sinners", score: 98 },
  { title: "Sirât", score: 93 },
  { title: "Song Sung Blue", score: 75 },
  { title: "The Alabama Solution", score: 100 },
  { title: "The Devil Is Busy", score: null },
  { title: "The Girl Who Cried Pearls", score: null },
  { title: "The Lost Bus", score: 87 },
  { title: "The Perfect Neighbor", score: 100 },
  { title: "The Secret Agent", score: 99 },
  { title: "The Singers", score: null },
  { title: "The Smashing Machine", score: null },
  { title: "The Three Sisters", score: null },
  { title: "The Ugly Stepsister", score: null },
  { title: "The Voice of Hind Rajab", score: 95 },
  { title: "Train Dreams", score: 95 },
  { title: "Two People Exchanging Saliva", score: null },
  { title: "Viva Verdi!", score: null },
  { title: "Weapons", score: 95 },
  { title: "Zootopia 2", score: 91 }
];
