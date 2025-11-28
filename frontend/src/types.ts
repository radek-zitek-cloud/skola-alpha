export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string | null;
  picture: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface OAuthConfig {
  google_client_id: string;
}

export interface VocabularyFilters {
  categories: string[];
  levels: string[];
  combinations: { category: string; level: string }[];
}

export interface WordStatistic {
  czech: string;
  english: string;
  typos: number;
  attempts: number;
}

export interface VocabularyStatistics {
  total_attempts: number;
  total_typos: number;
  words_learned: number;
  total_words: number;
  top_typo_words: WordStatistic[];
  top_ratio_words: WordStatistic[];
}

export type Theme = "light" | "dark";
