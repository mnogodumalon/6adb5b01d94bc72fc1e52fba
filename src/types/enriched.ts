import type { Ausleihen } from './app';

export type EnrichedAusleihen = Ausleihen & {
  geraetName: string;
  mitarbeiterName: string;
};
