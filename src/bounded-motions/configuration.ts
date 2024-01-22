export interface Configuration {
    name: string;
    debug: boolean;
    statusBar?: ConfigurationStatusBar;
}

interface ConfigurationStatusBar {
    help?: boolean;
}

export const DEFAULT_CONFIGURATION: Configuration = {
    name: "bounded-motions",
    debug: true,
};
