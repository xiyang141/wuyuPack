import { lib, game, ui, get, ai, _status } from "noname";
import { contents } from "./content";
import { skills } from "./skill";

export const initSweet = () => {
	ui.updatehl = () => {
		if (!game.me) {
			return;
		}
		if (!ui.handcards1Container || !ui.handcards2Container) {
			return;
		}
		if (!ui.handcards1Container.childNodes.length) {
			return;
		}
		var hs1 = [],
			hs2 = [];
		for (var i = 0; i < ui.handcards1Container.firstChild.childElementCount; i++) {
			if (!ui.handcards1Container.firstChild.childNodes[i].classList.contains("removing") && !ui.handcards1Container.firstChild.childNodes[i].classList.contains("wyremoving")) {
				hs1.push(ui.handcards1Container.firstChild.childNodes[i]);
			}
		}
		for (var i = 0; i < ui.handcards2Container.firstChild.childElementCount; i++) {
			if (!ui.handcards2Container.firstChild.childNodes[i].classList.contains("removing") && !ui.handcards1Container.firstChild.childNodes[i].classList.contains("wyremoving")) {
				hs2.push(ui.handcards2Container.firstChild.childNodes[i]);
			}
		}
		var offset1,
			offset12 = 0;
		if (!lib.config.fold_card) {
			offset1 = 112;
			ui.handcards1Container.classList.add("scrollh");
		} else {
			offset1 = Math.min(112, (ui.handcards1Container.offsetWidth - 128) / (hs1.length - 1));
			if (hs1.length > 1 && offset1 < 32) {
				offset1 = 32;
				ui.handcards1Container.classList.add("scrollh");
			} else {
				ui.handcards1Container.classList.remove("scrollh");
			}
		}
		if (offset1 < 100) {
			offset12 = 100 - offset1;
		}
		var spread1 = ui.getSpreadOffset(hs1, { currentMargin: offset1 });
		for (var i = 0; i < hs1.length; i++) {
			var x1 = i * offset1;
			if (spread1.spreadLeft || spread1.spreadRight) {
				if (i < spread1.spreadIndex) x1 -= spread1.spreadLeft;
				else if (i > spread1.spreadIndex) x1 += spread1.spreadRight;
			}
			var baseTransform1 = "translateX(" + x1 + "px)";
			hs1[i]._transform = baseTransform1;
			hs1[i].style.transform = hs1[i].classList.contains("selected") ? baseTransform1 + " translateY(-20px)" : baseTransform1;
			ui.refresh(hs1[i]);
			hs1[i].classList.remove("drawinghidden");
			if (offset12 > 40) {
				offset12 = 90 - hs1[i].node.info.offsetWidth;
				hs1[i].node.info.querySelector("span").style.display = "none";
				if (hs1[i].node.name.classList.contains("long")) {
					hs1[i].node.name.style.transform = "translateY(16px)  scale(0.85)";
					hs1[i].node.name.style.transformOrigin = "top left";
				} else {
					hs1[i].node.name.style.transform = "translateY(16px)";
				}
				hs1[i].node.info.style.transform = "translateX(-" + offset12 + "px) translateY(-3px)";
			} else {
				hs1[i].node.info.querySelector("span").style.display = "";
				hs1[i].node.name.style.transform = "";
				hs1[i].node.name.style.transformOrigin = "";
				hs1[i].node.info.style.transform = "translateX(-" + offset12 + "px)";
			}
		}
		ui.handcards1Container.firstChild.style.width = offset1 * (hs1.length - 1) + 118 + (spread1.spreadLeft + spread1.spreadRight) + "px";

		var offset2,
			offset22 = 0;
		if (!lib.config.fold_card) {
			offset2 = 112;
			ui.handcards2Container.classList.add("scrollh");
		} else {
			offset2 = Math.min(112, (ui.handcards2Container.offsetWidth - 128) / (hs2.length - 1));
			if (hs2.length > 1 && offset2 < 32) {
				offset2 = 32;
				ui.handcards2Container.classList.add("scrollh");
			} else {
				ui.handcards2Container.classList.remove("scrollh");
			}
		}
		if (offset2 < 100) {
			offset22 = 100 - offset2;
		}
		var spread2 = ui.getSpreadOffset(hs2, { currentMargin: offset2 });
		for (var i = 0; i < hs2.length; i++) {
			var x2 = i * offset2;
			if (spread2.spreadLeft || spread2.spreadRight) {
				if (i < spread2.spreadIndex) x2 -= spread2.spreadLeft;
				else if (i > spread2.spreadIndex) x2 += spread2.spreadRight;
			}
			var baseTransform2 = "translateX(" + x2 + "px)";
			hs2[i]._transform = baseTransform2;
			hs2[i].style.transform = hs2[i].classList.contains("selected") ? baseTransform2 + " translateY(-20px)" : baseTransform2;
			ui.refresh(hs2[i]);
			hs2[i].classList.remove("drawinghidden");
			if (offset22 > 40) {
				offset22 = 90 - hs2[i].node.info.offsetWidth;
				hs2[i].node.info.querySelector("span").style.display = "none";
				if (hs2[i].node.name.classList.contains("long")) {
					hs2[i].node.name.style.transform = "translateY(16px)  scale(0.85)";
					hs2[i].node.name.style.transformOrigin = "top left";
				} else {
					hs2[i].node.name.style.transform = "translateY(16px)";
				}
				hs2[i].node.info.style.transform = "translateX(-" + offset22 + "px) translateY(-3px)";
			} else {
				hs2[i].node.info.querySelector("span").style.display = "";
				hs2[i].node.name.style.transform = "";
				hs2[i].node.name.style.transformOrigin = "";
				hs2[i].node.info.style.transform = "translateX(-" + offset22 + "px)";
			}
		}
		ui.handcards2Container.firstChild.style.width = offset2 * (hs2.length - 1) + 118 + (spread2.spreadLeft + spread2.spreadRight) + "px";
	};
	for (const content in contents) {
		lib.element.content[content] = contents[content];
	}
	for (const skill in skills) {
		lib.skill[skill] = skills[skill];
	}
	lib.init.css(lib.assetURL + "extension/无语包/src/sweet", "style");
};
