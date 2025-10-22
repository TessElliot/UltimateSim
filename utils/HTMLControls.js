// HTMLControls.js
// Connects HTML/CSS buttons to the game's event system

class HTMLControls {
    constructor(emitter) {
        this.emitter = emitter;
        this.activeButton = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Map button actions to emitter events
        const buttonMap = {
            'move': 'MOVE MAP',
            'zoom': 'ZOOM MAP',
            'rotate': 'ROTATE MAP',
            'info': 'INFO MAP',
            'bulldoze': 'DESTROY',
            'home': 'GO HOME',
            'solar': 'BUILD SOLAR',
            'wind': 'BUILD WIND',
            'hydrogen': 'BUILD LARGE',
            'trees': 'PLANT TREES',
            'apartments': 'BUILD MEDIUM',
            'bike': 'BUILD BIKE LANE',
            'road': 'BUILD ROAD',
            'undo': 'UN DO',
            'save': 'SAVE GAME'
        };

        // Get all menu items
        const menuItems = document.querySelectorAll('.menu-item');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const event = buttonMap[action];

                if (!event) {
                    console.warn(`No event mapped for action: ${action}`);
                    return;
                }

                console.log(`🎮 HTML Menu clicked: ${action} → ${event}`);

                // Toggle active state for mode-based items
                if (['move', 'info', 'bulldoze', 'solar', 'wind', 'hydrogen', 'trees', 'apartments', 'bike', 'road'].includes(action)) {
                    // Remove active from all items
                    menuItems.forEach(mi => mi.classList.remove('active'));

                    // Add active to clicked item
                    item.classList.add('active');
                    this.activeButton = item;
                } else {
                    // For instant actions (zoom, rotate, home, undo, save), just flash
                    item.classList.add('active');
                    setTimeout(() => item.classList.remove('active'), 200);
                }

                // Emit the event
                this.emitter.emit(event);
            });
        });

        console.log('✅ HTML Controls initialized');
    }

    // Reset all menu item states
    resetButtons() {
        const items = document.querySelectorAll('.menu-item');
        items.forEach(item => item.classList.remove('active'));
        this.activeButton = null;
    }

    // Set a specific menu item as active
    setActiveButton(action) {
        this.resetButtons();
        const item = document.querySelector(`[data-action="${action}"]`);
        if (item) {
            item.classList.add('active');
            this.activeButton = item;
        }
    }

    // Show/hide the menu bar
    show() {
        const menu = document.getElementById('game-menu');
        if (menu) menu.style.display = 'block';
    }

    hide() {
        const menu = document.getElementById('game-menu');
        if (menu) menu.style.display = 'none';
    }
}
