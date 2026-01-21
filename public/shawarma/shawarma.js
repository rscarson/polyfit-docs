//
// Shawarma.js
//
// The shawarma king follows your cursor around the screen, while blaring his theme music.
// Also includes bouncing DVD logos for extra flair.
//
// To use:
//     <script type="module" src="/shawarma/shawarma.js"></script>
//     <link rel="stylesheet" href="/shawarma/shawarma.css" />
//
// I hid the trigger in the copyright icon:
//     <span class="crown">&copy;</span>
//
// Once the crown is clicked enough times, the shawarma king spawns.
// Clicking the crown again despawns the king.

// Options
const MAX_VELOCITY = 10;
const MAX_ACCELERATION = 0.1;
const MAX_ANGULAR_VELOCITY = 0.1;
const MAX_ANGULAR_ACCELERATION = 0.1;

const PARKING_ANGLE = 0.05; // radians
const PARKING_DISTANCE = 100; // pixels

const BOUNCE_AMPLITUDE = 1; // pixels
const BOUNCE_FREQUENCY = 0.01; // radians per tick

const DVDLOGO_SPEED = 2; // pixels per tick
const SHAWARMA_SPLAT_RESPAWN_DELAY = 1000; // ms

const TICK_INTERVAL = 20; // ms

const cursor = {
    x: -1, y: -1,
    handler: null,

    update(e) {
        this.x = e.clientX;
        this.y = e.clientY;
    },

    distanceFrom(x, y) {
        return Math.hypot(this.x - x, this.y - y);
    },

    angleTo(x, y) {
        return Math.atan2(y - this.y, x - this.x);
    },

    quadrant() {
        // Determine which quadrant of the viewport the cursor is in
        // 0: top-left, 1: top-right, 2: bottom-left, 3: bottom-right
        const vw = window.innerWidth; const vh = window.innerHeight;
        let quadrant = 0;
        if (this.x >= vw / 2) quadrant += 1;
        if (this.y >= vh / 2) quadrant += 2;
        return quadrant;
    },

    load() { 
        this.handler = (e) => this.update(e);
        this.handler = this.handler.bind(this);
        window.addEventListener('mousemove', this.handler);
    },
    unload() { window.removeEventListener('mousemove', this.handler); }
}

const splatEffect = {
    audio: new Audio('/shawarma/splat.mp3'),

    play() {
        this.audio.volume = 1.0;
        this.audio.loop = false;
        this.audio.play();
    }
}

const themeMusic = {
    audio: new Audio('/shawarma/theme.mp3'),

    update(distance) {
        // We update volume quadratically based on distance
        // And apply a low-pass filter to simulate muffling

        let newVolume = Math.max(0, 1 - (distance / 800));
        newVolume = newVolume * newVolume; // quadratic
        if (newVolume > 1) newVolume = 1;
        if (newVolume < 0) newVolume = 0;
        this.audio.volume = newVolume;

        // Low-pass filter frequency from 500Hz (far) to 22050Hz (close)
        let frequency = 500 + (1 - newVolume) * (22050 - 500);
        if (this.audio.context && this.audio.filter) {
            this.audio.filter.frequency.setValueAtTime(frequency, this.audio.context.currentTime);
        }
    },

    play() {
        this.audio.loop = true;
        this.audio.volume = 0;
        this.audio.play();
    },

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
    }
}

const dvdLogo = {
    handler: null,
    elements: [],

    splatCounter: null,
    splats: 0,

    spawn() {
        // Logo count is by bootstrap rules
        // small, 1, medium, 2, large, 3, xlarge, 4
        let logoCount = 4;
        if (window.innerWidth < 576) {
            logoCount = 1;
        } else if (window.innerWidth < 768) {
            logoCount = 2;
        } else if (window.innerWidth < 992) {
            logoCount = 3;
        }

        for (let i = 0; i < logoCount; i++) {
            let element = document.createElement('div');
            element.classList.add('dvd');
            document.body.insertBefore(element, document.body.firstChild);

            let negymaybe = (Math.random() < 0.5) ? -1 : 1;
            let negxmaybe = (Math.random() < 0.5) ? -1 : 1;

            this.elements.push({
                element: element,
                x: Math.random() * (window.innerWidth - element.offsetWidth),
                y: Math.random() * (window.innerHeight - element.offsetHeight),
                vx: (Math.random() < 0.5 ? -1 : 1) * DVDLOGO_SPEED * negxmaybe,
                vy: (Math.random() < 0.5 ? -1 : 1) * DVDLOGO_SPEED * negymaybe
            });
        }

        this.handler = setInterval(() => this.update(), TICK_INTERVAL);
    },

    despawn() {
        clearInterval(this.handler);
        for (let logo of this.elements) {
            document.body.removeChild(logo.element);
        }
        this.elements = [];
    },
    
    checkCollision(boundingBox) {
        // If any logo collides with the bounding box, update the splatometer and respawn the logo
        for (let logo of this.elements) {
            const logoRect = logo.element.getBoundingClientRect();
            if (
                logo.element.style.display !== 'none' &&
                logoRect.left < boundingBox.right &&
                logoRect.right > boundingBox.left &&
                logoRect.top < boundingBox.bottom &&
                logoRect.bottom > boundingBox.top
            ) {
                this.splats += 1;
                splatEffect.play();

                // Create a splat counter element and set the inner text to the current splat count
                if (this.splatCounter === null) {
                    this.splatCounter = document.createElement('div');
                    this.splatCounter.classList.add('splatometer');
                    document.body.appendChild(this.splatCounter);
                }
                this.splatCounter.innerText = this.splats.toString();

                // Respawn logo at random position
                logo.element.style.display = 'none';
                setTimeout(() => {
                    logo.x = Math.random() * (window.innerWidth - logo.element.offsetWidth);
                    logo.y = Math.random() * (window.innerHeight - logo.element.offsetHeight);
                    logo.element.style.display = 'block';
                    this.update();
                }, SHAWARMA_SPLAT_RESPAWN_DELAY);
            }
        }
    },

    update() {
        for (let logo of this.elements) {
            const vw = window.innerWidth - logo.element.offsetWidth;
            const vh = window.innerHeight - logo.element.offsetHeight;

            logo.x += logo.vx;
            logo.y += logo.vy;

            // Collision with viewport edges
            // But if partly offscreen, reverse direction
            if (logo.x < 0) {
                logo.x = 0;
                logo.vx = -logo.vx;
            }
            if (logo.x > vw) {
                logo.x = vw;
                logo.vx = -logo.vx;
            }
            if (logo.y < 0) {
                logo.y = 0;
                logo.vy = -logo.vy;
            }
            if (logo.y > vh) {
                logo.y = vh;
                logo.vy = -logo.vy;
            }

            logo.element.style.left = `${logo.x}px`;
            logo.element.style.top = `${logo.y}px`;
        }
    }
}

const theKing = {
    x: { v: 0, dv: 0 },
    y: { v: 0, dv: 0 },
    angle: { v: 0, dv: 0 },

    rightFacing: false,

    handler: null,
    element: null,

    spawn() {
        let vh = window.innerHeight - this.element?.offsetHeight || 0;
        let vw = window.innerWidth - this.element?.offsetWidth || 0;

        // First position the king in the furthest corner of the viewport from the cursor
        let quadrant = cursor.quadrant();
        switch (quadrant) {
            case 0: // top-left
                this.teleport(vw, vh);
                break;
            case 1: // top-right
                this.teleport(100, vh - 100);
                break;
            case 2: // bottom-left
                this.teleport(vw - 100, 100);
                break;
            case 3: // bottom-right
                this.teleport(100, 100);
                break;
        }

        // Now create and add the element to the DOM ( before everything else )
        this.element = document.createElement('div');
        this.element.classList.add('van');
        document.body.insertBefore(this.element, document.body.firstChild);


        // Set up the update handler on a tick interval
        this.handler = setInterval(() => this.update(), TICK_INTERVAL);
    },

    despawn() {
        clearInterval(this.handler);
        document.body.removeChild(this.element);
    },

    update() {
        let vh = window.innerHeight - this.element?.offsetHeight || 0;
        let vw = window.innerWidth - this.element?.offsetWidth || 0;

        // Actual parking distance is based on size
        let parkingDivisor = 1;
        if (window.innerWidth < 768) {
            parkingDivisor = 2;
        }
        const parkingDistance = PARKING_DISTANCE / parkingDivisor;

        const dist = cursor.distanceFrom(this.x.v, this.y.v) - parkingDistance;

        // Accelerate towards the cursor
        // Acceleration is proportional to distance, capped at MAX_ACCELERATION
        // It must become negative sharply near parkingDistance to avoid overshooting
        // At parking distance, acceleration is negative infinity (instant stop)
        let dax = 0;
        let day = 0;
        if (dist > parkingDistance) {
            dax = ((cursor.x - this.x.v) / dist) * MAX_ACCELERATION;
            day = ((cursor.y - this.y.v) / dist) * MAX_ACCELERATION;

            this.x.dv += dax;
            this.y.dv += day;
            if (Math.hypot(this.x.dv, this.y.dv) > MAX_VELOCITY) {
                // Cap velocity
                const angle = Math.atan2(this.y.dv, this.x.dv);
                this.x.dv = Math.cos(angle) * MAX_VELOCITY;
                this.y.dv = Math.sin(angle) * MAX_VELOCITY;
            }

            this.x.v += this.x.dv;
            this.y.v += this.y.dv;
        } else {
            // Within parking distance, decelerate to a stop
            this.x.dv *= 0.9;
            this.y.dv *= 0.9;
            this.x.v += this.x.dv;
            this.y.v += this.y.dv;
        }

        // Collision with viewport edges
        if (this.x.v < 0) {
            this.x.v = 0;
            this.x.dv = 0;
        } else if (this.x.v > vw) {
            this.x.v = vw;
            this.x.dv = 0;
        }
        if (this.y.v < 0) {
            this.y.v = 0;
            this.y.dv = 0;
        } else if (this.y.v > vh) {
            this.y.v = vh;
            this.y.dv = 0;
        }

        // If vx and vy and both zero - add a small bounce animation
        if (Math.hypot(this.x.dv, this.y.dv) < 0.1) {
            const time = Date.now();
            const bounceY = (Math.sin(time * BOUNCE_FREQUENCY) * BOUNCE_AMPLITUDE) / Math.PI;
            this.y.v += bounceY;
        }

        // Rotate toward the cursor
        if (Math.hypot(this.x.dv, this.y.dv) > 0.1) {
            let targetAngle = cursor.angleTo(this.x.v, this.y.v);

            // if right facing, flip target angle by π
            targetAngle = this.rightFacing ? targetAngle + Math.PI : targetAngle;

            // shortest signed angle [-π, π]
            let angleDiff = Math.atan2(
                Math.sin(targetAngle - this.angle.v),
                Math.cos(targetAngle - this.angle.v)
            );

            let angularAcceleration = 0;

            if (Math.abs(angleDiff) > PARKING_ANGLE) {
                // accelerate toward target angle
                angularAcceleration =
                    (angleDiff / Math.abs(angleDiff)) * MAX_ANGULAR_ACCELERATION;

                this.angle.dv += angularAcceleration;

                // cap angular velocity
                if (Math.abs(this.angle.dv) > MAX_ANGULAR_VELOCITY) {
                    this.angle.dv =
                        (this.angle.dv / Math.abs(this.angle.dv)) * MAX_ANGULAR_VELOCITY;
                }

                // debounce near target
                if (Math.abs(angleDiff) < 0.5) {
                    this.angle.dv *= 0.1;
                }

                this.angle.v += this.angle.dv;
            } else {
                // brake near target
                this.angle.dv *= 0.9;
                this.angle.v += this.angle.dv;
            }
        } else {
            this.angle.dv *= 0.1;
            this.angle.v += this.angle.dv;
        }



        // If the cursor is behind the king, flip the image with scaleX
        // and mirror the angle and angle velocity
        if (cursor.x < this.x.v && this.rightFacing) {
            this.rightFacing = false;
            this.angle.v = Math.atan2(
                Math.sin(this.angle.v + Math.PI),
                Math.cos(this.angle.v + Math.PI)
            );
            this.angle.dv = -this.angle.dv;
        } else if (cursor.x >= this.x.v && !this.rightFacing) {
            this.rightFacing = true;
            this.angle.v = Math.atan2(
                Math.sin(this.angle.v - Math.PI),
                Math.cos(this.angle.v - Math.PI)
            );
            this.angle.dv = -this.angle.dv;
        }

        this.teleport(this.x.v, this.y.v);
        themeMusic.update(dist);
        dvdLogo.checkCollision(this.element.getBoundingClientRect());
    },

    teleport(x, y) {
        this.x.v = x;
        this.y.v = y;

        if (this.element) {
            this.element.style.left = `${this.x.v}px`;
            this.element.style.top = `${this.y.v}px`;

            // Use css transform to rotate
            this.element.style.transform =
                `translate(-50%, -50%) rotate(${this.angle.v}rad)` +
                (this.rightFacing ? ' scaleX(-1)' : ' scaleX(1)');

        }
    }
}

cursor.load();

// Look for the first .crown element and attach a click handler
document.querySelectorAll('.crown').forEach((elem) => {
    elem.addEventListener('click', () => {
        let isSpawned = theKing.element !== null;
        if (isSpawned) {
            themeMusic.stop();
            theKing.despawn();
            dvdLogo.despawn();
            elem.style.opacity = '0.09';
        } else {
            // Get the opacity of the crown element
            const crown = document.querySelector('.crown');
            const beforeStyles = getComputedStyle(crown, '::before');

            let opacity = parseFloat(beforeStyles.opacity);
            opacity = isNaN(opacity) ? 0.09 : opacity;

            opacity += 0.25;
            
            // write the new opacity to the crown before pseudo-element
            crown.style.setProperty('--before-opacity', opacity.toString());

            if (opacity >= 1.0) {
                dvdLogo.spawn();
                theKing.spawn();
                themeMusic.play();
            }
        }
    });
});