class UIScene extends UIBlock {
    constructor(config) {
        super();

        this.emitter = EventDispatcher.getInstance();
        this.scene = config.scene;

        // Camera setup
        this.camUI = this.scene.cameras.add(28, 28, 125, 300);
        this.camUI.setOrigin(10, 10);
        this.camUI.setZoom(1);
        this.camUI.centerOn = true;

        // Button configuration array
        const buttonConfig = [
            { x: 0, y: 0, texture: "button_move", pointerdown: "moveMap", pointerup: "button1Up", hoverText: "Move Map (SHIFT)" },
            { x: 32, y: 0, texture: "button_zoom", pointerdown: "zoomMap", pointerup: "button2Up", hoverText: "Zoom Map (SPACE)" },
            { x: 64, y: 0, texture: "button_rotate", pointerdown: "rotateMap", pointerup: "button3Up", hoverText: "Rotate Map (R)" },
            { x: 0, y: 32, texture: "button_info", pointerdown: "infoMap", pointerup: "button4Up", hoverText: "Get Map Info" },
            { x: 64, y: 32, texture: "button_bulldoze", pointerdown: "destroy", pointerup: "button5Up", hoverText: "Bulldoze -1" },
            { x: 32, y: 32, texture: "button_home", pointerdown: "goHome", pointerup: "button6Up", hoverText: "Center Map (F)" },
            { x: 0, y: 64, texture: "button_sun", pointerdown: "buildSolar", pointerup: "button7Up", hoverText: "Build Solar Power +6" },
            { x: 32, y: 64, texture: "button_wind", pointerdown: "buildWind", pointerup: "button8Up", hoverText: "Build Wind Power +8" },
            { x: 64, y: 64, texture: "button", pointerdown: null, pointerup: "button9Up", hoverText: null },
            { x: 0, y: 96, texture: "button_trees", pointerdown: "plantTrees", pointerup: "button10Up", hoverText: "Plant Trees +5" },
            { x: 32, y: 96, texture: "button", pointerdown: "buildMedium", pointerup: "button11Up", hoverText: "Build Green Apartments +3" },
            { x: 64, y: 96, texture: "button_electric", pointerdown: "buildLarge", pointerup: "button12Up", hoverText: "Build Hydrogen Power +10" },
            { x: 0, y: 128, texture: "button", pointerdown: "buildBikeLane", pointerup: "button13Up", hoverText: "Build Bike Lane" },
            { x: 32, y: 128, texture: "button", pointerdown: "buildRoad", pointerup: "button14Up", hoverText: "Build Road" },
            { x: 64, y: 128, texture: "button", pointerdown: null, pointerup: "button15Up", hoverText: null },
            { x: 0, y: 160, texture: "button", pointerdown: "unDo", pointerup: "button16Up", hoverText: "Undo (U)" }
        ];

        this.buttons = [];

// Create all buttons using the config
buttonConfig.forEach((config, index) => {
    // 🔑 Skip button 1 - we'll replace it with a dropdown
    if (index === 0) {
        // Create dropdown for button 1 position
        const moveDropdown = new DropdownMenu(this.scene, {
            x: config.x,
            y: config.y,
            width: 32,
            height: 32,
            direction: 'right',
            options: [
                { label: "Move", value: "move", texture: "button_move" },
                { label: "Bulldoze", value: "bulldoze", texture: "button_bulldoze" },
                { label: "Info", value: "info", texture: "button_info" }
            ],
            bgColor: 0x2a2a2a,
            textColor: '#ffffff',
            fontSize: '10px',
            itemHeight: 30,
            depth: 100000,
            onChange: (value, label) => {
                console.log("Move dropdown selected:", value);
                if (value === "move") this.moveMap();
                if (value === "bulldoze") this.destroy();
                if (value === "info") this.infoMap();
            }
        });

        this.scene.add.existing(moveDropdown);
        moveDropdown.setScrollFactor(0);

        // Store reference
        this.moveDropdown = moveDropdown;
        this.buttons.push(moveDropdown);

        return; // Skip normal button creation
    }

    // Normal button creation for all other buttons
    const btn = this.scene.add.image(config.x, config.y, config.texture);
    btn.setOrigin(0, 0);
    btn.setInteractive();
    btn.setScrollFactor(0);
    btn.setDepth(10000);

    // Store original texture for reset
    btn.originalTexture = config.texture;

    // Bind event handlers
    if (config.pointerdown) {
        btn.on("pointerdown", this[config.pointerdown].bind(this));
    }
    btn.on("pointerup", this[config.pointerup].bind(this));

    // Add hover handlers for info text
    if (config.hoverText) {
        btn.on("pointerover", () => {
            this.scene.getInfo.text = config.hoverText;
        });

        btn.on("pointerout", () => {
            // Show current active mode when not hovering
            this.scene.getInfo.text = '';
        });
    }

    this.add(btn);
    this.buttons.push(btn);

    // Store as btn1, btn2, etc. for backwards compatibility
    this[`btn${index + 1}`] = btn;
});

        // Store UI bounds for other systems to check
        this.uiBounds = {
            x: 28,
            y: 28,
            width: 96,
            height: 192
        };

        // Make it accessible from the scene
        this.scene.uiBounds = this.uiBounds;
    }

    moveMap() {
        this.btn1.setTexture("button_move_clicked");
        this.emitter.emit("MOVE MAP");
    }

    zoomMap() {
        this.btn2.setTexture("button_zoom_clicked");
        this.emitter.emit("ZOOM MAP");
    }

    rotateMap() {
        this.btn3.setTexture("button_rotate_clicked");
        this.emitter.emit("ROTATE MAP");
    }

    infoMap() {
        this.btn4.setTexture("button_info_clicked");
        this.emitter.emit("INFO MAP");
    }

    destroy() {
        this.btn5.setTexture("button_bulldoze_clicked");
        this.emitter.emit("DESTROY");
    }

    goHome() {
        this.btn6.setTexture("button_home_clicked");
        this.emitter.emit("GO HOME");
    }

    buildSolar() {
        this.btn7.setTexture("button_sun_clicked");
        this.emitter.emit("BUILD SOLAR");
    }

    buildWind() {
        this.btn8.setTexture("button_wind_clicked");
        this.emitter.emit("BUILD WIND");
    }

    plantTrees() {
        this.btn10.setTexture("button_trees_clicked");
        this.emitter.emit("PLANT TREES");
    }

    buildMedium() {
        this.btn11.setTexture("button_clicked");
        this.emitter.emit("BUILD MEDIUM");
    }

    buildLarge() {
        this.btn12.setTexture("button_electric_clicked");
        this.emitter.emit("BUILD LARGE");
    }

    buildBikeLane() {
        this.btn13.setTexture("button_clicked");
        this.emitter.emit("BUILD BIKE LANE");
    }

    buildRoad() {
        this.btn14.setTexture("button_clicked");
        this.emitter.emit("BUILD ROAD");
    }

    unDo() {
        this.btn16.setTexture("button_clicked");
        this.emitter.emit("UN DO");
    }

    button1Up() {
        this.btn1.setTexture("button_move");
    }

    button2Up() {
        this.btn2.setTexture("button_zoom");
    }

    button3Up() {
        this.btn3.setTexture("button_rotate");
    }

    button4Up() {
        this.btn4.setTexture("button_info");
    }

    button5Up() {
        this.btn5.setTexture("button_bulldoze");
    }

    button6Up() {
        this.btn6.setTexture("button_home");
    }

    button7Up() {
        this.btn7.setTexture("button_sun");
    }

    button8Up() {
        this.btn8.setTexture("button_wind");
    }

    button9Up() {
        this.btn9.setTexture("button");
    }

    button10Up() {
        this.btn10.setTexture("button_trees");
    }

    button11Up() {
        this.btn11.setTexture("button");
    }

    button12Up() {
        this.btn12.setTexture("button_electric");
    }

    button13Up() {
        this.btn13.setTexture("button");
    }

    button14Up() {
        this.btn14.setTexture("button");
    }

    button15Up() {
        this.btn15.setTexture("button");
    }

    button16Up() {
        this.btn16.setTexture("button");
    }
}