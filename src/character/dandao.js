import { get, ui, lib, game } from "noname";
let funcMap = {
  storage(player, key, value) {
    game.broadcastAll(
      (player2, key2, value2) => {
        player2.storage.wuyu_dandao[key2] = value2;
      },
      player,
      key,
      value
    );
  },
  skill(player, equip, global, self) {
    let event = get.event(), skillEvent;
    if (event.skill) {
      skillEvent = event;
    } else if (event.getParent("trigger").skill) {
      skillEvent = event.getParent("trigger");
    } else if (event.getParent("useSkill").skill) {
      skillEvent = event.getParent("useSkill");
    }
    let boo1 = equip && skillEvent?.type == "equip", boo2 = !global && skillEvent?.type == "global", boo3 = !self && skillEvent?.player == player;
    return !skillEvent || boo1 || boo2 || boo3;
  },
  fixedEvent(player, event, info) {
    let newInfo = info.reduce((newInfo2, item) => {
      newInfo2[item] = event[item];
      return newInfo2;
    }, {});
    newInfo.dandao_player = player;
    event.set("dandao_skill", newInfo);
    info.forEach((item) => {
      Object.defineProperty(event, item, {
        get() {
          if (Array.isArray(this.dandao_skill[item])) {
            return [...this.dandao_skill[item]];
          }
          return this.dandao_skill[item];
        },
        set(value) {
          if (item == "num" && ["recover", "damage"].includes(event.name)) {
            if (value > this.dandao_skill[item]) {
              this.dandao_skill[item] = value;
            }
          }
          if (get.info("wuyu_dandao").funcs.skill(this.dandao_skill.dandao_player)) {
            this.dandao_skill[item] = value;
          }
        },
        configurable: true
      });
    });
    const next = game.createEvent("dandao_fixedEvent_after", false);
    next.player = player;
    next.set("sourceEvt", event);
    next.setContent(async (event2, trigger, player2) => {
      const evt = event2.sourceEvt;
      const note = evt.dandao_skill;
      for (const key in note) {
        Object.defineProperty(evt, key, {
          value: note[key],
          configurable: true,
          writable: true,
          enumerable: true
        });
        evt[key] = note[key];
      }
    });
    event.after.push(next);
  },
  replace(obj, key, value, oldInfo, newInfo) {
    let str = value.toString(), parm, func;
    str = str.replace(new RegExp(`["']${oldInfo}["']`, "g"), `"${newInfo}"`);
    if (key == "filter") {
      str = str.replace(/["']unequip2["']/g, '"dandaoequip"');
      str = str.replace(/["']unequip["']/g, '"dandaoequip"');
    }
    parm = str.match(/\(.*?\)/)[0];
    func = str.slice(str.indexOf(parm));
    parm = parm.slice(1, -1).split(",");
    func = func.slice(func.indexOf("{") + 1, -1);
    Object.defineProperty(obj, key, {
      value: new Function(...parm, func),
      enumerable: true,
      configurable: true,
      writable: true
    });
  },
  createEquipSkills(skills) {
    let list = [];
    skills.forEach((skill) => {
      let skillx = `huangzhubuff_${skill}`;
      if (lib.skill[skillx]) {
        list.add(skillx);
      } else {
        let newInfo = get.copy(get.info(skill)), func = (obj) => {
          for (let key in obj) {
            if (!obj.hasOwnProperty(key)) {
              continue;
            }
            let value = obj[key];
            if (get.objtype(value) == "object") {
              if (key == "ai") {
                continue;
              } else {
                func(value);
              }
            } else if (key == "skill_id") {
              obj[key] = `huangzhubuff_${value}`;
            } else if (["derivation", "group"].includes(key)) {
              if (typeof value == "string" && value.startsWith(skill + "_")) {
                obj[key] = value.replace(new RegExp(`${skill}_`), `${skillx}_`);
              } else {
                obj[key] = value.map((str) => {
                  return str.startsWith(skill + "_") ? str.replace(new RegExp(`${skill}_`), `${skillx}_`) : str;
                });
              }
            } else if (typeof value == "function") {
              let str = value.toString();
              if (str.includes(`${skill}`) || str.includes("unequip2") || str.includes("unequip")) {
                get.info("wuyu_dandao").funcs.replace(obj, key, value, `${skill}`, `${skillx}`);
              }
            }
          }
        };
        func(newInfo);
        lib.skill[skillx] = newInfo;
        lib.translate[skillx] = lib.translate[skill];
        game.finishSkill(skillx);
        list.add(skillx);
      }
    });
    return list;
  },
  getSameItem(card1, card2) {
    const list = [];
    let count = 0;
    if (get.color(card1, false) == get.color(card2, false)) {
      list.push("color");
      count++;
    }
    if (get.type2(card1, false) == get.type2(card2, false)) {
      list.push("type");
      count++;
    }
    if (get.suit(card1, false) == get.suit(card2, false)) {
      list.push("suit");
      count++;
    }
    if (count >= 3) {
      list.push("add");
    }
    if (get.number(card1, false) == get.number(card2, false)) {
      list.push("number");
    }
    if (get.cardNameLength(card1) == get.cardNameLength(card2)) {
      list.push("length");
    }
    if (get.name(card1, false) == get.name(card2, false)) {
      list.push("name");
    }
    if (get.is.damageCard(card1, true) == get.is.damageCard(card2, true)) {
      list.push("damage");
    }
    return list;
  }
};
const wuyu_dandao = {
  audio: "ext:无语包/audio/skill:5",
  init(player, skill) {
    let bool = player.name == "wuyu_sunhanhua" || player.name2 == "wuyu_sunhanhua";
    if (bool && player.isUnderControl(true, game.me)) {
      if (!player.storage.wuyu_dandao) {
        player.setStorage("wuyu_dandao", {
          add: 1,
          draw: 1,
          recover: 1,
          skills: 5,
          skill: 1,
          zhanfas: 5,
          zhanfa: 1,
          phase: 1,
          zhan: 1,
          maxhp: 1,
          effectCount: 1,
          baseDamage: 1,
          kanpo: 1,
          judge: 1,
          niepan: 1,
          change: 1
        });
      }
      for (const sk in get.info(skill).subSkill) {
        if (sk.includes("buff")) {
          continue;
        }
        player.addSkill(`${skill}_${sk}`);
      }
    }
  },
  funcs: funcMap,
  subSkill: {
    hujiabuff: {
      trigger: {
        player: ["changeHujiaBegin"]
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        return event.num > 0;
      },
      async content(event, trigger, player) {
        trigger.cancel();
      }
    },
    respondbuff: {
      forced: true,
      charlotte: true,
      mod: {
        cardRespondable(card, player, result) {
          return false;
        }
      }
    },
    equipbuff: {
      trigger: {
        player: ["loseAfter"],
        global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        if (event.name == "equip" && event.player == player) {
          return true;
        }
        let evt = event.getl(player);
        return evt && evt.player == player && evt.es?.length;
      },
      marktext: "斩",
      mark: true,
      intro: {
        name: "斩",
        mark(dialog, storage, player) {
          dialog.addText("装备失效");
          if (player.hasSkill("wuyu_dandao_baibanbuff")) {
            dialog.addText("技能失效");
          }
          if (player.hasSkill("wuyu_dandao_hujiabuff")) {
            dialog.addText("无法获得护甲");
          }
          if (player.hasSkill("wuyu_dandao_recoverbuff")) {
            dialog.addText("无法回复体力");
          }
          if (player.hasSkill("wuyu_dandao_gainbuff")) {
            dialog.addText("无法获得牌");
          }
        }
      },
      mod: {
        attackRange(player, num) {
          return num + 1 - player.getEquipRange();
        },
        globalFrom(from, to, distance) {
          let num = 0;
          for (let i of from.getVCards("e")) {
            let info = get.info(i).distance;
            if (!info) continue;
            if (info.globalFrom) num += info.globalFrom;
          }
          return distance - num;
        },
        globalTo(from, to, distance) {
          let num = 0;
          for (let i of to.getVCards("e")) {
            let info = get.info(i).distance;
            if (!info) continue;
            if (info.globalTo) num += info.globalTo;
            if (info.attackTo) num += info.attackTo;
          }
          return distance - num;
        }
      },
      init(player, skill) {
        let skills = player.getSkills("e", true, false);
        player.disableSkill(skill, skills);
      },
      onremove(player, skill) {
        player.enableSkill(skill);
      },
      async content(event, trigger, player) {
        let skills = player.getSkills("e", true, false);
        player.disableSkill(event.name, skills);
      }
    },
    gainbuff: {
      trigger: {
        player: ["gainBegin"]
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        return event.num > 0;
      },
      async content(event, trigger, player) {
        trigger.cancel();
      }
    },
    usebuff: {
      forced: true,
      charlotte: true,
      mod: {
        cardEnabled(card, player, result) {
          return false;
        }
      }
    },
    baibanbuff: {
      trigger: {
        player: ["changeSkillsAfter"]
      },
      forced: true,
      charlotte: true,
      init(player, skill) {
        let skills = player.getSkills(null, false, false).filter((sk) => {
          let info = get.info(sk);
          return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
        });
        player.disableSkill(skill, skills);
      },
      onremove(player, skill) {
        player.enableSkill(skill);
      },
      async content(event, trigger, player) {
        let skills = player.getSkills(null, false, false).filter((sk) => {
          let info = get.info(sk);
          return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
        });
        player.disableSkill(event.name, skills);
      }
    },
    recoverbuff: {
      trigger: {
        player: ["recoverBegin"]
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        return event.num > 0;
      },
      async content(event, trigger, player) {
        trigger.cancel();
      }
    },
    phasebuff: {
      trigger: {
        global: ["phaseEnd"]
      },
      charlotte: true,
      filter(event, player) {
        return event.skill != "wuyu_dandao";
      },
      async cost(event, trigger, player) {
        let num = player.getStorage("wuyu_dandao").phase;
        let list = [];
        for (let i = 0; i < num; i++) {
          list.push(lib.phaseName.map((phase) => [`${phase}${i}`, get.translation(phase)]));
        }
        let { bool, links } = await player.chooseButton({
          createDialog: [`执行自定义${num}个阶段的回合`, ...list.map((btns) => [btns, "tdnodes"])]
        }).set("phase_list", list).set("filterButton", (button) => {
          const link = button.link.at(-1);
          return parseInt(link) == ui.selected.buttons.length;
        }).forResult();
        event.result = {
          bool,
          cost_data: {
            list: links
          }
        };
      },
      async content(event, trigger, player) {
        const { list } = event.cost_data;
        const phaseList = list.map((phase) => phase.slice(0, -1));
        player.insertPhase().set("phaseList", phaseList).set("skill", "wuyu_dandao");
      }
    },
    huangzhubuff: {
      forced: true,
      charlotte: true,
      marktext: "武",
      intro: {
        name: "武",
        mark(dialog, storage, player) {
          const equips = player.getStorage("wuyu_dandao").huangzhubuff;
          dialog.addText("视为拥有以下装备效果(不会失效且独立):<br>");
          dialog.addSmall([equips, "vcard"]);
        }
      },
      mod: {
        globalFrom(from, to, distance) {
          return distance + from.getStorage("wuyu_dandao").huangzhubuff.reduce((sum, name) => sum + (lib.card[name]?.distance?.globalFrom || 0), 0);
        },
        globalTo(from, to, distance) {
          return distance + to.getStorage("wuyu_dandao").huangzhubuff.reduce((sum, name) => sum + (lib.card[name]?.distance?.globalTo || 0), 0);
        },
        attackRange(from, distance) {
          return distance - from.getStorage("wuyu_dandao").huangzhubuff.reduce((sum, name) => sum + (lib.card[name]?.distance?.attackFrom || 0), 0);
        },
        attackTo(from, to, distance) {
          return distance + to.getStorage("wuyu_dandao").huangzhubuff.reduce((sum, name) => sum + (lib.card[name]?.distance?.attackTo || 0), 0);
        }
      }
    },
    zhichibuff: {
      trigger: {
        player: ["damageBegin", "loseHpBegin"]
      },
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        trigger.cancel();
      }
    },
    draw: {
      audio: "wuyu_dandao",
      trigger: {
        player: ["loseAfter", "dyingBegin"],
        global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"],
        target: ["useCardToTargeted"]
      },
      forced: true,
      charlotte: true,
      filter(event, player, triggername) {
        if (event.getl) {
          let names = player.getHistory("lose", (evt) => evt != event).map((evt) => evt.getl(player).hs).flat().map((card) => card.name);
          return event.getl(player).hs.some((card) => !names.includes(card.name));
        }
        if (triggername == "useCardToTargeted") {
          return !game.hasGlobalHistory("useCard", (evt) => evt.targets.includes(player) && evt.card.name == event.card.name && evt != event.getParent());
        }
        return true;
      },
      async content(event, trigger, player) {
        const { draw } = player.getStorage("wuyu_dandao");
        await player.draw({ num: draw });
        let recast = player.countCards("hes") >= 2;
        if (recast) {
          const { bool, cards } = await player.chooseCard({
            prompt: "重铸两张牌",
            selectCard: 2,
            position: "hes"
          }).forResult();
          recast = bool;
          if (bool) {
            await player.recast(cards);
            const { recover, skills, skill, zhanfas, zhanfa, phase, zhan, add, maxhp, effectCount, baseDamage, kanpo, judge, niepan, change } = player.getStorage("wuyu_dandao");
            const list = get.info("wuyu_dandao").funcs.getSameItem(cards[0], cards[1]);
            if (list.includes("color")) {
              await player.recover({ num: recover });
              await player.changeHujia(recover);
            }
            if (list.includes("type")) {
              if (!player.getStorage("wuyu_dandao").allSkill) {
                let list3 = [];
                for (let character in lib.character) {
                  let skills2 = get.character(character, 3);
                  list3.addArray(skills2);
                }
                list3.flat().unique();
                get.info("wuyu_dandao").funcs.storage(player, "allSkill", list3);
              }
              const list2 = player.getStorage("wuyu_dandao").allSkill.filter((skill2) => !player.hasSkill(skill2, "invisible", true, false)).randomGets(skills);
              if (list2.length > 0) {
                const { bool: bool2, links } = await player.chooseButton({
                  createDialog: [`从${skills}个随机技能中选择${skill}个获得`, [list2, "skill"]],
                  selectButton: [1, skill]
                }).forResult();
                if (bool2) {
                  player.markAuto("wuyu_dandao_skillNote", links);
                  await player.addSkills(links);
                }
              }
            }
            if (list.includes("suit")) {
              let list2 = lib.zhanfa.getList().filter((zhanfa2) => !player.hasZhanfa(zhanfa2)).randomGets(zhanfas);
              if (list2.length > 0) {
                const { bool: bool2, links } = await player.chooseButton({
                  createDialog: [`获得${zhanfa}个战法`, [list2, "vcard"]],
                  selectButton: [1, zhanfa]
                }).forResult();
                if (bool2) {
                  for (let link of links) {
                    player.addZhanfa(link[2]);
                  }
                }
              }
            }
            if (list.includes("add")) {
              const ownSkills = player.getSkills("invisible", true, false).filter((sk) => {
                let info = get.info(sk);
                return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
              });
              player.refreshSkill(ownSkills);
              const { bool: bool2, links } = await player.chooseButton({
                createDialog: [
                  `选择${add}个数值+1`,
                  [
                    [
                      ["draw", `每回合首次失去某种牌时/每回合首次成为某种牌的目标后/濒死时,你摸${draw}↑张牌然后重铸两张牌或获得${draw}↑点护甲,若这两张牌`],
                      ["recover", `颜色相同:回复${recover}↑点体力并获得1↑点护甲(未受伤额外获得${recover}↑点护甲)`],
                      ["skills", `类型相同:从${skills}↑个技能中选择${skill}个获得`],
                      ["skill", `类型相同:从${skills}个技能中选择${skill}↑个获得`],
                      ["zhanfas", `花色相同:从${zhanfas}↑个战法中选择${zhanfa}个获得`],
                      ["zhanfa", `花色相同:从${zhanfas}个战法中选择${zhanfa}↑个获得`],
                      ["add", `以上皆相同:令丹道一个效果数字+${add}↑且重置技能`],
                      ["length", `牌名字数相同:本回合结束时执行一个自定义${phase}个阶段的回合`],
                      ["zhan", `获得${zhan}↑枚“斩”,使用牌时可移去至多5枚'斩'并对除你以外的目标执行对应效果:1.无法获得护甲;2.不能打出牌;3装备失效;4.无法获得牌;5.不能使用牌;6.技能失效;7.无法回复体力`],
                      ["maxhp", `皆不满足:增加${maxhp}↑点体力上限`],
                      ["effectCount", `使用牌额外结算${effectCount}↑次`],
                      ["baseDamage", `使用牌基础数值+${baseDamage}↑`],
                      ["kanpo", `每回合限${kanpo}↑次,任意角色使用牌时,可令其无效`],
                      ["judge", `每回合限${judge}↑次,任意角色判定结果确定时,可终止判定并获得判定牌`],
                      ["niepan", `每回合限${niepan}↑次,死亡时将体力调整至体力上限并获得等量护甲`],
                      ["change", `每回合限${change}↑次,体力值变化时视为使用一张牌库牌`]
                    ],
                    "textbutton"
                  ]
                ],
                selectButton: [1, add * 2]
              }).forResult();
              if (bool2) {
                for (let link of links) {
                  const num = player.getStorage("wuyu_dandao")[link] + add;
                  get.info("wuyu_dandao").funcs.storage(player, link, num);
                }
              }
            }
            if (list.includes("number")) {
              const equips = player.getStorage("wuyu_dandao")?.huangzhubff || [];
              const list2 = [];
              for (const pack in lib.cardPack) {
                if (pack == "zhanfa") {
                  continue;
                }
                const cards2 = lib.cardPack[pack];
                cards2.forEach((name) => {
                  if (get.type2(name, false) == "equip" && !equips.includes(name)) {
                    list2.push(name);
                  }
                });
              }
              const { links, bool: bool2 } = await player.chooseButton({
                createDialog: ["视为拥有一张装备效果(不会失效且独立)", [list2, "vcard"]]
              }).forResult();
              if (bool2) {
                equips.push(links[0][2]);
                get.info("wuyu_dandao").funcs.storage(player, "huangzhubuff", equips);
                const card = get.autoViewAs({ name: links[0][2] });
                const skills2 = get.info("wuyu_dandao").funcs.createEquipSkills(get.skillsFromEquips([card]));
                player.addAdditionalSkill(skill, skills2, true);
                player.markSkill("wuyu_dandao_huangzhubuff");
              }
            }
            if (list.includes("length")) {
              player.addTempSkill("wuyu_dandao_phasebuff", { player: ["phaseBefore"] });
            }
            if (list.includes("name")) {
              player.addTempSkill("wuyu_dandao_zhichibuff");
            }
            if (list.includes("damage")) {
              player.addMark("wuyu_dandao_zhan", zhan);
            }
            if (!list.length) {
              await player.gainMaxHp(maxhp);
            }
          }
        }
        if (!recast) {
          await player.changeHujia(draw);
        }
      }
    },
    zhan: {
      trigger: {
        player: ["useCard"]
      },
      charlotte: true,
      filter(event, player) {
        let bool = event.targets.length > 0;
        if (event.targets.includes(player)) {
          bool = event.targets.length > 1;
        }
        return bool && player.hasMark("wuyu_dandao_zhan");
      },
      prompt(event, player) {
        return "移去'斩'令非自身目标本回合:1.无法获得护甲;2.不能打出牌;3装备失效;4.无法获得牌;5.不能使用牌;6.技能失效;7.无法回复体力";
      },
      marktext: "斩",
      intro: {
        name: "斩",
        content: "mark"
      },
      async content(event, trigger, player) {
        let count = player.countMark(event.name);
        let num = Math.min(5, count), skills = [];
        player.removeMark(event.name, num);
        player.markSkill("wuyu_dandao_zhan");
        ["hujiabuff", "respondbuff", "equipbuff", "gainbuff", "usebuff", "baibanbuff", "recoverbuff"].forEach((name, i) => {
          if (num >= i + 1) {
            skills.add(`wuyu_dandao_${name}`);
          }
        });
        trigger.targets.filter((target) => target != player).forEach((target) => target.addTempSkill(skills));
      }
    },
    die: {
      audio: "wuyu_dandao",
      trigger: {
        player: ["dieBegin"]
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        return player.getHp() > 0;
      },
      async content(event, trigger, player) {
        game.log(player, "免疫即死");
        trigger.cancel();
      }
    },
    control: {
      init(player) {
        Object.defineProperty(player, "_trueMe", {
          get() {
            return this;
          },
          set(val) {
            if (val != this) {
              game.log(this, "免疫操控");
            }
            return false;
          },
          configurable: false,
          enumerable: true
        });
      }
    },
    useeff: {
      trigger: {
        player: ["useCard"]
      },
      forced: true,
      charlotte: true,
      mod: {
        cardUsable(card, player, num) {
          return Infinity;
        },
        targetInRange(card, player, target, range) {
          return true;
        }
      },
      async content(event, trigger, player) {
        if (!Array.isArray(trigger.directHit)) {
          trigger.directHit = [];
        }
        trigger.directHit.addArray(game.players);
        game.log(player, "使", trigger.card, "不可响应");
      }
    },
    effectCount: {
      trigger: {
        player: ["useCard"]
      },
      charlotte: true,
      filter(event, player) {
        return event.targets.length > 0 && !["equip", "delay"].includes(get.type(event.card, null, false));
      },
      prompt(event, player) {
        let num = player.getStorage("wuyu_dandao").effectCount;
        return `令${get.translation(event.card)}额外结算${num}次`;
      },
      async content(event, trigger, player) {
        const num = player.getStorage("wuyu_dandao").effectCount;
        trigger.effectCount += num;
        game.log(player, "令", trigger.card, "额外结算", num, "次");
      }
    },
    baseDamage: {
      trigger: {
        player: ["useCard"]
      },
      charlotte: true,
      filter(event, player) {
        return event.targets.length > 0 && !["equip", "delay"].includes(get.type(event.card, null, false));
      },
      prompt(event, player) {
        let num = player.getStorage("wuyu_dandao").baseDamage;
        return `令${get.translation(event.card)}基础数值+${num}`;
      },
      async content(event, trigger, player) {
        let num = player.getStorage("wuyu_dandao").baseDamage;
        trigger.baseDamage += num;
        game.log(player, "令", trigger.card, "数值+", num);
      }
    },
    useNo: {
      trigger: {
        global: ["useCardBegin"]
      },
      forced: true,
      charlotte: true,
      init(player, skill) {
        let checkMod = game.checkMod;
        game.broadcastAll((checkMod2) => {
          game.checkMod = function() {
            const args = Array.from(arguments);
            const name = args[args.length - 2], player2 = args[args.length - 1];
            let mod = checkMod2.apply(this, args);
            if (mod != "unchanged" && ["targetEnabled", "playerEnabled"].includes(name) && player2.getStorage("wuyu_dandao")) {
              mod = "unchanged";
            }
            if ("cardUsable" == name && player2.getStorage("wuyu_dandao")) {
              const num = args[2];
              if (num > mod) {
                mod = num;
              }
            }
            if (mod != "unchanged" && ["cardEnabled", "cardEnabled2", "cardRespondable", "cardSavable"].includes(name) && player2.getStorage("wuyu_dandao")) {
              mod = "unchanged";
            }
            if (["wuxieJudgeEnabled", "wuxieJudgeRespondable", "wuxieEnabled", "wuxieRespondable"].includes(name) && player2.getStorage("wuyu_dandao")) {
              mod = "unchanged";
            }
            return mod;
          };
        }, checkMod);
      },
      async content(event, trigger, player) {
        trigger.pushHandler((event2, option) => {
          if (Array.isArray(event2.directHit) && event2.directHit.includes(player)) {
            event2.directHit.remove(player);
          }
          if (event2.nowuxie || !event2.card.wuxieable) {
            if (!event2.directHit?.length) {
              event2.directHit = [];
            }
            event2.directHit.addArray(game.players.filter((target) => target != player));
          }
        });
      }
    },
    kanpo: {
      trigger: {
        global: ["useCardBefore"]
      },
      usable(skill, player) {
        return player.getStorage("wuyu_dandao").kanpo;
      },
      charlotte: true,
      prompt2(event, player) {
        return `令${get.translation(event.card)}无效`;
      },
      async content(event, trigger, player) {
        trigger.targets.length = 0;
        trigger.all_excluded = true;
        game.log(player, "令", trigger.card, "无效");
      }
    },
    judge: {
      trigger: {
        global: ["judgeFixing"]
      },
      usable(skill, player) {
        return player.getStorage("wuyu_dandao").judge;
      },
      charlotte: true,
      prompt(event, player) {
        return `取消判定并获得${get.translation(event.result.card)}`;
      },
      filter(event, player) {
        if (!event.result) {
          return false;
        }
        return true;
      },
      async content(event, trigger, player) {
        let evt = trigger.getParent();
        if (evt.name == "phaseJudge") {
          evt.excluded = true;
        } else {
          evt.finish();
          evt._triggered = null;
          if (evt.name.startsWith("pre_")) {
            let evtx = evt.getParent();
            evtx.finish();
            evtx._triggered = null;
          }
          let nexts = trigger.next.slice();
          for (let next of nexts) {
            if (next.name == "judgeCallback") {
              trigger.next.remove(next);
            }
          }
        }
        await player.gain({
          //@ts-ignore
          cards: [trigger.result.card],
          nature: "gain"
        });
      }
    },
    niepan: {
      trigger: {
        player: ["dieBegin"]
      },
      usable(skill, player) {
        return player.getStorage("wuyu_dandao").niepan;
      },
      forced: true,
      charlotte: true,
      filter(event, player) {
        return player.getHp() <= 0;
      },
      async content(event, trigger, player) {
        let num = player.getHp();
        if (player.maxHp < 1) {
          player.maxHp = 1;
        }
        await player.changeHp(player.maxHp - num);
        await player.changeHujia(player.maxHp);
        if (player.getHp() > 0) {
          trigger.cancel();
        }
      }
    },
    card: {
      trigger: {
        player: ["useCardBefore"]
      },
      firstDo: true,
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        let cancel = trigger.cancel, cardname = trigger.card.name, card = trigger.card;
        trigger.cancel = function() {
          let player2 = this.dandao_skill.dandao_player;
          if (get.info("wuyu_dandao").funcs.skill(player2)) {
            cancel.apply(this, arguments);
          }
        };
        Object.defineProperty(trigger, "card", {
          get() {
            if (card.name != cardname) {
              card.name = cardname;
            }
            return card;
          },
          set() {
          }
        });
        get.info("wuyu_dandao").funcs.fixedEvent(player, trigger, ["targets", "excluded", "all_excluded", "finished"]);
      }
    },
    damage: {
      trigger: {
        source: ["damageBefore"]
      },
      firstDo: true,
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        let cancel = trigger.cancel;
        trigger.cancel = function() {
          let player2 = this.dandao_skill.dandao_player;
          if (get.info("wuyu_dandao").funcs.skill(player2)) {
            cancel.apply(this, arguments);
          }
        };
        get.info("wuyu_dandao").funcs.fixedEvent(player, trigger, ["player", "num", "finished"]);
      }
    },
    recover: {
      trigger: {
        player: ["recoverBefore"]
      },
      firstDo: true,
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        let cancel = trigger.cancel;
        trigger.cancel = function() {
          let player2 = this.dandao_skill.dandao_player;
          if (get.info("wuyu_dandao").funcs.skill(player2)) {
            cancel.apply(this, arguments);
          }
        };
        get.info("wuyu_dandao").funcs.fixedEvent(player, trigger, ["player", "num", "finished"]);
      }
    },
    skip: {
      trigger: {
        player: ["phaseAnyBefore", "phaseBefore"]
      },
      firstDo: true,
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        get.info("wuyu_dandao").funcs.fixedEvent(player, trigger, ["skipped", "finished"], [false, true, true]);
      }
    },
    skill: {
      init(player, skill) {
        const filterSkills = game.filterSkills;
        game.broadcastAll((filterSkills2) => {
          game.filterSkills = (skills, player2, exclude) => {
            if (player2.storage.wuyu_dandao) {
              return skills;
            }
            return filterSkills2(skills, player2, exclude);
          };
        }, filterSkills);
      }
    },
    change: {
      trigger: {
        player: ["changeHpBegin"]
      },
      usable(skill, player) {
        return player.getStorage("wuyu_dandao").change;
      },
      //@ts-ignore
      getIndex(event, player) {
        const note = {};
        for (const pack in lib.cardPack) {
          if (pack == "zhanfa") {
            continue;
          }
          const list = [];
          const cards = lib.cardPack[pack];
          cards.forEach((name) => {
            if (lib.card[name] && player.hasUseTarget(get.autoViewAs({ name }), false, false)) {
              if (name == "sha") {
                lib.linked.forEach((nature) => list.push([name, nature]));
              }
              list.push([name]);
            }
          });
          note[pack] = list;
        }
        return [note];
      },
      filter(event, player, triggername, indexedData) {
        return Object.keys(indexedData).length > 0;
      },
      charlotte: true,
      async cost(event, trigger, player) {
        const packs = Object.keys(event.indexedData);
        let start = 0;
        const noted = {};
        event.controls = [
          ui.create.control(
            (link, btn) => {
              const event2 = get.event();
              const buttons = Array.from(event2.dialog.querySelectorAll(".button"));
              if (buttons.length > 0) {
                if (!noted[packs[start]]) {
                  noted[packs[start]] = Array.from(event2.dialog.querySelectorAll(".button")).filter((btn2) => !btn2.classList.contains("nodisplay"));
                }
                noted[packs[start]].forEach((button) => button.classList.add("nodisplay"));
                if (start < packs.length - 1) {
                  start++;
                } else {
                  start = 0;
                }
                btn.textContent = get.translation(`${packs[start]}_card_config`);
                if (!noted[packs[start]]) {
                  const cards = event2.getParent().indexedData[packs[start]];
                  const list = [];
                  buttons.forEach((button) => {
                    if (cards.some((info) => info[0] == button.link[2])) {
                      list.push(button);
                    }
                  });
                  noted[packs[start]] = list;
                }
                noted[packs[start]].forEach((button) => button.classList.remove("nodisplay"));
              } else {
                const cards = event2.wy_custom.cards;
                if (!noted[packs[start]]) {
                  noted[packs[start]] = cards.filter((card) => !card.classList.contains("removing"));
                }
                noted[packs[start]].forEach((card) => card.classList.add("removing"));
                if (start < packs.length - 1) {
                  start++;
                } else {
                  start = 0;
                }
                btn.textContent = get.translation(`${packs[start]}_card_config`);
                if (!noted[packs[start]]) {
                  const cards2 = event2.getParent().indexedData[packs[start]];
                  const list = [];
                  cards.forEach((card) => {
                    if (cards2.some((info) => info[0] == card.storage.link[2])) {
                      list.push(card);
                    }
                  });
                  noted[packs[start]] = list;
                }
                noted[packs[start]].forEach((card) => card.classList.remove("removing"));
                ui.updatehl();
              }
            },
            get.translation(`${packs[start]}_card_config`),
            "stayleft"
          )
        ];
        const { bool, links } = await player.chooseButton({
          complexSelect: true,
          createDialog: [
            `视为使用一张牌库牌`,
            [
              Object.values(event.indexedData).flat(),
              (item, type, position, noclick, node) => {
                const list = [get.type(item[0], null, false), "", item[0]];
                if (item[1]) {
                  list[3] = item[1];
                }
                node = ui.create.buttonPresets.vcard(list, type, position, noclick, node);
                if (!event.indexedData[packs[start]].some((info) => info[0] == item[0])) {
                  node.classList.add("nodisplay");
                }
                return node;
              }
            ]
          ]
        }).forResult();
        event.controls.forEach((control) => control.remove());
        event.result = {
          bool,
          cost_data: {
            links
          }
        };
      },
      async content(event, trigger, player) {
        let {
          links: [link]
        } = event.cost_data;
        let card = get.autoViewAs({
          name: link[2]
        });
        if (link[3]) {
          card.nature = link[3];
        }
        await player.chooseUseTarget(card, false, "nodistance");
      }
    },
    zhongliu: {
      trigger: {
        player: ["useSkillAfter", "logSkillBegin"]
      },
      forced: true,
      charlotte: true,
      async content(event, trigger, player) {
        const skills = player.getSkills("invisible", true, false).filter((sk) => {
          let info = get.info(sk);
          return info && !info.charlotte && get.skillInfoTranslation(sk, player).length;
        }).filter((skill) => {
          const translation = get.skillInfoTranslation(skill, player);
          return translation.includes("阶段限") || translation.includes("回合限");
        });
        player.refreshSkill(skills);
      }
    }
  }
};
export {
  wuyu_dandao
};
