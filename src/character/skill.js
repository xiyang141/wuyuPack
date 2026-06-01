import { game, get, ui, lib, _status } from "noname";
const skill = {
  //花木兰
  rongbian: {
    trigger: {
      player: ["useCard"]
    },
    forced: true,
    init(player, skill2) {
      if (!_status.characterlist) {
        game.initCharacterList();
      }
      if (player.storage.rongbian_skill) {
        return;
      }
      const skillMap = {};
      const list = [];
      for (let char of _status.characterlist) {
        const info = get.character(char);
        if (info.sex == "female" && char != "huamulan") {
          const skills = info.skills;
          if (skills?.length) {
            skillMap[char] = skills;
            list.addArray(skills);
          }
        }
      }
      player.setStorage("rongbian_allSkill", list);
      player.setStorage("rongbian_skill", skillMap);
    },
    createCard(name, skill2, player) {
      if (!lib.card["rongbian_" + name]) {
        if (lib.translate[name + "_ab"]) {
          lib.translate["rongbian_" + name] = lib.translate[name + "_ab"];
        } else {
          lib.translate["rongbian_" + name] = lib.translate[name];
        }
        lib.character[name];
        const card2 = {
          fullimage: true,
          image: "character:" + name,
          type: "character",
          cardPrompt(card3, player2) {
            const skill3 = card3.storage.romgbian_skill;
            let cardPrompt = "";
            if (lib.skill[skill3].nobracket) {
              cardPrompt += '<div class="skilln">' + get.translation(skill3) + '</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill3)) + "</span></div><br><br>";
            } else {
              const translation = lib.translate[skill3 + "_ab"] || get.translation(skill3).slice(0, 2);
              cardPrompt += '<div class="skill">【' + translation + '】</div><div><span style="font-family: yuanli">' + get.plainText(get.skillInfoTranslation(skill3)) + "</span></div><br><br>";
            }
            return cardPrompt;
          },
          ai: {
            value(card3) {
              const skill3 = card3.storage.romgbian_skill;
              if (lib.skill[skill3].ai?.neg || lib.skill[skill3].ai?.combo) {
                return 0;
              }
              return get.skillInfoTranslation(skill3).length;
            }
          }
        };
        lib.translate["rongbian_" + name + "_info"] = "一张女将牌";
        lib.card["rongbian_" + name] = card2;
      }
      const card = game.createCard("rongbian_" + name, lib.suit.randomGet(), get.rand(1, 13));
      card.storage.romgbian_skill = skill2;
      card.storage.rongbian_owner = player;
      card.storage.rongbian_female = true;
      return card;
    },
    filter(event, player) {
      if (get.type2(event.card, false) != "equip") {
        return false;
      }
      const list = player.storage.rongbian_allSkill;
      return list?.length && list.some((skill2) => !player.hasSkill(skill2, null, false, true));
    },
    async content(event, trigger, player) {
      const skillMap = player.storage.rongbian_skill;
      const list = Object.keys(skillMap);
      const chars = list.filter((char2) => skillMap[char2].some((skill3) => !player.hasSkill(skill3, null, false, true)));
      const char = chars.randomGet();
      const skill2 = skillMap[char].filter((skill3) => !player.hasSkill(skill3, null, false, true)).randomGet();
      const createCard = get.info("rongbian").createCard;
      const card = createCard(char, skill2, player);
      await player.gain(card, "gain2");
      player.addAdditionalSkill("rongbian", skill2, true);
    },
    group: ["rongbian_effect"],
    subSkill: {
      effect: {
        trigger: {
          player: ["loseAfter"],
          global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
        },
        forced: true,
        popup: false,
        filter(event, player) {
          const evt = event.getl(player);
          return evt.hs.some((card) => card.storage.rongbian_female);
        },
        async content(event, trigger, player) {
          const cards = player.getCards("h");
          const skills = cards.map((card) => card.storage.romgbian_skill).filter((skill2) => player.hasSkill(skill2, null, false, true));
          player.addAdditionalSkill("rongbian", skills);
          trigger.getl(player).hs.forEach((card) => {
            card.fix();
            card.remove();
            card.destroyed = true;
            game.log(card, "被销毁了");
          });
        }
      }
    },
    ai: {
      effect: {
        target(card, player, target) {
          if (get.type2(card, false) == "equip") {
            return 10;
          }
          return 0;
        }
      }
    }
  },
  hml_liedan: {
    enable: ["chooseToUse"],
    filter(event, player) {
      if (!player.countCards("hes", (card) => card.storage.rongbian_female)) {
        return false;
      }
      return get.inpileVCardList(
        (info) => ["basic", "trick"].includes(info[0]) && event.filterCard(
          {
            name: info[2],
            storage: {
              hml_liedan: true
            }
          },
          player,
          event
        )
      ).length > 0;
    },
    chooseButton: {
      dialog(event, player) {
        const dialog = ui.create.dialog(
          "烈胆",
          [
            get.inpileVCardList(
              (info) => ["basic", "trick"].includes(info[0]) && event.filterCard(
                {
                  name: info[2],
                  storage: {
                    hml_liedan: true
                  }
                },
                player,
                event
              )
            ),
            "vcard"
          ],
          "hidden"
        );
        return dialog;
      },
      check(button) {
        const player = get.player();
        const card = get.autoViewAs({ name: button.link[2], isCard: false });
        return Math.max(...game.players.map((curr) => get.effect(curr, card, player, player)));
      },
      backup(links) {
        return {
          viewAs: {
            name: links[0][2],
            storage: {
              hml_liedan: true
            }
          },
          filterCard: (card) => card.storage.rongbian_female,
          filterTarget(card, player, target) {
            return Boolean(lib.filter.targetEnabled(card, player, target));
          },
          ai1(card) {
            return 6 - get.value(card);
          },
          position: "hes",
          async precontent(event, trigger, player) {
            event.getParent().addCount = false;
            await player.draw(2);
          }
        };
      },
      prompt(links) {
        return "将一张女将牌当无距离和次数限制的基本牌或锦囊牌使用，然后摸两张牌";
      }
    },
    locked: false,
    hiddenCard(player, name) {
      if (["basic", "trick"].includes(get.type(name, null, false))) {
        return Boolean(player.countCards("h", (card) => card.storage.rongbian_female));
      }
    },
    mod: {
      cardUsable(card) {
        if (card?.storage?.hml_liedan) {
          return Infinity;
        }
      },
      targetInRange(card) {
        if (card?.storage?.hml_liedan) {
          return Infinity;
        }
      }
    },
    subSkill: {
      backup: {}
    },
    ai: {
      order(item, player) {
        const cards = [], cards2 = [];
        const list = player.getCards("h");
        list.forEach((card) => {
          if (card.storage.rongbian_female) cards2.push(card);
          else cards.push(card);
        });
        const nodis = cards2.filter((card) => lib.filter.cardDiscardable(card, player, "phaseDiscard"));
        const num = cards2.length - nodis.length - player.getHandcardLimit();
        if (num < 0) {
          return 0;
        }
        if (cards2.some((c) => get.value(c) < 1)) {
          return 10;
        }
        if (cards.some((c) => !player.hasUseTarget(c))) {
          return 10;
        }
        return 0;
      },
      result: {
        player: 10
      }
    }
  },
  tijun: {
    limited: true,
    enable: "phaseUse",
    filterCard: false,
    selectCard: -1,
    filterTarget(card, player, target) {
      return target.sex == "male" && target.countCards("e") > 0;
    },
    init(player) {
      player.addSkill("tijun_refresh");
    },
    filter(event, player) {
      return game.hasPlayer((target) => target.sex == "male" && target.countCards("e") > 0);
    },
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const cards = event.targets[0].getCards("e");
      player.setStorage("tijun_refresh", event.targets);
      await player.gain({
        cards,
        animate: "gain2"
      });
    },
    subSkill: {
      refresh: {
        trigger: {
          source: ["dieAfter"]
        },
        filter(event, player) {
          return !player.storage.tijun_refresh?.includes(event.player);
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
          player.refreshSkill("tijun");
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player(player, target) {
          return 10 + target.countCards("e");
        }
      }
    }
  },
  //乐曹植
  fuyue: {
    trigger: {
      global: "phaseBefore",
      player: "enterGame"
    },
    filter(event, player) {
      return event.name != "phase" || game.phaseNumber == 0;
    },
    addFuyue(cards, player) {
      const list = lib.inpile.filter((name) => {
        if (!["basic", "trick"].includes(get.type(name, null, false))) {
          return false;
        }
        return true;
      });
      for (let card of cards) {
        const name = list.filter((i) => card.name != i).randomGet();
        const tag = "fuyue_tag_" + name;
        const oldTag = card.gaintag?.find((tag2) => tag2.startsWith("fuyue_tag_"));
        if (oldTag) {
          player.removeGaintag(oldTag, [card]);
        }
        if (!lib.translate[tag]) {
          game.broadcastAll((tag2) => lib.translate[tag2] = `赋乐-${get.translation(name)}`, tag);
        }
        player.addGaintag([card], tag);
      }
    },
    forced: true,
    async content(event, trigger, player) {
      const cards = player.getCards("h");
      get.info("fuyue").addFuyue(cards, player);
    },
    group: ["fuyue_effect"],
    subSkill: {
      tag: {},
      effect: {
        trigger: {
          player: ["chooseToUseBefore"]
        },
        mod: {
          ignoredHandcard(card, player) {
            if (card.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return true;
            }
          },
          cardDiscardable(card, player, name) {
            if (name == "phaseDiscard" && card.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return false;
            }
          },
          cardname(card, player, name) {
            const noted = _status.fuyue_clicked;
            const list = _status.fuyue_ai;
            if (noted && noted.card == card && noted.name != name) {
              return noted.name;
            }
            if (list && list.some((i) => i[0] == card.id)) {
              return list.find((i) => i[0] == card.id)[1];
            }
          }
        },
        forced: true,
        popup: false,
        clickCard(card) {
          const list = Array.from(ui.control.querySelectorAll(".fuyue_control"));
          list.forEach((control) => control.remove());
          if (card.classList.contains("selectable") == false) {
            return;
          }
          const custom = _status.event.custom;
          if (card.classList.contains("selected")) {
            ui.selected.cards.remove(card);
            if (_status.multitarget || _status.event.complexSelect) {
              game.uncheck();
              game.check();
            } else {
              card.classList.remove("selected");
              card.updateTransform();
            }
          } else {
            ui.selected.cards.add(card);
            card.classList.add("selected");
            if (ui._handcardHover === card) {
              ui._handcardHover = null;
            }
            card.updateTransform(true);
          }
          if (typeof custom?.add?.card == "function") {
            custom.add.card();
          }
          game.check();
        },
        async content(event, trigger, player) {
          _status.fuyue_clicked = null;
          trigger.custom.replace.card = function() {
            const card = arguments[0];
            const clickCard = get.info("fuyue_effect").clickCard;
            const gaintag = card.gaintag;
            const recasting = get.event().skill == "_recast";
            if (!recasting && !card.classList.contains("selected") && gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))) {
              _status.fuyue_clicked = null;
              const list = Array.from(ui.control.querySelectorAll(".fuyue_control"));
              list.forEach((control) => control.remove());
              const namex = gaintag.find((tag) => tag.startsWith("fuyue_tag_")).slice(10);
              const names = [get.name(card, false), namex];
              _status.fuyue_clicked = {
                card
              };
              names.forEach((name) => {
                const control = ui.create.control([get.translation(name), "stayleft"]);
                control.classList.add("fuyue_control");
                control._link = name;
                control.custom = (e) => {
                  _status.fuyue_clicked.name = name;
                  const tempname = card.querySelector(".tempname");
                  if (tempname) {
                    tempname.innerHTML = get.translation(name);
                  }
                  game.Check.card(get.event());
                  clickCard(card);
                };
              });
              return;
            }
            clickCard(card);
          };
          trigger.set("ai1", (card) => {
            const order = get.cacheOrder(card);
            if (!card) {
              return order;
            }
            const name = card.gaintag?.find((tag) => tag.startsWith("fuyue_tag_"))?.slice(10);
            if (name) {
              const card2 = get.autoViewAs({ name, isCard: true });
              const order2 = get.cacheOrder(card2);
              if (order2 > order) {
                if (!_status.fuyue_ai) {
                  _status.fuyue_ai = [[card.id, name]];
                }
                _status.fuyue_ai.push([card.id, name]);
                game.Check.card(get.event());
                return order2;
              }
            }
            return order;
          });
          trigger.getHandler("onChooseToUse").push((event2) => {
            _status.fuyue_clicked = null;
            _status.fuyue_ai = null;
          });
        },
        hiddenCard(player, name) {
          const names = player.getCards("h").filter((c) => c.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))).map((c) => c.gaintag.find((tag) => tag.startsWith("fuyue_tag_")).slice(10));
          if (names.includes(name)) {
            return true;
          }
        }
      }
    }
  },
  wenlan: {
    trigger: {
      player: ["useCardAfter", "respondAfter"]
    },
    marktext: "文",
    mark: true,
    intro: {
      mark(dialog, storage, player) {
        let str = "上一张牌名: ";
        const list = player.getStorage("wenlan_note");
        const last = list.at(-1);
        if (last) {
          const card = last[0].card;
          let name = card.name;
          if (get.is.ordinaryCard(card)) {
            name = card.cards[0].name;
          }
          str = str + get.translation(name);
          const tag = last[1].find((tag2) => tag2.startsWith("fuyue_tag_"));
          if (tag) {
            str = str + "-" + get.translation(tag.slice(10));
          }
        }
        dialog.addText(str);
      }
    },
    init(player) {
      const list = player.getHistory("useCard").concat(player.getHistory("respond"));
      player.addSkill("wenlan_note");
      if (!player.storage.wenlan_note && list.length % 2 != 0) {
        const last = list.at(-1);
        const lastCard = last.card;
        const evt = player.getAllHistory("lose", (evt2) => evt2.type == "use" && evt2.getParent("useCard") == last)[0];
        let tags = [];
        if (get.is.ordinaryCard(lastCard)) {
          const id = lastCard.cardid;
          tags = evt.gaintag_map[id] || [];
        }
        player.setStorage("wenlan_note", [[last, tags]]);
      }
    },
    direct: true,
    filter(event, player) {
      const list = player.getStorage("wenlan_note");
      const index = list.findIndex((i) => i[0] == event);
      return index > 0 && (index + 1) % 2 == 0;
    },
    async content(event, trigger, player) {
      const list = player.getStorage("wenlan_note");
      const last = list.find((i) => i[0] == trigger);
      const last2 = list[list.indexOf(last) - 1];
      list.remove(last);
      list.remove(last2);
      const card = last[0].card;
      const card2 = last2[0].card;
      let noGain = true;
      const tag = last[1].find((tag3) => tag3.startsWith("fuyue_tag_"));
      const tag2 = last2[1].find((tag3) => tag3.startsWith("fuyue_tag_"));
      if (tag && tag2 && get.is.ordinaryCard(card) && get.is.ordinaryCard(card2)) {
        const names = [get.name(card.cards[0], false), tag.slice(10)];
        const names2 = [get.name(card2.cards[0], false), tag2.slice(10)];
        if (names.some((name) => names2.includes(name))) {
          const gains = names.concat(names2).toUniqued();
          const cards = [];
          while (gains.length) {
            const name = gains.shift();
            const card3 = get.cardPile(name);
            if (card3) {
              cards.push(card3);
            }
          }
          if (cards.length) {
            await player.gain({
              cards,
              animate: "gain2"
            });
            const gainCards = cards.filter((card3) => get.owner(card3) == player);
            if (gainCards.length) {
              noGain = false;
              get.info("fuyue").addFuyue(gainCards, player);
            }
          }
        }
      }
      if (noGain) {
        const { cards } = await player.chooseCard({
          prompt: "选择任意张手牌标记为“赋”或替换“赋”牌名",
          position: "h",
          selectCard: [1, Infinity],
          complexCard: true,
          ai(card3) {
            return 1;
          },
          filterCard(card3, player2) {
            const selected = ui.selected.cards?.[0];
            if (selected) {
              const tag3 = selected.gaintag.find((tag4) => tag4.startsWith("fuyue_tag_"));
              const selectable = card3.gaintag?.some((tag4) => tag4.startsWith("fuyue_tag_"));
              if (tag3) {
                return selectable;
              } else {
                return !selectable;
              }
            }
            return true;
          }
        }).forResult();
        if (cards?.length) {
          get.info("fuyue").addFuyue(cards, player);
        }
      }
    },
    subSkill: {
      note: {
        trigger: {
          player: ["useCard", "respond"]
        },
        forced: true,
        popup: false,
        async content(event, trigger, player) {
          const card = trigger.card;
          const evt = player.getAllHistory("lose", (evt2) => evt2.type == "use" && evt2.getParent() == trigger)[0];
          let tags = [];
          if (get.is.ordinaryCard(card)) {
            const id = card.cardid;
            tags = evt.gaintag_map[id] || [];
          }
          const list = player.getStorage("wenlan_note");
          list.push([trigger, tags]);
          player.setStorage("wenlan_note", list);
        }
      }
    }
  },
  //新杀谋诸葛亮
  jingmou: {
    trigger: {
      global: ["useCard"]
    },
    zhuanhuanji: true,
    marktext: "☯",
    mark: true,
    intro: {
      content(storage, player) {
        const info = player.storage.jingmou_note;
        let suitStr, typeStr;
        if (info?.suit) {
          suitStr = get.translation(info.suit);
          typeStr = get.translation(info.type);
          if (suitStr.length) {
            suitStr = suitStr + "或";
          }
        } else {
          suitStr = "与你记录相同花色或";
          typeStr = "类型";
        }
        if (!storage) {
          return `有角色使用${suitStr}${typeStr}的牌时，移除记录。此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害`;
        }
        return `有角色使用${suitStr}${typeStr}的牌时，移除记录。此牌结算后将其交给任意一名角色。`;
      }
    },
    filter(event, player) {
      const card = event.card;
      const type = get.type2(card, false);
      const suit = get.suit(card, false);
      const storage = player.storage.jingmou_note;
      if (!storage?.suit) {
        return false;
      }
      return storage.suit.includes(suit) || storage.type.includes(type);
    },
    async cost(event, trigger, player) {
      const state = player.storage.jingmou;
      const source = trigger.player;
      const card = trigger.card;
      const str = state ? `${get.translation(card)}结算后你可将其交给任意一名角色` : `令${get.translation(card)}无效并可弃置一张同花色牌对${get.translation(source)}造成1点火焰伤害`;
      event.result = await player.chooseBool({
        prompt: str,
        ai(event2, player2) {
          const source2 = get.event().jingmou_source;
          const state2 = get.event().jingmou_state;
          const card2 = get.event().jingmou_card;
          if (state2) {
            return card2.cards.length > 0;
          } else {
            return get.attitude(player2, source2) < 0;
          }
        }
      }).set("jingmou_state", state).set("jingmou_source", source).set("jingmou_card", card).forResult();
    },
    async content(event, trigger, player) {
      const state = player.storage.jingmou;
      const source = trigger.player;
      const card = trigger.card;
      player.changeZhuanhuanji("jingmou");
      const info = player.storage.jingmou_note;
      const suit = get.suit(card, false);
      const type = get.type2(card, false);
      const noted = player.storage.jingmou_noted || { suit: [], type: [] };
      if (info.suit == suit) {
        info.suit = "";
        noted.suit.add(suit);
      }
      if (info.type == type) {
        info.type = "";
        noted.type.add(type);
      }
      player.setStorage("jingmou_used", noted);
      if (!player.hasSkill("dingnan", null, false, true) && noted.suit.length == 4 && noted.type.length == 3) {
        await player.addSkills(["dingnan"]);
      }
      player.setStorage("jingmou_note", info);
      if (state) {
        const cards = player.getStorage("jingmou_gain");
        cards.push(card);
        player.setStorage("jingmou_gain", cards);
      } else {
        game.log(player, "令", card, "无效");
        trigger.targets.length = 0;
        trigger.all_excluded = true;
        const { cards } = await player.chooseCard({
          prompt: `弃置一张${get.translation(suit)}的手牌并对${get.translation(source)}造成1点火焰伤害`,
          position: "h",
          filterCard(card2, player2, event2) {
            const suit2 = get.event().jingmou_suit;
            return get.suit(card2, player2) == suit2 && lib.filter.cardDiscardable(card2, player2);
          },
          ai(card2) {
            return 10 - get.value(card2);
          }
        }).set("jingmou_suit", suit).forResult();
        if (cards?.length) {
          await player.discard({
            cards
          });
          await source.damage({
            num: 1,
            source: player,
            nature: "fire"
          });
        }
      }
    },
    derivation: ["dingnan"],
    group: ["jingmou_change", "jingmou_note", "jingmou_gain"],
    subSkill: {
      note: {
        trigger: {
          global: ["phaseUseBegin"]
        },
        filter(event, player) {
          const storage = player.storage.jingmou_note;
          if (!storage) {
            return true;
          }
          return !storage.suit && !storage.type;
        },
        async cost(event, trigger, player) {
          event.result = await player.chooseCard({
            prompt: "你可弃置任意张牌并秘密记录其中包含的一种花色与牌类型。有角色使用与你记录的花色或类型相同的牌时，移除该记录。阳：此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害；阴：此牌结算后将其交给任意一名角色。若你移除过所有花色与类型，你获得“定南”",
            position: "he",
            selectCard: [1, Infinity],
            filterCard: lib.filter.cardDiscardable,
            ai(card) {
              if (ui.selected.buttons.length > 0) {
                return -1;
              }
              return Math.random() - 0.5;
            }
          }).forResult();
        },
        async content(event, trigger, player) {
          const cards = event.cards;
          const suits = cards.map((card) => get.suit(card, false)).toUniqued();
          const types = cards.map((card) => get.type2(card, false));
          await player.discard({ cards });
          const { links } = await player.chooseButton({
            forced: true,
            selectButton: 2,
            createDialog: ["选择一种牌型和花色记录", [types.map((type) => [`${type}0`, get.translation(type)]), "tdnodes"], [suits.map((suit) => [`${suit}1`, get.translation(suit)]), "tdnodes"]],
            filterButton(button) {
              return button.link.at(-1) == ui.selected.buttons.length;
            }
          }).forResult();
          const type2 = links[0].slice(0, -1);
          const suit2 = links[1].slice(0, -1);
          const note = { suit: suit2, type: type2 };
          player.setStorage("jingmou_note", note);
        }
      },
      gain: {
        trigger: {
          global: ["useCardAfter"]
        },
        filter(event, player) {
          const cards = player.getStorage("jingmou_gain");
          return cards.includes(event.card);
        },
        direct: true,
        async content(event, trigger, player) {
          const card = trigger.card;
          const { targets } = await player.chooseTarget({
            prompt: `将${get.translation(card)}交给任意一名角色`,
            ai(target) {
              const player2 = get.player();
              return get.attitude(player2, target);
            }
          }).forResult();
          const cards = card.cards.filterInD("o").concat(card.cards.filterInD("d"));
          if (cards.length && targets.length) {
            await player.give(cards, targets[0], true);
          }
        }
      },
      change: {
        trigger: {
          global: "phaseBefore",
          player: "enterGame"
        },
        filter(event, player) {
          return event.name != "phase" || game.phaseNumber == 0;
        },
        prompt2(event, player) {
          return "切换【靖谋】为状态" + (player.storage.dcsbjunmou ? "阳" : "阴");
        },
        check: () => Math.random() > 0.5,
        async content(event, trigger, player) {
          player.changeZhuanhuanji("jingmou");
        }
      }
    }
  },
  guyi: {
    trigger: {
      global: "phaseBefore",
      player: "enterGame"
    },
    init(player, skill2) {
      player.addSkill("guyi_lose");
    },
    filter(event, player) {
      return event.name != "phase" || game.phaseNumber == 0;
    },
    forced: true,
    async content(event, trigger, player) {
      await player.draw({
        num: 1,
        gaintag: ["guyi_tag"]
      });
    },
    group: ["guyi_round"],
    subSkill: {
      tag: {},
      lose: {
        trigger: {
          player: ["loseAfter"],
          global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
        },
        charlotte: true,
        forced: true,
        filter(event, player) {
          const evt = event.getl(player);
          const tagMap = evt.gaintag_map;
          return evt.hs && Object.values(tagMap).flat().some((tag) => tag == "guyi_tag");
        },
        getIndex(event, player) {
          const evt = event.getl(player);
          const tagMap = evt.gaintag_map;
          if (!evt.hs.length) {
            return 0;
          }
          return Object.values(tagMap).flat().filter((tag) => tag == "guyi_tag").length;
        },
        mod: {
          aiOrder(player, card) {
            if (card?.hasGaintag?.("guyi_tag")) {
              return 13;
            }
          }
        },
        async content(event, trigger, player) {
          const num = Math.min(player.getRoundHistory("useSkill", (evt) => evt.skill == event.name).length, 7);
          const top = get.cards(num, true);
          await game.cardsGotoOrdering(top);
          const next = player.chooseToMove_new({ prompt: "孤熠", forced: true });
          next.set("list", [
            ["牌堆顶", top],
            ["获得", []]
          ]);
          next.set("filterOk", (list) => {
            return list[1].length == 1;
          });
          next.set("processAI", (list) => {
            const cards = list[0][1];
            const canUse = cards.filter((card2) => player.hasUseTarget(card2));
            let choice = canUse;
            if (canUse.length == 0) {
              choice = cards;
            }
            const values = choice.map((card2) => get.value(card2));
            const max = Math.max(...values);
            const card = choice.find((card2) => get.value(card2) == max);
            cards.remove(card);
            return [cards, [card]];
          });
          const {
            moved: [tops, gains]
          } = await next.forResult();
          await player.gain({ cards: gains, animate: "draw", gaintag: ["guyi_tag"] });
          tops.reverse();
          await game.cardsGotoPile(tops, () => ui.cardPile.firstChild);
          game.updateRoundNumber();
          await game.delay();
        },
        ai: {
          effect: {
            player(card) {
              if (card?.hasGaintag?.("guyi_tag")) {
                return 13;
              }
            }
          }
        }
      },
      round: {
        trigger: {
          global: ["roundEnd"]
        },
        forced: true,
        filter(event, player) {
          const note = {};
          game.players.forEach((curr) => {
            const num2 = curr.getRoundHistory("sourceDamage").reduce((num3, evt) => num3 += evt.num, 0);
            note[curr.playerid] = num2;
          });
          const num = note[player.playerid];
          return game.players.every((curr) => note[curr.playerid] <= num);
        },
        async content(event, trigger, player) {
          await player.draw({
            num: 1,
            gaintag: ["guyi_tag"]
          });
        }
      }
    }
  },
  dingnan: {
    enable: "phaseUse",
    usable: 1,
    selectTarget: [1, Infinity],
    filterTarget: true,
    filterCard: false,
    selectCard: -1,
    multitarget: true,
    multiline: true,
    async content(event, trigger, player) {
      await game.doAsyncInOrder(event.targets, async (target) => {
        const { bool } = await target.chooseToRespond({
          filterCard(card, player2, event2) {
            return card.name == "sha";
          },
          ai(card) {
            const player2 = get.player();
            const source = get.event().dingnan_source;
            return -get.damageEffect(player2, source, player2);
          }
        }).set("dingnan_source", player).forResult();
        if (!bool) {
          await target.damage({ num: 1, source: player });
        }
      });
    },
    ai: {
      order: 10,
      result: {
        target(player, target) {
          return get.damageEffect(target, player, target);
        }
      }
    }
  },
  //新杀张恭
  dcqianxin: {
    enable: "phaseUse",
    selectCard: -1,
    filterCard: false,
    selectTarget: -1,
    filterTarget: false,
    usable: 1,
    filter(event, player) {
      const cards = [];
      const list = Array.from(ui.cardPile.children);
      cards.addArray(list);
      return cards.filter((c) => c.hasGaintag("dcqianxin_tag")).length == 0;
    },
    init(player) {
      player.addSkill("dcqianxin_gain");
    },
    async content(event, trigger, player) {
      const targets = game.filterPlayer((p) => p.countCards("h") > 0);
      const targets2 = targets.slice();
      const results = await player.chooseCardOL({
        list: targets,
        args: [true]
      }).forResult();
      const lose_list = [];
      for (let i = 0; i < results.length; i++) {
        const target = targets2[i];
        const lose = [target, results[i].cards];
        lose_list.push(lose);
      }
      const cards = lose_list.map((i) => i[1][0]);
      const next = game.loseAsync({
        lose_list
      }).setContent("loseToDiscardpileMultiple");
      next.set("position", ui.cardPile);
      next.set("insert_index", () => {
        return ui.cardPile.children[get.rand(0, Math.floor(ui.cardPile.children.length / 2))];
      });
      await next;
      cards.forEach((c) => game.broadcastAll((c2) => c2.gaintag.add("eternal_dcqianxin_tag"), c));
    },
    ai: {
      order: 10,
      result: {
        player: 2
      }
    },
    subSkill: {
      gain: {
        trigger: {
          global: ["gainAfter", "loseAsyncAfter"]
        },
        filter(event, player) {
          return game.hasPlayer((curr) => {
            const evt = event.getg(curr);
            return evt && evt.length && evt.some((c) => c.hasGaintag("eternal_dcqianxin_tag"));
          });
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
          const targets = game.filterPlayer((p) => {
            const evt = trigger.getg(p);
            return evt && evt.length && evt.some((c) => c.hasGaintag("eternal_dcqianxin_tag"));
          });
          for (let target of targets) {
            if (target == player && player.countCards("h") < 4) {
              await player.drawTo(4);
              const { bool } = await player.chooseBool({
                prompt: "是否令当前回合角色手牌上限-2",
                ai() {
                  const player2 = get.player();
                  const target2 = _status.currentPhase;
                  const att = get.attitude(player2, target2);
                  return att < 0;
                }
              });
              if (bool) {
                const target2 = _status.currentPhase;
                let num = target2.getStorage("dcqianxin_debuff", 0);
                num += 2;
                target2.setStorage("dcqianxin_debuff", num);
                target2.addTempSkill("dcqianxin_debuff");
              }
            } else {
              await player.draw({ num: 1 });
            }
          }
        }
      },
      debuff: {
        charlotte: true,
        mod: {
          maxHandcard(player, num) {
            const sub = player.getStorage("dcqianxin_debuff", 0);
            return num - sub;
          }
        }
      }
    }
  },
  dczhenxing: {
    trigger: {
      player: ["phaseJieshuBegin", "damageEnd"]
    },
    prompt2: "结束阶段或当你受到伤害后，你可以观看牌堆顶3张牌，然后你获得其中与其余牌花色均不相同的1张牌并将剩余的牌至于牌堆顶，称为“信”",
    async content(event, trigger, player) {
      const cards = get.cards(3, true);
      await player.viewCards("镇行", cards);
      const { links } = await player.chooseButton({
        createDialog: ["获得其中与其余牌花色均不相同的1张牌并将剩余的牌至于牌堆顶，称为“信”", [cards, "card"]],
        filterButton(button) {
          const cards2 = get.event().dczhenxing_cards;
          const card = button.link;
          const suit = get.suit(card, false);
          const suits = cards2.map((c) => get.suit(c, false));
          return get.numOf(suits, suit) == 1;
        }
      }).set("dc_zhengxing_cards", cards).forResult();
      const gain = links || [];
      const tops = cards.filter((c) => !gain.includes(c)).reverse();
      if (gain.length) {
        await player.gain({
          cards: gain,
          animate: "gain2"
        });
      }
      game.broadcastAll((cards2) => cards2.forEach((c) => c.gaintag.add("eternal_dcqianxin_tag")), tops);
      await game.cardsGotoPile(tops);
    }
  },
  //幻孙策
  twliwu: {
    trigger: {
      global: ["changeHpEnd"]
    },
    init(player) {
      player.addSkill("twliwu_note");
    },
    filter(event, player) {
      const list = player.getStorage("twliwu_note");
      const evt = list.find((note) => note[0] == event);
      if (evt) {
        return evt[1] != event.player.isDamaged();
      }
      return false;
    },
    forced: true,
    async content(event, trigger, player) {
      const { cards } = await player.draw().forResult();
      if (cards?.length) {
        const type = get.type2(cards[0], false);
        if (type == "basic") {
          let num = player.getStorage("twliwu_round", 0);
          num += 1;
          player.setStorage("twliwu_round", num);
          if (!player.hasSkill("twliwu_round", null, false, false)) {
            player.addSkill("twliwu_round", "roundStart");
          }
        }
      }
    },
    subSkill: {
      note: {
        trigger: {
          global: ["changeHpBefore"]
        },
        charlotte: true,
        popup: false,
        forced: true,
        async content(event, trigger, player) {
          const list = player.getStorage("twliwu_note");
          const note = [trigger, trigger.player.isDamaged()];
          list.push(note);
          player.setStorage("twliwu_note", list);
          player.when("changeHpAfter").step(async (event2, trigger2, player2) => {
            player2.setStorage("twliwu_note", []);
          });
        }
      },
      round: {
        trigger: {
          source: ["damageBegin1"]
        },
        forced: true,
        charlotte: true,
        mark: true,
        marktext: "庭",
        intro: {
          content: "本轮造成伤害+#"
        },
        filter(event, player) {
          return player.storage.twliwu_round > 0;
        },
        async content(event, trigger, player) {
          const num = player.storage.twliwu_round;
          trigger.num += num;
          player.setStorage("twliwu_round", 0);
        }
      }
    }
  },
  twsaoting: {
    enable: ["chooseToUse"],
    selectCard: 1,
    position: "hes",
    zhuanhuanji: true,
    mark: true,
    marktext: "☯",
    intro: {
      content(storage, player, skill2) {
        return "你可以将一张伤害牌当【决斗】使用。当你以此法使用牌指定已受伤角色为目标后，你摸一张牌。";
      }
    },
    lose: false,
    discard: false,
    delay: false,
    filterCard(card, player) {
      return get.tag(card, "damage") > 0;
    },
    filter(event, player) {
      const name = player.storage.twsaoting ? "juedou" : "jiu";
      const card = get.autoViewAs({ name, twsaoting: true });
      const leach = event.filterCard;
      if (typeof leach == "function" && !leach(card, player, event)) {
        return false;
      }
      return player.countCards("hes", (card2) => get.tag(card2, "damage") > 0) > 0;
    },
    async precontent(event, trigger, player) {
      player.changeZhuanhuanji("twsaoting");
    },
    viewAs(card, player) {
      const name = player.storage.twsaoting ? "juedou" : "jiu";
      return {
        name,
        storage: {
          twsaoting: true
        }
      };
    },
    group: ["twsaoting_draw"],
    subSkill: {
      draw: {
        trigger: {
          player: ["useCardToPlayered"]
        },
        forced: true,
        filter(event, player) {
          return event.card.storage.twsaoting && event.target.isDamaged();
        },
        async content(event, trigger, player) {
          await player.draw();
        }
      }
    },
    ai: {
      order: 10,
      effect: {
        player(card, player, target) {
          if (card?.storage?.twsaoting && target?.isDamaged()) {
            return 1;
          }
        }
      }
    }
  },
  twjianyan: {
    trigger: {
      global: ["dyingBegin"]
    },
    filter(event, player) {
      return game.hasPlayer((p) => p != player && p.hasSkill("twhujv", null, false, false));
    },
    persevereSkill: true,
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: `任意名其他角色失去${get.poptip("twhujv")}，然后你回复等量的体力并获得等量的非伤害牌，将其余角色的“虎踞”转换至②，然后“入幻”。“入幻”失去${get.poptip("twliwu")}、${get.poptip("twsaoting")}、${get.poptip("twjianyan")}并获得${get.poptip("twsuzhen")}、${get.poptip("twdangjiang")}、${get.poptip("twjizhi")}`,
        selectTarget: [1, Infinity],
        filterTarget(card, player2, target) {
          return target.hasSkill("twhujv", null, false, true);
        },
        ai(target) {
          if (ui.selected.targets.length + player.hp > 0) {
            return -1;
          }
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const { targets } = event;
      await game.doAsyncInOrder(targets, async (target) => {
        await target.removeSkills("twhujv");
      });
      const num = targets.length;
      await player.recover({ num });
      const cards = [];
      while (cards.length < num) {
        const card = get.cardPile((c) => get.tag(c, "damage") <= 0 && !cards.includes(c));
        if (card) {
          cards.push(card);
        } else {
          break;
        }
      }
      if (cards.length) {
        await player.gain({ cards, animate: "gain2" });
      }
      game.filterPlayer((p) => !targets.includes(p) && p.hasSkill("twhujv", null, false, true)).forEach((p) => {
        if (!p.storage.twhujv) {
          p.changeZhuanhuanji("twhujv");
        }
      });
      await player.changeSkills(["twdangjiang", "twsuzhen", "twjizhi"], ["twliwu", "twsaoting", "twjianyan"]);
    },
    group: ["twjianyan_start"],
    subSkill: {
      start: {
        trigger: {
          global: ["phaseBefore"],
          player: ["enterGame"]
        },
        forced: true,
        persevereSkill: true,
        filter(event, player) {
          return game.phaseNumber == 0 || event.name != "phase";
        },
        async content(event, trigger, player) {
          const targets = game.filterPlayer((p) => p != player);
          await game.doAsyncInOrder(targets, async (target) => {
            await target.addSkills("twhujv");
          });
        }
      }
    }
  },
  twhujv: {
    zhuanhuanji: true,
    mark: true,
    marktext: "☯",
    global: ["twhujv_buff"],
    intro: {
      content(storage, player, skill2) {
        return "你令有“寄志”的角色使用【杀】的次数+1";
      }
    },
    subSkill: {
      buff: {
        mod: {
          maxHandcard(player, num) {
            if (player.hasSkill("twjianyan", null, false, false)) {
              const add = game.filterPlayer((p) => p.hasSkill("twhujv", null, false, false) && !p.storage.twhujv).length;
              return num + add;
            }
          },
          cardUsable(card, player, num) {
            if (card.name == "sha" && player.hasSkill("twjizhi", null, false, false)) {
              const add = game.filterPlayer((p) => p.hasSkill("twhujv", null, false, false) && p.storage.twhujv).length;
              return num + add;
            }
          }
        }
      }
    }
  },
  twdangjiang: {
    trigger: {
      global: ["changeHpEnd"]
    },
    init(player) {
      player.addSkill("twdangjiang_note");
    },
    filter(event, player) {
      if (event.player.countCards("he") <= 0) {
        return false;
      }
      const list = player.getStorage("twdangjiang_note");
      const evt = list.find((note) => note[0] == event);
      if (evt) {
        return evt[1] != event.player.isDamaged();
      }
      return false;
    },
    locked: true,
    async cost(event, trigger, player) {
      const target = trigger.player;
      event.result = await player.choosePlayerCard({
        prompt: `弃置${get.translation(target)}的一张牌，若为基本牌，你回复1点体力`,
        target,
        position: "he",
        filterButton(button) {
          const player2 = get.player();
          const target2 = get.event().twdangjiang_target;
          return lib.filter.canBeDiscarded(button.link, player2, target2);
        },
        ai(button) {
          const player2 = get.player();
          const target2 = get.event().twdangjiang_target;
          const card = button.link;
          const value = get.buttonValue(button);
          if (target2 == player2) {
            return get.type2(card, player2) == "basic" ? 6 - value : 0;
          }
          if (get.attitude(player2, target2) < 0) {
            return value;
          }
          return 0;
        }
      }).set("twdangjiang_target", target).forResult();
    },
    async content(event, trigger, player) {
      const { cards } = event;
      await trigger.player.discard({ cards, discarder: player });
      if (cards?.length) {
        const type = get.type2(cards[0], false);
        if (type == "basic") {
          await player.recover({ num: 1 });
        }
      }
    },
    subSkill: {
      note: {
        trigger: {
          global: ["changeHpBefore"]
        },
        charlotte: true,
        popup: false,
        forced: true,
        async content(event, trigger, player) {
          const list = player.getStorage("twdangjiang_note");
          const note = [trigger, trigger.player.isDamaged()];
          list.push(note);
          player.setStorage("twdangjiang_note", list);
          player.when("changeHpAfter").step(async (event2, trigger2, player2) => {
            player2.setStorage("twdangjiang_note", []);
          });
        }
      }
    }
  },
  twsuzhen: {
    enable: ["chooseToUse"],
    selectCard: 1,
    position: "hes",
    zhuanhuanji: true,
    mark: true,
    marktext: "☯",
    intro: {
      content(storage, player, skill2) {
        return "你可以将一张非伤害牌当【无中生有】使用。当你以此法使用牌指定未受伤角色为目标后，你摸一张牌。";
      }
    },
    lose: false,
    discard: false,
    delay: false,
    filterCard(card, player) {
      return get.tag(card, "damage") <= 0;
    },
    filter(event, player) {
      const name = player.storage.twsuzhen ? "sha" : "wuzhong";
      const card = get.autoViewAs({ name, storage: { twsuzhen: true } });
      const leach = event.filterCard;
      if (typeof leach == "function" && !leach(card, player, event)) {
        return false;
      }
      return player.countCards("hes", (card2) => get.tag(card2, "damage") <= 0) > 0;
    },
    async precontent(event, trigger, player) {
      player.changeZhuanhuanji("twsuzhen");
    },
    viewAs(card, player) {
      const name = player.storage.twsuzhen ? "sha" : "wuzhong";
      return {
        name,
        storage: {
          twsuzhen: true
        }
      };
    },
    group: ["twsuzhen_draw"],
    subSkill: {
      draw: {
        trigger: {
          player: ["useCardToPlayered"]
        },
        forced: true,
        filter(event, player) {
          return event.card.storage.twsuzhen && !event.target.isDamaged();
        },
        async content(event, trigger, player) {
          await player.draw();
        }
      }
    },
    ai: {
      order: 10,
      effect: {
        player(card, player, target) {
          if (!target.isDamaged()) {
            return 1;
          }
        }
      }
    }
  },
  twjizhi: {
    trigger: {
      player: ["dyingBegin"]
    },
    filter(event, player) {
      return game.hasPlayer((p) => p != player && p.hasSkill("twhujv", null, false, false));
    },
    persevereSkill: true,
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: `令任意名其他角色失去${get.poptip("twhujv")}，然后你回复等量的体力并获得等量的伤害牌，将其余角色的“虎踞”转换至①，然后“入幻”。“入幻”失去${get.poptip("twsuzhen")}、${get.poptip("twdangjiang")}、${get.poptip("twjizhi")}并获得${get.poptip("twliwu")}、${get.poptip("twsaoting")}、${get.poptip("twjianyan")}`,
        selectTarget: [1, Infinity],
        filterTarget(card, player2, target) {
          return target.hasSkill("twhujv", null, false, true);
        },
        ai(target) {
          if (ui.selected.targets.length + player.hp > 0) {
            return -1;
          }
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const { targets } = event;
      await game.doAsyncInOrder(targets, async (target) => {
        await target.removeSkills("twhujv");
      });
      const num = targets.length;
      await player.recover({ num });
      const cards = [];
      while (cards.length < num) {
        const card = get.cardPile((c) => get.tag(c, "damage") > 0 && !cards.includes(c));
        if (card) {
          cards.push(card);
        } else {
          break;
        }
      }
      if (cards.length) {
        await player.gain({ cards, animate: "gain2" });
      }
      game.filterPlayer((p) => !targets.includes(p) && p.hasSkill("twhujv", null, false, true)).forEach((p) => {
        if (p.storage.twhujv) {
          p.changeZhuanhuanji("twhujv");
        }
      });
      await player.changeSkills(["twliwu", "twsaoting", "twjianyan"], ["twsuzhen", "twtangjiang", "twjizhi"]);
    }
  }
};
export {
  skill
};
