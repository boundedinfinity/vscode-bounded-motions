import { EditorMode } from "./mode";
import { Controller } from "./controller";
import { type Configuration } from "./configuration";

const controller = new Controller();
export { EditorMode as MotionMode, Configuration, controller };
