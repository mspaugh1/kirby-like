import kaboom from "kaboom";
import { scale } from "./constants";

//width and height are for gameboy- but wider to fit into 16X9 ratio
//letterbox - canvas scales regardless of screensize and keep aspect ration
//global - only use kaboom from this constant
//scale below can be done this shorthand way because you already have a variable above with same name
export const k = kaboom({
    width: 256 * scale,
    height: 144 * scale,
    scale,
    letterbox: true,
    global: false,
});