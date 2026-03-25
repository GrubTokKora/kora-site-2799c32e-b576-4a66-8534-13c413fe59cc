import { useState, useEffect, useRef, useCallback } from 'react';
import type { FC, CSSProperties } from 'react';
import { getApiBaseUrl } from '../config';
import { float32ArrayToPcm16Base64, base64ToArrayBuffer } from '../utils/audio';

const BUSINESS_ID = "2799c32e-b576-4a66-8534-13c413fe59cc";

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const BotIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M12 18v-2" /><path d="M12 12v-2" /></svg>;

type AgentStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';

export const VoiceAgentWidget: FC = () => {
  const [showWidget, setShowWidget] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);

  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const playbackContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).KORA_CONFIG?.features?.voice?.enabled === true) {
      setShowWidget(true);
    }
  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    isPlayingRef.current = true;
    setStatus('speaking');

    if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
      playbackContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const context = playbackContextRef.current;
    
    const audioData = audioQueueRef.current.shift();
    if (!audioData) {
        isPlayingRef.current = false;
        return;
    }

    try {
      const audioBuffer = await context.decodeAudioData(audioData.slice(0));
      const source = context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(context.destination);
      source.start();
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextInQueue();
        } else {
          setStatus('listening');
        }
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      isPlayingRef.current = false;
      playNextInQueue();
    }
  }, []);

  const startMic = useCallback(async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;
      
      const source = context.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      const processor = context.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const base64 = float32ArrayToPcm16Base64(inputData);
          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: base64 }));
        }
      };

      source.connect(processor);
      processor.connect(context.destination);
      setStatus('listening');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setErrorMessage('Could not access microphone. Please check permissions.');
      setStatus('error');
    }
  }, []);

  const stopMic = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    audioContextRef.current?.close().catch(e => console.error("Error closing mic audio context", e));
    mediaStreamRef.current = null;
    audioContextRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;
  }, []);

  const connect = useCallback(async () => {
    if (websocketRef.current) return;
    setStatus('connecting');
    setTranscript('');
    setErrorMessage('');

    try {
      const apiBaseUrl = getApiBaseUrl();
      const res = await fetch(`${apiBaseUrl}/api/v1/public/voice/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: BUSINESS_ID }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to start voice session.' }));
        throw new Error(errorData.message || 'Failed to start voice session.');
      }

      const { websocket_url, client_secret } = await res.json();
      const ws = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      websocketRef.current = ws;

      ws.onopen = () => {
        startMic(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.response?.output_audio_transcript?.delta) {
          setTranscript(prev => prev + data.response.output_audio_transcript.delta);
        }
        if (data.response?.output_audio_transcript?.done) {
          setTranscript(prev => prev + '\n\n');
        }
        if (data.response?.output_audio?.delta) {
          const audioChunk = base64ToArrayBuffer(data.response.output_audio.delta);
          audioQueueRef.current.push(audioChunk);
          playNextInQueue();
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setErrorMessage('A connection error occurred.');
        setStatus('error');
      };

      ws.onclose = () => {
        stopMic();
        websocketRef.current = null;
        if (status !== 'error') {
          setStatus('idle');
        }
      };
    } catch (err) {
      console.error('Connection failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect.');
      setStatus('error');
    }
  }, [startMic, stopMic, playNextInQueue, status]);

  const handleOpen = () => {
    setIsOpen(true);
    connect();
  };

  const handleClose = () => {
    setIsOpen(false);
    websocketRef.current?.close();
    stopMic();
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    playbackContextRef.current?.close().then(() => playbackContextRef.current = null).catch(e => console.error("Error closing playback context", e));
    setStatus('idle');
  };

  if (!showWidget) {
    return null;
  }

  return (
    <>
      <button onClick={handleOpen} style={fabStyle} aria-label="Start Voice Assistant">
        <MicIcon />
      </button>

      {isOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <button onClick={handleClose} style={closeButtonStyle} aria-label="Close">
              <CloseIcon />
            </button>
            <div style={headerStyle}>
              <div style={botIconStyle}><BotIcon /></div>
              <h3 style={{ margin: 0, color: '#333' }}>Voice Assistant</h3>
            </div>
            <div style={transcriptContainerStyle}>
              <p style={{ whiteSpace: 'pre-wrap', margin: 0, color: '#444', fontSize: '1rem', lineHeight: 1.6 }}>{transcript}</p>
              {status === 'error' && <p style={{ color: '#d9534f', marginTop: '1rem' }}>{errorMessage}</p>}
            </div>
            <div style={statusIndicatorStyle}>
              <div style={{...statusDotStyle, backgroundColor: status === 'listening' ? '#4caf50' : (status === 'speaking' ? '#2196f3' : '#9e9e9e')}} />
              <span style={{ color: '#666', textTransform: 'capitalize' }}>{status}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Styles
const fabStyle: CSSProperties = {
  position: 'fixed',
  bottom: '2rem',
  right: '2rem',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-light))',
  color: 'white',
  border: 'none',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1001,
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
};

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  backdropFilter: 'blur(8px)',
};

const modalContentStyle: CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '2rem',
  width: '90%',
  maxWidth: '500px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  position: 'relative',
};

const closeButtonStyle: CSSProperties = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#999',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  borderBottom: '1px solid #eee',
  paddingBottom: '1rem',
};

const botIconStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'var(--accent-color)',
};

const transcriptContainerStyle: CSSProperties = {
  minHeight: '200px',
  maxHeight: '40vh',
  overflowY: 'auto',
  paddingRight: '1rem',
};

const statusIndicatorStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  paddingTop: '1rem',
  borderTop: '1px solid #eee',
};

const statusDotStyle: CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  transition: 'background-color 0.3s ease',
};