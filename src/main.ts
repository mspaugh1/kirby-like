import { makeBirdEnemy, makeFlameEnemy, makeGuyEnemy, makePlayer, setControls } from "./entities";
import { k } from "./kaboomCtx";
import { makeMap } from "./utils";

//avoid having to re-fetch the mapped data from tiled
// use the await keyword to wait for the layout before moving on
// keeps from having to redo this logic
// because you're using vite (or any bundler) you get the function explanation
// name of the sprite, path to asset
// vite makes sure to reference public even if you don't specify it
// how to slice the image - the sprites are a tile set - they're 16x16 in the file
// 9 sprites on the x axis in the image and 10 on the y axis
// objects are the assets that have more than one sprite
async function gameSetup() {
    k.loadSprite("assets", "./kirby-like.png",{
        sliceX: 9,
        sliceY: 10,
        anims: {
            kirbIdle: 0,
            kirbInhaling: 1,
            kirbFull: 2,
            kirbInhaleEffect: { from: 3, to: 8, speed: 15, loop: true},
            shootingStar: 9,
            flame: { from: 36, to: 37, speed: 4, loop: true},
            guyIdle: 18,
            guyWalk: { from: 18, to: 19, speed: 4, loop: true},
            bird: {from: 27, to: 28, speed: 4, loop: true },
        },
    });

    k.loadSprite("level-1", "./level-1.png");

    k.add([k.rect(k.width(), k.height()), k.color(0, 0, 0), k.fixed()]);
    // this renames properties so the properties are individual for each time this is called
    const { map: level1Layout, spawnPoints: level1SpawnPoints } = await makeMap (
        k,
        "level-1"
    );

    //add below adds components of type that have methods to call on them
    // full window to set background
    //fill background with color
    // game object not affected by camera
    k.scene("level-1", async () => {
        k.setGravity(2100);
        k.add([
            k.rect(k.width(), k.height()), 
            k.color(k.Color.fromHex("#f7d7db")),
            k.fixed(),
        ]);

        k.add(level1Layout);

        const kirb = makePlayer(
            k,
            level1SpawnPoints.player[0].x,
            level1SpawnPoints.player[0].y
        );

        // passing in control and player
        setControls(k, kirb);
        k.add(kirb);
        // kaboom makes the camera automatic
        k.camScale(0.7, 0.7);// or k.vec2(0.7));
        k.onUpdate(() => {
            if (kirb.pos.x < level1Layout.pos.x + 432){
                //camera follows character to a point but not further - stop at end of level
                // camera is on the left side of the screen
                k.camPos(kirb.pos.x + 500, 800);
            }
        });

        for (const flame of level1SpawnPoints.flame) {
            makeFlameEnemy(k, flame.x, flame.y);
        }
        for (const guy of level1SpawnPoints.guy) {
            makeGuyEnemy(k, guy.x, guy.y);
        }
        for (const bird of level1SpawnPoints.bird) {
            const possibleSpeeds = [100, 200, 300];
            k.loop(10, () => {
                makeBirdEnemy(k, bird.x, bird.y,
                    possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
                );
            });            
        }
    });


    k.go("level-1");
}

gameSetup();