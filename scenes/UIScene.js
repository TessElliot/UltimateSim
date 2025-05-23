class UIScene extends UIBlock {
  constructor(config) {
    super();

    this.emitter = EventDispatcher.getInstance();

    this.scene = config.scene;

    //this.camUI = this.scene.cameras.add(28, 28, 96, 160);
    this.camUI = this.scene.cameras.add(28, 28, 96, 192);
    this.camUI.setOrigin(10, 10);
    this.camUI.setZoom(1);
    this.camUI.centerOn = true;

    //this.bkgd = this.scene.add.image(0, 0, 'UI_bkgd');
    //this.bkgd.setOrigin(0, 0);

    this.btn1 = this.scene.add.image(0, 0, "button_move");
    this.btn2 = this.scene.add.image(32, 0, "button_zoom");
    this.btn3 = this.scene.add.image(64, 0, "button_rotate");
    this.btn4 = this.scene.add.image(0, 32, "button_info");
    this.btn5 = this.scene.add.image(64, 32, "button_bulldoze");
    this.btn6 = this.scene.add.image(32, 32, "button_home");
    this.btn7 = this.scene.add.image(0, 64, "button_sun");
    this.btn8 = this.scene.add.image(32, 64, "button_wind");
    this.btn9 = this.scene.add.image(64, 64, "button");
    this.btn10 = this.scene.add.image(0, 96, "button_trees");
    this.btn11 = this.scene.add.image(32, 96, "button");
    this.btn12 = this.scene.add.image(64, 96, "button_electric");
    this.btn13 = this.scene.add.image(0, 128, "button");
    this.btn14 = this.scene.add.image(32, 128, "button");
    this.btn15 = this.scene.add.image(64, 128, "button");
    this.btn16 = this.scene.add.image(0, 160, "button");

    this.btn1.setOrigin(0, 0);
    this.btn2.setOrigin(0, 0);
    this.btn3.setOrigin(0, 0);
    this.btn4.setOrigin(0, 0);
    this.btn5.setOrigin(0, 0);
    this.btn6.setOrigin(0, 0);
    this.btn7.setOrigin(0, 0);
    this.btn8.setOrigin(0, 0);
    this.btn9.setOrigin(0, 0);
    this.btn10.setOrigin(0, 0);
    this.btn11.setOrigin(0, 0);
    this.btn12.setOrigin(0, 0);
    this.btn13.setOrigin(0, 0);
    this.btn14.setOrigin(0, 0);
    this.btn15.setOrigin(0, 0);
    this.btn16.setOrigin(0, 0);

    this.btn1.setInteractive();
    this.btn2.setInteractive();
    this.btn3.setInteractive();
    this.btn4.setInteractive();
    this.btn5.setInteractive();
    this.btn6.setInteractive();
    this.btn7.setInteractive();
    this.btn8.setInteractive();
    this.btn9.setInteractive();
    this.btn10.setInteractive();
    this.btn11.setInteractive();
    this.btn12.setInteractive();
    this.btn13.setInteractive();
    this.btn14.setInteractive();
    this.btn15.setInteractive();
    this.btn16.setInteractive();

    this.btn1.on("pointerdown", this.moveMap.bind(this));
    this.btn2.on("pointerdown", this.zoomMap.bind(this));
    this.btn3.on("pointerdown", this.rotateMap.bind(this));
    this.btn4.on("pointerdown", this.infoMap.bind(this));
    this.btn5.on("pointerdown", this.destroy.bind(this));
    this.btn6.on("pointerdown", this.goHome.bind(this));
    this.btn7.on("pointerdown", this.buildSolar.bind(this));
    this.btn8.on("pointerdown", this.buildWind.bind(this));
    //this.btn9.on('pointerdown', this.clicked.bind(this));
    this.btn10.on("pointerdown", this.plantTrees.bind(this));
    this.btn11.on("pointerdown", this.buildMedium.bind(this));
    this.btn12.on("pointerdown", this.buildLarge.bind(this));
    this.btn13.on("pointerdown", this.buildBikeLane.bind(this));
    this.btn14.on("pointerdown", this.buildRoad.bind(this));
    //this.btn15.on('pointerdown', this.growForest.bind(this));
    this.btn16.on("pointerdown", this.unDo.bind(this));

    this.btn1.on("pointerup", this.button1Up.bind(this));
    this.btn2.on("pointerup", this.button2Up.bind(this));
    this.btn3.on("pointerup", this.button3Up.bind(this));
    this.btn4.on("pointerup", this.button4Up.bind(this));
    this.btn5.on("pointerup", this.button5Up.bind(this));
    this.btn6.on("pointerup", this.button6Up.bind(this));
    this.btn7.on("pointerup", this.button7Up.bind(this));
    this.btn8.on("pointerup", this.button8Up.bind(this));
    this.btn9.on("pointerup", this.button9Up.bind(this));
    this.btn10.on("pointerup", this.button10Up.bind(this));
    this.btn11.on("pointerup", this.button11Up.bind(this));
    this.btn12.on("pointerup", this.button12Up.bind(this));
    this.btn13.on("pointerup", this.button13Up.bind(this));
    this.btn14.on("pointerup", this.button14Up.bind(this));
    this.btn15.on("pointerup", this.button15Up.bind(this));
    this.btn16.on("pointerup", this.button16Up.bind(this));

    this.add(this.btn1);
    this.add(this.btn2);
    this.add(this.btn3);
    this.add(this.btn4);
    this.add(this.btn5);
    this.add(this.btn6);
    this.add(this.btn7);
    this.add(this.btn8);
    this.add(this.btn9);
    this.add(this.btn10);
    this.add(this.btn11);
    this.add(this.btn12);
    this.add(this.btn13);
    this.add(this.btn14);
    this.add(this.btn15);
    this.add(this.btn16);

    //this.B1 = this.scene.add.text(12, 12, '1');
    //this.B2 = this.scene.add.text(44, 12, '2');
    //this.B3 = this.scene.add.text(76, 12, '3');
    //this.B4 = this.scene.add.text(12, 44, '4');
    //this.B5 = this.scene.add.text(44, 44, '5');
    //this.B6 = this.scene.add.text(76, 44, '6');
    //this.B7 = this.scene.add.text(12, 76, '7');
    //this.B8 = this.scene.add.text(44, 76, '8');
    //this.B9 = this.scene.add.text(76, 76, '9');
    //this.B10 = this.scene.add.text(9, 108, '10');
    //this.B11 = this.scene.add.text(41, 108, '11');
    //this.B12 = this.scene.add.text(73, 108, '12');
    //this.B13 = this.scene.add.text(9, 140, '13');
    //this.B14 = this.scene.add.text(41, 140, '14');

    //this.B1.setOrigin(0, 0);
    //this.B2.setOrigin(0, 0);
    //this.B3.setOrigin(0, 0);
    //this.B4.setOrigin(0, 0);
    //this.B5.setOrigin(0, 0);
    //this.B6.setOrigin(0, 0);
    //this.B7.setOrigin(0, 0);
    //this.B8.setOrigin(0, 0);
    //this.B9.setOrigin(0, 0);
    //this.B10.setOrigin(0, 0);
    //this.B11.setOrigin(0, 0);
    //this.B12.setOrigin(0, 0);
    //this.B13.setOrigin(0, 0);
    //this.B14.setOrigin(0, 0);

    this.buttons = [];
    this.buttons.push(
      this.btn1,
      this.btn2,
      this.btn3,
      this.btn4,
      this.btn5,
      this.btn6,
      this.btn7,
      this.btn8,
      this.btn9,
      this.btn10,
      this.btn11,
      this.btn12,
      this.btn13,
      this.btn14,
      this.btn15,
      this.btn16
    );
  }

  moveMap() {
    this.btn1.setTexture("button_move_clicked");
    this.emitter.emit("MOVE MAP");
    console.log("move map");
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

  //buildSmall() {
  //    this.btn3.setTexture('button_clicked');
  //    this.emitter.emit('BUILD SMALL');
  //}

  buildMedium() {
    this.btn11.setTexture("button_clicked");
    this.emitter.emit("BUILD MEDIUM");
  }

  buildLarge() {
    this.btn12.setTexture("button_electric_clicked");
    this.emitter.emit("BUILD LARGE");
  }

  //buildExtraLarge() {
  //    this.btn6.setTexture('button_clicked');
  //    this.emitter.emit('BUILD EXTRA LARGE');
  //}
  buildBikeLane() {
    this.btn13.setTexture("button_clicked");
    this.emitter.emit("BUILD BIKE LANE");
  }

  buildRoad() {
    this.btn14.setTexture("button_clicked");
    this.emitter.emit("BUILD ROAD");
  }
  unDo() {
    this.btn16.setTexture("button_clickeed");
    this.emitter.emit("UN DO");
  }

  //buildHouse() {
  //    this.btn9.setTexture('button_clicked');
  //    this.emitter.emit('BUILD HOUSE');
  //}

  //buildWater() {
  //    this.btn10.setTexture('button_clicked');
  //    this.emitter.emit('BUILD WATER');
  //}

  //buildMeadow() {
  //    this.btn11.setTexture('button_clicked');
  //    this.emitter.emit('BUILD MEADOW');
  //}

  //buildWind() {
  //    this.btn12.setTexture('button_clicked');
  //    this.emitter.emit('BUILD WIND');
  //}

  //buildGreen() {
  //    this.btn13.setTexture('button_clicked');
  //    this.emitter.emit('BUILD GREEN');
  //}

  //growForest() {
  //    this.btn14.setTexture('button_clicked');
  //    this.emitter.emit('GROW FOREST');
  //}
  goHome() {
    this.btn6.setTexture("button_home_clicked");
    this.emitter.emit("GO HOME");
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
