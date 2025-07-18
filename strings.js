// == Custom Letterform Library ==

// Public function to include in other sketches
let letterStates = [];
let savedStates = [];
let recordingStates = false;
let charWidth;
let n=10;
let constTargetCol;

function drawCustomText(str, x, y, options = {}) {
  let {
    letterWidth = 10,
    letterSpacing = 10,
    lineSpacing = 10,
    strokeWeightVal = 2,
    detailLevel = 5,
    color = [0, 116, 255],
    preset = null,
    radius = 100,
    interactiveStrokeWeight = 6,
    interactiveDetailLevel = 10,
    //interactiveColor = [255, 0, 0],
    // New color pairs
    baseColor = [0, 0, 0],
    targetColor = [255, 255, 255],
    interactiveBaseColor = [255, 0, 0],
    interactiveTargetColor = [255, 255, 0],
    maxWidth = width - x,     // 👈 max width for bounding box    
    lineHeight = letterWidth * 2 + lineSpacing// 👈 vertical distance between lines
  } = options;

  let cx = x;
  let cy = y;

  // Split string into words (preserve whitespace)
  let words = str.split(/(\s+)/);

  for (let word of words) {
    let wordWidth = 0;
    for (let char of word) {
      let upperChar = char.toUpperCase();
      if (letterFunctions[upperChar]) {
        wordWidth += letterWidth * 2 + letterSpacing;
      }
    }

    if (cx + wordWidth > x + maxWidth) {
      // Move to next line
      cx = x;
      cy += lineHeight;
    }

    for (let char of word) {
      let upperChar = char.toUpperCase();

      // Push new state if needed
      if (!letterStates[cx + ',' + cy]) {
        letterStates[cx + ',' + cy] = {
          sw: strokeWeightVal,
          p: detailLevel,
          col: color.slice()
        };
      }

      let state = letterStates[cx + ',' + cy];

      if (!letterFunctions[upperChar]) {
        cx += letterSpacing * 2;
        continue;
      }

      let d = dist(mouseX, mouseY, cx + options.letterWidth, cy + options.letterWidth);
      let verticalGuard = abs(mouseY - cy) < radius / 2;

      let targetSw = strokeWeightVal;

      // Breathe preset: smoothly vary stroke weight with a sine wave
      if (preset === "breathe") {
        let breathValue = map(sin(time), -1, 1, 1, 10); // breathing stroke weight: 1 → 8
        targetSw = breathValue;
      }

      let targetP = detailLevel;
      let targetCol;
      let baseInterCol;
      let interactiveInterCol;

      if (preset === "hover-reactive" && d < radius) {
        // Interpolate strength based on proximity to cursor
        let proximity = 1 - (d / radius); // 1 near center, 0 at edge
        proximity = constrain(proximity, 0, 1);

        // Linearly interpolate based on proximity
        targetSw = lerp(strokeWeightVal, interactiveStrokeWeight, proximity);
        targetP = lerp(detailLevel, interactiveDetailLevel, proximity);

        // Color also interpolates based on proximity (new logic)
        baseInterCol = [
          lerp(baseColor[0], interactiveBaseColor[0], proximity),
          lerp(baseColor[1], interactiveBaseColor[1], proximity),
          lerp(baseColor[2], interactiveBaseColor[2], proximity)
        ];

        interactiveInterCol = [
          lerp(targetColor[0], interactiveTargetColor[0], proximity),
          lerp(targetColor[1], interactiveTargetColor[1], proximity),
          lerp(targetColor[2], interactiveTargetColor[2], proximity)
        ];
      } else {
        // Default color interpolation
        baseInterCol = baseColor;

        interactiveInterCol = targetColor;
      }

      state.sw = lerp(state.sw, targetSw, 0.1);
      state.p = lerp(state.p, targetP, 0.1);
      if (abs(state.p) < 0.05) state.p = 0;

      let renderP = round(state.p);
      // state.col = [
      //   lerp(state.col[0], targetCol[0], 0.1),
      //   lerp(state.col[1], targetCol[1], 0.1),
      //   lerp(state.col[2], targetCol[2], 0.1)
      // ];

      push();
      translate(cx, cy);
      strokeWeight(state.sw);
      //stroke(...state.col);
      letterFunctions[upperChar](renderP, letterWidth, baseInterCol, interactiveInterCol);
      pop();

      cx += letterWidth * 2 + letterSpacing;
      charWidth = letterWidth;
      

      if (recordingStates) {
        savedStates.push({
          x: cx,
          y: cy,
          char: upperChar,
          strokeWeight: Math.round(state.sw * 10) / 10,
          detail: state.p,
          color: [...state.col],
          width: charWidth,
          color1: baseInterCol,
          color2: interactiveInterCol
        });
        
      }
      
    }
  }
  recordingStates = false;
}

function drawStaticLetterData(dataArray) {
  for (let state of dataArray) {
    if (!letterFunctions[state.char]) continue;
    push();
    translate(state.x, state.y);
    strokeWeight(state.strokeWeight);
    //stroke(...state.color);
    letterFunctions[state.char](round(state.detail), state.width, state.color1, state.color2);
    pop();
  }
}

const letterFunctions = {
  A: drawA, B: drawB, C: drawC, D: drawD, E: drawE, F: drawF, G: drawG,
  H: drawH, I: drawI, J: drawJ, K: drawK, L: drawL, M: drawM, N: drawN,
  O: drawO, P: drawP, Q: drawQ, R: drawR, S: drawS, T: drawT, U: drawU,
  V: drawV, W: drawW, X: drawX, Y: drawY, Z: drawZ,
  "0": draw0, "1": draw1, "2": draw2, "3": draw3, "4": draw4, "5": draw5,
  "6": draw6, "7": draw7, "8": draw8, "9": draw9, " ": () => {}
};

function drawLetter(idArray, p, widthh, color1, color2) {
  // let baseColor = color(255, 0, 255);
  // let targetColor = color(0, 255, 255);
  let baseColor = color(color1[0], color1[1], color1[2]);
  let targetColor = color(color2[0], color2[1], color2[2]);
  let a = new Quadrilateral(widthh, n, baseColor, targetColor);   
  for (let id of idArray) {
    if (!id) continue;
    push();
    applyTransform(id, a.w);
    let type = id[2];
    if (type === "C") a.circ(p);
    else if (type === "S") a.st(p);
    pop();
  }
}

function applyTransform(id, letterWidth) {
  let gridSpacing = letterWidth;
  let translateMap = {
    1: [0, 0], 2: [1, 0], 3: [2, 0],
    4: [0, 1], 5: [1, 1], 6: [2, 1],
    7: [0, 2], 8: [1, 2], 9: [2, 2]
  };

  let rotateMap = { V: 0, W: HALF_PI, X: PI, Y: PI + HALF_PI };
  let scaleMap = { "=": [1, 1], "-": [-1, 1], "+": [1, -1] };

  let t = translateMap[id[0]];
  let r = rotateMap[id[1]];
  let s = scaleMap[id[3]];

  translate(t[0] * gridSpacing, t[1] * gridSpacing);
  rotate(r);
  scale(s[0], s[1]);
}

class Quadrilateral {
  constructor(w_, n_, baseColor_, targetColor_) {
    this.w = w_;
    this.n = n_;
    this.baseColor = baseColor_ || color(255, 0, 0);
    this.targetColor = targetColor_ || color(0, 255, 255);
  }

  st(p_) {
    if (p_ == 0) {
      line(0, 0, 0, this.w);
      line(0, this.w, this.w, this.w);
    } else {
      for (let i = 0; i <= p_ - 1; i++) {
        //let amt = i / (p_ - 1);
        let amt = i === 0 ? 1 / (p_ - 1) : i / (p_ - 1);
        let c = lerpColor(this.baseColor, this.targetColor, amt);
        stroke(c);
        line(0, (this.w * i) / this.n, (this.w * (i + 1)) / this.n, this.w);
        line(
          0,
          this.w - (this.w * (i + 1)) / this.n,
          this.w - (this.w * i) / this.n,
          this.w
        );
      }
    }
  }

  circ(p_) {
    let col = 0;
    let angle = 90 / (this.n + 1);
    if (p_ == 0) {
      line(0, 0, this.w, 0);
      line(0, this.w, this.w, 0);
    } else if (p_ >= this.n / 2) {
      let v = 0;
      for (let j = this.n; j <= 90; j += angle) {
        let amt = (j - this.n) / (90 - this.n);
        let c = lerpColor(this.baseColor, this.targetColor, amt);
        stroke(c);
        let x = int(this.w * cos(radians(j)));
        let y = int(this.w * sin(radians(j)));
        line(v, 0, x, y);
        line(0, this.w, this.w, 0);
        v = v + this.w / this.n;
      }
    } else {
      let v1 = this.w - this.w / this.n;
      let v2 = 0;
      for (let j = this.n; j <= angle * (p_ + 1); j += angle) {
        let amt = (j - this.n) / (angle * (p_ + 1) - this.n);
        let c = lerpColor(this.baseColor, this.targetColor, amt);
        stroke(c);
        let x = int(this.w * cos(radians(j)));
        let y = int(this.w * sin(radians(j)));
        line(v2, 0, x, y);
        v2 += this.w / this.n;
      }
      for (let j = 90 - angle; j >= angle * (this.n - p_); j -= angle) {
        let amt = (90 - j) / (90 - angle * (this.n - p_));
        let c = lerpColor(this.baseColor, this.targetColor, amt);
        stroke(c);
        let x = int(this.w * cos(radians(j)));
        let y = int(this.w * sin(radians(j)));
        line(v1, 0, x, y);
        v1 -= this.w / this.n;
        col++;
      }
    }
  }
}


// function keyPressed() {
//   if (key === 'S' || key === 's') {
//     recordingStates = true;
//     console.log('hello');
//     savedStates = []; // clear old
//   } else if (key === 'E' || key === 'e') {
//     recordingStates = false;
//     console.log(savedStates); // 🔁 Or send via postMessage to another sketch
//     sendStateToOtherSketch(savedStates);
//   }
// }

function keyPressed() {
  document.addEventListener('keydown', function(event) {
    if ((event.key === 's' || event.key === 'S') && (event.metaKey || event.ctrlKey)) {
      event.preventDefault(); // prevent browser save dialog
      // Start recording
      recordingStates = true;
      savedStates = []; // Clear previous data

      // Wait one frame (~16ms) to collect states in draw()
      setTimeout(() => {
        recordingStates = false;
        console.log(savedStates);
        sendStateToOtherSketch(savedStates);
      }, 25); // slight delay to ensure draw() runs once
    }
  });
}

function sendStateToOtherSketch(data) {
  const targetWindow = window.open('receiver.html', '_blank'); // or iframe.contentWindow
  const payload = JSON.stringify(data);

  // Wait a moment before posting to make sure the other window is ready
  setTimeout(() => {
    targetWindow.postMessage({ type: "letterData", payload }, "*");
  }, 2000);
}

// Include all letter drawing functions here (e.g. drawA to drawZ and draw0 to draw9)
// These functions call drawLetter() with the correct transformation strings
// Copy the existing drawA(p) { drawLetter([...], p); } etc. from your sketch
// into this file for it to be self-contained.

// == Letter Functions ==
function drawA(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "5XC-", "9XS=", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawB(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "2VC=", "8VC+", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawC(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "2VC=", "8YS=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawD(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "5VC+", "5VC=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawE(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2VC-", "6XS=", "8YS=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawF(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "6XS=", "", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawG(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6XS=", "8VC+", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawH(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "5YS=", "5VC=", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawI(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5WC-", "3WS=", "5YC-", "7YS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawJ(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["", "6XS=", "8YS=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawK(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["1VS=", "5VC+", "5VS=", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawL(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "", "8VC+", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawM(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["4YC=", "6WC-", "8YS=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawN(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["4YC=", "6XS=", "6WC=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawO(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6XS=", "8YS=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawP(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "2VC=", "", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawQ(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6XS=", "9XS=", "5VS=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawR(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "5XC-", "5VS=", "5WS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawS(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2VC-", "6XS=", "8VC+", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawT(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5YC+", "5YC=", "5VS=", "7YS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawU(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6WC-", "8YS=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawV(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6WC-", "", "4WC+"], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawW(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6XS=", "6WC=", "4WC+"], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawX(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2VC-", "2VC=", "8VC+", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawY(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "5YS=", "9XC=", ""], p, letterWidth, baseInterCol, interactiveInterCol); }
function drawZ(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "2VC=", "8YS=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw1(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5YC+", "5VS=", "7YS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw2(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "5XC-", "8YS=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw3(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "2VC=", "5VC=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw4(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "5YS=", "9XS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw5(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2VC-", "6XS=", "5VC=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw6(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "6XS=", "8VC+", "5VC-"], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw7(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "2VC=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw8(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["5XC=", "2VC=", "5VC=", "8XC="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw9(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2VC-", "5XC-", "5VC=", "4VS="], p, letterWidth, baseInterCol, interactiveInterCol); }
function draw0(p, letterWidth, baseInterCol, interactiveInterCol) { drawLetter(["2WS=", "6XS=", "8YS=", "4VS=", "2VS-", "2VS=", "6WS=", "8XS="], p, letterWidth, baseInterCol, interactiveInterCol); }

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}