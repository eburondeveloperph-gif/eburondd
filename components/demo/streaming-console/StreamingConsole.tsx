/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useRef, useState } from 'react';
// FIX: Import LiveServerContent to correctly type the content handler.
import { LiveConnectConfig, Modality, LiveServerContent } from '@google/genai';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { saveTranslation } from '@/lib/db';
import {
  useSettings,
  useLogStore,
  useTools,
  ConversationTurn,
} from '@/lib/state';

const formatTimestamp = (date: Date) => {
  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

import { isDutch, removeDuplicateSentences } from '@/lib/utils';
import { AVAILABLE_TOOLS } from '@/lib/tools';

const renderContent = (text: string, isAgent: boolean) => {
  const processedText = isAgent ? removeDuplicateSentences(text) : text;
  // Split by **bold** text
  const boldParts = processedText.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((boldPart, boldIndex) => {
    if (boldPart.startsWith('**') && boldPart.endsWith('**')) {
      return <strong key={boldIndex}>{boldPart.slice(2, -2)}</strong>;
    }
    return boldPart;
  });
};

export default function StreamingConsole() {
  const { client, setConfig } = useLiveAPIContext();
  const { systemPrompt, voice } = useSettings();
  const turns = useLogStore(state => state.turns);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Set the configuration for the Live API
  useEffect(() => {
    // Using `any` for config to accommodate `speechConfig`, which is not in the
    // current TS definitions but is used in the working reference example.
    const config: any = {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice,
          },
        },
      },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      systemInstruction: systemPrompt,
    };

    const activeTools = AVAILABLE_TOOLS.filter(t => t.isEnabled);
    if (activeTools.length > 0) {
      config.tools = [
        {
          functionDeclarations: activeTools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    setConfig(config);
  }, [setConfig, systemPrompt, voice]);

  useEffect(() => {
    const { addTurn, updateLastTurn } = useLogStore.getState();

    const handleInputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'user' && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
        });
      } else {
        addTurn({ role: 'user', text, isFinal });
      }
    };

    const handleOutputTranscription = (text: string, isFinal: boolean) => {
      const turns = useLogStore.getState().turns;
      const last = turns[turns.length - 1];
      if (last && last.role === 'agent' && !last.isFinal) {
        updateLastTurn({
          text: last.text + text,
          isFinal,
        });
      } else {
        addTurn({ role: 'agent', text, isFinal });
      }
    };

    // FIX: The 'content' event provides a single LiveServerContent object.
    // The function signature is updated to accept one argument, and groundingMetadata is extracted from it.
    const handleContent = (serverContent: LiveServerContent) => {
      const text =
        serverContent.modelTurn?.parts
          ?.map((p: any) => p.text)
          .filter(Boolean)
          .join(' ') ?? '';
      const groundingChunks = serverContent.groundingMetadata?.groundingChunks;

      if (!text && !groundingChunks) return;

      const turns = useLogStore.getState().turns;
      const last = turns.at(-1);

      if (last?.role === 'agent' && !last.isFinal) {
        const updatedTurn: Partial<ConversationTurn> = {
          text: last.text + text,
        };
        if (groundingChunks) {
          updatedTurn.groundingChunks = [
            ...(last.groundingChunks || []),
            ...groundingChunks,
          ];
        }
        updateLastTurn(updatedTurn);
      } else {
        addTurn({ role: 'agent', text, isFinal: false, groundingChunks });
      }
    };

    const handleTurnComplete = async () => {
      const turns = useLogStore.getState().turns;
      const last = turns.at(-1);
      if (last && !last.isFinal) {
        updateLastTurn({ isFinal: true });
        
        // Save to Supabase
        if (last.role === 'agent') {
            const userTurns = turns.filter(t => t.role === 'user');
            const userTurn = userTurns[userTurns.length - 1];
            if (userTurn) {
                await saveTranslation(userTurn.text, last.text);
            }
        }
      }
    };

    client.on('inputTranscription', handleInputTranscription);
    client.on('outputTranscription', handleOutputTranscription);
    client.on('content', handleContent);
    client.on('turncomplete', handleTurnComplete);

    return () => {
      client.off('inputTranscription', handleInputTranscription);
      client.off('outputTranscription', handleOutputTranscription);
      client.off('content', handleContent);
      client.off('turncomplete', handleTurnComplete);
    };
  }, [client]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <div className="transcription-container">
      <div className="transcription-view" ref={scrollRef}>
        {turns.length === 0 && (
          <div className="empty-state">
            <p>Ready to translate. Press the play button below to start.</p>
          </div>
        )}
        {turns.filter(t => t.isFinal).map((t, i) => (
          <div
            key={t.timestamp.getTime() + i}
            className={`transcription-entry ${t.role}`}
          >
              <div className="transcription-header">
                <div className="transcription-source">
                  {t.role === 'user'
                    ? (isDutch(t.text) ? 'Staff' : 'Guest')
                    : t.role === 'agent'
                      ? 'Translation'
                      : 'System'}
                </div>
              </div>
              <div className="transcription-text-content text-3xl">
                {renderContent(t.text, t.role === 'agent')}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}