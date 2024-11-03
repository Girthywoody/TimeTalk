import React, { useRef, useState, useEffect } from 'react';
import { X, Mic, Pause, StopCircle } from 'lucide-react';

const AudioRecorder = ({ onMediaCapture }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioData, setAudioData] = useState([]);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(255, 192, 203, 0.1)'; // Light pink background
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#ff69b4'; // Hot pink for the waveform
      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (canvas.height / 2);

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      source.connect(analyser);

      const options = { mimeType: 'audio/webm' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        onMediaCapture(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      drawWaveform();

      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      streamRef.current.getTracks().forEach(track => track.stop());
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
      setIsRecording(false);
      setDuration(0);
    }
  };

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden bg-pink-50/90 backdrop-blur-sm p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="text-2xl font-medium text-pink-900">
          {formatTime(duration)}
        </div>
        <div className="text-sm text-pink-600 font-medium">
          High quality
        </div>
        
        <canvas
          ref={canvasRef}
          className="w-full h-24 rounded-lg"
          width={800}
          height={100}
        />

        <div className="flex items-center gap-4">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="p-4 bg-pink-600 rounded-full text-white hover:bg-pink-700 transition-colors"
            >
              <StopCircle size={24} />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="p-4 bg-pink-600 rounded-full text-white hover:bg-pink-700 transition-colors"
            >
              <Mic size={24} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;