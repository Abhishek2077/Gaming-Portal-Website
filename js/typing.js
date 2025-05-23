(() => {
  'use strict';

  const defaultText = `The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet, helping you practice your typing with all characters. Use this test to improve your speed and accuracy.`;

  const container = document.querySelector('.container');
  const textToTypeDiv = document.getElementById('text-to-type');
  const inputArea = document.getElementById('input-area');
  const timerDisplay = document.getElementById('timer-display');
  const wpmDisplay = document.getElementById('wpm-display');
  const accuracyDisplay = document.getElementById('accuracy-display');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const toggleCustomTextBtn = document.getElementById('toggle-custom-text');
  const customTextSection = document.getElementById('custom-text-section');
  const customTextInput = document.getElementById('custom-text-input');
  const downloadPdfBtn = document.getElementById('download-pdf-btn');
  const ghostCursor = document.getElementById('ghost-cursor');
  const graphContainer = document.getElementById('graph-container');
  const wpmGraphCanvas = document.getElementById('wpm-graph');
  const wpmGraphCtx = wpmGraphCanvas.getContext('2d');

  let testText = defaultText;
  let charSpans = [];
  let startTime = null;
  let intervalId = null;
  let lastInput = '';
  let currentIndex = 0;
  let mistakes = 0;
  let totalTyped = 0;
  let finished = false;

  // For Ghost race data
  // It will be an array of objects: {time: seconds elapsed, pos: charIndex}
  let bestRaceData = null;
  let raceStartTime = null;
  let ghostPositionIndex = 0;
  let ghostEnabled = false;

  // For WPM performance tracking over time for graph & PDF
  // We store a list of {timeElapsedSeconds, wpm}
  let wpmSnapshots = [];

  function sanitizeText(text) {
    // Remove extra trailing/leading spaces and normalize spaces for clean typing test
    return text.replace(/\s+/g, ' ').trim();
  }

  function splitTextToSpans(text) {
    textToTypeDiv.innerHTML = '';
    charSpans = [];
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.className = '';
      textToTypeDiv.appendChild(span);
      charSpans.push(span);
    }
    // Add current position border left to first span
    if (charSpans.length) {
      charSpans[0].classList.add('current');
    }
  }

  function resetTestState() {
    clearInterval(intervalId);
    startTime = null;
    raceStartTime = null;
    ghostPositionIndex = 0;
    currentIndex = 0;
    mistakes = 0;
    totalTyped = 0;
    finished = false;
    lastInput = '';
    wpmSnapshots = [];
    ghostCursor.style.display = 'none';
    inputArea.value = '';
    inputArea.disabled = false;
    inputArea.focus();
    startBtn.disabled = true;
    resetBtn.disabled = false;
    downloadPdfBtn.disabled = true;
    graphContainer.style.display = "none";
    updateDisplays(0,100,0);
    splitTextToSpans(testText);
    // Enable ghost if we have bestRaceData
    ghostEnabled = bestRaceData && bestRaceData.length > 0;
    if (ghostEnabled) {
      ghostCursor.style.display = 'block';
    }
  }

  function updateDisplays(timeElapsed, accuracy, wpm) {
    timerDisplay.textContent = `Time: ${timeElapsed.toFixed(1)}s`;
    accuracyDisplay.textContent = `Accuracy: ${accuracy.toFixed(0)}%`;
    wpmDisplay.textContent = `WPM: ${wpm.toFixed(0)}`;
  }

  function calcWPM(charsTyped, timeInSeconds) {
    // Words are considered 5 chars per word
    if (timeInSeconds <= 0) return 0;
    return (charsTyped / 5) / (timeInSeconds / 60);
  }

  function updateTextHighlighting() {
    const inputVal = inputArea.value;
    const len = inputVal.length;

    // Remove all classes
    charSpans.forEach((span) => {
      span.classList.remove('correct', 'incorrect', 'current');
    });

    mistakes = 0;
    totalTyped = len;
    for (let i = 0; i < charSpans.length; i++) {
      if (i < len) {
        if (inputVal[i] === charSpans[i].textContent) {
          charSpans[i].classList.add('correct');
        } else {
          mistakes++;
          charSpans[i].classList.add('incorrect');
        }
      }
    }
    // Current character to type
    if (!finished) {
      if (len < charSpans.length) {
        charSpans[len].classList.add('current');
      }
    }
  }

  function updateGhostCursor() {
    if (!ghostEnabled || !bestRaceData) {
      ghostCursor.style.display = 'none';
      return;
    }
    if (!raceStartTime) {
      raceStartTime = performance.now();
      ghostCursor.style.display = 'block';
    }
    const elapsed = (performance.now() - raceStartTime) / 1000;

    // Move ghostPositionIndex as elapsed time advances
    while (ghostPositionIndex < bestRaceData.length-1 && bestRaceData[ghostPositionIndex+1].time <= elapsed) {
      ghostPositionIndex++;
    }

    let ghostCharIndex = bestRaceData[ghostPositionIndex].pos;

    if (ghostCharIndex > charSpans.length-1) {
      ghostCharIndex = charSpans.length-1;
    }

    // Position the ghost cursor near the ghostCharIndex span
    const span = charSpans[ghostCharIndex];
    if (!span) return;

    const rect = span.getBoundingClientRect();
    const containerRect = textToTypeDiv.getBoundingClientRect();
    // Place ghost cursor relative to container
    const left = span.offsetLeft;
    const top = span.offsetTop;

    ghostCursor.style.left = left + 'px';
    ghostCursor.style.top = top + 'px';
    ghostCursor.style.height = span.offsetHeight + 'px';
  }

  function saveBestPerformance(timeElapsed, wpmValue, raceData) {
    // If no previous best or this is better, save it with time series data
    const oldBestWpm = parseFloat(localStorage.getItem('bestWPM')) || 0;
    if (wpmValue > oldBestWpm) {
      localStorage.setItem('bestWPM', wpmValue);
      localStorage.setItem('bestTime', timeElapsed);
      localStorage.setItem('bestRaceData', JSON.stringify(raceData));
    }
  }

  function loadBestPerformance() {
    const wpmStored = localStorage.getItem('bestWPM');
    if (!wpmStored) return null;
    const raceDataRaw = localStorage.getItem('bestRaceData');
    if (!raceDataRaw) return null;
    try {
      return JSON.parse(raceDataRaw);
    } catch (e) {
      return null;
    }
  }

  function calculateAccuracy() {
    if (totalTyped === 0) return 100;
    return ((totalTyped - mistakes) / totalTyped) * 100;
  }

  function updateStats() {
    if (!startTime) return;
    const now = performance.now();
    const timeElapsed = (now - startTime) / 1000;

    // Calculate WPM and accuracy
    const accuracy = calculateAccuracy();
    const wpm = calcWPM(totalTyped, timeElapsed);

    updateDisplays(timeElapsed, accuracy, wpm);

    // Save WPM snapshot for graph and PDF every 0.5 sec
    if (wpmSnapshots.length === 0 || (wpmSnapshots[wpmSnapshots.length - 1].time + 0.5 <= timeElapsed)) {
      wpmSnapshots.push({time: timeElapsed, wpm: wpm});
    }

    // Update ghost cursor position
    if (ghostEnabled) {
      updateGhostCursor();
    }
  }

  function endTest() {
    finished = true;
    inputArea.disabled = true;
    clearInterval(intervalId);
    startBtn.disabled = false;
    resetBtn.disabled = false;
    downloadPdfBtn.disabled = false;
    graphContainer.style.display = "block";
    drawWpmGraph();

    // Save best perf if better
    const finalWpm = parseFloat(wpmDisplay.textContent.replace(/[^0-9.]/g, '')) || 0;
    const finalTime = (performance.now() - startTime) / 1000;
    saveBestPerformance(finalTime, finalWpm, wpmSnapshots);
  }

  function handleInput(e) {
    if (!startTime) return;

    const val = inputArea.value;

    if (val.length > testText.length) {
      inputArea.value = val.substring(0, testText.length);
      return;
    }

    lastInput = val;
    currentIndex = val.length;
    updateTextHighlighting();

    // If test complete
    if (currentIndex === testText.length) {
      // Check if all correct
      const accuracy = calculateAccuracy();
      if (accuracy === 100) {
        endTest();
      } else {
        // Allow user to continue if mistakes present
      }
    }
  }

  function startTest() {
    resetTestState();
    startTime = performance.now();
    raceStartTime = null;
    ghostPositionIndex = 0;
    intervalId = setInterval(updateStats, 50);
    inputArea.focus();
  }

  function resetTest() {
    clearInterval(intervalId);
    startTime = null;
    ghostCursor.style.display = 'none';
    startBtn.disabled = false;
    resetBtn.disabled = true;
    downloadPdfBtn.disabled = true;
    graphContainer.style.display = "none";
    inputArea.disabled = true;
    inputArea.value = '';
    updateDisplays(0, 100, 0);
    splitTextToSpans(testText);
    finished = false;
  }

  function toggleCustomText() {
    if (customTextSection.style.display === 'none') {
      customTextSection.style.display = 'block';
      toggleCustomTextBtn.textContent = 'Use Default Text';
      // Set testText to custom input or empty
      const val = customTextInput.value.trim();
      testText = val ? sanitizeText(val) : '';
      if (!testText) {
        startBtn.disabled = true;
      } else {
        startBtn.disabled = false;
      }
    } else {
      customTextSection.style.display = 'none';
      toggleCustomTextBtn.textContent = 'Use Custom Text';
      testText = defaultText;
      startBtn.disabled = false;
    }
    resetTest();
  }

  function handleCustomTextInput() {
    const val = customTextInput.value.trim();
    testText = val ? sanitizeText(val) : '';
    if (testText.length > 0) {
      startBtn.disabled = false;
    } else {
      startBtn.disabled = true;
    }
  }

  function drawWpmGraph() {
    if (!wpmSnapshots.length) return;
    const ctx = wpmGraphCtx;
    const canvas = wpmGraphCanvas;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = "#1f1a3a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Setup graph boundaries and margins
    const margin = 40;

    // Find max time and max wpm
    const maxTime = wpmSnapshots[wpmSnapshots.length - 1].time;
    const maxWpm = Math.max(...wpmSnapshots.map(s => s.wpm), 50);

    // Draw axes
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Y-axis
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    // X-axis
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();

    ctx.fillStyle = '#ddd';
    ctx.font = '12px Inter';
    ctx.textAlign = 'right';

    // Y axis labels (WPM)
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      let ypos = margin + ((canvas.height - 2 * margin) / ySteps) * i;
      let wpmLabel = Math.round(maxWpm - (maxWpm / ySteps) * i);
      ctx.fillText(wpmLabel, margin - 6, ypos + 4);
      // horizontal grid line
      ctx.strokeStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(margin, ypos);
      ctx.lineTo(canvas.width - margin, ypos);
      ctx.stroke();
    }

    // X axis labels (time in seconds)
    ctx.textAlign = 'center';
    const xSteps = 6;
    for (let i = 0; i <= xSteps; i++) {
      let xpos = margin + ((canvas.width - 2 * margin) / xSteps) * i;
      let tLabel = (maxTime / xSteps) * i;
      ctx.fillText(tLabel.toFixed(1) + 's', xpos, canvas.height - margin + 16);
      // vertical grid line
      ctx.strokeStyle = '#444';
      ctx.beginPath();
      ctx.moveTo(xpos, margin);
      ctx.lineTo(xpos, canvas.height - margin);
      ctx.stroke();
    }

    // Draw WPM line
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();

    for (let i = 0; i < wpmSnapshots.length; i++) {
      const x = margin + (wpmSnapshots[i].time / maxTime) * (canvas.width - 2 * margin);
      const y = margin + ((maxWpm - wpmSnapshots[i].wpm) / maxWpm) * (canvas.height - 2 * margin);
      if (i === 0) {
        ctx.moveTo(x,y);
      } else {
        ctx.lineTo(x,y);
      }
    }
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#22c55e';
    wpmSnapshots.forEach(snap => {
      const x = margin + (snap.time / maxTime) * (canvas.width - 2 * margin);
      const y = margin + ((maxWpm - snap.wpm) / maxWpm) * (canvas.height - 2 * margin);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  async function downloadPdfReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({unit: 'pt', format: 'a4'});
    const margin = 30;
    const lineHeight = 22;
    let y = margin;

    doc.setFont('Inter', 'bold');
    doc.setFontSize(18);
    doc.text('Typing Speed Test Report', margin, y);
    y += 30;

    // Summary info
    doc.setFontSize(12);
    doc.setFont('Inter', 'normal');
    doc.text(`Test duration: ${((performance.now() - startTime)/1000).toFixed(1)} seconds`, margin, y);
    y += lineHeight;
    doc.text(`Final WPM: ${wpmDisplay.textContent.replace('WPM: ', '')}`, margin, y);
    y += lineHeight;
    doc.text(`Accuracy: ${accuracyDisplay.textContent.replace('Accuracy: ', '')}`, margin, y);
    y += lineHeight * 1.5;

    // Draw graph as image from canvas
    // Scale canvas content to fit into pdf width margins
    const imgData = wpmGraphCanvas.toDataURL('image/png');
    const imgWidth = doc.internal.pageSize.getWidth() - 2 * margin;
    const aspectRatio = wpmGraphCanvas.height / wpmGraphCanvas.width;
    const imgHeight = imgWidth * aspectRatio;

    doc.text('WPM progress graph:', margin, y);
    y += lineHeight / 2;
    doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
    y += imgHeight + 20;

    // Typed text summary with highlight of mistakes
    doc.setFontSize(14);
    doc.text('Typed Text Summary:', margin, y);
    y += lineHeight;

    const pageWidth = doc.internal.pageSize.getWidth() - 2 * margin;
    const maxLineWidth = pageWidth;
    const fontSize = 11;
    doc.setFontSize(fontSize);
    doc.setFont('Courier');

    // We render the typed text with mistake highlights in red
    // To keep it simple, we print it line by line with colors (red for wrong letters)
    const typedVal = inputArea.value;
    let line = '';
    let lineY = y;
    const lineHeightPdf = fontSize * 1.2;
    let lineX = margin;

    function flushLineColored(doc, text, y, isError) {
      if (text.length === 0) return;
      if (isError) {
        doc.setTextColor(255, 80, 80);
      } else {
        doc.setTextColor(0, 0, 0);
      }
      doc.text(text, margin, y);
      doc.setTextColor(0, 0, 0);
    }

    // For simple PDF text highlight, just print chunks of correct and incorrect letters separately
    // Here we prepare a line-buffer approach, respecting maxLineWidth pixel width
    // Each character approximate width ~6 pt at font size 11
    const charWidthApprox = 6;
    let currentChunk = '';
    let currentChunkError = null;
    let currLineWidth = 0;

    const charsPerLine = Math.floor(maxLineWidth / charWidthApprox);

    for (let i = 0; i < typedVal.length; i++) {
      const typedChar = typedVal[i];
      const originalChar = testText[i] || '';
      const isError = typedChar !== originalChar;

      // If different error than current chunk, we flush chunk and start new
      if (currentChunkError === null) {
        currentChunkError = isError;
        currentChunk = typedChar;
      } else if (currentChunkError === isError) {
        currentChunk += typedChar;
      } else {
        flushLineColored(doc, currentChunk, lineY, currentChunkError);
        currentChunk = typedChar;
        currentChunkError = isError;
        lineY += lineHeightPdf;
      }

      // Handle line breaks for long lines
      if (currentChunk.length >= charsPerLine) {
        flushLineColored(doc, currentChunk, lineY, currentChunkError);
        currentChunk = '';
        currentChunkError = null;
        lineY += lineHeightPdf;
      }
    }
    // Flush last chunk
    flushLineColored(doc, currentChunk, lineY, currentChunkError);

    doc.save('typing_speed_test_report.pdf');
  }

  // Initial Setup
  function initialize() {
    testText = sanitizeText(defaultText);
    splitTextToSpans(testText);
    inputArea.disabled = true;
    resetBtn.disabled = true;
    startBtn.disabled = false;
    downloadPdfBtn.disabled = true;
    timerDisplay.textContent = 'Time: 0.0s';
    wpmDisplay.textContent = 'WPM: 0';
    accuracyDisplay.textContent = 'Accuracy: 100%';
    customTextSection.style.display = 'none';
    ghostCursor.style.display = 'none';

    // Load best performance data for ghost
    bestRaceData = loadBestPerformance();

    // Event Listeners
    inputArea.addEventListener('input', handleInput);
    startBtn.addEventListener('click', () => {
      if (customTextSection.style.display === 'block') {
        // load custom text
        const val = customTextInput.value.trim();
        if (!val) {
          alert('Please enter some custom text to start the test.');
          return;
        }
        testText = sanitizeText(val);
        splitTextToSpans(testText);
      } else {
        testText = sanitizeText(defaultText);
        splitTextToSpans(testText);
      }
      startTest();
    });

    resetBtn.addEventListener('click', resetTest);
    toggleCustomTextBtn.addEventListener('click', toggleCustomText);
    customTextInput.addEventListener('input', handleCustomTextInput);
    downloadPdfBtn.addEventListener('click', downloadPdfReport);

    // Accessibility: Allow typing area focus
    textToTypeDiv.setAttribute('tabindex', '0');
  }

  initialize();

})();