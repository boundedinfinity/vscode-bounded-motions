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

export interface MoveCharacterArgs {
    to: To;
    by?: By;
    value?: number;
    select?: boolean;
}

export interface MoveWordArgs {
    to: To;
    by?: By;
    value?: number;
    select?: boolean;
}

export class DocumentManager {
    constructor(public readonly config: Configuration) {}

    // https://code.visualstudio.com/api/references/commands#cursorMove

    moveCharacter(args: MoveCharacterArgs) {
        vscode.commands.executeCommand("cursorMove", args);
    }

    moveWord(args: MoveWordArgs) {
        const editor = vscode.window.activeTextEditor;
        const cur = editor!.selection.active;
        const line = editor!.document.lineAt(cur.line);
        let count = args.value || 1
        const regex = new RegExp('\w')
        const matches = line.text.match(regex)

        for (const char of line.text) {
            if(char === " ") {
                count++
            }


        }
    }
}
