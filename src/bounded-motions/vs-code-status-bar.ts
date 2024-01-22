import * as vscode from "vscode";
import { EditorMode, MovementType, MotionMode } from "./mode";
import { Configuration } from "./configuration";

interface VsCodeStatusBarOpts {
    editor?: EditorMode;
    motion?: MotionMode;
    movement?: MovementType;
    message?: string;
}

const editorMap: Map<EditorMode, string> = new Map([
    [EditorMode.EDIT, EditorMode.EDIT],
    [EditorMode.MOTION, EditorMode.MOTION],
]);

const motionMap: Map<MotionMode, string> = new Map([
    [MotionMode.CHARACTER, "CHAR"],
    [MotionMode.DOCUMENT, "DOC "],
    [MotionMode.LINE, "LINE"],
    [MotionMode.WORD, "WORD"],
]);

// References
//   - ICONS https://code.visualstudio.com/api/references/icons-in-labels#icon-listing
const movementMap: Map<MovementType, string> = new Map([
    [MovementType.UP, " $(arrow-up)"], // ↑
    [MovementType.DOWN, " $(arrow-down) "], // ↓
    [MovementType.LEFT, " $(arrow-left)"], // ←
    [MovementType.RIGHT, " $(arrow-right)"], // →
]);

export class VsCodeStatusBarManager {
    private readonly configuration: Configuration;
    private readonly item: vscode.StatusBarItem;

    constructor(config: Configuration) {
        this.configuration = config;
        this.item = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Left
        );
        this.item.command = `${this.configuration.name}.statusBar`;
        this.item.show();
    }

    disposables(): vscode.Disposable[] {
        return [this.item];
    }

    set(opts: VsCodeStatusBarOpts): void {
        let text = this.configuration.name;

        if (opts.editor) {
            text += ` : ${editorMap.get(opts.editor) || opts.editor}`;
        }

        if (opts.motion) {
            text += `  : ${motionMap.get(opts.motion) || opts.editor}`;
        }

        if (opts.movement) {
            text += `  : ${movementMap.get(opts.movement) || opts.movement}`;
        }

        if (opts.message) {
            text += ` : ${opts.message}`;
        }

        if (this.configuration.debug)
            console.log(`Updating status bar with "${text}"`);

        this.item.text = text;
        this.item.show();
    }
}
