interface BanInfo {
	plan: string;
	plans: {
		[key: string]: string;
	};
	char: string[];
	current: string;
}

interface BpConfig {
	showPack: string;
	current: string;
	search: string;
	show: string;
	ban: boolean;
	noban: boolean;
	intro: string;
}

interface CardInfo {
	current: string;
	prefix: string;
	rawName: string;
	tilte: string;
	skins: {
		value: string[];
	};
	rSkins: {
		value: string[];
	};
	show: {
		show: string;
		skills: string[];
		intro: string;
		appendStr: string;
		skin: number;
		rskin: number;
		mode: string;
	};
}

interface Dynamic {
	[key: string]: {
		[key: string]: {
			name: string;
			path: string;
			yh?: number[];
			x: [number, number];
			y: [number, number];
			backgroud?: {
				path: string;
			};
			audio?: {
				card?: boolean;
				skill?: boolean;
			};
			skins: {
				[key: string]: {
					name: string;
					path: string;
					yh?: number[];
					x: [number, number];
					y: [number, number];
					backgroud?: {
						path: string;
					};
					audio?: {
						card?: boolean;
						skill?: boolean;
					};
				};
			};
		};
	};
}

interface Skin<T extends []> {
	skin: T;
	rskin: {
		[K in T[number]]: string[];
	};
	yuanhua: {
		[K in T[number]]: string[];
	};
}

interface wySkinConfig {
	character: { [key: string]: Skin<string[]> };
	getSkin(name: string): Skin<string[]>;
}

export type { BanInfo, BpConfig, CardInfo, Dynamic, wySkinConfig };
