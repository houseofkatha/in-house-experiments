let started = false;
let targetX;
let targetY;
let zRotation = 0;
let xRotation;
let yRotation;

let logo1;

let lastZ = null;
let totalRotation = 0;
let rotationCount = 0;

let easingStarted = false;
let easingTriggered = false;
let easeStartTime;
let easeDuration = 10000; // 3 seconds easing in
let visualRotation = 0;
let startPoint = 0;

function preload() {
  logo1 = loadImage("HoK-Seal.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  angleMode(DEGREES);
  visualRotation = 0; // starts matching device
}

window.addEventListener('DOMContentLoaded', () => {
  const permissionButton = document.getElementById('permissionButton');

  permissionButton.addEventListener('click', () => {
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {

      DeviceMotionEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            started = true;
            permissionButton.style.display = 'none';
            window.addEventListener('deviceorientation', handleOrientation);

            // ⏳ Start the delayed transition
            setTimeout(() => {
              easingStarted = true;
              easeStartTime = millis();
            }, 5000);
          } else {
            alert('Permission denied');
          }
        })
        .catch(console.error);
    } else {
      // Not iOS
      started = true;
      permissionButton.style.display = 'none';
      window.addEventListener('deviceorientation', handleOrientation);

      // ⏳ Start the delayed transition
      setTimeout(() => {
        easingStarted = true;
        easeStartTime = millis();
      }, 5000);
    }
  });
});

function draw() {
  background("white");

  if (!easingStarted) {
    // Before 5s: logo follows phone
    visualRotation = 0;
  } else {
    // After 5s: Ease-in transition
    let elapsed = millis() - easeStartTime;
    let t = constrain(elapsed / easeDuration, 0, 1);

    // Lerp between following phone (zRotation) → staying upright (-zRotation)
    let targetRotation = 360 * rotationCount + zRotation;
    
    // if (zRotation === 0) startPoint = visualRotation;
    visualRotation = lerpAngle(startPoint, zRotation, t);
  }

  push();
  translate(width / 2, height / 2);
  rotate(visualRotation);
  imageMode(CENTER);
  image(logo1, 0, 0, 200, 200);
  pop();

  // Display rotation info
  fill(0);
  textSize(16);
  text("z-axis: " + nf(zRotation, 1, 2), 25, 50);
  text("Rotations: " + rotationCount, 25, 70);

  if (typeof visualRotation !== 'undefined' || typeof startPoint !== 'undefined') {
    text("visualRotation: " + nf(visualRotation, 1, 2), 25, 90);
    text("startPoint: " + nf(startPoint, 1, 2), 25, 110);
  }

}

function handleOrientation(event) {
  if (event.alpha != null) {
    let alpha = event.alpha;

    if (lastZ !== null) {
      let delta = angleDiff(lastZ, alpha);

      // Detect wrap-around from high angle to low (e.g., 359 → 1)
      if (lastZ > 270 && alpha < 90) {
        rotationCount++;
        startPoint = visualRotation; // ✅ update start point at wrap
        console.log("Revolution complete → count: ", rotationCount);
      }

      totalRotation += abs(delta);
    }

    lastZ = alpha;
    zRotation = alpha;
  }

  if (event.beta !== null && event.gamma !== null) {
    xRotation = event.beta;
    yRotation = event.gamma;

    let rX = map(yRotation, -90, 90, -height / 2, height / 2);
    let rY = map(xRotation, -90, 90, -height, height);
    targetX = width / 2 + rX;
    targetY = height / 2 + rY;
  }
}

// Shortest angle diff
function angleDiff(a, b) {
  return ((b - a + 540) % 360) - 180;
}

// Lerp angle safely across wrap-around
function lerpAngle(a, b, t) {
  let delta = (b - a + 540) % 360 - 180;
  return a + delta * t;
}