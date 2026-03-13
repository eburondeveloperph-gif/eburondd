/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { Speaker, Volume2 } from 'lucide-react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useSettings, useLogStore, useUI } from '@/lib/state';
import { Visualizer } from './Visualizer';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { client, connected, connect, disconnect } = useLiveAPIContext();
  const { isAudioPlaying, setIsAudioPlaying } = useUI();

  useEffect(() => {
    const onVolume = (v: number) => {
      setVolume(v);
    };
    audioRecorder.on('volume', onVolume);
    return () => {
      audioRecorder.off('volume', onVolume);
    };
  }, [audioRecorder]);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    if (!connected) {
      setMuted(false);
      setIsAudioPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [connected, setIsAudioPlaying]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder && !isAudioPlaying) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder, isAudioPlaying]);

  const handleConnectToggle = async () => {
    if (connected) {
      disconnect();
    } else {
      if (isAudioPlaying) return; // Prevent multiple starts

      setIsAudioPlaying(true);
      const audio = new Audio('/speak.mp3');
      audioRef.current = audio;
      
      try {
        await audio.play();
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve(); // Resolve on error too, to not block
        });
      } catch (e) {
        console.error("Audio play failed", e);
      } finally {
        setIsAudioPlaying(false);
      }

      connect();
    }
  };

  const handleMicClick = () => {
    if (connected) {
      setMuted(!muted);
    } else {
      handleConnectToggle();
    }
  };

  const micButtonTitle = connected
    ? muted
      ? 'Unmute microphone'
      : 'Mute microphone'
    : 'Connect and start translation';

  const connectButtonTitle = connected ? 'Stop Translation' : 'Start Translation';

  return (
    <section className="control-tray">
      <nav className={cn('actions-nav')}>
        <button
          className={cn('action-button mic-button')}
          onClick={handleMicClick}
          title={micButtonTitle}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
          <Visualizer isSpeaking={!muted && volume > 0.05} />
        </button>
        <button
          className={cn('action-button')}
          title="AI Status"
        >
          <Volume2 size={20} />
          <Visualizer isSpeaking={isAudioPlaying} />
        </button>
        <button
          className={cn('action-button')}
          onClick={useLogStore.getState().clearTurns}
          aria-label="Reset Chat"
          title="Reset session logs"
        >
          <span className="icon">refresh</span>
        </button>
        {children}
      </nav>

      <div className={cn('connection-container', { connected })}>
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className={cn('action-button connect-toggle', { connected })}
            onClick={handleConnectToggle}
            title={connectButtonTitle}
          >
            <span className="material-symbols-outlined filled">
              {connected ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
        <span className="text-indicator">{connected ? 'Live' : 'Offline'}</span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
