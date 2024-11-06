import React, { useRef, useState, useEffect } from 'react';
import { Mic, StopCircle, Trash2, Save } from 'lucide-react';

const AudioRecorder = ({ onMediaCapture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const chunksRef = useRef([]);

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
      // Reset state
      setAudioURL(null);
      chunksRef.current = [];
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;

      // Set up audio context and analyzer
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Start visualization
      drawWaveform();

    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
    }
  };

  const discardRecording = () => {
    setAudioURL(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const saveRecording = () => {
    if (audioURL) {
      onMediaCapture(audioURL);
    }
  };

  return (
    <div className="audio-recorder">
      <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-b from-indigo-950 to-indigo-900 rounded-xl shadow-xl">
        {/* Timer Display */}
        <div className="audio-recorder__timer text-indigo-100">
          {formatTime(duration)}
        </div>

        {/* Waveform Canvas */}
        <canvas
          ref={canvasRef}
          className="audio-recorder__canvas"
          width={800}
          height={100}
        />

        {/* Controls */}
        <div className="flex items-center gap-4 mt-2">
          {!audioURL ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`audio-recorder__btn ${
                isRecording ? 'audio-recorder__btn--recording' : 'audio-recorder__btn--record'
              }`}
            >
              {isRecording ? <StopCircle size={24} className="text-white" /> : <Mic size={24} className="text-white" />}
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={discardRecording}
                className="audio-recorder__btn audio-recorder__btn--discard"
              >
                <Trash2 size={20} className="text-white" />
              </button>
              
              <audio ref={audioRef} src={audioURL} className="hidden" />
              
              <button
                onClick={saveRecording}
                className="audio-recorder__btn audio-recorder__btn--save"
              >
                <Save size={20} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div className="audio-recorder__status text-indigo-300">
          {isRecording ? 'Recording in progress...' : audioURL ? 'Ready to save' : 'Ready to record'}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;