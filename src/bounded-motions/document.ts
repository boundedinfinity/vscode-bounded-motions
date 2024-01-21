import { Configuration } from "./configuration";
import * as vscode from "vscode";

type To =
    | "left"
    | "right"
    | "up"
    | "down"
    | "prevBlankLine"
    | "nextBlankLine"
    | "wrappedLineStart"
    | "wrappedLineEnd"
    | "wrappedLineColumnCenter"
    | "wrappedLineFirstNonWhitespaceCharacter"
    | "wrappedLineLastNonWhitespaceCharacter"
    | "viewPortTop"
    | "viewPortCenter"
    | "viewPortBottom"
    | "viewPortIfOutside";

type By = "line" | "wrappedLine" | "character" | "halfLine";

interface MoveArgs {
    to: To;
    by?: By;
    value?: number;
    select?: boolean;
}

export class DocumentManager {
    constructor(public readonly config: Configuration) {}

    // https://code.visualstudio.com/api/references/commands#cursorMove

    move(args: MoveArgs) {
        vscode.commands.executeCommand("cursorMove", args);
    }

    moveUp() {
        this.move({ to: "up" });
    }

    moveDown() {
        this.move({ to: "down" });
    }

    moveRight() {
        this.move({ to: "right" });
    }

    moveLeft() {
        this.move({ to: "left" });
    }
}
