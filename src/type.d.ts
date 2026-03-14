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
			yhPath: string;
			yh: ".png" | ".jpg";
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
}

export type { BanInfo, BpConfig, CardInfo, Dynamic };
