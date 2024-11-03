import React, { useRef, useState, useEffect } from 'react';
import { Mic, StopCircle } from 'lucide-react';

const AudioRecorder = ({ onMediaCapture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const dataArrayRef = useRef(null);

  useEffect(() => {
    // Initialize audio context and analyzer
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    
    // Create data array for visualization
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    return () => {
      stopRecording();
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current || !isRecording) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyserRef.current.frequencyBinCount;

    // Get the current waveform data
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    // Style the visualization
    canvasCtx.fillStyle = '#1e1b4b';
    canvasCtx.fillRect(0, 0, width, height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = '#818cf8';
    canvasCtx.beginPath();

    // Draw the waveform
    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArrayRef.current[i] / 128.0;
      const y = (v * height) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(width, height / 2);
    canvasCtx.stroke();

    // Request next frame
    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Set up audio processing
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Create and configure media recorder
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      const chunks = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onMediaCapture(URL.createObjectURL(blob));
        chunks.length = 0;
      };

      // Start recording
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start visualization
      requestAnimationFrame(drawWaveform);

    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
      setDuration(0);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-full bg-indigo-950 p-6">
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="text-2xl font-medium text-indigo-200">
          {formatTime(duration)}
        </div>
        <div className="text-sm text-indigo-300 font-medium">
          {isRecording ? 'Recording...' : 'Ready to record'}
        </div>
        
        <canvas
          ref={canvasRef}
          className="w-full h-24 rounded-lg bg-indigo-900/50"
          width={800}
          height={100}
        />

        <div className="flex items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-4 rounded-full text-white transition-colors ${
              isRecording 
                ? 'bg-pink-600 hover:bg-pink-700' 
                : 'bg-indigo-500 hover:bg-indigo-600'
            }`}
          >
            {isRecording ? <StopCircle size={24} /> : <Mic size={24} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;