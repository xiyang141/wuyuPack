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
		value: number[];
	};
	show: {
		show: string;
		skills: string[];
		intro: string;
		appendStr: string;
		skin: number;
		rSkin: number;
		mode: string;
	};
}

interface Dynamic {
	[key: string]: {
		[key: string]: {
			name: string;
			path: string;
			ext: ".png" | ".jpg";
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
			skins?: {
				name: string;
				path: string;
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
}

interface wySkinConfig {
	character: string;
	getname(name: string, skin: string): string[];
}

export type { BanInfo, BpConfig, CardInfo, Dynamic, wySkinConfig };
