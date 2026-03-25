import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC } from 'react';
import { getApiBaseUrl } from '../config';
import { processAudioBlob } from '../utils/audio';

declare global {
  interface Window {
    KORA_CONFIG?: {
      apiBaseUrl?: string;
      recaptchaSiteKey?: string;
      features?: {
        voice?: {
          enabled?: boolean;
        };
      };
    };
  }
}

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23" strokeWidth="2"></line><line x1="8" y1="23" x2="16" y2="23" strokeWidth="2"></line></svg>;

type TranscriptEntry = {
  source: 'user' | 'agent';
  text: string;
};

export const VoiceAgentWidget: FC<{ businessId: string }> = ({ businessId }) => {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionState, setSessionState] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  const ws = useRef<WebSocket | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<ArrayBuffer[]>([]);
  const isPlaying = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.KORA_CONFIG?.features?.voice?.enabled) {
      setIsFeatureEnabled(true);
    }
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const playNextInQueue = useCallback(() => {
    if (audioQueue.current.length === 0) {
      isPlaying.current = false;
      return;
    }
    isPlaying.current = true;
    const audioData = audioQueue.current.shift();
    if (audioData && audioContext.current) {
      audioContext.current.decodeAudioData(audioData)
        .then(buffer => {
          const source = audioContext.current!.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.current!.destination);
          source.onended = playNextInQueue;
          source.start();
        })
        .catch(e => {
          console.error('Error decoding audio data:', e);
          playNextInQueue();
        });
    }
  }, []);

  const handleServerMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data);
    
    if (data.response?.output_audio_transcript?.delta) {
      const text = data.response.output_audio_transcript.delta;
      setTranscript(prev => {
        const last = prev[prev.length - 1];
        if (last?.source === 'agent') {
          return [...prev.slice(0, -1), { ...last, text: last.text + text }];
        }
        return [...prev, { source: 'agent', text }];
      });
    }

    if (data.response?.output_audio?.delta) {
      const audioBase64 = data.response.output_audio.delta;
      const binaryString = atob(audioBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      audioQueue.current.push(bytes.buffer);
      if (!isPlaying.current) {
        playNextInQueue();
      }
    }
  }, [playNextInQueue]);

  const startMicrophone = useCallback(async () => {
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!audioContext.current || audioContext.current.state === 'closed') {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      mediaRecorder.current = new MediaRecorder(stream.current);
      mediaRecorder.current.ondataavailable = async (event) => {
        if (event.data.size > 0 && ws.current?.readyState === WebSocket.OPEN) {
          const pcmBase64 = await processAudioBlob(event.data, audioContext.current!);
          ws.current.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: pcmBase64,
          }));
        }
      };
      mediaRecorder.current.start(250);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setSessionState('error');
      setTranscript(prev => [...prev, { source: 'agent', text: 'Could not access microphone. Please check your permissions.' }]);
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    if (stream.current) {
      stream.current.getTracks().forEach(track => track.stop());
      stream.current = null;
    }
  }, []);

  const startSession = useCallback(async () => {
    if (sessionState !== 'idle' && sessionState !== 'error') return;
    
    setSessionState('connecting');
    setTranscript([]);
    audioQueue.current = [];
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      });

      if (!response.ok) throw new Error('Failed to start voice session.');

      const { websocket_url, client_secret } = await response.json();
      
      ws.current = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      
      ws.current.onopen = () => {
        setSessionState('active');
        startMicrophone();
      };
      
      ws.current.onmessage = handleServerMessage;
      
      ws.current.onclose = () => {
        setSessionState('idle');
        stopMicrophone();
      };
      
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setSessionState('error');
        stopMicrophone();
      };

    } catch (error) {
      console.error(error);
      setSessionState('error');
      setTranscript([{ source: 'agent', text: 'Sorry, I am unavailable right now.' }]);
    }
  }, [businessId, sessionState, handleServerMessage, startMicrophone, stopMicrophone]);

  const stopSession = useCallback(() => {
    stopMicrophone();
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
    if (audioContext.current && audioContext.current.state !== 'closed') {
      audioContext.current.close();
    }
    setSessionState('idle');
  }, [stopMicrophone]);

  const openModal = () => {
    setIsModalOpen(true);
    startSession();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    stopSession();
  };

  if (!isFeatureEnabled) {
    return null;
  }

  return (
    <>
      <button className="voice-agent-fab" onClick={openModal} aria-label="Start Voice Assistant">
        <MicIcon />
      </button>

      {isModalOpen && (
        <div className="voice-agent-modal-overlay" onClick={closeModal}>
          <div className="voice-agent-modal" onClick={(e) => e.stopPropagation()}>
            <div className="voice-agent-header">
              <h3>Voice Assistant</h3>
              <button className="voice-agent-close-btn" onClick={closeModal}>&times;</button>
            </div>
            <div className="voice-agent-transcript">
              {transcript.map((entry, i) => (
                <p key={i} className={`transcript-entry ${entry.source}`}>
                  <strong>{entry.source === 'agent' ? 'Assistant' : 'You'}:</strong> {entry.text}
                </p>
              ))}
              <div ref={transcriptEndRef} />
            </div>
            <div className="voice-agent-footer">
              <div className={`status-indicator ${sessionState}`}>
                {sessionState === 'connecting' && 'Connecting...'}
                {sessionState === 'active' && 'Listening...'}
                {sessionState === 'error' && 'Connection error. Please try again.'}
                {sessionState === 'idle' && 'Session ended.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};