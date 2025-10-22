// BorderAnimation.js
// Animates the border radius of container corners

class BorderAnimation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.warn(`Container ${containerId} not found`);
            return;
        }

        // Initialize only top corners (bottom corners stay at 0)
        this.corners = {
            topLeft: this.initCorner(),
            topRight: this.initCorner()
        };

        // Start animation
        this.animate();
    }

    initCorner() {
        // Random initial value between 0 and 40
        const value = Math.random() * 40;

        // Randomly choose to go to 0 or 40 as max
        const max = Math.random() > 0.5 ? 40 : 0;

        // Set direction based on where we're heading
        const dir = max === 40 ? 1 : -1;

        // Speed range
        const minSpeed = 0.01875; // 8x slower
        const maxSpeed = 0.15;    // base speed

        // Random initial speed
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

        // Random speed direction (1 = speeding up, -1 = slowing down)
        const speedDir = Math.random() > 0.5 ? 1 : -1;

        // Speed change rate (how fast the speed itself changes)
        const speedChangeRate = 0.0005;

        return {
            value: value,
            max: max,
            dir: dir,
            speed: speed,
            speedDir: speedDir,
            minSpeed: minSpeed,
            maxSpeed: maxSpeed,
            speedChangeRate: speedChangeRate
        };
    }

    updateCorner(corner) {
        // Update the speed itself (oscillate speed between min and max)
        corner.speed += corner.speedDir * corner.speedChangeRate;

        if (corner.speed >= corner.maxSpeed) {
            corner.speed = corner.maxSpeed;
            corner.speedDir = -1; // Start slowing down
        } else if (corner.speed <= corner.minSpeed) {
            corner.speed = corner.minSpeed;
            corner.speedDir = 1; // Start speeding up
        }

        // Update corner position with current speed
        corner.value += corner.dir * corner.speed;

        if (corner.max === 40) {
            // Oscillating between current and 40
            if (corner.value >= 40) {
                corner.value = 40;
                corner.dir = -1;
            } else if (corner.value <= 0) {
                corner.value = 0;
                corner.dir = 1;
            }
        } else {
            // Oscillating between current and 0
            if (corner.value >= 40) {
                corner.value = 40;
                corner.dir = -1;
            } else if (corner.value <= 0) {
                corner.value = 0;
                corner.dir = 1;
            }
        }
    }

    animate() {
        // Update only top corners
        this.updateCorner(this.corners.topLeft);
        this.updateCorner(this.corners.topRight);

        // Apply to container (bottom corners stay at 0)
        this.container.style.borderTopLeftRadius = `${this.corners.topLeft.value}px`;
        this.container.style.borderTopRightRadius = `${this.corners.topRight.value}px`;
        this.container.style.borderBottomLeftRadius = '0px';
        this.container.style.borderBottomRightRadius = '0px';

        // Continue animation
        requestAnimationFrame(() => this.animate());
    }
}
