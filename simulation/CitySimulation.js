export class CitySimulation {
  constructor(scene) {
    this.scene = scene;

    // tracking the month ,, maybe dates later?
    this.month = 0;

    // ccurrentenvironmental state
    this.pollution = 0;     //cuurent poluuton
    this.temperature = 15;  // °C baseline

    // power state
    this.powerSupply  = 0;
    this.powerDemand  = 0;
    this.brownout     = false;   // currently in deficit?
    this.deficitMonths= 0;       // consecutive months in deficit
    this.brownoutLevel= 0;       // 0-1 how dark city is

    // UI label
    this.ui = scene.add.text(30, 572, '', {
      color: '#ff6633',
    }).setShadow(1, 1, '#ff9933', 3, false, true);
    scene.cameras.main.ignore(this.ui);

    // monthly tick  every 10s
    scene.time.addEvent({
      delay: 10000,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });

    this.tick();
  }

  tick() {
    this.month += 1;

    // recalc after any city changes
    const counts = this.countTiles();

    // Pollution model ,,, different scores for tile typesx
    const FACTORY_POLLUTION   = 8;   // per industrial tile / month
    const ROAD_POLLUTION      = 5;   // minor for roads/vehicles
    const GREEN_CLEAN         = 4;   // per green tile / month
    const DECAY_FACTOR        = 0.95;// 5 % natural clearing

    let deltaPollution = counts.industrial * FACTORY_POLLUTION +
                         counts.road       * ROAD_POLLUTION -
                         counts.green      * GREEN_CLEAN;

    this.pollution = Math.max(0, (this.pollution + deltaPollution) * DECAY_FACTOR);

    // --- Temperature feedback ---
    const tempRise    = this.pollution * 0.02; // greenhouse effect
    const cooling     = counts.green * 0.01;   // urban cooling
    this.temperature  = 15 + tempRise - cooling;

    // ---------- POWER GRID ----------
    const power = this.computePower(counts);
    this.powerSupply = power.supply;
    this.powerDemand = power.demand;

    const deficit = this.powerDemand - this.powerSupply; // positive if shortage

    // adjust brownoutLevel gradually
    if (deficit > 0) {
      this.brownoutLevel = Math.min(1, this.brownoutLevel + 0.25);
      if (!this.brownout && this.brownoutLevel > 0) {
        this.scene.showNewspaper?.('City Suffers Brown-outs', [
          'Electricity demand has exceeded supply.',
          'Factories are idling and citizens complain of rolling black-outs.',
    
        ]);
      }
      this.brownout = true;
    } else {
      this.brownoutLevel = Math.max(0, this.brownoutLevel - 0.25);
      if (this.brownout && this.brownoutLevel === 0) {
        this.scene.showNewspaper?.('Power Restored', [
          'Additional generation capacity is now online and electricity is flowing again.'
        ]);
        this.brownout = false;
      }
    }

    // apply tint each tick based on level
    this.applyBrownoutTint(this.brownoutLevel);

    // update UI
    this.ui.text = `Month: ${this.month}  Temp: ${this.temperature.toFixed(1)}°C  Pollution: ${this.pollution.toFixed(0)}  Power: ${this.powerSupply}/${this.powerDemand}`;
  }

  // Categorise tiles each tick
  countTiles() {
    let industrial = 0;
    let green      = 0;
    let road       = 0;
///this categorizatoin can be long and we can put it in a seperate file later 
    for (const tile of this.scene.mapTiles) {
      const key = tile.texture.key;
      if (key === 'industrial' || key === 'factory' || key === 'warehouse') {
        industrial += 1;
      } else if (key === 'wood' || key === 'meadow' || key === 'park' || key === 'nature_reserve') {
        green += 1;
      } else if (key === 'road' || key === 'bike') {
        road += 1;
      }
    }

    return { industrial, green, road };
  }

  computePower(counts) {
    let supply = 0;
    let demand = 0;

    for (const tile of this.scene.mapTiles) {
      const key = tile.texture.key;

      // production
      if (key === 'wind')                 supply += 15;
      else if (key === 'power:plant (solar)') supply += 12;
      else if (key === 'hydrogen')        supply += 60;

      // demand 
      else if (key === 'industrial' || key === 'warehouse' || key === 'factory')
        demand += 10;
      else if (key.includes('apartments') || key === 'green_apartments')
        demand += 5;
      else if (key === 'office' || key === 'commercial')
        demand += 4;
      else if (key === 'school' || key === 'hospital' || key === 'university')
        demand += 6;
    }

    // road traffic uses a bit of electricity (charging EVs / street lights)
    demand += counts.road * 0.2;

    return { supply, demand };
  }

  // visual tinting disabled – only ensure any previous tint is cleared
  applyBrownoutTint(level) {
    if (level === 0) {
      this.scene.mapTiles.forEach(t => t.clearTint());
    }
  }

  // expose manual tick for immediate updates
  immediateUpdate() {
    this.tick();
  }
} 