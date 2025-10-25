let table;
let particles = [];
let currentFilter = "All";
let layoutMode = "free";
let selectedParticle = null;
let tooltip;

let categories = {
  "A": "#FFBCBE",
  "B": "#B2DCF7",
  "C": "#97F7CE",
  "D": "#FF9242"
};

function preload() {
  table = loadTable('testdata.csv', 'csv', 'header');
}

class Particle {
  constructor(label, category, value) {
    this.label = label;
    this.category = category;
    this.value = value;
    this.r = 6;
    this.x = random(width);
    this.y = random(height);
    this.xSpeed = random(-0.3, 0.3);
    this.ySpeed = random(-0.3, 0.3);
  }

  move() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;
    if (this.x - this.r < 0 || this.x + this.r > width) this.xSpeed *= -1;
    if (this.y - this.r < 0 || this.y + this.r > height) this.ySpeed *= -1;
  }

  draw() {
    push();
    translate(this.x, this.y);
    stroke(50);
    strokeWeight(1);
    fill(categories[this.category] || '#888');
    ellipse(0, 0, this.r * 2);
    pop();
  }

  isHovered(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r + 5;
  }

  joinParticles(particles) {
    particles.forEach(other => {
      if (other === this) return;
      let d = dist(this.x, this.y, other.x, other.y);
      if (d < 200) {
        stroke(255, 100); // white with transparency
        strokeWeight(1);
        line(this.x, this.y, other.x, other.y);
      }
    });
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  // --- Tooltip ---
  tooltip = createDiv("");
  tooltip.id("tooltip");

  // --- Container for category buttons ---
  let categoryContainer = createDiv('');
  categoryContainer.id('category-container');

  let catKeys = Object.keys(categories);
  catKeys.forEach(cat => {
    let btn = createButton(cat);
    btn.class("category-btn");
    btn.parent(categoryContainer);
    btn.mousePressed(() => currentFilter = cat);
  });

  let btnAll = createButton("All");
  btnAll.class("category-btn");
  btnAll.parent(categoryContainer);
  btnAll.mousePressed(() => currentFilter = "All");

  // --- Container for layout buttons ---
  let layoutContainer = createDiv('');
  layoutContainer.id('layout-container');

  let layouts = ["free", "grid", "circle", "hexagon"];
  layouts.forEach(layout => {
    let btn = createButton(layout);
    btn.class("layout-btn");
    btn.parent(layoutContainer);
    btn.mousePressed(() => layoutMode = layout);
  });

  // --- Create particles from CSV ---
  for (let r = 0; r < table.getRowCount(); r++) {
    let label = table.getString(r, "name");
    let cat = table.getString(r, "category");
    let value = table.getString(r, "paragraph");
    particles.push(new Particle(label, cat, value));
  }
}

function draw() {
  background('#0f0f0f');

  let visible = particles.filter(p => currentFilter === "All" || p.category === currentFilter);

  // Move particles in free mode
  if (layoutMode === "free") {
    for (let p of visible) p.move();
  }

  // Draw particles and network lines
  for (let i = 0; i < visible.length; i++) {
    let p = visible[i];
    p.draw();
    p.joinParticles(visible.slice(i));
  }

  // Tooltip display
  if (selectedParticle) {
    tooltip.html(`<b>${selectedParticle.label} (${selectedParticle.category})</b><br>${selectedParticle.value.substring(0, 200)}...`);
tooltip.position(selectedParticle.x + 15, selectedParticle.y + 15);
    tooltip.show();
  } else {
    tooltip.hide();
  }

  // Optional: call layout functions
  applyLayout();
}

// === Layouts ===
function applyLayout() {
  if (layoutMode === "grid") arrangeGrid();
  else if (layoutMode === "circle") arrangeCircle();
  else if (layoutMode === "hexagon") arrangeHexagon();
 
}

function arrangeGrid() {
  let cols = 10;
  let spacingX = width / (cols + 1);
  let spacingY = height / (ceil(particles.length / cols) + 1);
  for (let i = 0; i < particles.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let targetX = (col + 1) * spacingX;
    let targetY = (row + 1) * spacingY;
    particles[i].x = lerp(particles[i].x, targetX, 0.05);
    particles[i].y = lerp(particles[i].y, targetY, 0.05);
  }
}

function arrangeCircle() {
  let centerX = width / 2;
  let centerY = height / 2;
  let total = particles.length;
  let ringSpacing = 100; // distance between rings
  let particlesPlaced = 0;

  let ringNumber = 1;

  while (particlesPlaced < total) {
    let radius = ringNumber * ringSpacing;

    // estimate how many particles for this ring
    let circumference = TWO_PI * radius;
    let approxCount = floor(circumference / 20); // 20 = approximate spacing between particles
    let countInRing = min(approxCount, total - particlesPlaced);

    for (let i = 0; i < countInRing; i++) {
      let angle = map(i, 0, countInRing, 0, TWO_PI);
      let targetX = centerX + cos(angle) * radius;
      let targetY = centerY + sin(angle) * radius;

      particles[particlesPlaced].x = lerp(particles[particlesPlaced].x, targetX, 0.05);
      particles[particlesPlaced].y = lerp(particles[particlesPlaced].y, targetY, 0.05);

      particlesPlaced++;
    }

    ringNumber++;
  }
}



function arrangeHexagon() {
  let total = particles.length;

  // Choose approximate radius based on canvas size and number of particles
  let cols = ceil(sqrt(total * width / height)); // dynamically calculate columns
  let rows = ceil(total / cols);                // rows needed to fit all particles

  let radiusX = width / (cols + 0.5);  // horizontal spacing
  let radiusY = height / (rows + 0.5); // vertical spacing

  let count = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (count >= total) return; // stop if we placed all particles

      let x = col * radiusX + radiusX / 2;
      if (row % 2 == 1) x += radiusX / 2; // stagger odd rows

      let y = row * radiusY + radiusY / 2;

      // Smoothly move particle to its position
      particles[count].x = lerp(particles[count].x, x, 0.05);
      particles[count].y = lerp(particles[count].y, y, 0.05);

      count++;
    }
  }
}





// === Mouse interactions ===
function mousePressed() {
  let found = false;
  for (let p of particles) {
    if (p.isHovered(mouseX, mouseY)) {
      if (selectedParticle === p) selectedParticle = null;
      else selectedParticle = p;
      found = true;
      break;
    }
  }
  if (!found) selectedParticle = null;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
