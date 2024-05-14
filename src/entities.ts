import { AreaComp, BodyComp, DoubleJumpComp, GameObj, HealthComp, KaboomCtx, OpacityComp, PosComp, ScaleComp, SpriteComp } from "kaboom";
import { scale } from "./constants";


export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
    const player = k.make([
        k.sprite("assets", { anim: "kirbIdle"}), // animation to play by default
        k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10)}), // hit box relative to sprite to make sure it's not floating into the platform
        k.body(),// player can be affected by gravity
        k.pos(posX * scale, posY * scale),
        k.scale(scale),
        k.doubleJump(10), // kirby jump 
        k.health(3),
        k.opacity(1), // when he's hit we make him flash
        {
            speed: 300,
            direction: "right",
            isInhaling: false,
            isFull: false,
        },
        "player",
    ]);

    // setting up the enemies that will collide with our player
    // need async to make the player flash - a tween? await syntax
    // you can pass the enemy function in there
    // if kirby is inhaling then it's swallowed but if not then the player is hit
    player.onCollide("enemy", async(enemy: GameObj) => {
        if (player.isInhaling && enemy.isInhalable){
            player.isInhaling = false;
            k.destroy(enemy);
            player.isFull = true;
            return;
        }

        //player is dead
        if (player.hp() === 0) {
            k.destroy (player);
            k.go("level-1");
            return;
        }
        // reduce 1 hp
        player.hurt();

        // make player flash
        //tween - gradually change from one value to another

        await k.tween(
            player.opacity,
            0,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear
        );
         await k.tween(
            player.opacity,
            1,
            0.05,
            (val) => (player.opacity = val),
            k.easings.linear    
         );
    });

    player.onCollide("exit", () => {
        k.go("level-2");
    });

    const inhaleEffect = k.add([
        k.sprite("assets", {anim: "kirbInhaleEffect"}),
        k.pos(),
        k.scale(scale),
        k.opacity(0),
        "inhaleEffect", // this is the tag. it's always playing but we just show it
    ]);

    const inhaleZone = player.add([
        k.area({ shape: new k.Rect(k.vec2(0),20,4)}),
        k.pos(), // empty to decide on position based on where player is
        "inhaleZone",
    ]);

    inhaleZone.onUpdate( () => {
        if (player.direction === "left") {
            // inhaleZone is a child of player, so this is relative
            inhaleZone.pos = k.vec2(-14, 8);
            // inhale is not a child of player because you can't change opacity of a child independently
            inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
            inhaleEffect.flipX = true;
            return;
        }
        inhaleZone.pos = k.vec2(14,8);
        inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);
        inhaleEffect.flipX = false;
    });

    player.onUpdate(() => {
        // if player falls then re-spawn - positive Y is down
        if (player.pos.y > 2000){
            // go to the scene to reload
            k.go("level-1");
        }
    });

    return player;
}

// could be just a GameObj, but here we create a type instead
// can be done in a folder, but for tutorial we do this here
// game object that has all these components with Opacity having new properties
type PlayerGameObj = GameObj <
SpriteComp &
AreaComp &
BodyComp &
PosComp &
ScaleComp &
DoubleJumpComp &
HealthComp &
OpacityComp & {
    speed: number;
    direction: string;
    isInhaling: boolean;
    isFull: boolean;
}

>
export function setControls(k: KaboomCtx, player: PlayerGameObj) {
    // need reference to inhale effect
    // returns an array with all objects that have this tag
    const inhaleEffectRef = k.get("inhaleEffect")[0];
    k.onKeyDown((key) => {
        switch (key) {
            case "left":
                player.direction = "left";
                player.flipX = true;
                player.move(-player.speed, 0); // moving a player speed and 0 y value, so horizontal then negative for left not right
                break;
            case "right":
                player.direction = "right";
                player.flipX = false;
                player.move(player.speed, 0); // moving a player speed and 0 y value, so horizontal then negative for left not right
                break;
            case "z":
                if (player.isFull) {
                    player.play("kirbFull");
                    inhaleEffectRef.opacity = 0; // hide the effect
                    break;
                }
                player.isInhaling = true;
                player.play("kirbInhaling");
                inhaleEffectRef.opacity = 1;
                break;
            default:
        }
    });

    k.onKeyPress((key) => {
        if (key === "x") player.doubleJump();
    });

    k.onKeyRelease((key) => {
        if (key === "z") {
            if (player.isFull) {
                //spitting is the same animation as inhaling
                player.play("kirbInhaling");

                const shootingStar = k.add([
                    k.sprite("assets", {
                        anim: "shootingStar",
                        flipX: player.direction === "right", // default animation is to the left                        
                    }),
                    k.area({shape: new k.Rect(k.vec2(5,4), 6, 6)}),
                    k.pos(
                        player.direction === "left" ? player.pos.x -80 : player.pos.x + 80,
                        player.pos.y + 5 
                    ),
                    k.scale(scale),
                    player.direction === "left" ? k.move (k.LEFT, 800) : k.move(k.RIGHT, 800),
                    "shootingStar",                    
                ]);
                shootingStar.onCollide("platform", () => k.destroy(shootingStar));
                player.isFull = false;
                k.wait(1, () => player.play("kirbIdle"));
                return;                
            }
            inhaleEffectRef.opacity = 0;
            player.isInhaling = false;
            player.play("kirbIdle");
        }
    });
}


export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number){
    const flame = k.add([
        k.sprite("assets", {anim: "flame"}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4,6), 8, 10),
            collisionIgnore: ["enemy"],// no collisions between enemies
        }),
        k.body(),
        k.state("idle", ["idle", "jump"]), // state machine defines behavior for each state. default state and all possible states
        { isInhalable: false, speed: 100},
        "enemy",
    ]);

    makeInhalable(k, flame);

    flame.onStateEnter("idle", async () => {
        await k.wait(1);
        flame.enterState("jump");
    });

    flame.onStateEnter("jump", async () => {
        flame.jump(1000); // jump force
    });

    flame.onStateUpdate("jump", async () => {
        if(flame.isGrounded()) {
            flame.enterState("idle");
        }
    });
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number){
    const guy = k.add([
        k.sprite("assets", {anim: "guyWalk"}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(2,3.9), 12, 12),
            collisionIgnore: ["enemy"],// no collisions between enemies
        }),
        k.body(),
        k.state("idle", ["idle", "left", "right"]), // state machine defines behavior for each state. default state and all possible states
        { isInhalable: false, speed: 100},
        "enemy",
    ]);

    makeInhalable(k, guy);

    guy.onStateEnter("idle", async () => {
        await k.wait(1);
        guy.enterState("left");
    });

    guy.onStateEnter("left", async () => {
        guy.flipX = false;
        await k.wait(2);
        guy.enterState("right");
    });

    guy.onStateUpdate("left", () => {
        guy.move(-guy.speed, 0);
    });

    guy.onStateEnter("right", async () => {
        guy.flipX = true;
        await k.wait(2);
        guy.enterState("left");
    });

    guy.onStateUpdate("right", () => {
        guy.move(guy.speed, 0);
    });
}

export function makeBirdEnemy(k: KaboomCtx, posX: number, posY: number, speed: number){
    const bird = k.add([
        k.sprite("assets", {anim: "bird"}),
        k.scale(scale),
        k.pos(posX * scale, posY * scale),
        k.area({
            shape: new k.Rect(k.vec2(4,6), 8, 10),
            collisionIgnore: ["enemy"],// no collisions between enemies
        }),
        k.body({isStatic: true}), // or the bird falls due to gravity
        k.move(k.LEFT, speed),
        k.offscreen({destroy: true, distance: 400}), //things don't render when they're offscreen
        { isInhalable: false, speed: 100},
        "enemy",
    ]);

    makeInhalable(k, bird);
    return bird;
}

export function makeInhalable(k: KaboomCtx, enemy: GameObj) {
    enemy.onCollide("inhaleZone", () => {
        enemy.isInhalable = true;
    });

    enemy.onCollideEnd("inhaleZone", () => {
        enemy.isInhalable = false;
    });

    enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
        k.destroy(enemy);
        k.destroy(shootingStar);
    });

    const playerRef = k.get("player")[0];

    enemy.onUpdate(() => {
        if(playerRef.isInhaling && enemy.isInhalable) {
            if(playerRef.direction === "right"){
                enemy.move(-800, 0);
                return;
            }
            enemy.move(800, 0);
        }
    })

}