export type CalendarEvent = {
  season: number;
  round: number;
  eventName: string;
  country: string;
  circuitKey: string;
  laps: number;
  lapTime: number;
};

function race(
  season: number,
  round: number,
  eventName: string,
  country: string,
  circuitKey: string,
  laps: number,
  lapTime: number,
): CalendarEvent {
  return {
    season,
    round,
    eventName,
    country,
    circuitKey,
    laps,
    lapTime,
  };
}

export const CALENDAR_2024: CalendarEvent[] = [
  race(2024, 1, "Bahrain Grand Prix", "Bahrain", "bahrain", 57, 96),
  race(2024, 2, "Saudi Arabian Grand Prix", "Saudi Arabia", "jeddah", 50, 92),
  race(2024, 3, "Australian Grand Prix", "Australia", "albert-park", 58, 82),
  race(2024, 4, "Japanese Grand Prix", "Japan", "suzuka", 53, 92),
  race(2024, 5, "Chinese Grand Prix", "China", "shanghai", 56, 97),
  race(2024, 6, "Miami Grand Prix", "United States", "miami", 57, 91),
  race(2024, 7, "Emilia-Romagna Grand Prix", "Italy", "imola", 63, 78),
  race(2024, 8, "Monaco Grand Prix", "Monaco", "monaco", 78, 76),
  race(2024, 9, "Canadian Grand Prix", "Canada", "montreal", 70, 76),
  race(2024, 10, "Spanish Grand Prix", "Spain", "barcelona", 66, 78),
  race(2024, 11, "Austrian Grand Prix", "Austria", "spielberg", 71, 68),
  race(2024, 12, "British Grand Prix", "Great Britain", "silverstone", 52, 90),
  race(2024, 13, "Hungarian Grand Prix", "Hungary", "hungaroring", 70, 79),
  race(2024, 14, "Belgian Grand Prix", "Belgium", "spa", 44, 106),
  race(2024, 15, "Dutch Grand Prix", "Netherlands", "zandvoort", 72, 73),
  race(2024, 16, "Italian Grand Prix", "Italy", "monza", 53, 84),
  race(2024, 17, "Azerbaijan Grand Prix", "Azerbaijan", "baku", 51, 106),
  race(2024, 18, "Singapore Grand Prix", "Singapore", "marina-bay", 62, 96),
  race(2024, 19, "United States Grand Prix", "United States", "austin", 56, 98),
  race(2024, 20, "Mexico City Grand Prix", "Mexico", "mexico-city", 71, 80),
  race(2024, 21, "São Paulo Grand Prix", "Brazil", "interlagos", 69, 72),
  race(2024, 22, "Las Vegas Grand Prix", "United States", "las-vegas", 50, 79),
  race(2024, 23, "Qatar Grand Prix", "Qatar", "lusail", 57, 84),
  race(2024, 24, "Abu Dhabi Grand Prix", "United Arab Emirates", "yas-marina", 58, 86),
];

export const CALENDAR_2025: CalendarEvent[] = [
  race(2025, 1, "Australian Grand Prix", "Australia", "albert-park", 58, 82),
  race(2025, 2, "Chinese Grand Prix", "China", "shanghai", 56, 97),
  race(2025, 3, "Japanese Grand Prix", "Japan", "suzuka", 53, 92),
  race(2025, 4, "Bahrain Grand Prix", "Bahrain", "bahrain", 57, 96),
  race(2025, 5, "Saudi Arabian Grand Prix", "Saudi Arabia", "jeddah", 50, 92),
  race(2025, 6, "Miami Grand Prix", "United States", "miami", 57, 91),
  race(2025, 7, "Emilia-Romagna Grand Prix", "Italy", "imola", 63, 78),
  race(2025, 8, "Monaco Grand Prix", "Monaco", "monaco", 78, 76),
  race(2025, 9, "Spanish Grand Prix", "Spain", "barcelona", 66, 78),
  race(2025, 10, "Canadian Grand Prix", "Canada", "montreal", 70, 76),
  race(2025, 11, "Austrian Grand Prix", "Austria", "spielberg", 71, 68),
  race(2025, 12, "British Grand Prix", "Great Britain", "silverstone", 52, 90),
  race(2025, 13, "Belgian Grand Prix", "Belgium", "spa", 44, 106),
  race(2025, 14, "Hungarian Grand Prix", "Hungary", "hungaroring", 70, 79),
  race(2025, 15, "Dutch Grand Prix", "Netherlands", "zandvoort", 72, 73),
  race(2025, 16, "Italian Grand Prix", "Italy", "monza", 53, 84),
  race(2025, 17, "Azerbaijan Grand Prix", "Azerbaijan", "baku", 51, 106),
  race(2025, 18, "Singapore Grand Prix", "Singapore", "marina-bay", 62, 96),
  race(2025, 19, "United States Grand Prix", "United States", "austin", 56, 98),
  race(2025, 20, "Mexico City Grand Prix", "Mexico", "mexico-city", 71, 80),
  race(2025, 21, "São Paulo Grand Prix", "Brazil", "interlagos", 69, 72),
  race(2025, 22, "Las Vegas Grand Prix", "United States", "las-vegas", 50, 79),
  race(2025, 23, "Qatar Grand Prix", "Qatar", "lusail", 57, 84),
  race(2025, 24, "Abu Dhabi Grand Prix", "United Arab Emirates", "yas-marina", 58, 86),
];

export const CALENDAR_2026: CalendarEvent[] = [
  race(2026, 1, "Australian Grand Prix", "Australia", "albert-park", 58, 82),
  race(2026, 2, "Chinese Grand Prix", "China", "shanghai", 56, 97),
  race(2026, 3, "Japanese Grand Prix", "Japan", "suzuka", 53, 92),
  race(2026, 4, "Miami Grand Prix", "United States", "miami", 57, 91),
  race(2026, 5, "Canadian Grand Prix", "Canada", "montreal", 70, 76),
  race(2026, 6, "Monaco Grand Prix", "Monaco", "monaco", 78, 76),
  race(2026, 7, "Barcelona-Catalunya Grand Prix", "Spain", "barcelona", 66, 78),
  race(2026, 8, "Austrian Grand Prix", "Austria", "spielberg", 71, 68),
  race(2026, 9, "British Grand Prix", "Great Britain", "silverstone", 52, 90),
  race(2026, 10, "Belgian Grand Prix", "Belgium", "spa", 44, 106),
  race(2026, 11, "Hungarian Grand Prix", "Hungary", "hungaroring", 70, 79),
  race(2026, 12, "Dutch Grand Prix", "Netherlands", "zandvoort", 72, 73),
  race(2026, 13, "Italian Grand Prix", "Italy", "monza", 53, 84),
  race(2026, 14, "Spanish Grand Prix", "Spain", "madrid", 57, 80),
  race(2026, 15, "Azerbaijan Grand Prix", "Azerbaijan", "baku", 51, 106),
  race(2026, 16, "Bahrain Grand Prix in Malaysia", "Malaysia", "sepang", 56, 96),
  race(2026, 17, "Singapore Grand Prix", "Singapore", "marina-bay", 62, 96),
  race(2026, 18, "United States Grand Prix", "United States", "austin", 56, 98),
  race(2026, 19, "Mexico City Grand Prix", "Mexico", "mexico-city", 71, 80),
  race(2026, 20, "São Paulo Grand Prix", "Brazil", "interlagos", 69, 72),
];

export const CALENDAR = [
  ...CALENDAR_2024,
  ...CALENDAR_2025,
  ...CALENDAR_2026,
];
