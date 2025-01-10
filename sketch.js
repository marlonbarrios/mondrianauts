// Introduction to Machine Learning for the Arts, Fall 2024
// https://github.com/ml5js/Intro-ML-Arts-IMA-F24

let proxyUrl = "https://crawling-hazel-vertebra.glitch.me/create_n_get/";
let textInput;
let img;
let canvasContainer;
let canvasWidth;
let canvasHeight;
let autoGenerate = false;
let lastGenerateTime = 0;
let generateInterval = 10000; // 10 seconds in milliseconds
let toggleButton;
let prevImg = null;
let transitionProgress = 0;
let isTransitioning = false;
let transitionDuration = 5000; // 5 seconds for transition
let subjects = [
  "two astronauts with chrome helmets", "three space pilots with mirrored visors", 
  "group of astronauts with reflective helmets", "pair of space explorers with metallic visors",
  "three space models with mirror helmets", "astronaut duo with polished chrome helmets", 
  "space crew with reflective visors", "multiple astronauts with metallic face shields"
];
let styles = [
  "Mondrian style", "Bauhaus geometric", "De Stijl", "modernist",
  "Mondrian grid", "Bauhaus space", "geometric Mondrian", "staged Bauhaus"
];
let elements = [
  "in full body sealed chrome suits", "wearing full mirrored space suits",
  "in full-length reflective suits", "wearing polished metallic suits",
  "in full body chrome uniforms", "wearing metallic sealed suits",
  "in full-length mirror suits", "wearing reflective space uniforms"
];
let colorSchemes = [
  "in primary colors", "with Mondrian palette",
  "in Bauhaus colors", "with geometric patterns",
  "in De Stijl colors", "with modernist tones",
  "in bold color blocks", "with primary shapes"
];
let environments = [
  "in Mondrian world studio", "in Mondrian world geometric stage",
  "in Mondrian world space", "in Mondrian world Bauhaus interior",
  "in Mondrian world geometric studio", "on Mondrian world platform",
  "in Mondrian world staged space", "in Mondrian world fashion studio"
];
let intervalSlider;
let intervalLabel;
let audioContext;
let oscillators = [];
let gainNode;
let filterNode;
let lfoNode;
let isMuted = false;
let muteButton;
let isLoading = false;
let loadingAngle = 0;
let isFirstGeneration = true;
let volumeSlider;
let masterVolume = 0.8; // Increased from 0.5 to 0.8
let isAnimatingLoader = false;  // New flag to control loader animation
let backgroundOpacity = 0;
let backgroundDelay = 2000; // 2 seconds delay
let backgroundFadeDuration = 1000; // 1 second fade
let staticLoadingAngle = 0;  // New variable for static loader rotation

async function initAudio() {
  if (!audioContext) {
    await setupAudio();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
}

function setupAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  
  // Resume audio context immediately
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  gainNode = audioContext.createGain();
  filterNode = audioContext.createBiquadFilter();
  lfoNode = audioContext.createOscillator();
  
  // Create multiple oscillators for richer sound
  for (let i = 0; i < 4; i++) {
    let osc = audioContext.createOscillator();
    let oscGain = audioContext.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(filterNode);
    oscillators.push({ oscillator: osc, gain: oscGain });
  }
  
  // More extreme filter settings
  filterNode.type = 'bandpass';
  filterNode.Q.value = 25; // Much higher resonance for crystalline sound
  filterNode.connect(gainNode);
  
  // Faster LFO with more complex modulation
  lfoNode.connect(filterNode.frequency);
  lfoNode.type = 'square'; // Changed to square for more digital sound
  lfoNode.frequency.value = 32; // Even faster modulation
  
  gainNode.connect(audioContext.destination);
  gainNode.gain.value = 0;  // Start with silence
  
  // Set initial gains to 0 for all oscillators
  oscillators.forEach(osc => {
    osc.gain.gain.value = 0;
  });
  
  // More digital waveforms combination
  oscillators[0].oscillator.type = 'square';
  oscillators[1].oscillator.type = 'sawtooth';
  oscillators[2].oscillator.type = 'square';
  oscillators[3].oscillator.type = 'triangle';
  
  // Start all oscillators
  oscillators.forEach(osc => osc.oscillator.start());
  lfoNode.start();
}

function setup() {
  // Remove padding and make canvas full window size
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
  
  canvasContainer = createDiv('');
  canvasContainer.style('position', 'fixed'); // Change to fixed
  canvasContainer.style('top', '0');
  canvasContainer.style('left', '0');
  canvasContainer.style('width', '100%');
  canvasContainer.style('height', '100%');
  canvasContainer.style('background-color', '#C0C0C0');  // Silver gray
  
  let cnv = createCanvas(canvasWidth, canvasHeight);
  cnv.parent(canvasContainer);
  
  // Move UI container to bottom of screen
  let uiContainer = createDiv('');
  uiContainer.style('position', 'fixed');
  uiContainer.style('bottom', '20px'); // Changed from top to bottom
  uiContainer.style('left', '0');
  uiContainer.style('width', '100%'); // Full width
  uiContainer.style('transform', 'none'); // Remove translateX
  uiContainer.style('text-align', 'center');
  uiContainer.style('z-index', '1000');
  uiContainer.style('background-color', 'rgba(0,0,0,0.7)'); // Darker background
  uiContainer.style('padding', '15px');
  uiContainer.style('box-sizing', 'border-box');
  
  // Create a flex container for better control alignment
  let controlsContainer = createDiv('');
  controlsContainer.parent(uiContainer);
  controlsContainer.style('display', 'flex');
  controlsContainer.style('justify-content', 'center');
  controlsContainer.style('align-items', 'center');
  controlsContainer.style('gap', '15px');
  controlsContainer.style('flex-wrap', 'wrap');

  // Add all controls to the flex container instead of uiContainer
  textInput = createInput("a mondrian bauhaus world with some astronouts a with their suits designed by mondrian");
  textInput.size(min(450, windowWidth - 100));
  textInput.parent(controlsContainer);
  
  toggleButton = createButton("start stream of protective suits and helmets");
  toggleButton.mousePressed(toggleAutoGenerate);
  toggleButton.parent(controlsContainer);
  toggleButton.style('background-color', '#4CAF50');
  toggleButton.style('color', 'white');
  toggleButton.style('padding', '8px 16px');
  toggleButton.style('border', 'none');
  toggleButton.style('border-radius', '4px');
  toggleButton.style('cursor', 'pointer');
  
  let durationLabel = createSpan('Transition: ');
  durationLabel.parent(controlsContainer);
  durationLabel.style('color', 'white');
  
  let durationSlider = createSlider(500, 10000, 5000, 100);
  durationSlider.parent(controlsContainer);
  durationSlider.input(() => {
    transitionDuration = durationSlider.value();
  });
  
  intervalLabel = createSpan('Interval: ');
  intervalLabel.parent(controlsContainer);
  intervalLabel.style('color', 'white');
  
  intervalSlider = createSlider(500, 20000, 10000, 100);
  intervalSlider.parent(controlsContainer);
  intervalSlider.input(() => {
    generateInterval = intervalSlider.value();
    intervalLabel.html(`Interval: ${(generateInterval/1000).toFixed(1)}s `);
  });
  
  muteButton = createButton("🔊");
  muteButton.parent(controlsContainer);
  muteButton.mousePressed(() => {
    initAudio(); // Ensure audio is initialized
    isMuted = !isMuted;
    if (gainNode) {
      gainNode.gain.setValueAtTime(isMuted ? 0 : masterVolume, audioContext.currentTime);
    }
    muteButton.html(isMuted ? "🔇" : "🔊");
  });

  // Initialize labels
  intervalLabel.html(`Interval: ${(generateInterval/1000).toFixed(1)}s `);

  // Add audio setup
  setupAudio();

  // Add after other sliders in the controls container
  let volumeLabel = createSpan('Volume: ');
  volumeLabel.parent(controlsContainer);
  volumeLabel.style('color', 'white');
  volumeLabel.style('font-family', 'Helvetica, Arial, sans-serif');
  
  volumeSlider = createSlider(0, 100, 80, 1);  // Default to 80% instead of 50%
  volumeSlider.parent(controlsContainer);
  volumeSlider.input(() => {
    masterVolume = volumeSlider.value() / 100;
    if (!isMuted && gainNode) {
      gainNode.gain.setValueAtTime(masterVolume, audioContext.currentTime);
    }
  });

  // Set Helvetica font for all text elements
  textInput.style('font-family', 'Helvetica, Arial, sans-serif');
  durationLabel.style('font-family', 'Helvetica, Arial, sans-serif');
  intervalLabel.style('font-family', 'Helvetica, Arial, sans-serif');
  toggleButton.style('font-family', 'Helvetica, Arial, sans-serif');

  // Initialize ticker position
  tickerX = width;

  // Initialize audio immediately
  initAudio().then(() => {
    console.log('Audio initialized');
  }).catch(err => {
    console.error('Audio init error:', err);
  });
}

function draw() {
  background(192, 192, 192);  // Same as #C0C0C0 in RGB
  
  // Check for auto-generate first
  if (autoGenerate && millis() - lastGenerateTime >= generateInterval) {
    generateImage();
    lastGenerateTime = millis();
  }
  
  if (img) {
    // Draw center image first
    let drawWidth = 512;
    let drawHeight = 512;
    let centerX = (width - drawWidth) / 2;
    let centerY = (height - drawHeight) / 2;

    if (isTransitioning && prevImg) {
      let progress = (millis() - transitionProgress) / transitionDuration;
      progress = constrain(progress, 0, 1);
      
      let drawWidth = 512;
      let drawHeight = 512;
      let centerX = (width - drawWidth) / 2;
      let centerY = (height - drawHeight) / 2;
      
      // Draw previous image with no transparency
      push();
      image(prevImg, centerX, centerY, drawWidth, drawHeight);
      pop();
      
      // Draw new image with no transparency
      push();
      image(img, centerX, centerY, drawWidth, drawHeight);
      pop();
      
      // Sound control - only during transitions
      if (audioContext && !isMuted) {
        let baseFreq = map(progress, 0, 1, 40, 3000); // Wider frequency range
        
        // More complex frequency relationships
        oscillators[0].oscillator.frequency.setValueAtTime(
          baseFreq + sin(progress * TWO_PI * 50) * 1200 + cos(progress * TWO_PI * 30) * 800,
          audioContext.currentTime
        );
        oscillators[1].oscillator.frequency.setValueAtTime(
          baseFreq * 2.5 + cos(progress * TWO_PI * 45) * 1500 + sin(progress * TWO_PI * 25) * 1000,
          audioContext.currentTime
        );
        oscillators[2].oscillator.frequency.setValueAtTime(
          baseFreq * 1.5 + sin(progress * TWO_PI * 55) * 900 + cos(progress * TWO_PI * 35) * 700,
          audioContext.currentTime
        );
        oscillators[3].oscillator.frequency.setValueAtTime(
          baseFreq * 3.5 + cos(progress * TWO_PI * 60) * 2000 + sin(progress * TWO_PI * 40) * 1200,
          audioContext.currentTime
        );
        
        // More dramatic filter modulation
        let filterFreq = map(
          sin(progress * TWO_PI * 25) * cos(progress * TWO_PI * 20) * sin(progress * TWO_PI * 15),
          -1, 1, 200, 20000
        );
        filterNode.frequency.setValueAtTime(filterFreq, audioContext.currentTime);
        
        // More extreme Q modulation
        filterNode.Q.setValueAtTime(
          map(sin(progress * TWO_PI * 30), -1, 1, 15, 35),
          audioContext.currentTime
        );
        
        // More complex volume envelope that ensures silence at start and end
        let currentVolume = map(
          sin(progress * PI) * // This creates a bell curve
          (1 - abs(progress - 0.5) * 2) * // This ensures it fades in and out
          cos(progress * TWO_PI * 15),
          -1, 1, 0, 0.8
        ) * masterVolume;
        
        // More complex staccato patterns
        oscillators.forEach((osc, i) => {
          let vol = currentVolume * 0.4 * 
            (sin(progress * TWO_PI * (40 + i * 15)) > 0.2 ? 1 : 0) *
            (cos(progress * TWO_PI * (30 + i * 10)) > 0 ? 1 : 0.5);
          osc.gain.gain.setValueAtTime(vol, audioContext.currentTime);
        });
        
        // More complex tremolo with increased volume
        gainNode.gain.setValueAtTime(
          currentVolume * (1 + sin(progress * TWO_PI * 50) * 0.9) * (1 + cos(progress * TWO_PI * 40) * 0.7),
          audioContext.currentTime
        );
        
        // Ensure complete silence at end of transition
        if (progress >= 0.99) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          oscillators.forEach(osc => {
            osc.gain.gain.setValueAtTime(0, audioContext.currentTime);
          });
        }
      }
      
      if (progress >= 1) {
        isTransitioning = false;
        prevImg = null;
        if (gainNode) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        }
      }
    } else {
      // Ensure silence when not transitioning
      if (gainNode) {
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        oscillators.forEach(osc => {
          osc.gain.gain.setValueAtTime(0, audioContext.currentTime);
        });
      }
      // Draw single center image with no transparency
      push();
      image(img, centerX, centerY, drawWidth, drawHeight);
      pop();
    }

    // Calculate background opacity based on time
    if (millis() - transitionProgress > backgroundDelay) {
      backgroundOpacity = map(
        millis() - transitionProgress - backgroundDelay,
        0,
        backgroundFadeDuration,
        0,
        80 // Max opacity of 80
      );
      backgroundOpacity = constrain(backgroundOpacity, 0, 80);
    } else {
      backgroundOpacity = 0;
    }

    // Draw background image with calculated opacity
    if (backgroundOpacity > 0) {
      push();
      tint(255, backgroundOpacity);
      let bgAspect = img.width / img.height;
      let canvasAspect = width / height;
      let bgWidth, bgHeight, x, y;
      
      if (bgAspect > canvasAspect) {
        bgHeight = height * 1.2;
        bgWidth = bgHeight * bgAspect;
        x = (width - bgWidth) / 2;
        y = 0;
      } else {
        bgWidth = width * 1.2;
        bgHeight = bgWidth / bgAspect;
        x = 0;
        y = (height - bgHeight) / 2;
      }
      
      // Background animation
      let offsetX = sin(frameCount * 0.005) * 60;
      let offsetY = cos(frameCount * 0.005) * 60;
      let scaleAmount = map(sin(frameCount * 0.01), -1, 1, 1.1, 1.3);
      
      // Add horizontal flip transformation
      translate(width/2, height/2);
      scale(-1, 1);  // Flip horizontally
      translate(-width/2, -height/2);
      
      // Draw background image
      image(img, x + offsetX, y + offsetY, bgWidth, bgHeight);
      pop();
    }
  } else {
    // Draw static loader when no image and not generating
    push();
    fill(192, 192, 192);  // Match the silver background
    rect(0, 0, width, height);
    drawLoader(false);
    pop();
  }
  
  // Draw animated loader during generation
  if (isLoading) {
    push();
    fill(192, 192, 192);  // Match the silver background
    rect(0, 0, width, height);
    drawLoader(true);
    pop();
  }
}

function drawLoader(animate) {
  push();
  translate(width/2, height/2);
  
  let loaderSize = 200;
  
  // Background circle for loader with gradient
  let gradient = drawingContext.createRadialGradient(0, 0, 0, 0, 0, loaderSize/2);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  gradient.addColorStop(1, 'rgba(40, 40, 40, 0.8)');
  drawingContext.fillStyle = gradient;
  noStroke();
  ellipse(0, 0, loaderSize, loaderSize);
  
  // Use different rotation speeds for static vs animated
  if (animate) {
    rotate(loadingAngle);
  } else {
    rotate(staticLoadingAngle);
    staticLoadingAngle += 0.005;  // Very slow rotation for static loader
  }
  
  // Outer ring with more vibrant Mondrian colors
  noFill();
  strokeWeight(8);
  
  // Vibrant Red arc
  stroke(255, 40, 40, 230);
  arc(0, 0, loaderSize * 0.9, loaderSize * 0.9, 0, PI/2);
  
  // Electric Blue arc
  stroke(20, 20, 255, 230);
  arc(0, 0, loaderSize * 0.9, loaderSize * 0.9, PI/2, PI);
  
  // Bright Yellow arc
  stroke(255, 255, 0, 230);
  arc(0, 0, loaderSize * 0.9, loaderSize * 0.9, PI, 3*PI/2);
  
  // Bright White arc with blue tint
  stroke(220, 240, 255, 230);
  arc(0, 0, loaderSize * 0.9, loaderSize * 0.9, 3*PI/2, TWO_PI);
  
  // Spinning segments with color gradient
  for (let i = 0; i < 8; i++) {
    let alpha = map(sin(loadingAngle + i * PI/4), -1, 1, 50, 255);
    let hue = map(i, 0, 8, 0, 255);
    stroke(hue, 200, 255, alpha);
    strokeWeight(4);
    line(0, 0, 60 * cos(i * PI/4), 60 * sin(i * PI/4));
  }
  
  // Inner geometric design with brighter colors
  rotate(-loadingAngle * 1.5);
  strokeWeight(5);
  
  // Brighter horizontal lines
  stroke(255, 30, 30);  // Bright red
  line(-50, -15, 50, -15);
  stroke(30, 30, 255);  // Bright blue
  line(-40, 0, 40, 0);
  stroke(255, 255, 30);  // Bright yellow
  line(-45, 15, 45, 15);
  
  if (animate) {
    loadingAngle += 0.08;
  }
  pop();
  
  // Modify text based on state
  textSize(24);
  textAlign(CENTER, CENTER);
  textFont('Helvetica');
  
  let textColor = color(255, 0, 0);
  textColor.setAlpha(animate ? (200 + sin(frameCount * 0.1) * 55) : 200);
  
  // Text shadow
  fill(0);
  for(let i = -2; i <= 2; i++) {
    for(let j = -2; j <= 2; j++) {
      text(animate ? "generating stream of protective suits and helmets in a mondrian world..." : "", 
           width/2 + i, height/2 + 120 + j);
    }
  }
  
  // Main text
  fill(textColor);
  text(animate ? "generating stream of protective suits and helmets in a mondrian world..." : "", 
       width/2, height/2 + 120);
}

async function generateImage() {
  console.log("Generating image...");
  if (isFirstGeneration) {
    isLoading = true;  // Only show loader for first generation
  }
  lastGenerateTime = millis();
  
  let subject = random(subjects);
  let style = random(styles);
  let element = random(elements);
  let colorScheme = random(colorSchemes);
  let environment = random(environments);
  
  let prompt = `photorealistic full body shot of ${subject} ${element} ${environment} ${style} ${colorScheme}, 
    high end fashion photography in Mondrian world, studio lighting, high detail, 8k, 
    fully closed helmets, perfect mirror reflection, polished chrome surface, metallic shine, 
    sealed space helmets, reflective visors, no exposed faces, full length photo, 
    showing entire suits, standing pose, fashion editorial style in Mondrian style world`;
    
  textInput.value(prompt);
  tickerText = prompt; // Update ticker text
  tickerX = width; // Reset ticker position
  
  let data = {
    modelURL: "https://api.replicate.com/v1/models/stability-ai/stable-diffusion-3/predictions",
    input: {
      prompt: prompt,
    },
  };

  let options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  try {
    let response = await fetch(proxyUrl, options);
    console.log("Response received, loading image...");
    let json = await response.json();
    loadImage(json.output[0], gotImage);
  } catch (error) {
    console.error("Error generating image:", error);
    lastGenerateTime = millis() - generateInterval + 1000;
    isLoading = false;  // Stop loading only on error
  }
}

function gotImage(results) {
  if (img) {
    prevImg = img;
    isTransitioning = true;
    transitionProgress = millis();
  }
  img = results;
  if (isFirstGeneration) {
    isLoading = false;
    isFirstGeneration = false;  // Turn off first generation flag
  }
  console.log("Image loaded.");
}

function windowResized() {
  canvasWidth = windowWidth;
  canvasHeight = windowHeight;
  resizeCanvas(canvasWidth, canvasHeight);
  textInput.size(min(450, windowWidth - 100));
  tickerX = width; // Reset ticker position on resize
}

function toggleAutoGenerate() {
  initAudio();
  
  autoGenerate = !autoGenerate;
  if (autoGenerate) {
    toggleButton.html("stop stream of protective suits and helmets");
    toggleButton.style('background-color', '#f44336');
    lastGenerateTime = millis();
    generateImage();
  } else {
    toggleButton.html("start stream of protective suits and helmets");
    toggleButton.style('background-color', '#4CAF50');
  }
}

function cleanup() {
  if (oscillators) {
    oscillators.forEach(osc => {
      osc.oscillator.stop();
      osc.gain.disconnect();
    });
  }
  if (lfoNode) {
    lfoNode.stop();
  }
  if (audioContext) {
    audioContext.close();
  }
}
