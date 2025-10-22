import { setLocation } from "../services/location.js"; // Adjust path as necessary
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
        this.load.image("background", "assets/ui/backgrounds/background_title.png");

        // Log when image loads to check dimensions
        this.load.on('filecomplete-image-background', (key, type, data) => {
            console.log('🖼️ Background image loaded:', key);
            console.log('📐 Image dimensions:', data.width, 'x', data.height);
        });
    }

    create() {
        const bkgd = this.add.image(500, 300, "background");
        bkgd.setScale(4);

        // Log the texture dimensions
        const texture = this.textures.get('background');
        console.log('🎨 Background texture size:', texture.source[0].width, 'x', texture.source[0].height);

        // Make this instance globally available for HTML UI
        window.titleSceneInstance = this;

        // Initialize HTML title UI and show it immediately
        if (!window.titleUI) {
            window.titleUI = new TitleUI();
        }
        // Show the title screen with CSS title
        window.titleUI.show();
    }

    async handleCurrentLocation() {
        window.locationChoice = "current";

        // Hide the title UI completely
        if (window.titleUI) {
            window.titleUI.hide();
        }

        // Show loading message in Phaser
        const loadingText = this.add.text(500, 300, "Getting your location...", {
            fontFamily: 'Press Start 2P',
            fontSize: '12pt',
            fill: "#0f0",
        }).setOrigin(0.5).setShadow(1, 1, '#000000', 2, false, true).setScale(0.85, 1);

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
                // Show location options again
                if (window.titleUI) {
                    window.titleUI.showLocationOptions();
                }
            }, 3000);
        }
    }

    handleManualLocation() {
        window.locationChoice = "manual";

        // Hide the title UI completely
        if (window.titleUI) {
            window.titleUI.hide();
        }

        // Pass a callback to start the game only after the form is submitted
        this.manualLocationForm(() => {
            console.log("Starting game with manually entered location.");

            // Check if the city and state are correctly set before proceeding
            console.log("City in callback:", this.city);
            console.log("State in callback:", this.state);

            // Start the game scene
            this.scene.start("playingGame");
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
        console.log('🔍 loadSavedGame called');

        // Check all localStorage keys
        console.log('📦 All localStorage keys:', Object.keys(localStorage));

        const savedMapString = localStorage.getItem("savedMap");
        console.log('🗺️ savedMap value:', savedMapString);

        if (savedMapString) {
            try {
                const parsedMap = JSON.parse(savedMapString);
                console.log('✅ Parsed savedMap:', parsedMap);
                console.log('🎮 Starting game with resume: true');
                this.scene.start("playingGame", { resume: true });
            } catch (e) {
                console.error('❌ Error parsing savedMap:', e);
                alert("Saved game data is corrupted. Please start a new game.");
            }
        } else {
            console.log('❌ No saved game found in localStorage');
            alert("No saved game found. Please start a new game.");

            // Show the title UI again instead of calling non-existent locationOptions
            if (window.titleUI) {
                window.titleUI.show();
            }
        }
    }
}

// Create an instance and export it
export const titleSceneInstance = new TitleScene();