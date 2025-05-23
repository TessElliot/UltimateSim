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
    }

    create() {

      const bkgd = this.add.image(500, 300, "background");
        bkgd.setScale(4);

      const text = this.add.text(500, 270, "ULTIMATE SIM", {
          fontFamily: 'Tahoma', // Sets the font family to Arial
          fontSize: '48px',
          color: '#a7e3ff'
      }).setShadow(1, 1, '#000', 2, false, true);

    text.setOrigin(0.5, 0.5);
    text.setInteractive();

    text.on("pointerdown", () => {
      text.setVisible(false);
      //this.showMenu();
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

      // Fetch current location asynchronously and start the game only after obtaining coordinates
      // await this.fetchCurrentLocation();
      this.scene.start("playingGame");
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
