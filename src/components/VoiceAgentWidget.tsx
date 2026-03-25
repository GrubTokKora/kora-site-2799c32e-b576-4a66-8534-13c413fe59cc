import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { Mic, Bot, X, Loader } from 'lucide-react';
import { createVoiceSession } from '../voice';
import {
  base64FromInt16LE,
  int16FromBase64PCM16,
  float32FromPCM16,
} from '../utils/audio';

type Sender = 'user' | 'agent';
type Message = { sender: Sender; text: string };
type WidgetStatus = 'idle' | 'loading' | 'connected' | 'error';

function isVoiceFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const v = (window as any).KORA_CONFIG?.features?.voice as unknown;
  return Boolean(
    v &&
      typeof v === 'object' &&
      (v as { enabled?: boolean }).enabled === true,
  );
}

declare global {
  interface Window {
    KORA_CONFIG?: {
      apiBaseUrl?: string;
      recaptchaSiteKey?: string;
      features?: {
        voice?: {
          enabled?: boolean;
          provider?: string;
        };
      };
    };
  }
}

export const VoiceAgentWidget: FC<{ businessId: string }> = ({ businessId }) => {
  const visible = useMemo(() => isVoiceFeatureEnabled(), []);

  const [status, setStatus] = useState<WidgetStatus>('idle');
  const [errorText, setErrorText] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const assistantDraftRef = useRef<string>('');
  const isSessionReadyRef = useRef<boolean>(false);
  const pendingAudioRef = useRef<string[]>([]);
  const lastUserItemIdRef = useRef<string>('');

  const locale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), []);

  function stop() {
    wsRef.current?.close();
    wsRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    isSessionReadyRef.current = false;
    pendingAudioRef.current = [];
    assistantDraftRef.current = '';
    lastUserItemIdRef.current = '';
    nextStartTimeRef.current = 0;

    setStatus('idle');
  }

  function appendUserTranscript(text: string, itemId?: string) {
    const t = (text || '').trim();
    if (!t) return;
    if (itemId && itemId === lastUserItemIdRef.current) return;
    if (itemId) lastUserItemIdRef.current = itemId;
    setMessages((prev) => [...prev, { sender: 'user', text: t }]);
  }

  async function start() {
    if (status === 'loading') return;
    setStatus('loading');
    setErrorText('');
    setMessages([]);
    assistantDraftRef.current = '';

    try {
      const bootstrap = await createVoiceSession(businessId, locale, {
        url: window.location.href,
        title: document.title,
      });

      const websocketUrl = bootstrap.websocket_url;
      const clientSecret = bootstrap.client_secret;

      if (!websocketUrl || !clientSecret) {
        throw new Error('Voice session missing websocket_url/client_secret');
      }

      const ws = new WebSocket(websocketUrl, [`xai-client-secret.${clientSecret}`]);
      wsRef.current = ws;
      isSessionReadyRef.current = false;
      pendingAudioRef.current = [];

      ws.onopen = async () => {
        const sessionObj = (bootstrap.session || {}) as Record<string, unknown>;
        ws.send(JSON.stringify({ type: 'session.update', session: sessionObj }));
      };

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);
          handleRealtimeEvent(event);
        } catch {
          // Ignore
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setErrorText('Voice connection failed.');
      };

      ws.onclose = () => {
        stop();
        setStatus((s) => (s === 'error' ? s : 'idle'));
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error');
      setErrorText(msg || 'Could not start voice session.');
    }
  }

  async function startMicAndStream(ws: WebSocket) {
    const sampleRate = 24000;
    const ctx = new AudioContext({ sampleRate });
    audioCtxRef.current = ctx;
    nextStartTimeRef.current = ctx.currentTime;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micStreamRef.current = stream;

    const source = ctx.createMediaStreamSource(stream);
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    processor.connect(gain);
    gain.connect(ctx.destination);

    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm16 = new Int16Array(input.length);
      for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const b64 = base64FromInt16LE(pcm16);
      if (!isSessionReadyRef.current) {
        pendingAudioRef.current.push(b64);
        if (pendingAudioRef.current.length > 80) pendingAudioRef.current.shift();
        return;
      }
      ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
    };

    source.connect(processor);
  }

  function playPCM16Audio(base64Pcm16: string) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const pcm16 = int16FromBase64PCM16(base64Pcm16);
    const float32 = float32FromPCM16(pcm16);

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startAt);

    nextStartTimeRef.current = startAt + buffer.duration;
  }

  function handleRealtimeEvent(event: any) {
    if (!event?.type) return;

    if (event.type === 'session.updated') {
      isSessionReadyRef.current = true;
      setStatus('connected');
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        for (const b64 of pendingAudioRef.current) {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
        }
        pendingAudioRef.current = [];
        void startMicAndStream(ws);
      }
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      appendUserTranscript(event.transcript, event.item_id);
      return;
    }
    if (event.type === 'conversation.item.added') {
      const item = event.item;
      if (item?.role === 'user' && Array.isArray(item?.content)) {
        const audioPart = item.content.find((c: any) => c?.type === 'input_audio' && typeof c?.transcript === 'string');
        if (audioPart?.transcript) appendUserTranscript(audioPart.transcript, item?.id);
      }
      return;
    }

    if (event.type === 'response.output_audio.delta') {
      if (event.delta) playPCM16Audio(event.delta);
      return;
    }

    if (event.type === 'response.output_audio_transcript.delta') {
      if (typeof event.delta === 'string') assistantDraftRef.current += event.delta;
      return;
    }

    if (event.type === 'response.output_audio_transcript.done') {
      const text = assistantDraftRef.current.trim();
      if (text) setMessages((prev) => [...prev, { sender: 'agent', text }]);
      assistantDraftRef.current = '';
      return;
    }

    if (event.type === 'input_audio_buffer.speech_stopped') {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] } }));
      }
      return;
    }

    if (event.type === 'error') {
      setStatus('error');
      setErrorText(event?.error?.message || 'Voice agent error.');
      return;
    }
  }

  useEffect(() => {
    return () => stop();
  }, []);

  if (!visible) return null;

  return (
    <>
      <button
        onClick={() => {
          setIsOpen((v) => {
            const next = !v;
            if (!next) stop();
            return next;
          });
          if (!isOpen && wsRef.current == null && status !== 'connected') start();
        }}
        className="voice-widget-fab"
        aria-label="Open Voice Assistant"
      >
        <Bot style={{ width: '2rem', height: '2rem' }} />
      </button>

      {isOpen && (
        <div
          className="voice-widget-overlay animate-fade-in"
          onClick={() => {
            setIsOpen(false);
            stop();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="voice-widget-modal animate-slide-in-up"
          >
            <header className="voice-widget-header">
              <div className="voice-widget-header-title">
                <Bot className="icon" style={{ width: '1.5rem', height: '1.5rem' }} />
                <h2>Voice Assistant</h2>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  stop();
                }}
                className="voice-widget-close-btn"
                aria-label="Close voice assistant"
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </header>

            <div className="voice-widget-body">
              {messages.map((m, idx) => (
                <div key={idx} className={`voice-widget-message-row ${m.sender}`}>
                  {m.sender === 'agent' && (
                    <div className="voice-widget-agent-avatar">
                      <Bot className="icon" style={{ width: '1.25rem', height: '1.25rem' }} />
                    </div>
                  )}
                  <div className={`voice-widget-message-bubble ${m.sender}`}>
                    <p>{m.text}</p>
                  </div>
                </div>
              ))}

              {status === 'loading' && <div style={{ textAlign: 'center', color: '#a8a29e', fontSize: '0.875rem' }}>Connecting...</div>}
              {status === 'error' && errorText && (
                <div className="voice-widget-error-msg">{errorText}</div>
              )}
            </div>

            <footer className="voice-widget-footer">
              <button
                onClick={() => start()}
                disabled={status === 'loading'}
                className="voice-widget-mic-btn"
              >
                {status === 'loading' ? <Loader className="animate-spin" style={{ width: '2rem', height: '2rem' }} /> : <Mic style={{ width: '2rem', height: '2rem' }} />}
              </button>
              <p className="voice-widget-footer-status">
                {status === 'connected' ? 'Listening...' : status === 'error' ? 'Connection failed' : 'Tap to start'}
              </p>
            </footer>
          </div>
        </div>
      )}
    </>
  );
};

export default VoiceAgentWidget;