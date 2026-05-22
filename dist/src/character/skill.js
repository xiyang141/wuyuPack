import { get, game, ui, lib, _status } from "noname";
const skill = {
  //武张飞
  zisheng: {
    trigger: {
      player: ["useCard"]
    },
    filter(event, player) {
      const card = event.card;
      const num = get.number(card, false);
      const cardx = get.cardPile((card2) => get.number(card2) == 3);
      return cardx && ["6", "9", "12"].includes(num.toString());
    },
    async cost(event, trigger, player) {
      const list = [];
      while (true) {
        const card = get.cardPile((card2) => get.number(card2) == 3 && !list.includes(card2));
        if (card) {
          list.push(card);
        } else {
          break;
        }
      }
      const cards = list.randomSort().randomGets(3);
      const { bool, links } = await player.chooseButton({
        prompt: "恣胜",
        createDialog: ["恣胜：选择一张点数为3的牌获得", [cards, "card"]],
        ai(button) {
          return get.value(button.link);
        }
      }).forResult();
      event.result = {
        bool,
        cost_data: {
          cards: links
        }
      };
    },
    async content(event, trigger, player) {
      const cards = event.cost_data.cards;
      await player.gain({ cards, animate: "gain2" });
    },
    group: ["zisheng_damage"],
    subSkill: {
      damage: {
        trigger: {
          player: ["gainAfter"],
          global: ["loseAfter", "loseAsyncAfter"]
        },
        prompt2: "对其造成等同于你获得或弃置其牌数的伤害",
        check(event, player, name, indexedData) {
          const target2 = indexedData?.[0];
          if (!target2) {
            return 0;
          }
          return get.damageEffect(target2, player, player);
        },
        getIndex(event, player) {
          if (event.name == "gain") {
            if (event.source) {
              return [[event.source, event.cards.length]];
            } else {
              return 0;
            }
          } else {
            if (event.type != "discard") {
              return 0;
            }
            if ((event.discarder || event.getParent(2)?.player) != player) {
              return 0;
            }
            return game.filterPlayer((target2) => target2 != player).map((target2) => [target2, event.getl(target2).cards2.length]).filter((map) => map[1] > 0);
          }
        },
        filter(event, player, name, indexedData) {
          return Boolean(indexedData);
        },
        async content(event, trigger, player) {
          const map = event.indexedData;
          await map[0].damage({ num: map[1] });
        }
      }
    }
  },
  xianlue: {
    enable: "phaseUse",
    selectCard: -1,
    filterCard: false,
    selectTarget: 1,
    filterTarget: function(card, player, target2) {
      if (!target2.hasHistory("damage") && !target2.hasHistory("lose")) {
        return false;
      }
      return !(player.getStorage("xianlue_used") || []).includes(target2);
    },
    init(player) {
      player.addSkill("xianlue_used");
    },
    filter(event, player) {
      return game.hasPlayer((target2) => {
        if (target2 == player) {
          return false;
        }
        if (!target2.hasHistory("damage") && !target2.hasHistory("lose")) {
          return false;
        }
        return !(player.getStorage("xianlue_used") || []).includes(target2);
      });
    },
    async content(event, trigger, player) {
      const target2 = event.targets[0];
      const list = player.storage.xianlue_used || [];
      list.add(target2);
      player.setStorage("xianlue_used", list);
      const cards = target2.getCards("h");
      const note = cards.map((card) => get.number(card) || 0);
      const numbers = player.storage.xianlue_note || [];
      numbers.addArray(note);
      player.setStorage("xianlue_note", numbers);
      await player.viewCards(`${get.translation(target2)}的手牌`, cards);
      const sub = player.storage.xianlue_dying || 0;
      if (numbers.length >= 13 - sub) {
        let count = player.storage.xianlue_count || 0;
        player.refreshSkill("haoxian");
        player.setStorage("xianlue_note", []);
        await player.draw({ num: count + 2 });
        player.setStorage("xianlue_count", ++count);
      }
    },
    group: ["xianlue_dying", "xianlue_eff"],
    subSkill: {
      used: {
        charlotte: true,
        mark: true,
        forced: true,
        popup: false,
        intro: {
          mark(dialog, storage, player) {
            const numbers = player.getStorage("xianlue_note") || [];
            dialog.addText(`本回合已对${get.translation(storage).split("、")}使用过【显略】`);
            dialog.addText(`已记录点数: ${numbers.join("、")}`);
          }
        },
        trigger: {
          player: "phaseAfter"
        },
        async content(event, trigger, player) {
          player.setStorage("xianlue_used", []);
        }
      },
      dying: {
        audio: "xianlue",
        trigger: {
          source: "dying"
        },
        forced: true,
        filter(event, player) {
          return event.reason?.name == "damage";
        },
        async content(event, trigger, player) {
          let num = player.storage.xianlue_dying || 0;
          num += 3;
          player.setStorage("xianlue_dying", num);
        }
      },
      eff: {
        audio: "xianlue",
        trigger: {
          player: "useCard"
        },
        mod: {
          targetInRange(card, player) {
            const num = get.number(card);
            const numbers = player.storage.xianlue_note || [];
            if (numbers.includes(num)) {
              return true;
            }
          }
        },
        filter(event, player) {
          const card = event.card;
          const num = get.number(card);
          const numbers = player.storage.xianlue_note || [];
          return numbers.includes(num);
        },
        forced: true,
        async content(event, trigger, player) {
          game.log(player, "令牌", event.card, "不可响应");
          trigger.directHit.addArray(game.players);
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player: 10
      }
    }
  },
  haoxian: {
    enable: "phaseUse",
    limited: true,
    skillAnimation: true,
    selectCard: -1,
    filterCard: false,
    selectTarget: -1,
    filterTarget: false,
    async content(event, trigger, player) {
      player.awakenSkill(event.name);
      const dis = [];
      while (true) {
        const card = get.cardPile((card2) => get.number(card2) == 3 && !dis.includes(card2), "discardPile");
        if (!card) {
          break;
        } else {
          dis.push(card);
        }
      }
      if (dis.length) {
        game.log(player, `将${get.cnNumber(dis.length)}张牌置入了牌堆`);
        const next = game.cardsGotoPile(dis);
        next.set("insert_index", () => {
          return ui.cardPile.childNodes[get.rand(0, ui.cardPile.childNodes.length - 1)];
        });
        await next;
      }
      game.filterPlayer((target2) => target2 != player && target2.countCards("h", (card) => get.number(card) == 3) > 0);
      await game.doAsyncInOrder(event.targets, async (target2) => {
        const cards = target2.getCards("h").filter((card) => get.number(card) == 3);
        if (cards.length) {
          await player.gain({ cards, animate: "gain2" });
        }
      });
    },
    ai: {
      order: 10,
      result: {
        player(player) {
          const list = [];
          const dis = Array.from(ui.discardPile.childNodes);
          list.addArray(dis);
          const num1 = list.filter((card) => get.number(card) == 3).length;
          const num2 = game.findPlayer((target2) => target2 != player && target2.isMaxHandcard(true))?.countCards("h");
          if (num1 && num1 > 0 && Math.random() < 0.5) {
            return 10;
          }
          if (num1 && num1 > 3) {
            return 10;
          }
          if (num2 && num2 > 5 && Math.random() < 0.5) {
            return 10;
          }
        }
      }
    }
  },
  //牛头马面
  dianbu: {
    trigger: {
      player: ["phaseBefore", "enterGame"]
    },
    filter(event, player) {
      return game.phaseNumber == 0 || event.name != "phase";
    },
    forced: true,
    async content(event, trigger, player) {
      const cards = [];
      while (cards.length < 13) {
        const card = get.cardPile2((c) => !cards.includes(c));
        if (card) {
          cards.push(card);
        } else {
          break;
        }
      }
      if (cards.length) {
        await player.gain({ cards, animate: "gain2" });
      }
    },
    group: ["dianbu_effect"],
    subSkill: {
      used: {},
      effect: {
        trigger: {
          player: ["useCard"]
        },
        forced: true,
        filter(event, player) {
          const name = event.card.name;
          const used = player.getStorage("dianbu_used") || [];
          return name.startsWith("juhun_") && !used.includes(name);
        },
        mod: {
          ignoredHandcard(card, player) {
            return card.hasGaintag("dianbu_noMax");
          },
          cardDiscardable(card, player, name) {
            if (name == "phaseDiscard" && card.hasGaintag("dianbu_noMax")) {
              return false;
            }
          }
        },
        async content(event, trigger, player) {
          const name = trigger.card.name;
          const used = player.getStorage("dianbu_used") || [];
          used.push(name);
          player.setStorage("dianbu_used", used);
          const card = get.autoViewAs({ name: "wuzhong" });
          const next = player.useCard({
            card,
            targets: [player]
          });
          player.when({
            player: ["gainAfter"]
          }).filter((event2, player2) => {
            return event2.getParent("useCard") == next;
          }).step(async (event2, trigger2, player2) => {
            const cards = trigger2.cards.filter((card2) => get.owner(card2) == player2);
            player2.addGaintag(cards, "dianbu_noMax");
          });
          await next;
          if (name == "juhun_zhadan") {
            player.setStorage("dianbu_used", []);
          }
        }
      }
    }
  },
  juhun: {
    enable: ["chooseToUse"],
    init(player) {
      game.players.forEach((curr) => curr.addSkill("juhun_effect"));
    },
    selectCard: [1, Infinity],
    filterCard(card, player) {
      return Boolean(game.checkMod(card, player, true, "cardEnabled", []));
    },
    lose: false,
    delay: false,
    discard: false,
    filterOk() {
      const cards = ui.selected.cards;
      return get.info("juhun").getType(cards);
    },
    getType(cards) {
      const numbers = cards.map((card) => get.number(card));
      if (numbers.some((number) => typeof number != "number")) {
        return false;
      }
      numbers.toUniqued().length;
      if (cards.length == 2 && numbers.toUniqued().length == 1) {
        return "duizi";
      } else if (cards.length == 3 && numbers.toUniqued().length == 1) {
        return "santiao";
      } else if (cards.length == 4 && numbers.toUniqued().length == 1) {
        return "zhadan";
      } else if (cards.length == 5 && numbers.every((number, i, list) => {
        return number - list[i - 1] == 1;
      })) {
        return "shunzi";
      }
      return false;
    },
    filter(event, player) {
      if (_status.currentPhase != player || event.type != "phase") {
        return false;
      }
      const cards = player.getCards("h");
      const numbers = cards.map((card) => get.number(card));
      const dsz = numbers.some((number) => get.numOf(numbers, number) > 1);
      const list = numbers.filter((i) => typeof i == "number").sort();
      let sz;
      if (list.length < 5) {
        sz = false;
      } else {
        sz = list.every((i, j) => i - list[j - 1] == 1);
      }
      return dsz || sz;
    },
    viewAs(cards, player) {
      const type = get.info("juhun").getType(cards);
      if (!type) return null;
      return {
        name: `juhun_${type}`
      };
    },
    subSkill: {
      effect: {
        trigger: {
          player: ["phaseBegin", "phaseEnd"]
        },
        popup: false,
        forced: true,
        charlotte: true,
        mod: {
          cardname(card, player, currentname) {
            if (card.hasGaintag("juhun")) {
              return "hschenzhi_poker";
            }
          }
        },
        filter(event, player, name) {
          return player.hasSkill("juhun", null, false, false);
        },
        async content(event, trigger, player) {
          const cards = player.getCards("h");
          if (event.triggername == "phaseBegin") {
            player.addGaintag(cards, "juhun");
          } else if (event.triggername == "phaseEnd") {
            player.removeGaintag("juhun", cards);
          }
        }
      }
    }
  },
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
      if (player.storage.rongbian_skill) return;
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
      if (get.type2(event.card, false) != "equip") return false;
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
        target(card, player, target2) {
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
          filterTarget(card, player, target2) {
            return Boolean(lib.filter.targetEnabled(card, player, target2));
          },
          ai1(card) {
            return get.value(card);
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
        if (cards2.some((c) => get.value(c) < 1)) return 10;
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
    filterTarget(card, player, target2) {
      return target2.sex == "male" && target2.countCards("e") > 0;
    },
    init(player) {
      player.addSkill("tijun_refresh");
    },
    filter(event, player) {
      return game.hasPlayer((target2) => target2.sex == "male" && target2.countCards("e") > 0);
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
        player(player, target2) {
          return 10 + target2.countCards("e");
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
        const card = get.autoViewAs({ name });
        return player.hasUseTarget(card, false, false);
      });
      for (let card of cards) {
        const name = list.filter((i) => card.name != i).randomGet();
        const tag = "fuyue_tag_" + name;
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
        mod: {
          ignoredHandcard(card, player) {
            if (card.gaintag.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return true;
            }
          },
          cardDiscardable(card, player, name) {
            if (name == "phaseDiscard" && card.gaintag.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return false;
            }
          }
        },
        trigger: {
          player: ["useCard1"]
        },
        filter(event, player) {
          const card = event.card;
          if (!card.isCard || !card.cards?.length) {
            return false;
          }
          const loseEvt = player.getHistory("lose", (evt) => evt.type == "use" && evt.getParent("useCard") == event)?.[0];
          if (loseEvt) {
            const card2 = loseEvt.cards[0];
            const tags = loseEvt.gaintag_map[card2.cardid];
            return tags && tags.some((tag) => tag.startsWith("fuyue_tag_"));
          }
          return false;
        },
        async cost(event, trigger, player) {
          const loseEvt = player.getHistory("lose", (evt) => evt.type == "use" && evt.getParent("useCard") == trigger)?.[0];
          const name = loseEvt.gaintag_map[loseEvt.cards[0].cardid].find((tag) => tag.startsWith("fuyue_tag_")).slice(10);
          const { bool } = await player.chooseBool({
            prompt: `是否将${get.translation(trigger.card)}改为${get.translation(name)}`,
            ai(event2, player2) {
              const card = get.autoViewAs({ name, isCard: true }, trigger.cards);
              const targets = get.event().fuyue_targets;
              const num = targets.reduce((num2, target2) => num2 + get.effect(target2, card, player2, player2), 0);
              return num > 0;
            }
          }).set("fuyue_targets", trigger.targets).forResult();
          event.result = {
            bool
          };
        },
        async content(event, trigger, player) {
          const loseEvt = player.getHistory("lose", (evt) => evt.type == "use" && evt.getParent("useCard") == trigger)?.[0];
          const name = loseEvt.gaintag_map[loseEvt.cards[0].cardid].find((tag) => tag.startsWith("fuyue_tag_")).slice(10);
          const [suit, number] = get.cardInfo(trigger.card);
          const card = get.autoViewAs({ name, isCard: true, suit, number }, trigger.cards);
          game.log(player, "将", trigger.card, "改为", card);
          trigger.card = card;
        }
      }
    }
  },
  wenlan: {
    trigger: {
      player: ["useCardAfter"]
    },
    filter(event, player) {
      const list = game.getAllGlobalHistory("useCard", (evt) => evt.player == player);
      return list.length && list.length % 2 == 0;
    },
    mod: {
      aiOrder(player, card, num) {
        const list = game.getAllGlobalHistory("useCard", (evt) => evt.player == player).slice();
        const isFu = card.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"));
        let names = [], names2 = [];
        if (isFu && list.length && list.length % 2 == 0) {
          const tag = card.gaintag.find((tag2) => tag2.startsWith("fuyue_tag_"));
          names.push(card.name, tag.slice(10));
          const evt = list.at(-2);
          const cardx = evt.card;
          const isCard = get.is.ordinaryCard(card);
          if (isCard) {
            const tags = game.getAllGlobalHistory("everything", (evt2) => evt2.name == "lose" && evt2.type == "use" && evt2.player == player && evt2.getParent("useCard") == list[0])?.[0].gaintag_map[cardx.cards[0].cardid] || [];
            if (tags.some((tag2) => tag2.startsWith("fuyue_tag_"))) {
              const name = [cardx.cards[0].name].concat(tags.map((tag2) => tag2.slice(10)));
              names2.push(cardx.cards[0].name, name);
            }
          }
        }
        if (names.some((name) => names2.includes(name))) {
          return 114;
        }
      }
    },
    forced: true,
    async content(event, trigger, player) {
      const list = game.getAllGlobalHistory("useCard", (evt) => evt.player == player).slice(-2);
      const card = list[0].card, card2 = list[1].card;
      const doubleCard = get.is.ordinaryCard(card) && get.is.ordinaryCard(card2);
      let noDouble = true;
      if (doubleCard) {
        const tags = game.getAllGlobalHistory("everything", (evt) => evt.name == "lose" && evt.type == "use" && evt.player == player && evt.getParent("useCard") == list[0])?.[0].gaintag_map[card.cards[0].cardid] || [], tags2 = game.getAllGlobalHistory("everything", (evt) => evt.name == "lose" && evt.type == "use" && evt.player == player && evt.getParent("useCard") == list[1])?.[0].gaintag_map[card2.cards[0].cardid] || [];
        if (tags.some((tag) => tag.startsWith("fuyue_tag_")) && tags2.some((tag) => tag.startsWith("fuyue_tag_"))) {
          const names = [card.cards[0].name].concat(tags.map((tag) => tag.slice(10)));
          const names2 = [card2.cards[0].name].concat(tags2.map((tag) => tag.slice(10)));
          if (names.some((name) => names2.includes(name))) {
            noDouble = false;
            const cards = [];
            const list2 = names.concat(names2);
            while (cards.length < 2) {
              const gain = get.cardPile((card3) => list2.includes(get.name(card3, false)) && !cards.includes(card3));
              cards.push(gain);
              if (!gain) {
                break;
              }
            }
            if (cards.length > 0) {
              await player.gain({ cards, animate: "gain2" });
              const gain = cards.filter((c) => get.owner(c) == player);
              if (gain.length > 0) {
                get.info("fuyue").addFuyue(gain, player);
              }
            }
          }
        }
      }
      if (noDouble && player.getCards("h").some((card3) => !card3.gaintag.some((tag) => tag.startsWith("fuyue_tag_")))) {
        const { cards, bool } = await player.chooseCard({
          position: "h",
          selectCard: [1, 2],
          prompt: "将至多两张手牌标记为“赋”。",
          filterCard(card3, player2) {
            return !card3.gaintag.some((tag) => tag.startsWith("fuyue_tag_"));
          }
        }).forResult();
        if (bool) {
          get.info("fuyue").addFuyue(cards, player);
        }
      }
    }
  },
  //新杀谋诸葛亮
  jingmou: {
    marktext: "☯",
    mark: true,
    intro: {
      content(storage, player) {
        const info = player.storage.jingmou_note;
        let suitStr, typeStr;
        if (info?.suit) {
          suitStr = info.suit.map((suit) => get.translation(suit)).join("、");
          typeStr = info.type.map((type) => get.translation(type)).join("、");
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
    trigger: {
      global: ["useCard"]
    },
    filter(event, player) {
      const card = event.card;
      const type = get.type2(card, false);
      const suit = get.suit(card, false);
      const storage = player.storage.jingmou_note;
      if (!storage?.suit) return false;
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
          if (state2) {
            return true;
          } else {
            return get.attitude(player2, source2) < 0;
          }
        }
      }).set("jingmou_state", state).set("jingmou_source", source).forResult();
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
      if (info.suit.includes(suit)) {
        info.suit.remove(suit);
        noted.suit.add(suit);
      } else {
        info.type.remove(type);
        noted.type.add(type);
      }
      player.setStorage("jingmou_used", noted);
      if (player.hasSkill("dingnan", null, false, true) && noted.suit.length == 4 && noted.type.length == 3) {
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
          }
        }).set("jingmou_suit", suit).forResult();
        if (cards.length) {
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
          return !player.storage.jingmou_note?.suit;
        },
        async cost(event, trigger, player) {
          event.result = await player.chooseCard({
            prompt: "你可弃置任意张牌并秘密记录其中包含的一种花色与牌类型。有角色使用与你记录的花色或类型相同的牌时，移除该记录。阳：此牌无效，你可弃置一张与此牌花色一致的手牌对其造成1点火焰伤害；阴：此牌结算后将其交给任意一名角色。若你移除过所有花色与类型，你获得“定南”",
            position: "he",
            selectCard: [1, Infinity],
            filterCard: lib.filter.cardDiscardable,
            ai(card) {
              const cards = ui.selected.cards;
              const types = cards.map((cards2) => get.type2(cards2, false));
              const type = get.type2(card, false);
              if (!types.includes(type)) {
                return 10;
              }
              return 0;
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
            createDialog: ["选择一种花色记录", [suits.map((suit) => [suit, get.translation(suit)]), "tdnodes"]]
          }).forResult();
          const note = { suit: links, type: types };
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
            ai(target2) {
              const player2 = get.player();
              return get.attitude(player2, target2);
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
      player: ["loseAfter"],
      global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
    },
    forced: true,
    filter(event, player) {
      const evt = event.getl(player);
      const tagMap = evt.gaintag_map;
      return evt.hs && Object.values(tagMap).flat().some((tag) => tag == "guyi_tag");
    },
    async content(event, trigger, player) {
      const num = Math.min(player.getRoundHistory("useSkill", (evt) => evt.skill == event.name).length, 7);
      const cards = get.cards(num);
      await player.viewCards("牌堆顶的牌", cards);
      const result = await player.chooseCardButton({
        prompt: "选择获得的牌",
        cards
      }).forResult();
      if (result.bool) {
        await player.gain({
          cards: result.links,
          animate: "draw",
          gaintag: ["guyi_tag"]
        });
        cards.removeArray(result.links);
      }
      for (const card of cards.slice(0).reverse()) {
        ui.cardPile.insertBefore(card, ui.cardPile.firstChild);
      }
    },
    group: ["guyi_start", "guyi_round"],
    subSkill: {
      tag: {},
      start: {
        trigger: {
          global: "phaseBefore",
          player: "enterGame"
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
      await game.doAsyncInOrder(event.targets, async (target2) => {
        const { bool } = await target2.chooseToRespond({
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
          await target2.damage({ num: 1, source: player });
        }
      });
    },
    ai: {
      order: 10,
      result: {
        target(player, taregt, card) {
          return get.damageEffect(target, player, target);
        }
      }
    }
  }
};
export {
  skill
};
