import { useEffect, useMemo, useRef, useState } from 'react';
import type { FC } from 'react';
import { createVoiceSession, closeVoiceSession } from '../voice';
import type { VoiceSessionBootstrap } from '../voice';
import { base64FromInt16LE, int16FromBase64PCM16, float32FromPCM16 } from '../utils/audio';

type Sender = 'user' | 'agent';
type Message = { sender: Sender; text: string };
type WidgetStatus = 'idle' | 'loading' | 'connected' | 'error';
type AgentPhase = 'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'error';

function KoraIcon({
  kind,
  className = 'w-5 h-5',
}: {
  kind: 'mic' | 'spinner' | 'listening' | 'speaking' | 'thinking' | 'error' | 'close';
  className?: string;
}) {
  const style: React.CSSProperties = {
    width: className.includes('w-8') ? '2rem' : className.includes('w-4') ? '1rem' : '1.25rem',
    height: className.includes('h-8') ? '2rem' : className.includes('h-4') ? '1rem' : '1.25rem',
  };

  if (kind === 'close') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
      </svg>
    );
  }
  if (kind === 'spinner') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <path d="M21 12a9 9 0 1 1-9-9" />
      </svg>
    );
  }
  if (kind === 'listening') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <path d="M12 3v6" />
        <path d="M8 6v12" />
        <path d="M16 8v8" />
        <path d="M4 10v4" />
        <path d="M20 10v4" />
      </svg>
    );
  }
  if (kind === 'speaking') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <polygon points="11 5 6 9 3 9 3 15 6 15 11 19 11 5" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18 6a8 8 0 0 1 0 12" />
      </svg>
    );
  }
  if (kind === 'thinking') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <path d="M12 2a8 8 0 0 0-5 14.2V20l3-1 3 1v-3.8A8 8 0 1 0 12 2z" />
        <path d="M9.5 10a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4" />
        <circle cx="12" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (kind === 'error') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <circle cx="12" cy="16.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  );
}

function isVoiceFeatureEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const v = (window as any).KORA_CONFIG?.features?.voice as unknown;
  return Boolean(v && typeof v === 'object' && (v as { enabled?: boolean }).enabled === true);
}

/** xAI realtime events use `delta` per docs; never concatenate if missing (avoids "undefined" in UI). */
function pickTranscriptDeltaChunk(ev: { delta?: unknown; transcript?: unknown }): string {
  const d = ev.delta;
  if (typeof d === 'string') return d;
  const t = ev.transcript;
  if (typeof t === 'string') return t;
  return '';
}

/** xAI examples use `delta`; some wire traces use `audio` — prefer whichever is non-empty. */
function pickOutputAudioBase64(ev: { delta?: unknown; audio?: unknown }): string {
  const a = ev.audio;
  if (typeof a === 'string' && a.length > 0) return a;
  const d = ev.delta;
  if (typeof d === 'string' && d.length > 0) return d;
  return '';
}

const PUBLIC_VOICE_VISITOR_UNAVAILABLE = "Voice assistant isn't available right now. Please try again later.";

function toFriendlyVoiceError(raw: unknown): string {
  const text = typeof raw === 'string' ? raw : '';
  const lower = text.toLowerCase();
  if (lower.includes('notallowederror') || (lower.includes('permission') && lower.includes('denied')) || lower.includes('microphone')) {
    return 'Microphone permission is required to use the voice assistant.';
  }
  if (lower.includes('failed to create voice session') || lower.includes('monthly voice') || lower.includes('quota') || lower.includes('\"detail\"') || /\b429\b/.test(lower) || /\b40[13]\b/.test(lower) || /\b50[0-9]\b/.test(lower)) {
    return PUBLIC_VOICE_VISITOR_UNAVAILABLE;
  }
  if (text.includes('{') && (lower.includes('detail') || lower.includes('\"error\"'))) {
    return PUBLIC_VOICE_VISITOR_UNAVAILABLE;
  }
  if (lower.includes('statuscode.unavailable') || lower.includes('grpc_status:14') || lower.includes('service unavailable') || lower.includes('aiorpcerror')) {
    return 'Voice service is temporarily unavailable. Please try again in a moment.';
  }
  if (lower.includes('network') || lower.includes('connection')) {
    return 'We could not connect right now. Please check your internet and try again.';
  }
  if (!text.trim()) return PUBLIC_VOICE_VISITOR_UNAVAILABLE;
  return PUBLIC_VOICE_VISITOR_UNAVAILABLE;
}

function resolvePrimaryColor(): string {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'var(--accent-color, #c0392b)';
  try {
    const root = window.getComputedStyle(document.documentElement);
    const candidates = [
      root.getPropertyValue('--kora-voice-primary'),
      root.getPropertyValue('--primary-color'),
      root.getPropertyValue('--color-primary'),
      root.getPropertyValue('--theme-primary'),
      root.getPropertyValue('--accent-color'),
    ];
    for (const c of candidates) {
      const v = c.trim();
      if (v) return v;
    }
  } catch {
    // ignore and use fallback
  }
  return 'var(--accent-color, #c0392b)';
}

const VoiceAgentWidget: FC<{ businessId: string }> = ({ businessId }) => {
  const INACTIVITY_TIMEOUT_MS = 15_000;
  const visible = useMemo(() => isVoiceFeatureEnabled(), []);

  const [status, setStatus] = useState<WidgetStatus>('idle');
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const primaryColor = useMemo(() => resolvePrimaryColor(), []);
  const [errorText, setErrorText] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [assistantStreaming, setAssistantStreaming] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const bootstrapRef = useRef<VoiceSessionBootstrap | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const assistantDraftRef = useRef<string>('');
  const isSessionReadyRef = useRef<boolean>(false);
  const pendingAudioRef = useRef<string[]>([]);
  const lastUserItemIdRef = useRef<string>('');
  const lastTranscriptTurnKeyRef = useRef<string>('');
  const greetedRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const sessionInputSampleRateRef = useRef<number>(24000);
  const sessionOutputSampleRateRef = useRef<number>(24000);

  const locale = useMemo(() => 'auto', []);

  function stop() {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (bootstrapRef.current?.kora_session_id) {
      closeVoiceSession(bootstrapRef.current.kora_session_id, businessId);
    }
    try { wsRef.current?.close(); } catch {}
    wsRef.current = null;
    bootstrapRef.current = null;
    try { processorRef.current?.disconnect(); } catch {}
    processorRef.current = null;
    try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
    micStreamRef.current = null;
    try { audioCtxRef.current?.close(); } catch {}
    audioCtxRef.current = null;

    isSessionReadyRef.current = false;
    pendingAudioRef.current = [];
    assistantDraftRef.current = '';
    lastUserItemIdRef.current = '';
    lastTranscriptTurnKeyRef.current = '';
    greetedRef.current = false;
    nextStartTimeRef.current = 0;
    setAssistantStreaming('');

    setStatus('idle');
    setPhase('idle');
  }

  function resetInactivityTimer() {
    if (inactivityTimerRef.current !== null) {
      window.clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      stop();
    }, INACTIVITY_TIMEOUT_MS);
  }

  function flushAgentTranscriptToMessages() {
    const text = assistantDraftRef.current.trim();
    assistantDraftRef.current = '';
    setAssistantStreaming('');
    if (!text) return;
    setMessages((prev) => [...prev, { sender: 'agent', text }]);
  }

  function appendUserTranscript(text: string, itemId?: string) {
    const t = (typeof text === 'string' ? text : '').trim();
    if (!t) return;
    if (itemId && itemId === lastUserItemIdRef.current) return;
    flushAgentTranscriptToMessages();
    if (itemId) lastUserItemIdRef.current = itemId;
    setMessages((prev) => [...prev, { sender: 'user', text: t }]);
  }

  async function start() {
    if (status === 'loading') return;
    setStatus('loading');
    setPhase('connecting');
    setErrorText('');
    setMessages([]);
    assistantDraftRef.current = '';
    setAssistantStreaming('');
    lastTranscriptTurnKeyRef.current = '';

    try {
      const preGrantedMic = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = preGrantedMic;

      const bootstrap = await createVoiceSession({
        business_id: businessId,
        locale,
        page_context: { url: window.location.href, title: document.title },
      });
      bootstrapRef.current = bootstrap;

      const { websocket_url, client_secret } = bootstrap;
      if (!websocket_url || !client_secret) {
        throw new Error('Voice session missing websocket_url/client_secret');
      }

      const sess = bootstrap.session as Record<string, unknown> | undefined;
      const sessionAudio = sess?.audio as Record<string, unknown> | undefined;
      const inputFmt = sessionAudio?.input as Record<string, unknown> | undefined;
      const outputFmt = sessionAudio?.output as Record<string, unknown> | undefined;
      const inForm = inputFmt?.format as Record<string, unknown> | undefined;
      const outForm = outputFmt?.format as Record<string, unknown> | undefined;
      const inRate = inForm?.rate;
      const outRate = outForm?.rate;
      sessionInputSampleRateRef.current = typeof inRate === 'number' && Number.isFinite(inRate) && inRate > 0 ? inRate : 24000;
      sessionOutputSampleRateRef.current = typeof outRate === 'number' && Number.isFinite(outRate) && outRate > 0 ? outRate : sessionInputSampleRateRef.current;

      const ws = new WebSocket(websocket_url, [`xai-client-secret.${client_secret}`]);
      wsRef.current = ws;
      isSessionReadyRef.current = false;
      pendingAudioRef.current = [];

      ws.onopen = async () => {
        const sessionObj = (bootstrap.session || {}) as Record<string, unknown>;
        ws.send(JSON.stringify({ type: 'session.update', session: sessionObj }));
      };

      ws.onmessage = (ev) => {
        resetInactivityTimer();
        try {
          const event = JSON.parse(ev.data);
          handleRealtimeEvent(event);
        } catch { /* Ignore unknown event shapes. */ }
      };

      ws.onerror = () => {
        setStatus('error');
        setPhase('error');
        setErrorText(PUBLIC_VOICE_VISITOR_UNAVAILABLE);
      };

      ws.onclose = () => {
        try { processorRef.current?.disconnect(); } catch {}
        try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
        try { audioCtxRef.current?.close(); } catch {}
        wsRef.current = null;
        isSessionReadyRef.current = false;
        pendingAudioRef.current = [];
        assistantDraftRef.current = '';
        lastTranscriptTurnKeyRef.current = '';
        setAssistantStreaming('');
        setStatus((s) => (s === 'error' ? s : 'idle'));
        setPhase((p) => (p === 'error' ? p : 'idle'));
      };
    } catch (e) {
      try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
      micStreamRef.current = null;
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error');
      setPhase('error');
      setErrorText(toFriendlyVoiceError(msg || 'Could not start voice session.'));
    }
  }

  async function startMicAndStream(ws: WebSocket) {
    const sampleRate = sessionInputSampleRateRef.current;
    const ctx = new AudioContext({ sampleRate });
    audioCtxRef.current = ctx;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* ignore */ }
    }
    nextStartTimeRef.current = ctx.currentTime;

    const stream = micStreamRef.current ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));
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
      resetInactivityTimer();
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
    if (ctx.state === 'suspended') {
      try { void ctx.resume(); } catch { /* ignore */ }
    }

    const pcm16 = int16FromBase64PCM16(base64Pcm16);
    if (pcm16.length === 0) return;
    const float32 = float32FromPCM16(pcm16);
    const decodeRate = sessionOutputSampleRateRef.current;

    const buffer = ctx.createBuffer(1, float32.length, decodeRate);
    buffer.copyToChannel(new Float32Array(float32), 0);

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
      setPhase('listening');
      resetInactivityTimer();
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        for (const b64 of pendingAudioRef.current) {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.append', audio: b64 }));
        }
        pendingAudioRef.current = [];
      }
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN && !greetedRef.current) {
          greetedRef.current = true;
          const greeting = String(bootstrapRef.current?.initial_greeting || '').trim();
          if (greeting) {
            ws.send(JSON.stringify({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: `Please greet the visitor by saying exactly: "${greeting}"` }] } }));
          }
          ws.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] } }));
        }
      } catch { /* ignore */ }
      void startMicAndStream(wsRef.current as WebSocket);
      return;
    }

    if (event.type === 'response.created') {
      flushAgentTranscriptToMessages();
      return;
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      setPhase('thinking');
      appendUserTranscript(event.transcript, event.item_id);
      return;
    }
    if (event.type === 'conversation.item.added') {
      const item = event.item;
      if (item?.role === 'user' && Array.isArray(item?.content)) {
        const audioPart = item.content.find((c: any) => c?.type === 'input_audio' && typeof c?.transcript === 'string');
        if (audioPart?.transcript) appendUserTranscript(audioPart.transcript, item?.id);
      }
      if (item?.role === 'user') setPhase('thinking');
      return;
    }

    if (event.type === 'response.output_audio.delta') {
      const b64 = pickOutputAudioBase64(event);
      if (b64) {
        setPhase('speaking');
        playPCM16Audio(b64);
      }
      return;
    }

    if (event.type === 'response.output_audio_transcript.delta') {
      const piece = pickTranscriptDeltaChunk(event);
      if (!piece) return;
      const turnKey = (typeof event.item_id === 'string' && event.item_id) || (typeof event.response_id === 'string' && event.response_id) || '';
      if (turnKey && lastTranscriptTurnKeyRef.current && turnKey !== lastTranscriptTurnKeyRef.current) {
        flushAgentTranscriptToMessages();
      }
      if (turnKey) lastTranscriptTurnKeyRef.current = turnKey;
      assistantDraftRef.current += piece;
      setAssistantStreaming(assistantDraftRef.current);
      return;
    }

    if (event.type === 'response.output_audio_transcript.done' || event.type === 'response.output_audio.done' || event.type === 'response.done') {
      flushAgentTranscriptToMessages();
      setPhase('listening');
      return;
    }

    if (event.type === 'input_audio_buffer.speech_started') {
      flushAgentTranscriptToMessages();
      return;
    }

    if (event.type === 'input_audio_buffer.speech_stopped') {
      try {
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'response.create', response: { modalities: ['text', 'audio'] } }));
        }
      } catch {}
      return;
    }

    if (event.type === 'error') {
      setStatus('error');
      setPhase('error');
      const msg = (typeof event.error?.message === 'string' && event.error.message) || (typeof event.message === 'string' && event.message) || 'Voice agent error.';
      setErrorText(toFriendlyVoiceError(msg));
      return;
    }
  }

  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  if (!visible) return null;

  const statusLabel = phase === 'connecting' ? 'Connecting' : phase === 'error' ? 'Error' : phase === 'thinking' ? 'Thinking' : phase === 'speaking' ? 'Speaking' : 'Listening';
  const statusIcon: 'spinner' | 'error' | 'listening' | 'thinking' | 'speaking' = phase === 'connecting' ? 'spinner' : phase === 'error' ? 'error' : phase === 'thinking' ? 'thinking' : phase === 'speaking' ? 'speaking' : 'listening';

  return (
    <>
      <button onClick={() => { setIsOpen((v) => { const next = !v; if (!next) stop(); return next; }); if (!isOpen && wsRef.current == null && status !== 'connected') start(); }} className="voice-widget-fab" style={{ backgroundColor: primaryColor }} aria-label="Open Voice Assistant">
        <KoraIcon kind="mic" className="w-8 h-8" />
      </button>

      {isOpen && (
        <div className="voice-widget-overlay animate-fade-in" onClick={() => { setIsOpen(false); stop(); }}>
          <div onClick={(e) => e.stopPropagation()} className="voice-widget-modal animate-slide-in-up">
            <header className="voice-widget-header">
              <div>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'white', margin: 0 }}>Voice Assistant</h2>
                <p style={{ fontSize: '0.75rem', color: '#a8a29e', margin: 0 }}>Powered by Kora</p>
              </div>
              <button onClick={() => { setIsOpen(false); stop(); }} className="voice-widget-close-btn" aria-label="Close voice assistant">
                <KoraIcon kind="close" className="w-5 h-5" />
              </button>
            </header>

            <div className="voice-widget-body">
              {phase === 'connecting' && messages.length === 0 && !assistantStreaming.trim() ? (
                <div style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '9999px', background: 'linear-gradient(to bottom right, #f87171, #dc2626, #7f1d1d)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>Connecting...</p>
                  <p style={{ fontSize: '0.75rem', color: '#a8a29e' }}>Preparing your voice assistant</p>
                </div>
              ) : null}
              {messages.map((m, idx) => (
                <div key={idx} className={`voice-widget-message-row ${m.sender}`}>
                  {m.sender === 'agent' ? <div className="voice-widget-agent-avatar"><KoraIcon kind="mic" className="w-5 h-5" /></div> : null}
                  <div className={`voice-widget-message-bubble ${m.sender}`}><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{m.text}</p></div>
                </div>
              ))}

              {assistantStreaming.trim() ? (
                <div className="voice-widget-message-row agent">
                  <div className="voice-widget-agent-avatar"><KoraIcon kind="mic" className="w-5 h-5" /></div>
                  <div className="voice-widget-message-bubble agent" style={{ border: '1px solid rgba(113, 113, 113, 0.6)' }}><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{assistantStreaming}</p></div>
                </div>
              ) : null}

              {status === 'error' && errorText ? <div className="voice-widget-error-msg">{errorText}</div> : null}
            </div>

            <footer className="voice-widget-footer" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
              {phase !== 'idle' ? (
                <div className="voice-widget-status-pill" style={{
                  color: phase === 'error' ? '#fca5a5' : phase === 'connecting' ? '#fcd34d' : phase === 'thinking' ? '#fde047' : phase === 'speaking' ? '#7dd3fc' : '#6ee7b7',
                  borderColor: phase === 'error' ? 'rgba(239, 68, 68, 0.4)' : phase === 'connecting' ? 'rgba(251, 191, 36, 0.4)' : phase === 'thinking' ? 'rgba(252, 211, 77, 0.4)' : phase === 'speaking' ? 'rgba(56, 189, 248, 0.4)' : 'rgba(52, 211, 153, 0.3)',
                  backgroundColor: phase === 'error' ? 'rgba(127, 29, 29, 0.3)' : phase === 'connecting' ? 'rgba(113, 63, 18, 0.2)' : phase === 'thinking' ? 'rgba(113, 83, 18, 0.2)' : phase === 'speaking' ? 'rgba(12, 74, 110, 0.2)' : 'rgba(6, 78, 59, 0.2)',
                }}>
                  <span className={phase === 'connecting' ? 'animate-spin' : ''}><KoraIcon kind={statusIcon} className="w-4 h-4" /></span>
                  <span>{statusLabel}</span>
                </div>
              ) : <div />}
              <button onClick={() => start()} disabled={status === 'loading'} className="voice-widget-mic-btn" style={{ width: '3rem', height: '3rem', backgroundColor: 'var(--accent-color)' }}>
                {status === 'loading' ? <span className="animate-spin"><KoraIcon kind="spinner" className="w-5 h-5" /></span> : <KoraIcon kind="mic" className="w-5 h-5" />}
              </button>
            </footer>
          </div>
        </div>
      )}
      <style>{`
        .voice-widget-status-pill { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 9999px; border: 1px solid; font-size: 0.75rem; font-weight: 600; }
        @keyframes pulse { 50% { opacity: 0.5; } }
      `}</style>
    </>
  );
};

export default VoiceAgentWidget;
