/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { create } from 'zustand';

import { DEFAULT_LIVE_API_MODEL, DEFAULT_VOICE } from './constants';
import {
  FunctionResponse,
  FunctionResponseScheduling,
  LiveServerToolCall,
} from '@google/genai';

import { getTranslationPrompt } from './prompts';

/**
 * Settings
 */
export const useSettings = create<{
  systemPrompt: string;
  model: string;
  voice: string;
  staffLanguage: string;
  guestLanguage: string;
  setSystemPrompt: (prompt: string) => void;
  setModel: (model: string) => void;
  setVoice: (voice: string) => void;
  setStaffLanguage: (lang: string) => void;
  setGuestLanguage: (lang: string) => void;
  updateSystemPrompt: () => void;
}>(set => ({
  staffLanguage: 'Dutch (Flemish)',
  guestLanguage: 'Auto-detect',
  systemPrompt: getTranslationPrompt('Dutch (Flemish)', 'Auto-detect'),
  model: DEFAULT_LIVE_API_MODEL,
  voice: 'Zephyr',
  setSystemPrompt: prompt => set({ systemPrompt: prompt }),
  setModel: model => set({ model }),
  setVoice: voice => set({ voice }),
  setStaffLanguage: lang => set(state => {
    const newState = { ...state, staffLanguage: lang };
    return { ...newState, systemPrompt: getTranslationPrompt(lang, state.guestLanguage) };
  }),
  setGuestLanguage: lang => set(state => {
    const newState = { ...state, guestLanguage: lang };
    return { ...newState, systemPrompt: getTranslationPrompt(state.staffLanguage, lang) };
  }),
  updateSystemPrompt: () => set(state => ({
    systemPrompt: getTranslationPrompt(state.staffLanguage, state.guestLanguage)
  })),
}));

/**
 * UI
 */
export const useUI = create<{
  isSidebarOpen: boolean;
  isAudioPlaying: boolean;
  toggleSidebar: () => void;
  setIsAudioPlaying: (isPlaying: boolean) => void;
}>(set => ({
  isSidebarOpen: true,
  isAudioPlaying: false,
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsAudioPlaying: isPlaying => set({ isAudioPlaying: isPlaying }),
}));

/**
 * Tools (Minimal for compatibility)
 */
export interface FunctionCall {
  name: string;
  description?: string;
  parameters?: any;
  isEnabled: boolean;
  scheduling?: FunctionResponseScheduling;
}

export const useTools = create<{
  tools: FunctionCall[];
  toggleTool: (toolName: string) => void;
}>(set => ({
  tools: [],
  toggleTool: (toolName: string) =>
    set(state => ({
      tools: state.tools.map(tool =>
        tool.name === toolName ? { ...tool, isEnabled: !tool.isEnabled } : tool,
      ),
    })),
}));

/**
 * Logs
 */
export interface LiveClientToolResponse {
  functionResponses?: FunctionResponse[];
}
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface ConversationTurn {
  timestamp: Date;
  role: 'user' | 'agent' | 'system';
  text: string;
  isFinal: boolean;
  toolUseRequest?: LiveServerToolCall;
  toolUseResponse?: LiveClientToolResponse;
  groundingChunks?: GroundingChunk[];
}

export const useLogStore = create<{
  turns: ConversationTurn[];
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) => void;
  updateLastTurn: (update: Partial<ConversationTurn>) => void;
  clearTurns: () => void;
}>((set, get) => ({
  turns: [],
  addTurn: (turn: Omit<ConversationTurn, 'timestamp'>) =>
    set(state => ({
      turns: [...state.turns, { ...turn, timestamp: new Date() }],
    })),
  updateLastTurn: (update: Partial<Omit<ConversationTurn, 'timestamp'>>) => {
    set(state => {
      if (state.turns.length === 0) {
        return state;
      }
      const newTurns = [...state.turns];
      const lastTurn = { ...newTurns[newTurns.length - 1], ...update };
      newTurns[newTurns.length - 1] = lastTurn;
      return { turns: newTurns };
    });
  },
  clearTurns: () => set({ turns: [] }),
}));
