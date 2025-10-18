import { setLocation } from "../location.js"; // Adjust path as necessary
export class TitleScene extends Phaser.Scene {
    constructor() {
        super("bootGame");
        this.minLat = null;
        this.minLon = null;
        this.city = ""; // Add city property
        this.state = ""; // Add state property
    }

    getCity() {
        return this.city;
    }

    getState() {
        return this.state;
    }
    preload() {
        this.load.image("background", "assets/background_title.png");
        this.load.spritesheet("title", "assets/game_title.png", {
            frameWidth: 800,
            frameHeight: 80,
        });
        // Add game_tile spritesheet
        this.load.spritesheet("game_tile", "assets/game_title.png", {
            frameWidth: 64, // adjust if needed
            frameHeight: 64, // adjust if needed
        });
    }

    create() {
        const bkgd = this.add.image(500, 300, "background");
        bkgd.setScale(4);

        const title = this.add.sprite(500, 300, "title");

        this.anims.create({
            key: "title",
            frames: this.anims.generateFrameNumbers("title", {
                frames: [0, 1, 2, 3, 4, 5],
            }),
            frameRate: 1,
            repeat: -1,
        });

        title.play("title");

        title.setOrigin(0.5, 0.5);
        title.setInteractive();

        title.on("pointerdown", () => {
            title.setVisible(false);
            this.showMenu();
        });
    }

    showMenu() {
        const startGameButton = this.add.text(500, 250, "Start", { fill: "#0f0" }).setShadow(1, 1, '#000000', 2, false, true);
        const resumeGameButton = this.add.text(500, 300, "Resume Game", {
            fill: "#0f0",
        }).setShadow(1, 1, '#000000', 2, false, true);

        startGameButton.setOrigin(0.5, 0.5).setInteractive();
        resumeGameButton.setOrigin(0.5, 0.5).setInteractive();

        startGameButton.on("pointerdown", () => {
            startGameButton.setVisible(false);
            resumeGameButton.setVisible(false);
            this.locationOptions();
        });

        resumeGameButton.on("pointerdown", () => {
            startGameButton.setVisible(false);
            resumeGameButton.setVisible(false);
            this.loadSavedGame();
        });
    }

    locationOptions() {
        const currentLocationButton = this.add.text(500, 250, "Current Location", {
            fill: "#0f0",
        }).setShadow(1, 1, '#000000', 2, false, true);
        const manualLocationButton = this.add.text(500, 300, "Manual Location", {
            fill: "#0f0",
        }).setShadow(1, 1, '#000000', 2, false, true);

        currentLocationButton.setOrigin(0.5, 0.5).setInteractive();
        manualLocationButton.setOrigin(0.5, 0.5).setInteractive();

        currentLocationButton.on("pointerdown", async () => {
            currentLocationButton.setVisible(false);
            manualLocationButton.setVisible(false);
            window.locationChoice = "current";

            // Show loading message
            const loadingText = this.add.text(500, 300, "Getting your location...", {
                fill: "#0f0",
            }).setOrigin(0.5).setShadow(1, 1, '#000000', 2, false, true);

            try {
                // Get browser geolocation
                const position = await new Promise((resolve, reject) => {
                    if (!navigator.geolocation) {
                        reject(new Error("Geolocation not supported"));
                        return;
                    }
                    navigator.geolocation.getCurrentPosition(
                        resolve,
                        reject,
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                });

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log("Got browser location:", lat, lon);

                // Store in location.js
                setLocation(lat.toString(), lon.toString());

                loadingText.destroy();
                this.scene.start("playingGame");

            } catch (error) {
                console.error("Location error:", error);
                loadingText.setText("Location access denied.\nPlease use Manual Location.");

                setTimeout(() => {
                    loadingText.destroy();
                    this.locationOptions();
                }, 3000);
            }
        });

        manualLocationButton.on("pointerdown", () => {
            currentLocationButton.setVisible(false);
            manualLocationButton.setVisible(false);
            window.locationChoice = "manual";

            // Pass a callback to start the game only after the form is submitted
            this.manualLocationForm(() => {
                console.log("Starting game with manually entered location.");

                // Check if the city and state are correctly set before proceeding
                console.log("City in callback:", this.city);
                console.log("State in callback:", this.state);

                // Start the game scene
                this.scene.start("playingGame");
            });
        });
    }

    manualLocationForm(callback) {
        const formHTML = `
        <form id="locationForm" style="background-color: white; padding: 10px;">
            <label for="city">Latitude:</label>
            <input type="text" id="city" name="city"><br><br>
            <label for="state">Longitude:</label>
            <input type="text" id="state" name="state"><br><br>
            <button type="button" id="submitButton">Submit</button>
        </form>
        `;

        const element = this.add.dom(500, 300).createFromHTML(formHTML);
        element.setOrigin(0.5, 0.5);

        this.setupFormSubmission(element, callback);
    }
    setupFormSubmission(element, callback) {
        const submitButton = element.getChildByID("submitButton");

        if (submitButton) {
            submitButton.addEventListener("click", () => {
                const city = element.getChildByID("city").value;
                const state = element.getChildByID("state").value;

                console.log(`Form submitted with city: ${city}, state: ${state}`); // Debug log

                if (city && state) {
                    // Set location using the imported function
                    setLocation(city, state);

                    if (callback) {
                        callback(); // Call the callback after setting the values
                    }
                } else {
                    console.log("Please enter both city and state.");
                }
            });
        } else {
            console.error("Submit button not found.");
        }
    }

    loadSavedGame() {
        const savedMapString = localStorage.getItem("savedMap");
        if (savedMapString) {
            this.scene.start("playingGame", { resume: true });
        } else {
            alert("No saved game found. Starting a new game.");
            this.locationOptions();
        }
    }
}

// Create an instance and export it
export const titleSceneInstance = new TitleScene();