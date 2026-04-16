import type { Game, Library, UI, Get, AI, status } from "nonameRoot";

interface Skin<T extends string[]> {
	skin: T;
	rskin: {
		[K in T[number]]: string[];
	};
	yuanhua: {
		[K in T[number]]: string[];
	};
}

declare module "noname" {
	const lib: Library & {
		wySkin: {
			character: { [key: string]: Skin<string[]> };
			getSkin(name: string): Skin<string[]>;
		};
	};
	const game: Game & {
		wyrging: (value: boolean) => void;
	};
	const get: Get & {};
	const ui: UI & {
		arenalog: HTMLDivElement;
		historybar: HTMLDivElement;
		sidebar: HTMLDivElement;
		sidebar3: HTMLDivElement;
		me: HTMLDivElement;
		click: {
			wybpClose(): void;
		};
	};
	const _status: status & {
		wyrgFighting: boolean;
		gameStart: boolean;
		lastPhasedPlayer: boolean;
		pozhen: {
			has: boolean;
			use: boolean;
			res: boolean;
		};
		wyrgMode: {
			loadHome(): void;
			close?(): void;
		};
	};
	const ai: AI & {};
	export { lib, game, get, ui, _status, ai };
}
