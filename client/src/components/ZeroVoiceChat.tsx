/**
 * Zero Voice Chat Component
 * Talk to Zero with your voice - he'll respond with voice too
 */

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';

interface Message {
  role: 'user' | 'zero';
  text: string;
  timestamp: Date;
}

export function ZeroVoiceChat() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [isSendingText, setIsSendingText] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await sendToZero(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendToZero = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('mode', 'conversation');
      formData.append('source', 'web');

      const response = await fetch('/api/zero/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Add user message
      setMessages(prev => [...prev, {
        role: 'user',
        text: result.transcription,
        timestamp: new Date(),
      }]);

      // Add Zero's response
      setMessages(prev => [...prev, {
        role: 'zero',
        text: result.response,
        timestamp: new Date(),
      }]);

      // Play Zero's audio response
      if (result.audio) {
        playAudio(result.audio);
      } else if (result.audioError) {
        setError(result.audioError);
      }
    } catch (err) {
      console.error('Error communicating with Zero:', err);
      setError('Failed to communicate with Zero. Check that the backend is running.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    try {
      setIsPlaying(true);

      const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setError('Failed to play audio response');
        setIsPlaying(false);
      };

      audio.play();
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio response');
      setIsPlaying(false);
    }
  };

  const sendTextMessage = async () => {
    if (!textInput.trim()) {
      return;
    }

    setIsSendingText(true);
    setError(null);

    const userText = textInput.trim();
    const history = messages.map(msg => ({
      role: msg.role === 'zero' ? 'assistant' : 'user',
      content: msg.text,
    }));

    try {
      const response = await fetch('/api/zero/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: userText }],
          mode: 'conversation',
          source: 'web',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      setMessages(prev => ([
        ...prev,
        { role: 'user', text: userText, timestamp: new Date() },
        { role: 'zero', text: result.message || 'Zero responded with no text.', timestamp: new Date() },
      ]));
      setTextInput('');
    } catch (err) {
      console.error('Error sending text to Zero:', err);
      setError('Failed to send text message to Zero. Please try again.');
    } finally {
      setIsSendingText(false);
    }
  };

  const handleTextSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSendingText) {
      return;
    }
    void sendTextMessage();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-white">
            Talk to Zero
          </h2>
          <p className="text-gray-300">
            Press and hold to record, release to send. Zero will respond with voice.
          </p>

          {/* Microphone Button */}
          <div className="flex justify-center py-8">
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={isProcessing || isPlaying}
              className={`
                relative w-32 h-32 rounded-full transition-all duration-200
                ${isRecording
                  ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                  : 'bg-purple-600 hover:bg-purple-500'
                }
                ${(isProcessing || isPlaying) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-16 h-16 text-white animate-spin" />
              ) : isPlaying ? (
                <Volume2 className="w-16 h-16 text-white animate-pulse" />
              ) : isRecording ? (
                <Mic className="w-16 h-16 text-white animate-pulse" />
              ) : (
                <MicOff className="w-16 h-16 text-white" />
              )}

              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
              )}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-center">
            {isRecording && (
              <p className="text-red-400 font-semibold animate-pulse">
                🎤 Recording... Release to send to Zero
              </p>
            )}
            {isProcessing && (
              <p className="text-yellow-400 font-semibold">
                ⚡ Zero is thinking...
              </p>
            )}
            {isPlaying && (
              <p className="text-green-400 font-semibold">
                🔊 Zero is speaking...
              </p>
            )}
            {!isRecording && !isProcessing && !isPlaying && (
              <p className="text-gray-400">
                Press and hold the microphone to start
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-300">{error}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-gray-900/40 border-gray-700/60">
        <h3 className="text-2xl font-semibold text-white mb-4">Send text to Zero</h3>
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <textarea
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder="Type what you want to say to Zero..."
            className="w-full min-h-[120px] rounded-lg bg-black/40 text-white border border-purple-500/30 p-4 focus:outline-none focus:ring-2 focus:ring-purple-500/70"
            disabled={isSendingText}
          />
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-gray-400 text-sm">
              Use this if your microphone is blocked or Zero can't play audio.
            </p>
            <Button
              type="submit"
              disabled={isSendingText || !textInput.trim()}
              className="md:w-auto w-full"
            >
              {isSendingText ? 'Sending...' : 'Send to Zero'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Conversation History */}
      {messages.length > 0 && (
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">Conversation</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-900/30 border border-blue-500/30 ml-8'
                    : 'bg-purple-900/30 border border-purple-500/30 mr-8'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                        D
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                        Z
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        {msg.role === 'user' ? 'You' : 'Zero'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-gray-200">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
