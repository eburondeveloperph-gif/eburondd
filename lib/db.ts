import { supabase } from './supabase';

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
