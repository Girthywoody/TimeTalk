import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, AlertCircle, Repeat, Timer, Settings } from 'lucide-react';

export default function MediaCapture({ mediaType, onMediaCapture }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [showCountdownSelect, setShowCountdownSelect] = useState(false);
  const [selectedTimer, setSelectedTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [selectedDevices, setSelectedDevices] = useState({ video: '', audio: '' });
  const [showDeviceSelect, setShowDeviceSelect] = useState(false);
  const [countdownTime, setCountdownTime] = useState(selectedTimer);

  const deviceSelectorRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const countdownRef = useRef(null);


  // Get available cameras and devices on mount
  useEffect(() => {
    getDevices();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking settings button or inside device selector
      if (event.target.closest('[data-settings-button]') || 
          event.target.closest('[data-device-selector]')) {
        return;
      }
      setShowDeviceSelect(false);
    }
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Start preview when component mounts or camera/device changes
  useEffect(() => {
    if (mediaType === 'video' || mediaType === 'image') {
      startPreview();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [mediaType, currentCameraIndex, selectedDevices]);

  const cancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setIsCountingDown(false);
    setCountdownTime(selectedTimer); // Reset to selected time
  };

  const getDevices = async () => {
    try {
      // Request permissions first to ensure we can access device labels
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          stream.getTracks().forEach(track => track.stop());
        });

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput');

      setDevices({ video: videoDevices, audio: audioDevices });
      setCameras(videoDevices);
      
      // Set default devices
      if (!selectedDevices.video && videoDevices.length) {
        setSelectedDevices(prev => ({ ...prev, video: videoDevices[0].deviceId }));
      }
      if (!selectedDevices.audio && audioDevices.length) {
        setSelectedDevices(prev => ({ ...prev, audio: audioDevices[0].deviceId }));
      }
    } catch (err) {
      console.error('Error getting devices:', err);
      setError(getErrorMessage(err));
    }
  };

  const startPreview = async () => {
    try {
      setError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
  
      const constraints = {
        video: {
          deviceId: selectedDevices.video ? { exact: selectedDevices.video } : undefined,
          facingMode: currentCameraIndex === 0 ? 'user' : 'environment'
        },
        audio: mediaType === 'video' ? {
          deviceId: selectedDevices.audio ? { exact: selectedDevices.audio } : undefined
        } : false
      };
  
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Only mirror if using front camera
        videoRef.current.style.transform = currentCameraIndex === 0 ? 'scaleX(-1)' : 'none';
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Preview error:', err);
      setError(getErrorMessage(err));
    }
  };
  
  const captureImage = async () => {
    try {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (currentCameraIndex === 0) {
          ctx.scale(-1, 1);
          ctx.translate(-canvas.width, 0);
        }
        
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        onMediaCapture(imageData);
      }
    } catch (err) {
      console.error('Image capture error:', err);
      setError(getErrorMessage(err));
    }
  };


  const flipCamera = async () => {
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    setSelectedDevices(prev => ({ ...prev, video: cameras[nextIndex].deviceId }));
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdownTime(selectedTimer);
    let timeLeft = selectedTimer;
    
    countdownRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdownTime(timeLeft);
      
      if (timeLeft === 0) {
        clearInterval(countdownRef.current);
        setIsCountingDown(false);
        captureImage();
        setCountdownTime(selectedTimer); // Reset to selected time
      }
    }, 1000);
  };

  const startRecording = () => {
    try {
      if (!streamRef.current) return;
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      const chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        onMediaCapture(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Recording error:', err);
      setError(getErrorMessage(err));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(timerRef.current);
  };


  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const DeviceSelector = () => (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
        {mediaType !== 'audio' && devices.video.length > 0 && (
          <div>
              <div ref={deviceSelectorRef} className="absolute top-4 left-4 z-10">
              {/* Rest of the DeviceSelector content stays the same */}
              </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Camera
            </label>
            <select
              value={selectedDevices.video}
              onChange={(e) => {
                setSelectedDevices(prev => ({ ...prev, video: e.target.value }));
                if (!isRecording) startPreview();
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              {devices.video.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${devices.video.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {mediaType !== 'image' && devices.audio.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Microphone
            </label>
            <select
              value={selectedDevices.audio}
              onChange={(e) => {
                setSelectedDevices(prev => ({ ...prev, audio: e.target.value }));
                if (!isRecording) startPreview();
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            >
              {devices.audio.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${devices.audio.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );

  const getErrorMessage = (error) => {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        message: 'Permission denied. Please allow access to your camera/microphone in your browser settings.',
        actionText: 'How to enable?',
        action: () => {
          alert(
            'To enable permissions:\n' +
            '1. Click the camera/lock icon in your browser\'s address bar\n' +
            '2. Select "Allow" for camera and microphone\n' +
            '3. Refresh the page'
          );
        }
      };
    }
    return {
      message: 'An error occurred while accessing your media devices.',
      actionText: 'Try again',
      action: () => startPreview()
    };
  };

  if (error) {
    return (
      <div className="relative mt-4 rounded-xl overflow-hidden bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
          <div className="flex-1">
            <p className="text-red-700 mb-2">{error.message}</p>
            <button
              onClick={error.action}
              className="text-sm text-red-600 hover:text-red-700 font-medium underline"
            >
              {error.actionText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-4 rounded-xl overflow-hidden bg-gray-900 aspect-square"> {/* Added aspect-square here */}
      {(mediaType === 'video' || mediaType === 'image') && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
        />
      )}

      {showDeviceSelect && <DeviceSelector />}
      
      {/* Recording Timer */}
      {isRecording && (
        <div className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          {formatTime(recordingTime)}
        </div>
      )}

      {/* Photo Countdown */}
      {isCountingDown && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <span className="text-white text-7xl font-bold animate-pulse">
            {countdownTime}
          </span>
        </div>
      )}

      {/* Camera Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          data-settings-button
          onClick={() => setShowDeviceSelect(!showDeviceSelect)}
          className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <Settings size={20} />
        </button>
        
        {cameras.length > 1 && (
          <button
            onClick={flipCamera}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            <Repeat size={20} />
          </button>
        )}
        
        {mediaType === 'image' && (
          <button
            onClick={() => {
              if (isCountingDown) {
                cancelCountdown();
              } else {
                setShowCountdownSelect(!showCountdownSelect);
              }
            }}
            className="p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          >
            {isCountingDown ? (
              <X size={20} />
            ) : isTimerActive ? (
              <span className="text-white font-medium">{selectedTimer}s</span>
            ) : (
              <Timer size={20} />
            )}
          </button>
        )}
      </div>

      {/* Timer Selection Dropdown */}
      {showCountdownSelect && (
        <div className="absolute top-16 right-4 bg-white rounded-lg shadow-lg p-2">
          {[0, 3, 5].map((time) => (
            <button
              key={time}
              onClick={() => {
                setSelectedTimer(time);
                setIsTimerActive(time > 0);
                setShowCountdownSelect(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              {time === 0 ? 'No timer' : `${time}s`}
            </button>
          ))}
        </div>
      )}

      {/* Capture/Record Button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
        {mediaType === 'image' ? (
          <button
            onClick={() => {
              if (isCountingDown) return;
              if (selectedTimer > 0) {
                startCountdown();
              } else {
                captureImage();
              }
            }}
            className="bg-white text-gray-900 rounded-full p-4 shadow-lg hover:bg-blue-50 transition-all duration-200"
            disabled={isCountingDown}
          >
            <Camera size={24} />
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`${
              isRecording ? 'bg-red-500' : 'bg-white'
            } text-gray-900 rounded-full p-4 shadow-lg hover:bg-opacity-90 transition-all duration-200`}
          >
            {isRecording ? <X size={24} /> : <div className="w-6 h-6 rounded-full bg-red-500" />}
          </button>
        )}
      </div>
    </div>
  );
}