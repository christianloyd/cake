document.addEventListener("DOMContentLoaded", function () {
  const cake = document.querySelector(".cake");
  const candleCountDisplay = document.getElementById("candleCount");
  const micStatus = document.getElementById("micStatus");
  let candles = [];
  let audioContext;
  let analyser;
  let microphone;
  let microphoneConnected = false;
  
  // Try to load your music file - update the filename to match yours
  let audio = new Audio('bday.mp3'); // Change this to your actual filename
  
  // Add error handling for audio file
  audio.addEventListener('error', function(e) {
    console.log('Audio file not found or cannot be loaded:', e);
    // Fallback: create a simple beep sound using Web Audio API
    audio = null;
  });

  // Fallback sound function using Web Audio API
  function playBirthdaySound() {
    if (audio && !audio.error) {
      // Play your music file
      audio.currentTime = 0; // Reset to beginning
      audio.play().catch(function(error) {
        console.log('Could not play audio file:', error);
        playBeepSound();
      });
    } else {
      // Fallback to beep sound
      playBeepSound();
    }
  }

  function playBeepSound() {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Web Audio API not supported');
        return;
      }
    }
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C note
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
  }

  function updateCandleCount() {
    const activeCandles = candles.filter(
      (candle) => !candle.classList.contains("out")
    ).length;
    candleCountDisplay.textContent = activeCandles;
  }

  function addCandle(left, top) {
    const candle = document.createElement("div");
    candle.className = "candle";
    candle.style.left = left + "px";
    candle.style.top = top + "px";

    const flame = document.createElement("div");
    flame.className = "flame";
    candle.appendChild(flame);

    cake.appendChild(candle);
    candles.push(candle);
    updateCandleCount();
  }

  cake.addEventListener("click", function (event) {
    const rect = cake.getBoundingClientRect();
    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;
    addCandle(left, top);
  });

  function isBlowing() {
    if (!analyser || !microphoneConnected) return false;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    let average = sum / bufferLength;

    return average > 50; // Adjust this threshold if needed
  }

  function blowOutCandles() {
    let blownOut = 0;

    // Only check for blowing if there are candles and at least one is not blown out
    if (candles.length > 0 && candles.some((candle) => !candle.classList.contains("out"))) {
      if (isBlowing()) {
        candles.forEach((candle) => {
          if (!candle.classList.contains("out") && Math.random() > 0.5) {
            candle.classList.add("out");
            blownOut++;
          }
        });
      }

      if (blownOut > 0) {
        updateCandleCount();
      }

      // If all candles are blown out, trigger confetti after a small delay
      if (candles.every((candle) => candle.classList.contains("out"))) {
        setTimeout(function() {
          triggerConfetti();
          endlessConfetti();
          playBirthdaySound();
          // Show greeting message with typing animation
          showTypingGreeting("🎉 Wishing you the happiest birthday! 🎂");
        }, 200);
      }
    }
  }

  // Initialize microphone with better error handling
  async function initMicrophone() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });

      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      microphoneConnected = true;
      micStatus.textContent = "🎤 Microphone: Connected ✓";
      micStatus.style.backgroundColor = "rgba(0,128,0,0.7)";
      
      // Update button text to show both options are available
      const existingButton = document.querySelector(".blow-button");
      if (existingButton) {
        existingButton.textContent = "💨 Press to Blow (or use mic)";
      }
      
      setInterval(blowOutCandles, 200);
      
    } catch (err) {
      console.log("Microphone access denied or unavailable: " + err);
      micStatus.textContent = "🎤 Microphone: Access denied";
      micStatus.style.backgroundColor = "rgba(128,0,0,0.7)";
      
      // Update button text for mic-denied users
      const existingButton = document.querySelector(".blow-button");
      if (existingButton) {
        existingButton.textContent = "💨 Press to Blow!";
      }
    }
  }

  // Fallback: Click to blow out candles
  function addClickToBlow() {
    const blowButton = document.createElement("button");
    blowButton.textContent = "💨 Press to Blow!";
    blowButton.className = "blow-button";

    blowButton.addEventListener("click", function() {
      if (candles.length > 0 && candles.some(candle => !candle.classList.contains("out"))) {
        candles.forEach((candle) => {
          candle.classList.add("out");
        });
        updateCandleCount();

        // Animate balloons with GSAP
        if (window.gsap) {
          gsap.to(".baloons img", {
            duration: 2.5,
            opacity: 1,
            y: -1000,         // Move up
            stagger: 0.2,
            ease: "power2.in"
          });
        }

        document.querySelectorAll('.baloons img').forEach((img, i) => {
          img.classList.remove('fly-up');
          // Add a staggered delay for each balloon
          setTimeout(() => {
            img.classList.add('looping');
          }, i * 300); // 0.3s stagger
        });

        // Only trigger celebration if all candles are out
        if (candles.every(candle => candle.classList.contains("out"))) {
          setTimeout(function() {
            triggerConfetti();
            endlessConfetti();
            playBirthdaySound();
            // Show greeting message with typing animation
            showTypingGreeting("🎉 Happy Birthday Redj, virtual cake lang sa ron HAHAHA! 🎂");
          }, 200);
        }
      }
    });

    document.body.appendChild(blowButton);
  }

  // Always show the click-to-blow button as an option
  addClickToBlow();

  // Initialize microphone on user interaction
  document.addEventListener("click", function initOnClick() {
    initMicrophone();
    document.removeEventListener("click", initOnClick);
  }, { once: true });

  function triggerConfetti() {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  function endlessConfetti() {
    const confettiInterval = setInterval(function() {
      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0 }
      });
    }, 1000);
    
    // Stop endless confetti after 10 seconds
    setTimeout(() => clearInterval(confettiInterval), 10000);
  }

   

  document.getElementById('show-message-btn').onclick = function() {
    document.getElementById('long-message-modal').style.display = 'block';
  };
  document.getElementById('close-message-btn').onclick = function() {
    document.getElementById('long-message-modal').style.display = 'none';
  };
  // Optional: Hide modal when clicking outside the content
  document.getElementById('long-message-modal').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
  };
  });