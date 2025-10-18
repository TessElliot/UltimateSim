class DropdownMenu extends Phaser.GameObjects.Container {
    constructor(scene, config) {
        super(scene, config.x || 0, config.y || 0);
        
        this.scene = scene;
        this.config = config;
        this.width = config.width || 200;
        this.options = config.options || [];
        this.onChange = config.onChange || (() => {});
        this.selectedIndex = config.defaultIndex || 0;
        this.isOpen = false;
        this.direction = config.direction || 'right';
        
        // Styling configuration
        this.style = {
            height: config.height || 40,
            itemHeight: config.itemHeight || 36,
            maxVisibleItems: config.maxVisibleItems || 6,
            bgColor: config.bgColor || 0x1a1a1a,
            bgHoverColor: config.bgHoverColor || 0x2a2a2a,
            bgSelectedColor: config.bgSelectedColor || 0x3a3a3a,
            textColor: config.textColor || '#ffffff',
            fontSize: config.fontSize || '16px',
            borderColor: config.borderColor || 0x444444,
            borderWidth: config.borderWidth || 2,
            arrowColor: config.arrowColor || '#888888'
        };
        
        this.createDropdown();
        this.setScrollFactor(0);
        this.setDepth(config.depth || 100000);  // Very high depth to be on top of everything
    }
    
    createDropdown() {
        // Main button background
        this.mainBg = this.scene.add.graphics();
        this.drawBox(this.mainBg, 0, 0, this.width, this.style.height, this.style.bgColor);
        this.add(this.mainBg);

        // Selected text display
        this.selectedText = this.scene.add.text(
            12,
            this.style.height / 2,
            this.options[this.selectedIndex]?.label || 'Select...',
            {
                fontSize: this.style.fontSize,
                color: this.style.textColor,
                fontFamily: 'Arial'
            }
        );
        this.selectedText.setOrigin(0, 0.5);
        this.add(this.selectedText);

        // Arrow icon
        this.arrow = this.scene.add.text(
            this.width - 20,
            this.style.height / 2,
            '▼',
            {
                fontSize: '12px',
                color: this.style.arrowColor
            }
        );
        this.arrow.setOrigin(0.5, 0.5);
        this.add(this.arrow);

        this.mainHitArea = this.scene.add.rectangle(
            0, 
            0, 
            this.width,
            this.style.height,
            0xff0000,
            0
        );
        this.mainHitArea.setOrigin(0, 0);
        this.mainHitArea.setInteractive({ useHandCursor: true });

        this.mainHitArea.on('pointerdown', (pointer) => {
            console.log('🎯 MAIN HIT AREA CLICKED!');
            pointer.event.stopPropagation();
            this.justOpened = true;  // ← Add this flag
            this.toggleDropdown();
        });

        //this.mainHitArea.setDepth(25000);
        this.mainHitArea.setScrollFactor(0);
        this.add(this.mainHitArea);

        // Dropdown panel (initially hidden)
        this.createDropdownPanel();

        // Setup interactions
        this.setupMainButtonInteractions();

        // Close dropdown when clicking outside
        // Close dropdown when clicking outside (delayed to let button handler run first)
        this.scene.input.on('pointerdown', (pointer) => {
            this.scene.time.delayedCall(1, () => {
                this.handleOutsideClick(pointer);
            });
        }, this);
    }  // 🔑 This closes createDropdown()
    
    drawBox(graphics, x, y, width, height, color) {
        graphics.clear();
        graphics.fillStyle(color, 1);
        graphics.fillRoundedRect(x, y, width, height, 4);
        graphics.lineStyle(this.style.borderWidth, this.style.borderColor, 1);
        graphics.strokeRoundedRect(x, y, width, height, 4);
    }
    
    createDropdownPanel() {
        const visibleItems = Math.min(this.options.length, this.style.maxVisibleItems);

        // 🔑 Calculate panel dimensions and position based on direction
        if (this.direction === 'right') {
            // Horizontal layout
            this.panelWidth = visibleItems * this.width;
            this.panelHeight = this.style.height;
            this.panelX = this.width + 2;
            this.panelY = 0;
            this.itemSize = this.width;
        } else {
            // Vertical layout (default)
            this.panelWidth = this.width;
            this.panelHeight = visibleItems * this.style.itemHeight;
            this.panelX = 0;
            this.panelY = this.style.height + 2;
            this.itemSize = this.style.itemHeight;
        }

        // Panel container
        this.panel = this.scene.add.container(this.panelX, this.panelY);
        this.panel.setVisible(false);
        this.add(this.panel);

        // Panel background
        this.panelBg = this.scene.add.graphics();
        this.drawBox(this.panelBg, 0, 0, this.panelWidth, this.panelHeight, this.style.bgColor);
        this.panel.add(this.panelBg);

        // Items container (for scrolling)
        this.itemsContainer = this.scene.add.container(0, 0);
        this.panel.add(this.itemsContainer);

        // Create items
        this.items = [];
        this.options.forEach((option, index) => {
            this.createItem(option, index);
        });

        // Scroll setup
        this.scrollOffset = 0;
        if (this.direction === 'right') {
            this.maxScroll = Math.max(0, (this.options.length - this.style.maxVisibleItems) * this.width);
        } else {
            this.maxScroll = Math.max(0, (this.options.length - this.style.maxVisibleItems) * this.style.itemHeight);
        }

        // Create mask for overflow
        if (this.options.length > this.style.maxVisibleItems) {
            this.createScrollMask();
            this.setupScrolling();
        }
    }
    
    createItem(option, index) {
        let xPos, yPos, itemWidth, itemHeight;

        // Position items based on direction
        if (this.direction === 'right') {
            xPos = index * this.width;
            yPos = 0;
            itemWidth = this.width;
            itemHeight = this.style.height;
        } else {
            xPos = 0;
            yPos = index * this.style.itemHeight;
            itemWidth = this.width;
            itemHeight = this.style.itemHeight;
        }

        // Use button texture if provided, otherwise use background graphics
        let itemBg, itemBtn;

        if (option.texture) {
            // Create button sprite
            itemBtn = this.scene.add.image(xPos, yPos, option.texture);
            itemBtn.setOrigin(0, 0);
        } else {
            // Item background (fallback)
            itemBg = this.scene.add.graphics();
            itemBg.fillStyle(this.style.bgColor, 1);
            itemBg.fillRect(xPos, yPos, itemWidth, itemHeight);
        }

        // Item text (optional - only if no texture or label needed)
        let itemText;
        if (!option.texture || option.showLabel) {
            itemText = this.scene.add.text(
                xPos + itemWidth / 2,
                yPos + itemHeight / 2,
                option.label,
                {
                    fontSize: this.style.fontSize,
                    color: this.style.textColor,
                    fontFamily: 'Arial'
                }
            );
            itemText.setOrigin(0.5, 0.5);
        }

        // Interactive area
        const itemHitArea = this.scene.add.rectangle(
            xPos + itemWidth / 2,
            yPos + itemHeight / 2,
            itemWidth,
            itemHeight,
            0xff0000,
            0
        );
        itemHitArea.setInteractive({ useHandCursor: true });
        itemHitArea.setOrigin(0.5, 0.5);

        const item = {
            background: itemBg,
            button: itemBtn,
            text: itemText,
            hitArea: itemHitArea,
            index: index,
            option: option
        };

        // Hover effects
        itemHitArea.on('pointerover', () => {
            if (option.texture && option.textureHover) {
                itemBtn.setTexture(option.textureHover);
            } else if (itemBg) {
                itemBg.clear();
                itemBg.fillStyle(this.style.bgHoverColor, 1);
                itemBg.fillRect(xPos, yPos, itemWidth, itemHeight);
            }
        });

        itemHitArea.on('pointerout', () => {
            if (option.texture) {
                const texture = (index === this.selectedIndex && option.textureClicked) ?
                    option.textureClicked : option.texture;
                itemBtn.setTexture(texture);
            } else if (itemBg) {
                const fillColor = (index === this.selectedIndex) ?
                    this.style.bgSelectedColor : this.style.bgColor;
                itemBg.clear();
                itemBg.fillStyle(fillColor, 1);
                itemBg.fillRect(xPos, yPos, itemWidth, itemHeight);
            }
        });

        // Click handler
        itemHitArea.on('pointerdown', (pointer) => {
            pointer.event.stopPropagation();

            // Change texture to clicked state
            if (option.texture && option.textureClicked) {
                itemBtn.setTexture(option.textureClicked);
            }

            this.selectItem(index);
        });

        this.items.push(item);

        // Add all elements to container
        if (itemBg) this.itemsContainer.add(itemBg);
        if (itemBtn) this.itemsContainer.add(itemBtn);
        if (itemText) this.itemsContainer.add(itemText);
        this.itemsContainer.add(itemHitArea);
    }
    
    createScrollMask() {
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRect(
            this.x + this.panelX,
            this.y + this.panelY,
            this.panelWidth,
            this.panelHeight
        );

        const mask = maskShape.createGeometryMask();
        this.itemsContainer.setMask(mask);
        this.scrollMaskGraphics = maskShape;
    }
    
    setupScrolling() {
        this.panel.setInteractive(
            new Phaser.Geom.Rectangle(0, 0, this.width, this.panelHeight),
            Phaser.Geom.Rectangle.Contains
        );
        
        this.panel.on('wheel', (pointer, deltaX, deltaY) => {
            const scrollAmount = deltaY > 0 ? this.style.itemHeight : -this.style.itemHeight;
            this.scrollOffset = Phaser.Math.Clamp(
                this.scrollOffset + scrollAmount,
                0,
                this.maxScroll
            );
            this.itemsContainer.y = -this.scrollOffset;
        });
    }
    
    setupMainButtonInteractions() {

        this.mainHitArea.on('pointerover', () => {
            if (!this.isOpen) {
                this.drawBox(this.mainBg, 0, 0, this.width, this.style.height, this.style.bgHoverColor);
            }
        });

        this.mainHitArea.on('pointerout', () => {
            if (!this.isOpen) {
                this.drawBox(this.mainBg, 0, 0, this.width, this.style.height, this.style.bgColor);
            }
        });
    }
    
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        this.isOpen = true;
        this.panel.setVisible(true);      
        this.arrow.setText('▲');
        this.drawBox(this.mainBg, 0, 0, this.width, this.style.height, this.style.bgHoverColor);
        this.bringToTop(this.panel);

    }
    
    closeDropdown() {
        this.isOpen = false;
        this.panel.setVisible(false);
        this.arrow.setText('▼');
        this.drawBox(this.mainBg, 0, 0, this.width, this.style.height, this.style.bgColor);
    }
    
    handleOutsideClick(pointer) {
        if (!this.isOpen) return;

        if (this.justOpened) {
            this.justOpened = false;
            return;
        }

        // Get the actual world bounds of the dropdown container
        const dropdownBounds = this.getBounds();

        // Check if click is on the main button area
        const clickedOnButton = Phaser.Geom.Rectangle.Contains(
            new Phaser.Geom.Rectangle(dropdownBounds.x, dropdownBounds.y, this.width, this.style.height),
            pointer.x,
            pointer.y
        );

        // Check if click is on the panel
        const clickedOnPanel = Phaser.Geom.Rectangle.Contains(
            new Phaser.Geom.Rectangle(
                dropdownBounds.x + this.panelX,
                dropdownBounds.y + this.panelY,
                this.panelWidth,
                this.panelHeight
            ),
            pointer.x,
            pointer.y
        );

        if (!clickedOnButton && !clickedOnPanel) {
            this.closeDropdown();
        }
    }
    
    selectItem(index) {
        const oldIndex = this.selectedIndex;
        this.selectedIndex = index;

        // Update visual state for main button
        if (this.selectedText) {
            this.selectedText.setText(this.options[index].label);
        }

        // Update item backgrounds/buttons
        this.items.forEach((item, i) => {
            const option = this.options[i];

            if (item.button) {
                // Handle button sprite
                if (i === index && option.textureClicked) {
                    item.button.setTexture(option.textureClicked);
                } else {
                    item.button.setTexture(option.texture);
                }
            } else if (item.background) {
                // Handle graphics background
                let xPos, yPos, itemWidth, itemHeight;

                if (this.direction === 'right') {
                    xPos = i * this.width;
                    yPos = 0;
                    itemWidth = this.width;
                    itemHeight = this.style.height;
                } else {
                    xPos = 0;
                    yPos = i * this.style.itemHeight;
                    itemWidth = this.width;
                    itemHeight = this.style.itemHeight;
                }

                const fillColor = (i === index) ? this.style.bgSelectedColor : this.style.bgColor;
                item.background.clear();
                item.background.fillStyle(fillColor, 1);
                item.background.fillRect(xPos, yPos, itemWidth, itemHeight);
            }
        });

        // Close dropdown
        this.closeDropdown();

        // Trigger callback
        if (oldIndex !== index) {
            this.onChange(this.options[index].value, this.options[index].label, index);
        }
    }
    
    // Public methods
    getValue() {
        return this.options[this.selectedIndex]?.value;
    }
    
    getLabel() {
        return this.options[this.selectedIndex]?.label;
    }
    
    getSelectedIndex() {
        return this.selectedIndex;
    }
    
    setSelectedIndex(index) {
        if (index >= 0 && index < this.options.length) {
            this.selectItem(index);
        }
    }
    
    setSelectedValue(value) {
        const index = this.options.findIndex(opt => opt.value === value);
        if (index !== -1) {
            this.selectItem(index);
        }
    }
    
    updateOptions(newOptions) {
        // Clear existing items
        this.items.forEach(item => {
            item.background.destroy();
            item.text.destroy();
            item.hitArea.destroy();
        });
        this.items = [];
        this.itemsContainer.removeAll(true);
        
        // Update options
        this.options = newOptions;
        this.selectedIndex = 0;
        
        // Recreate items
        this.options.forEach((option, index) => {
            this.createItem(option, index);
        });
        
        // Update display
        this.selectedText.setText(this.options[0].label);
        
        // Recalculate scroll
        this.maxScroll = Math.max(0, (this.options.length - this.style.maxVisibleItems) * this.style.itemHeight);
        this.scrollOffset = 0;
        this.itemsContainer.y = 0;
    }
    
    destroy(fromScene) {
        // Remove global click listener
        this.scene.input.off('pointerdown', this.handleOutsideClick, this);
        
        // Destroy mask if it exists
        if (this.scrollMaskGraphics) {
            this.scrollMaskGraphics.destroy();
        }
        
        super.destroy(fromScene);
    }
}