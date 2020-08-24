import { Emulators, CommandInterface } from "emulators";
import { EmulatorsUi } from "emulators-ui";

import { Layers } from "emulators-ui/dist/types/dom/layers";

declare const emulators: Emulators;
declare const emulatorsUi: EmulatorsUi;

export class DosInstance {
    layers: Layers;
    ciPromise?: Promise<CommandInterface>;

    constructor(root: HTMLDivElement) {
        this.layers = emulatorsUi.dom.layers(root);
        this.layers.showLoadingLayer();
    }

    async run(bundleUrl: string): Promise<CommandInterface> {
        await this.stop();

        const bundle = await emulatorsUi.network.resolveBundle(bundleUrl);
        this.ciPromise = emulators.dosWorker(bundle);

        const ci = await this.ciPromise;
        const config = await ci.config();

        emulatorsUi.graphics.webGl(this.layers, ci);
        emulatorsUi.sound.audioNode(ci);
        emulatorsUi.controls.keyboard(this.layers, ci);
        emulatorsUi.controls.nippleArrows(this.layers, ci, (config as any).gestures);

        this.layers.hideLoadingLayer();
        return ci;
    }

    async stop(): Promise<void> {
        this.layers.showLoadingLayer();

        if (this.ciPromise === undefined) {
            return;
        }

        const ci = await this.ciPromise;
        delete this.ciPromise;
        await ci.exit();

        return;
    }
}


export type DosFactoryType = (root: HTMLDivElement) => DosInstance;
export const DosFactory: DosFactoryType = (root: HTMLDivElement) => {
    return new DosInstance(root);
}

(window as any).Dos = DosFactory;