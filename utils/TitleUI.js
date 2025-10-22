// TitleUI.js
// Handles HTML/CSS UI for the title screen

class TitleUI {
    constructor() {
        this.titleUI = document.getElementById('title-ui');
        this.gameTitle = document.getElementById('game-title');
        this.enterText = document.getElementById('enter-text');
        this.startBtn = document.getElementById('start-game-btn');
        this.resumeBtn = document.getElementById('resume-game-btn');
        // creditsBtn removed - credits now shown via hover on title
        this.currentLocationBtn = document.getElementById('current-location-btn');
        this.manualLocationBtn = document.getElementById('manual-location-btn');
        this.creditsDisplay = document.getElementById('title-credits-display');

        this.creditsText = `<u>Programming</u>
Tess Elliot
Sagar Singh

<u>Graphics</u>
Leilani Armstrong
Brian Bortz
Tess Elliot
Sara Mohajer
Saray Suarez
Jewell Watters
Skylar Wright

<u>Climate Advisors</u>
Gabrielle R. Brown
Renee McPherson

<u>˙⋆Thanks to⋆˙</u>
Rhizome, Inc
Arts and Humanities Forum
University of Oklahoma

Fuller Games, 2025`;

        this.typewriterTimeout = null;
        this.hideTimeout = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Click listener on game title only
        if (this.gameTitle) {
            this.gameTitle.addEventListener('click', () => {
                console.log('ULTIMATE SIM clicked - raising curtain');
                // Trigger curtain rise, then show menu
                if (window.raiseCurtain) {
                    window.raiseCurtain();
                }
                this.showMenu();
            });
        }

        // Only add event listeners if elements exist on this page
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => {
                console.log('Start button clicked');
                this.showLocationOptions();
            });
        }

        if (this.resumeBtn) {
            this.resumeBtn.addEventListener('click', () => {
                console.log('Resume button clicked');
                this.hide();
                // Trigger TitleScene to load saved game
                if (window.titleSceneInstance) {
                    window.titleSceneInstance.loadSavedGame();
                }
            });
        }

        // Credits button removed - credits now shown via hover on title

        if (this.currentLocationBtn) {
            this.currentLocationBtn.addEventListener('click', () => {
                console.log('Current Location button clicked');
                this.hideLocationOptions();
                // Trigger TitleScene to handle current location
                if (window.titleSceneInstance) {
                    window.titleSceneInstance.handleCurrentLocation();
                }
            });
        }

        if (this.manualLocationBtn) {
            this.manualLocationBtn.addEventListener('click', () => {
                console.log('Manual Location button clicked');
                this.hideLocationOptions();
                // Trigger TitleScene to handle manual location
                if (window.titleSceneInstance) {
                    window.titleSceneInstance.handleManualLocation();
                }
            });
        }
    }

    showLocationOptions() {
        // Hide main menu buttons (only if they exist)
        if (this.startBtn) this.startBtn.style.display = 'none';
        if (this.resumeBtn) this.resumeBtn.style.display = 'none';

        // Show location buttons (only if they exist)
        if (this.currentLocationBtn) {
            this.currentLocationBtn.style.display = 'block';
            this.currentLocationBtn.classList.add('pop-in');
        }
        if (this.manualLocationBtn) {
            this.manualLocationBtn.style.display = 'block';
            this.manualLocationBtn.classList.add('pop-in');
        }
    }

    hideLocationOptions() {
        if (this.currentLocationBtn) {
            this.currentLocationBtn.style.display = 'none';
            this.currentLocationBtn.classList.remove('pop-in');
        }
        if (this.manualLocationBtn) {
            this.manualLocationBtn.style.display = 'none';
            this.manualLocationBtn.classList.remove('pop-in');
        }
    }

    // Typewriter credits method removed - credits now shown via hover toggle in index.html

    show() {
        if (this.titleUI) this.titleUI.classList.add('show');
        // Show title, hide buttons initially
        if (this.gameTitle) this.gameTitle.style.display = 'block';

        // Hide buttons initially
        if (this.startBtn) this.startBtn.style.display = 'none';
        if (this.resumeBtn) this.resumeBtn.style.display = 'none';
    }

    hide() {
        if (this.titleUI) this.titleUI.classList.remove('show');
    }

    showMenu() {
        // showTitleButtons is now called from raiseCurtain() in index.html after curtain fades
        // This method is no longer needed, but kept for compatibility
        // The buttons will appear automatically after the curtain animation completes
    }
}
