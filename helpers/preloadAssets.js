export function preloadAssets(scene) {
  scene.load.image("background_image", "assets/ui/backgrounds/background_title.png");
  scene.load.image("UI_bkgd", "assets/ui/backgrounds/UI_bkgd.png");
  scene.load.image("button", "assets/ui/buttons/button.png");
  scene.load.image("button_clicked", "assets/ui/buttons/button_clicked.png");
  scene.load.image("button_bulldoze", "assets/ui/buttons/button_bulldoze.png");
  scene.load.image(
    "button_bulldoze_clicked",
    "assets/ui/buttons/button_bulldoze_clicked.png"
  );
  scene.load.image("button_trees", "assets/ui/buttons/button_trees.png");
  scene.load.image(
    "button_trees_clicked",
    "assets/ui/buttons/button_trees_clicked.png"
  );
  scene.load.image("button_electric", "assets/ui/buttons/button_electric.png");
  scene.load.image(
    "button_electric_clicked",
    "assets/ui/buttons/button_electric_clicked.png"
  );
  scene.load.image("button_info", "assets/ui/buttons/button_info.png");
  scene.load.image(
    "button_info_clicked",
    "assets/ui/buttons/button_info_clicked.png"
  );
  scene.load.image("button_move", "assets/ui/buttons/button_move.png");
  scene.load.image(
    "button_move_clicked",
    "assets/ui/buttons/button_move_clicked.png"
  );
  scene.load.image("button_rotate", "assets/ui/buttons/button_rotate.png");
  scene.load.image(
    "button_rotate_clicked",
    "assets/ui/buttons/button_rotate_clicked.png"
  );
  scene.load.image("button_zoom", "assets/ui/buttons/button_zoom.png");
  scene.load.image(
    "button_zoom_clicked",
    "assets/ui/buttons/button_zoom_clicked.png"
  );
  scene.load.image("button_sun", "assets/ui/buttons/button_sun.png");
  scene.load.image(
    "button_sun_clicked",
    "assets/ui/buttons/button_sun_clicked.png"
  );
  scene.load.image("button_wind", "assets/ui/buttons/button_wind.png");
  scene.load.image(
    "button_wind_clicked",
    "assets/ui/buttons/button_wind_clicked.png"
  );
  scene.load.image("button_home", "assets/ui/buttons/button_home.png");
  scene.load.image(
    "button_home_clicked",
    "assets/ui/buttons/button_home_clicked.png"
  );

  scene.load.spritesheet("null", "assets/terrain/null.png", {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.spritesheet("industrial", "assets/landuse/warehouse.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("warehouse", "assets/landuse/warehouse.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("wood", "assets/landuse/forest.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("power:plant (solar)", "assets/landuse/power_solar.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("church", "assets/landuse/church.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("university", "assets/landuse/university.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("college", "assets/landuse/university.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("school", "assets/landuse/school.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("grass", "assets/landuse/grass.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("grassland", "assets/landuse/grass.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("swimming_pool", "assets/landuse/swimming_pool.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("no data", "assets/landuse/no_data.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("commercial", "assets/landuse/commercial.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("golf_course", "assets/landuse/golf_course.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("public", "assets/landuse/grass.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("hospital", "assets/landuse/hospital.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("apartments", "assets/landuse/apartments_medium.png", {
    frameWidth: 32,
    frameHeight: 128,
  });

  scene.load.spritesheet("religious", "assets/landuse/church.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("social_facility", "assets/landuse/social_facility.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("playground", "assets/landuse/playground.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("office", "assets/landuse/office_medium.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("nature_reserve", "assets/landuse/nature_reserve.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("substation", "assets/landuse/substation.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("military", "assets/landuse/military.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("shed", "assets/landuse/shed.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("sports_centre", "assets/landuse/sports_centre.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("meadow", "assets/landuse/meadow.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("cemetery", "assets/landuse/cemetery.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("quarry", "assets/landuse/quarry.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("plant_nursery", "assets/landuse/plant_nursery.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("hotel", "assets/landuse/hotel.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("parking", "assets/landuse/parking.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("garages", "assets/landuse/parking.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("carport", "assets/landuse/parking.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("brownfield", "assets/landuse/brownfield.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("garden", "assets/landuse/garden.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet(
    "green_apartments",
    "assets/landuse/green_apartments.png",
    {
      frameWidth: 64,
      frameHeight: 256,
    }
  );
  scene.load.spritesheet("empty", "assets/player_sprites/empty.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("forest", "assets/landuse/forest.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("wind", "assets/landuse/wind_power_anim.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("soil", "assets/player_sprites/soil.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("farmland", "assets/landuse/farm.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("farmyard", "assets/landuse/farm.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("reservoir", "assets/landuse/water_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("construction", "assets/landuse/construction_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("wetland", "assets/landuse/wetland_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("dump_station", "assets/landuse/dump_station_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("landfill", "assets/landuse/landfill.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("park", "assets/landuse/park.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("pitch", "assets/landuse/pitch.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("recreation_ground", "assets/landuse/pitch.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("house", "assets/landuse/detached.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("detached", "assets/landuse/detached.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("neighbourhood", "assets/landuse/neighbourhood.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("neighborhood", "assets/landuse/neighborhood.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("residential", "assets/landuse/residential.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("scrub", "assets/landuse/scrub.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("retail", "assets/landuse/retail.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("water", "assets/landuse/pond.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("tiles", "assets/legacy/test_spritesheet.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("tiles_med", "assets/legacy/test_med_spritesheet.png", {
    frameWidth: 64,
    frameHeight: 128,
  });
  scene.load.spritesheet("destroy", "assets/effects/ground_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("grow", "assets/effects/grow_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("brian", "assets/legacy/Brian_spritesheet.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("farm", "assets/player_sprites/farm.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("pond_b", "assets/effects/pond_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("tree_b", "assets/effects/tree_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("road", "assets/terrain/road.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("beach", "assets/terrain/beach.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("coastline", "assets/landuse/water_anim.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("bike", "assets/terrain/road_with_bike.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("ground", "assets/landuse/ground.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("yes", "assets/landuse/yes.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("power:plant (oil)", "assets/landuse/power_plant_oil.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("power:plant (oil;gas)", "assets/landuse/power_plant_oil_gas.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("power:plant (gas)", "assets/landuse/power_plant_oil_gas.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("barn", "assets/landuse/barn.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("dog_park", "assets/landuse/dog_park.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("ruins", "assets/landuse/ruins.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("roof", "assets/landuse/yes.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("island", "assets/landuse/island.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("islet", "assets/landuse/islet.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("museum", "assets/landuse/museum.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("stadium", "assets/landuse/sports_centre.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("hangar", "assets/landuse/hangar.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("garage", "assets/landuse/garage.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("cabin", "assets/landuse/cabin.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("civic", "assets/landuse/civic.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("mall", "assets/landuse/mall.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("greenfield", "assets/landuse/greenfield.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("schoolyard", "assets/landuse/schoolyard.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("waterpark", "assets/landuse/waterpark.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("basin", "assets/landuse/basin.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("harbor", "assets/landuse/harbor.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("marina", "assets/landuse/marina.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("railway", "assets/terrain/railway.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("aerodrome", "assets/landuse/hangar.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("apron", "assets/landuse/apron.png", {
    frameWidth: 32,
    frameHeight: 64,
  });
  scene.load.spritesheet("terrace", "assets/landuse/terrace.png", {
    frameWidth: 32,
    frameHeight: 128,
  });
  scene.load.spritesheet("track", "assets/landuse/track.png", {
    frameWidth: 32,
    frameHeight: 128,
  });



  scene.load.image("skyscraper", "assets/player_sprites/building.png");
  scene.load.image("solar", "assets/player_sprites/solar.png");
  scene.load.image("hydrogen", "assets/player_sprites/hydrogen.png");
  scene.load.image("paper_bg", "assets/ui/backgrounds/paper_bg.png");

  scene.load.spritesheet("tornado", "assets/landuse/tornado_strip.png", {
    frameWidth: 48,
    frameHeight: 48,
  });

  // Add the listener to handle the 'complete' event
  scene.load.once("complete", () => {
    console.log("All assets loaded.");
    console.log("Check tornado texture:", scene.textures.exists("tornado"));
  });
}

export function createAnimations(scene) {
  console.log("creating animations...");

  const animations = [
    {
      key: "nature_reserve",
      sprite: "nature_reserve",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      frameRate: 4,
    },
    {
      key: "bulldozing",
      sprite: "destroy",
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: 4,
      repeat: 0,
    },
    {
      key: "reservior",
      sprite: "reservoir",
      frames: [0, 1, 2],
      frameRate: 6,
    },
    {
      key: "construction",
      sprite: "construction",
      frames: [0, 1, 2, 3, 4, 5],
      frameRate: 6,
    },
    {
      key: "farmland",
      sprite: "farmland",
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: 4,
    },
    {
      key: "house",
      sprite: "house",
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: 4,
    },
    {
      key: "detached",
      sprite: "house",
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: 4,
    },
    {
      key: "wetland",
      sprite: "wetland",
      frames: [0, 1, 2],
      frameRate: 6,
    },
    {
      key: "water",
      sprite: "water",
      frames: [0, 1, 2],
      frameRate: 1,
    },
    {
      key: "landfill",
      sprite: "landfill",
      frames: [0, 1, 2],
      frameRate: 4,
    },
    {
      key: "dump_station",
      sprite: "dump_station",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      frameRate: 3,
    },
    {
      key: "park",
      sprite: "park",
      frames: Array.from({ length: 19 }, (_, i) => i), // [0...18]
      frameRate: 3,
    },
    {
      key: "pitch",
      sprite: "pitch",
      frames: [0, 1, 2, 3, 4],
      frameRate: 3,
    },
    {
      key: "recreation_ground",
      sprite: "pitch",
      frames: [0, 1, 2, 3, 4],
      frameRate: 3,
    },
    {
      key: "wind",
      sprite: "wind",
      frames: [0, 1, 2, 3, 4, 5, 6, 7],
      frameRate: 3,
    },
    {
      key: "neighbourhood",
      sprite: "neighbourhood",
      frames: Array.from({ length: 20 }, (_, i) => i),
      frameRate: 3,
    },
    {
      key: "neighborhood",
      sprite: "neighborhood",
      frames: Array.from({ length: 20 }, (_, i) => i),
      frameRate: 3,
    },
    {
      key: "residential",
      sprite: "residential",
      frames: Array.from({ length: 40 }, (_, i) => i),
      frameRate: 3,
    },
    {
      key: "scrub",
      sprite: "scrub",
      frames: [0, 1],
      frameRate: 1,
    },
    {
      key: "retail",
      sprite: "retail",
      frames: [0, 1, 2, 3],
      frameRate: 1,
    },
    {
      key: "power:plant (oil)",
      sprite: "power:plant (oil)",
      frames: [0, 1, 2, 3],
      frameRate: 1,
    },
    {
      key: "schoolyard",
      sprite: "schoolyard",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      frameRate: 3,
    },
    {
      key: "waterpark",
      sprite: "waterpark",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      frameRate: 3,
    },
    {
      key: "harbor",
      sprite: "harbor",
      frames: [0, 1, 2, 3, 4, 5],
      frameRate: 1,
    },
    {
      key: "marina",
      sprite: "marina",
      frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      frameRate: 3,
    },
    {
      key: "coastline",
      sprite: "coastline",
      frames: [0, 1, 2],
      frameRate: 1,
    },


    {
      key: "tornado_spin",
      sprite: "tornado",
      frames: [0, 1, 2],
      frameRate: 6,
      repeat: -1,
    },
  ];

  // animations.forEach(({ key, sprite, frames, frameRate, repeat = -1 }) => {
  //   scene.anims.create({
  //     key,
  //     frames: scene.anims.generateFrameNumbers(sprite, { frames }),
  //     frameRate,
  //     repeat,
  //   });
  // });
  animations.forEach(
    ({ key, sprite, frames, frameRate, repeat = -1, manualFrames }) => {
      try {
        if (manualFrames) {
          scene.anims.create({
            key,
            frames: manualFrames,
            frameRate,
            repeat,
          });
        } else {
          // Check if the texture exists before trying to generate frames
          if (!scene.textures.exists(sprite)) {
            console.warn(`⚠️ Skipping animation "${key}" - texture "${sprite}" not found`);
            return;
          }
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(sprite, { frames }),
            frameRate,
            repeat,
          });
        }
      } catch (error) {
        console.warn(`⚠️ Failed to create animation "${key}" for sprite "${sprite}":`, error.message);
        // Continue to next animation
      }
    }
  );
  console.log('✅ createAnimations() completed successfully');
}