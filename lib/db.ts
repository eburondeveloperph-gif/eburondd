import { supabase } from './supabase';
import { ConversationTurn } from './state';

export async function saveTranslation(transcription: string, translation: string) {
  const { data, error } = await supabase
    .from('translations')
    .insert([
      { transcription, translation },
    ]);

  if (error) {
    console.error('Error saving translation:', error);
    return null;
  }
  return data;
}

export async function saveConversationTurn(turn: ConversationTurn) {
  const { error } = await supabase
    .from('conversation_history')
    .insert([
      {
        timestamp: turn.timestamp.toISOString(),
        role: turn.role,
        text: turn.text,
        is_final: turn.isFinal,
        tool_use_request: turn.toolUseRequest,
        tool_use_response: turn.toolUseResponse,
        grounding_chunks: turn.groundingChunks,
      },
    ]);

  if (error) {
    console.error('Error saving conversation turn:', error);
  }
}
