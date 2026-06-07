import { lib, game, ui, get, ai, _status } from "noname";
import { contents } from "./content";
import { skills } from "./skill";
import { characters } from "./character";
import { characterSort } from "./characterSort";
import { translates } from "./translate";
import { dynamicTranslates } from "./dynamicTranslate";
import { buttonPresets } from "./buttonPresets";

export const initCharacter = () => {
	const getOwner = get.owner;
	get.owner = (card, method) => {
		const owner = card.storage?._wyowner;
		if (get.itemtype(owner) == "player") {
			return owner;
		}
		return getOwner(card, method);
	};
	for (const content in contents) {
		lib.element.content[content] = contents[content];
	}
	for (const buttonPreset in buttonPresets) {
		ui.create.buttonPresets[buttonPreset] = buttonPresets[buttonPreset];
	}
	game.import("character", () => {
		return {
			name: "wyrg",
			character: characters,
			skill: skills,
			translate: translates,
			dynamicTranslate: dynamicTranslates,
			characterSort: {
				wyrg: characterSort,
			},
		};
	});
};
