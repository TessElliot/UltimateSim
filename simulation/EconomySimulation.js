export class EconomySimulation {
  //constructor(scene, citySim, gWidth) {
  //  this.scene   = scene;
  //  this.citySim = citySim; // reference to read power surplus etc.

  //  // starting treasury – generous so player can build
  //  this.money = 10000;

  //  // UI
  //  const xPos = gWidth ? gWidth - 400 : 30;
  //  this.text = scene.add.text(xPos, 588, '', {
  //    color: '#ffdd33',
  //  }).setShadow(1,1,'#ccaa00',3,false,true);
  //  scene.cameras.main.ignore(this.text);
  //  this.refreshUI();

  //  // monthly tick
  //  scene.time.addEvent({
  //    delay: 10000,
  //    loop: true,
  //    callback: this.monthTick,
  //    callbackScope: this,
  //  });
  //}

  ////Charge construction cost when a tile is placed 
  //chargeFor(tileKey) {
  //  const costTable = {
  //    road: 20,
  //    bike: 10,
  //    wind: 400,
  //    'power:plant (solar)': 350,
  //    hydrogen: 1200,
  //    industrial: 600,
  //    warehouse: 500,
  //    factory: 700,
  //    wood: 50,
  //    green_apartments: 300,
  //  };

  //  const cost = costTable[tileKey] ?? 100; // default cost for all other tiles for now
  //  this.money -= cost;
  //  this.refreshUI();
  //}

  //monthTick() {
  //  // income from power surplus
  //  const surplus = Math.max(0, this.citySim.powerSupply - this.citySim.powerDemand);
  //  const powerRate = 25; // $ per surplus MW
  //  this.money += surplus * powerRate;

  //  // basic municipal upkeep (thsi scales with tiles count)
  //  const upkeepPerTile = 0.8;
  //  this.money -= this.scene.mapTiles.length * upkeepPerTile;

  //  // tax income
  //  const taxPerTile = 1.2;          // property tax
  //  this.money += this.scene.mapTiles.length * taxPerTile;

  //  // maintenance cost for generators
  //  let genMaintenance = 0;
  //  this.scene.mapTiles.forEach(t => {
  //    const k = t.texture.key;
  //    if (k === 'wind') genMaintenance += 8;
  //    else if (k === 'power:plant (solar)') genMaintenance += 6;
  //    else if (k === 'hydrogen') genMaintenance += 15;
  //  });
  //  this.money -= genMaintenance;

  //  this.refreshUI();
  //}

  //refreshUI() {
  //  this.text.text = `Budget: $${Math.floor(this.money)}`;
  //}
} 