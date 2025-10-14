// categories and their colors
let categories = {
  "A": "#ff595e",
  "B": "#1982c4",
  "C": "#8ac926",
  "D": "#ffca3a"
};

// particle class
class Particle {
  constructor(label, category) {
    this.x = random(0, width);
    this.y = random(0, height);
    this.r = random(6, 10);
    this.category = category;
    this.label = label;
    this.xSpeed = random(-1, 1);
    this.ySpeed = random(-1, 1);
  }

  createParticle() {
    noStroke();
    fill(categories[this.category]);
    circle(this.x, this.y, this.r * 2);
  }

  moveParticle() {
   this.x += this.xSpeed;
    this.y += this.ySpeed;

    // bounce off canvas edges
    if (this.x - this.r < 2 || this.x + this.r > width) this.xSpeed *= -1;
    if (this.y - this.r < 0 || this.y + this.r > height) this.ySpeed *= -1;
  }

  joinParticles(particles) {
    particles.forEach(element => {
      let dis = dist(this.x, this.y, element.x, element.y);
      if (dis < 200) {
        stroke('rgba(255,255,255,0.2)');
        strokeWeight(1);
        line(this.x, this.y, element.x, element.y);
      }
    });
  }

  isHovered(mx, my) {
    return dist(mx, my, this.x, this.y) < this.r + 2;
  }

  showTooltip() {
    fill(255);
    noStroke(0);
    textSize(14);
    textAlign(LEFT, BOTTOM);
    textFont('Courier New');
    text(this.label + " (" + this.category + ")", this.x + 5, this.y - 10);
  }
}

let particles = [];
let currentFilter = "All";

function setup() {
  createCanvas(windowWidth, windowHeight);

  // create filter buttons
  let cats = Object.keys(categories);
  cats.forEach((cat, i) => {
    let btn = createButton(cat);
    btn.position(20 + i * 60, 20);
    btn.mousePressed(() => currentFilter = cat);
  });

  let btnAll = createButton("All");
  btnAll.position(20 + cats.length * 60, 20);
  btnAll.mousePressed(() => currentFilter = "All");

  // create particles
  for (let i = 0; i < 40; i++) {
    let cat = random(cats);
    let label = "Point " + (i + 1);
    particles.push(new Particle(label, cat));
  }
}

function draw() {
  background('#0f0f0f');

  // filter visible particles
  let visibleParticles = particles.filter(p => currentFilter === "All" || p.category === currentFilter);

  for (let i = 0; i < visibleParticles.length; i++) {
    let p = visibleParticles[i];
    p.moveParticle();
    p.createParticle();
    p.joinParticles(visibleParticles.slice(i));

    if (p.isHovered(mouseX, mouseY)) {
      p.showTooltip();
    }
  }
}

function mousePressed() {
  for (let p of particles) {
    if (p.isHovered(mouseX, mouseY)) {
      console.log(`Clicked ${p.label} (Category: ${p.category})`);
      p.r = 12;
    } else {
      p.r = random(2, 10);
    }
  }
}
