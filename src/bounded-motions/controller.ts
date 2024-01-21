import { EditorMode } from "./mode";
import { VsCodeContextManager } from "./vs-code-context";
import { VsCodeStatusBarManager } from "./vs-code-status-bar";
import { type Configuration, DEFAULT_CONFIGURATION } from "./configuration";
import { DocumentManager } from "./document";
import { createMachine, createActor, assign, sendTo } from "xstate";
import * as vscode from "vscode";

type SetModeOpts = {
    force?: boolean;
};

type VsCodeEvent = {
    text?: string;
};

export class Controller {
    private readonly config: Configuration;
    private readonly vsCodeContext: VsCodeContextManager;
    private readonly statusBar: VsCodeStatusBarManager;
    private readonly document: DocumentManager;
    private readonly machine /*: ReturnType<typeof createMachine> */;
    private readonly actor /* ReturnType<typeof interpret> */;

    constructor(config?: Configuration) {
        this.config = config ?? DEFAULT_CONFIGURATION;
        this.vsCodeContext = new VsCodeContextManager(this.config);
        this.statusBar = new VsCodeStatusBarManager(this.config);
        this.document = new DocumentManager(this.config);

        this.machine = this.initMachine();
        // @ts-ignore
        this.actor = createActor(this.machine).start();

        if (this.isDebug()) {
            console.log(`${this.config.name} is now active!`);
        }
    }

    isDebug(): boolean {
        return this.config.debug;
    }

    setMode(mode: EditorMode, opts?: SetModeOpts): void {
        if (this.vsCodeContext.set(mode, { ...opts })) {
            this.statusBar.set(mode);
        }
    }

    handleCharacter(event: VsCodeEvent) {
        if (event.text) {
            this.actor.send({ type: event.text });
        }
    }

    private initMachine() {
        return createMachine(
            {
                /** @xstate-layout N4IgpgJg5mDOIC5QFkCGBjAFgSwHZgDpkB5AFQEliA5AgYQAkBBAJQGIAGAbXYF1FQADgHtY2AC7YhufiAAeiALQBmAGwBGAgCZNagCxL2KzSoAcxgKxKANCACeiNSfMElmgJy6A7J7cn2n3X0AXyCbNCw8QhIKajomNjVuPiQQYVEJKRl5BAVtZ3VNTzU3c0DTFV0bewRHZ1cPb19-QKU1ELCMHHwiMkoaBhZWTSSZNPFJaRTshRMTLRVzPTVzP3ZZkyqHJxd3Lx8-AP020JBwrqje2IG2JRGUsYzJ0GzdNwJPJTcjFU8jN01dHoVJsatt6nsmoclO1Tp1Ij0Yv14qxdHdBCJxpkpltPAQTK8TColIS1AFzP8QbUdg19s0jjCzvDon04oNzGjUhjHllFKoNNo9AZvmYFtY7IhCrjVOxVKZiaU3G4GXDusyrsiVByHhMeTk8gQCkUSmVCZVxQhJS4VDKVHKnK8lSdGarLkjBp4tVyddicrN5otASt2GtZiDLdLZSZ5Q7lREXYjWWwTJ70t7nohXu9Pt9fu4AWpgebw9bI9HFSpY+cESzrqw3CnMU85Di8QSiSSyRSi94rTa7QrHR04xcE7WADYN7k+5TmXH4zTmfNufyaPyF6oKUkEGVKcz+WZ6VYeStM12J1gAa0naebes0SgNvgWKjcn2MFTNG63O73ngPuiPXQT3jGtkWwa8sXTPVlgIQJFVndwfnzT9FDUAstDUVd2EBZZASKCsnRVEdQMGAArCCm2mExcVeZZZ2WbQPBBTdcR-fcTEPYNj0I4dq3VQYwAo3UZgBAgSnvNw9GXaV1wlXRnB0epl3caiSmA4j+LYdAxzAVAACcqAAVwAWwAIzAPTYCE6d1GcPR5IaHDXFknIvAIAtSl3IldBldwAnUggAFEABFyFIVg4HQayoIUV83kU+cjG0dhLGYnR2G3f5PAkj5F3kgKQrC1gACpotvTc1l0dzWkXDxVG8Mww0Md5FmymUilKADNBCE5cCECA4BkZ0wFGL1IPKtDXGqhi6p+P9NGYpQlFxW0nGWipCU0bCArVKhRtTcbpltB97PJLwnOMNK9xceSjDUXdXyknaz2ufbG2E8wKjEwFTGKNZvECSl2E0K1Z1mRoHL0ArQtIN6pxir5cR0ExFSjV8jBWEFTANAs3E8cldx0ACTB6oIgA */
                types: {} as {
                    context: {
                        numbers: string;
                    };
                },
                context: {
                    numbers: "",
                },

                id: "Machine",

                states: {
                    MOTION: {
                        entry: "enterMotion",
                        states: {
                            CHAR: {
                                entry: "enterChar",
                                on: {
                                    l: {
                                        target: "CHAR",
                                        actions: "handleRight",
                                        reenter: true,
                                    },

                                    k: {
                                        target: "CHAR",
                                        actions: "handleDown",
                                        reenter: true,
                                    },

                                    i: {
                                        target: "CHAR",
                                        actions: "handleUp",
                                        reenter: true,
                                    },

                                    j: {
                                        target: "CHAR",
                                        actions: "handleLeft",
                                        reenter: true,
                                    },
                                    0: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    1: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    2: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    3: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    4: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    5: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    6: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    7: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    8: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    9: {
                                        target: "CHAR",
                                        actions: "storeNumber",
                                        reenter: true,
                                    },
                                    e: {
                                        target: "#Machine.EDIT",
                                    },

                                    clearNumbers: {
                                        target: "CHAR",
                                        actions: "clearNumbers",
                                        reenter: true,
                                    },
                                },
                            },
                        },

                        initial: "CHAR",
                    },

                    EDIT: {
                        on: {
                            esc: "MOTION",
                            "*": {
                                target: "EDIT",
                                actions: "passthrough",
                            },
                        },
                        entry: "enterEdit",
                    },
                },

                initial: "MOTION",
            },
            {
                actions: {
                    storeNumber: assign({
                        numbers: (event) =>
                            event.context.numbers.concat(event.event.type),
                    }),
                    clearNumbers: assign({
                        numbers: () => "",
                    }),
                    handleDown: (event) => {
                        this.document.move({
                            to: "down",
                            value: event.context.numbers
                                ? parseInt(event.context.numbers)
                                : 1,
                        });

                        event.self.send({ type: "clearNumbers" });
                    },
                    handleLeft: (event) => {
                        this.document.move({
                            to: "left",
                            value: event.context.numbers
                                ? parseInt(event.context.numbers)
                                : 1,
                        });
                        event.self.send({ type: "clearNumbers" });
                    },
                    handleRight: (event) => {
                        this.document.move({
                            to: "right",
                            value: event.context.numbers
                                ? parseInt(event.context.numbers)
                                : 1,
                        });
                        event.self.send({ type: "clearNumbers" });
                    },
                    handleUp: (event) => {
                        this.document.move({
                            to: "up",
                            value: event.context.numbers
                                ? parseInt(event.context.numbers)
                                : 1,
                        });
                        event.self.send({ type: "clearNumbers" });
                    },
                    enterChar: () => {
                        this.setMode(EditorMode.MOTION, { force: true });
                    },
                    enterMotion: () => {
                        this.setMode(EditorMode.MOTION);
                    },
                    enterEdit: () => {
                        this.setMode(EditorMode.EDIT);
                    },
                    passthrough: (context) => {
                        const event: VsCodeEvent = { text: context.event.type };
                        vscode.commands.executeCommand("default:type", event);
                    },
                },
            }
        );
    }
}
