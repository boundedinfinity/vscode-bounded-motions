export interface Configuration {
    name: string;
    debug: boolean
}

export const DEFAULT_CONFIGURATION: Configuration = {
    name: "bounded-motions",
    debug: true
};
