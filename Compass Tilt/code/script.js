let started = false;
let targetX;
let targetY;
let zRotation = 0;
let xRotation;
let yRotation;

let logo1;
let logo2;
let logo3;

let smoothedAngle = 0;
let rotationEase = 0;
let easeStartTime;
const easeDuration = 10000; // 5 seconds

let startRotationAnimation = false;
let rotationAnimationStarted = false;

let initialRotation = 0;
let currentVisualAngle = 0; // What the image visually looks like before easing
let finalTargetAngle = 0;
let easedAngle;

function preload() {
    logo1 = loadImage("HoK-Seal.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0); // show black background initially
  angleMode(DEGREES);

  // Don't put event listener in setup. Instead, bind it after DOM loads
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
    }
  });
});

function draw() {
  background("white");

  // Delay rotation logic by 5 seconds
  if (!rotationAnimationStarted) {
    rotationAnimationStarted = true;
    setTimeout(() => {
      startRotationAnimation = true;
      initialRotation = zRotation;
      easedAngle = zRotation;
      finalTargetAngle = zRotation; // FIXED value
      easeStartTime = millis();
    }, 5000);
  }

  if (startRotationAnimation) {
    let elapsed = millis() - easeStartTime;
    rotationEase = constrain(elapsed / easeDuration, 0, 1);
    easedAngle = lerpAngle(easedAngle, zRotation, rotationEase);

    push();
    translate(width / 2, height / 2);
    rotate(easedAngle);
    imageMode(CENTER);
    image(logo1, 0, 0, 200, 200);
    pop();
  } else {
    // Track placeholder rotation before easing
    currentVisualAngle = zRotation;

    push();
    translate(width / 2, height / 2);
    // rotate(currentVisualAngle);
    imageMode(CENTER);
    image(logo1, 0, 0, 200, 200);
    pop();
  }
}

function handleOrientation(event) {
  if (event.beta !== null && event.gamma !== null) {
    hasDeviceOrientation = true;
    let beta = event.beta;
    let gamma = event.gamma;
    let alpha = event.alpha;

    let rX = map(gamma, -90, 90, -height / 2, height / 2);
    let rY = map(beta, -90, 90, -height, height);
    // zRotation = floor(alpha);
    zRotation = alpha;
    xRotation = floor(beta);
    yRotation = floor(gamma);
    console.log(zRotation);

    targetX = width / 2 + rX;
    targetY = height / 2 + rY;
    
    targetRot = map(beta, -90, 90, -PI, PI); // +/- 60 degrees
  }
}

function lerpAngle(a, b, t) {
  let delta = (b - a + 540) % 360 - 180;
  return a + delta * t;
}