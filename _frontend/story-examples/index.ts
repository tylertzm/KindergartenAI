import hansGuckInDieLuft from './hans-guck-in-die-luft.txt?raw';
import zappelPhilip from './zappel-philip.txt?raw';
import daumenLutscher from './daumen-lutscher.txt?raw';

export interface StoryExample {
  title: string;
  content: string;
}

export const storyExamples: StoryExample[] = [
  {
    title: 'Hans Guck-in-die-Luft',
    content: hansGuckInDieLuft
  },
  {
    title: 'Zappel-Philipp',
    content: zappelPhilip
  },
  {
    title: 'Daumen-Lutscher',
    content: daumenLutscher
  }
];

