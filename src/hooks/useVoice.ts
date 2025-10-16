import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceSettings } from '../types';

export const useVoice = (settings: VoiceSettings) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
      
      // Load voices when they become available
      const loadVoices = () => {
        voicesRef.current = synthRef.current?.getVoices() || [];
        console.log('Available voices:', voicesRef.current.map(v => v.name));
      };
      
      loadVoices();
      if (synthRef.current) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
  }, []);

  // Audio level monitoring
  const monitorAudioLevel = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
      }

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      
      if (isListening) {
        updateAudioLevel();
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [isListening]);

  useEffect(() => {
    if (isListening) {
      monitorAudioLevel();
    } else {
      setAudioLevel(0);
    }
  }, [isListening, monitorAudioLevel]);

  const getVoice = useCallback(() => {
    if (!synthRef.current || voicesRef.current.length === 0) return null;
    
    // Look for specific voices based on settings
    let preferredVoices: string[] = [];
    
    if (settings.type === 'female') {
      preferredVoices = [
        'Google UK English Female',
        'Microsoft Zira Desktop',
        'Microsoft Hazel Desktop',
        'Samantha',
        'Victoria',
        'Fiona',
        'Karen',
        'Moira',
        'Tessa',
        'Veena',
        'Kate',
        'Female'
      ];
    } else {
      preferredVoices = [
        'Google UK English Male',
        'Microsoft David Desktop',
        'Microsoft Mark Desktop',
        'Daniel',
        'Alex',
        'Thomas',
        'Oliver',
        'Arthur',
        'Malcolm',
        'Gordon',
        'Male'
      ];
    }
    
    // Find the first available preferred voice
    for (const preferredName of preferredVoices) {
      const voice = voicesRef.current.find(v => 
        v.name.includes(preferredName) || 
        (settings.type === 'female' && v.name.toLowerCase().includes('female')) ||
        (settings.type === 'male' && v.name.toLowerCase().includes('male'))
      );
      if (voice) {
        console.log('Selected voice:', voice.name);
        return voice;
      }
    }
    
    // Fallback: find any voice of the correct gender
    const fallbackVoice = voicesRef.current.find(v => {
      const name = v.name.toLowerCase();
      if (settings.type === 'female') {
        return name.includes('female') || name.includes('woman') || 
               ['zira', 'hazel', 'samantha', 'victoria', 'karen', 'susan'].some(n => name.includes(n));
      } else {
        return name.includes('male') || name.includes('man') || 
               ['david', 'mark', 'daniel', 'alex', 'thomas', 'james'].some(n => name.includes(n));
      }
    });
    
    return fallbackVoice || voicesRef.current[0] || null;
  }, [settings.type]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
        setTranscript('');
      };
      
      recognitionRef.current.onend = () => {
        console.log('🎤 Speech recognition ended');
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptText;
          } else {
            interimTranscript += transcriptText;
          }
        }
        
        const fullTranscript = finalTranscript || interimTranscript;
        if (fullTranscript.trim()) {
          setTranscript(fullTranscript);
          console.log('🎤 Transcript:', fullTranscript);
        }
        
        // If we got a final result, stop listening
        if (finalTranscript) {
          setIsListening(false);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !text.trim()) return;

    // Stop any current speech
    if (currentUtteranceRef.current) {
      synthRef.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtteranceRef.current = utterance;
    
    // Apply voice settings
    const selectedVoice = getVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🔊 Speaking with voice:', selectedVoice.name);
    }
    
    utterance.rate = settings.speed;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    
    utterance.onstart = () => {
      console.log('🔊 Speech started:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log('🔊 Speech ended');
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };
    
    utterance.onerror = (event) => {
      console.error('🔊 Speech synthesis error:', event.error);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    synthRef.current.speak(utterance);
  }, [settings, getVoice]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  // Return transcript for voice input
  const getTranscript = useCallback(() => {
    const currentTranscript = transcript;
    setTranscript(''); // Clear after reading
    return currentTranscript;
  }, [transcript]);

  return {
    isListening,
    isSpeaking,
    audioLevel,
    transcript,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    getTranscript
  };
};
