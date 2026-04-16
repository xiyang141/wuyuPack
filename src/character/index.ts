import { lib, game, ui, get, ai, _status } from "noname";
import { character } from "./character";
import { skill } from "./skill";
import { translate } from "./translate";

export const initcharacter = ()=> {
    for(const s in skill){
        lib.skill[s] = skill[s];
    }
    for(const t in translate){
        lib.translate[t] = translate[t];
    }
    for(const char in character){
        const info = get.copy(character[char].info);
        delete character[char].info;
        lib.character[char] = character[char];
        lib.character[char] = character[char];
        lib.characterPack[info.pack][char] = char;
        if(!lib.characterSort[info.pack][info.sort]){
            lib.characterSort[info.pack][info.sort] = [];
        }   
        lib.characterSort[info.pack][info.sort].push(char);
    }
}