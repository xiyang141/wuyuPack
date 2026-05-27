import { lib, get, ui, game, _status } from "noname";
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
          const target = indexedData?.[0];
          if (!target) {
            return 0;
          }
          return get.damageEffect(target, player, player);
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
            return game.filterPlayer((target) => target != player).map((target) => [target, event.getl(target).cards2.length]).filter((map) => map[1] > 0);
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
    filterTarget: function(card, player, target) {
      if (!target.hasHistory("damage") && !target.hasHistory("lose")) {
        return false;
      }
      return !(player.getStorage("xianlue_used") || []).includes(target);
    },
    init(player) {
      player.addSkill("xianlue_used");
    },
    filter(event, player) {
      return game.hasPlayer((target) => {
        if (target == player) {
          return false;
        }
        if (!target.hasHistory("damage") && !target.hasHistory("lose")) {
          return false;
        }
        return !(player.getStorage("xianlue_used") || []).includes(target);
      });
    },
    async content(event, trigger, player) {
      const target = event.targets[0];
      const list = player.storage.xianlue_used || [];
      list.add(target);
      player.setStorage("xianlue_used", list);
      const cards = target.getCards("h");
      const note = cards.map((card) => get.number(card) || 0);
      const numbers = player.storage.xianlue_note || [];
      numbers.addArray(note);
      player.setStorage("xianlue_note", numbers);
      await player.viewCards(`${get.translation(target)}的手牌`, cards);
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
      game.filterPlayer((target) => target != player && target.countCards("h", (card) => get.number(card) == 3) > 0);
      await game.doAsyncInOrder(event.targets, async (target) => {
        const cards = target.getCards("h").filter((card) => get.number(card) == 3);
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
          const num2 = game.findPlayer((target) => target != player && target.isMaxHandcard(true))?.countCards("h");
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
        await player.gain({ cards, animate: "draw" });
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
    check(card) {
      const num = ui.selected.cards.length;
      if (num > 3) {
        return -1;
      }
      if (!num) {
        return 1;
      }
      const cards = ui.selected.cards.slice();
      const type = get.info("juhun").getType(cards.add(card));
      if (type) {
        return 1;
      }
      return -1;
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
    async content(event, trigger, player) {
      const { cards } = event;
      await player.discard({ cards });
      const type = get.info("juhun").getType(cards);
      if (type == "duizi") {
        const cards2 = get.inpileVCardList((info) => {
          if (info[0] != "basic") {
            return false;
          }
          const card2 = get.autoViewAs({ name: info[2] });
          return player.hasUseTarget(card2, null, false);
        });
        const {
          links: [link]
        } = await player.chooseButton({
          createDialog: ["视为使用一张基本牌", [cards2, "vcard"]]
        }).forResult();
        const card = get.autoViewAs({ name: link[2], isCard: false });
        await player.chooseUseTarget({
          card,
          nodistance: true,
          addCount: false
        });
      } else if (type == "santiao") {
        const targets = [player.getPrevious(), player.getNext()];
        await game.doAsyncInOrder(targets, async (target) => {
          await player.gainPlayerCard({
            target,
            position: "he"
          });
        });
      } else if (type == "zhadan") {
        const {
          targets: [target]
        } = await player.chooseTarget({
          prompt: "选择一名角色对其造成2点伤害"
        }).forResult();
        await target.damage({
          source: player,
          num: 2
        });
      } else if (type == "shunzi") {
        const {
          targets: [target]
        } = await player.chooseTarget({
          prompt: "将一名角色随机两张牌变为扑克牌。"
        }).forResult();
        const cards2 = target.getCards("h").randomGets(2);
        target.addGaintag(cards2, "juhun");
      }
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
    },
    ai: {
      order: 13,
      result: {
        player: 5
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
            if (card.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return true;
            }
          },
          cardDiscardable(card, player, name) {
            if (name == "phaseDiscard" && card.gaintag?.some((tag) => tag.startsWith("fuyue_tag_"))) {
              return false;
            }
          },
          cardname(card, player, current) {
            const event = get.event();
            const leach = event.filterCard;
            const card2 = get.autoViewAs({ name: current, isCard: true }, [card]);
            if (typeof leach == "function" && !leach(card2, player)) {
              const tag = card.gaintag?.find((tag2) => tag2.startsWith("fuyue_tag_"));
              if (tag) {
                const name = tag.slice(10);
                const cardx = get.autoViewAs({ name, isCard: true }, [card]);
                if (leach(cardx, player)) {
                  return name;
                }
              }
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
              const num = targets.reduce((num2, target) => num2 + get.effect(target, card, player2, player2), 0);
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
  //谋关羽
  guanwu: {
    trigger: {
      player: ["phaseBegin"]
    },
    filter(event, player) {
      const card = get.cardPile("qinglong", "field");
      return Boolean(card);
    },
    forced: true,
    async content(event, trigger, player) {
      const cards = [];
      const card = get.cardPile("qinglong", "field");
      cards.push(card);
      const owner = get.owner(cards[0]);
      if (owner) {
        await owner.lose({
          cards
        });
      }
      await player.gain({
        cards,
        animate: "gain2"
      });
    },
    group: ["guanwu_eff"],
    subSkill: {
      eff: {
        trigger: {
          player: ["useCard"]
        },
        filter(event, player) {
          if (event.card.name != "sha") {
            return false;
          }
          return player.getRoundHistory("useCard", (evt) => get.tag(evt.card, "damage") > 0).length >= 2;
        },
        charlotte: true,
        forced: true,
        async content(event, trigger, player) {
          const num = Math.ceil(player.getRoundHistory("useCard", (evt) => get.tag(evt.card, "damage") > 0).length / 2);
          trigger.baseDamage += num;
        }
      }
    }
  },
  weishi: {
    trigger: {
      target: ["useCardToTargeted"]
    },
    usable: 1,
    filter(event, player) {
      return event.player != player && get.tag(event.card, "damage") < 0;
    },
    async cost(event, trigger, player) {
      const num = Math.ceil(player.countCards("h") / 2);
      event.result = await player.chooseCard({
        prompt: `弃置一半手牌（向上取整）令${get.translation(trigger.card)}对你无效`,
        selectCard: num,
        filterCard: lib.filter.cardDiscardable,
        position: "h",
        ai(card) {
          const player2 = get.player();
          if (player2.countCards("h") < 5) {
            return 6 - get.value(card);
          }
          return 0;
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const { cards } = event;
      await player.discard({ cards });
      const evt = trigger.getParent();
      evt.targets.remove(player);
      evt.excluded.add(player);
    },
    group: ["weishi_sha"],
    subSkill: {
      sha: {
        trigger: {
          global: ["useCardAfter"]
        },
        forced: true,
        filter(event, player) {
          return event.player != player && get.tag(event.card, "damage") > 0 && event.targets.includes(player);
        },
        async content(event, trigger, player) {
          const cards = [];
          while (cards.length < 2) {
            const card = get.cardPile((card2) => get.tag(card2, "damage") > 0 && !cards.includes(card2));
            if (card) {
              cards.push(card);
            } else {
              break;
            }
          }
          if (cards.length) {
            await player.gain({
              cards,
              animate: "gain2"
            });
          }
          await player.chooseToUse({
            prompt: `是否对${get.translation(trigger.player)}使用一张杀？`,
            filterCard(card, player2, event2) {
              if (get.name(card) != "sha") {
                return false;
              }
              return lib.filter.filterCard(card, player2);
            },
            filterTarget(card, player2, target) {
              const source = get.event().sourcex;
              if (target != source && !ui.selected.targets.includes(source)) {
                return false;
              }
              return Boolean(lib.filter.targetEnabled(card, player2, target));
            },
            ai1(card) {
              return -get.value(card);
            },
            ai2(target) {
              const player2 = get.player();
              return get.effect(target, { name: "sha" }, player2, player2);
            }
          }).set("sourcex", trigger.player).set("logSkill", "weishi").set("complexSelect", true);
        }
      }
    }
  },
  jvao: {
    enable: "phaseUse",
    usable: 1,
    filter(event, player) {
      const list = get.inpileVCardList((info) => info[2] == "sha" || info[0] == "trick");
      const targets = game.filterPlayer((curr) => player.inRange(curr));
      return list.some((info) => {
        const card = get.autoViewAs({
          name: info[2],
          nature: info[3]
        });
        return targets.some((target) => player.canUse(card, target, false, false));
      });
    },
    chooseButton: {
      dialog(event, player) {
        const list = get.inpileVCardList((info) => info[2] == "sha" || info[0] == "trick");
        return ui.create.dialog("选择一张牌对任意攻击范围内其他角色使用", [list, "vcard"]);
      },
      check(button) {
        return Math.random() - 0.5;
      },
      backup(links, player) {
        return {
          selectCard: -1,
          filterCard: false,
          selectTarget: [1, Infinity],
          jvao_card: links[0],
          multitarget: true,
          multiline: true,
          filterTarget(card, player2, target) {
            const info = get.info("jvao_backup").jvao_card;
            const card2 = get.autoViewAs({
              name: info[2],
              nature: info[3]
            });
            return player2.inRange(target) && player2.canUse(card2, target, false, false);
          },
          ai2(target) {
            const player2 = get.player();
            const info = get.info("jvao_backup").jvao_card;
            const card = get.autoViewAs({
              name: info[2],
              nature: info[3]
            });
            const num = get.effect(target, card, player2, player2);
            const att = get.attitude(player2, target);
            if (num > 0) {
              return att;
            } else {
              return -att;
            }
          },
          prompt: `视为对攻击范围内任意其他角色使用${get.translation(links[0][2])}`,
          async content(event, trigger, player2) {
            const targets = event.targets;
            const info = get.info("jvao_backup").jvao_card;
            const card = get.autoViewAs({
              name: info[2],
              nature: info[3]
            });
            await player2.useCard({
              card,
              targets
            });
            targets.forEach((target) => {
              target.addSkill("jvao_eff");
              target.setStorage("jvao_source", player2);
            });
          }
        };
      }
    },
    subSkill: {
      backup: {},
      eff: {
        trigger: {
          player: ["useCard"]
        },
        forced: true,
        charlotte: true,
        mod: {
          cardUsable(card, player, target) {
            if (get.name(card, false) == "sha" && get.type(card, null, false) == "trick") {
              return Infinity;
            }
          },
          targetInRange(card, player, target) {
            if (get.name(card, false) == "sha" && get.type(card, null, false) == "trick") {
              return true;
            }
          },
          playerEnabled(card, player, target) {
            if (get.name(card, false) == "sha" && get.type(card, null, false) == "trick") {
              const source = player.getStorage("jvao_source");
              return target == source;
            }
          }
        },
        filter(event, player) {
          const card = event.card;
          return get.name(card, false) == "sha" && get.type(card, null, false) == "trick";
        },
        async content(event, trigger, player) {
          trigger.addCount = false;
          player.setStorage("jvao_source", null);
          player.removeSkill("jvao_eff");
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player: 3
      }
    }
  },
  //邓晚棠
  daijia: {
    trigger: {
      player: ["damageAfter"],
      global: ["roundStart"]
    },
    filter(event, player) {
      if (event.name == "damage") {
        return !player.hasHistory("damage", (evt) => evt != event);
      }
      return true;
    },
    mark: true,
    marktext: "黛",
    intro: {
      content: "expansion"
    },
    onremove: true,
    async cost(event, trigger, player) {
      event.result = await player.chooseCard({
        prompt: "你可弃置任意张手牌并回复1点体力，然后随机从牌堆或弃牌堆将等量张红色牌置于武将牌上，称为“黛”。其他角色使用牌指定你为目标时，你可获得两张“黛”。",
        selectCard: [1, Infinity],
        filterCard: lib.filter.cardDiscardable,
        position: "h",
        ai(card) {
          const player2 = get.player();
          const value = get.value(card);
          if (player2.isDamaged()) {
            return 1;
          }
          const cards = player2.getCards("h");
          const num = cards.filter((card2) => get.color(card2) == "red").length;
          const num2 = cards.filter((card2) => get.color(card2) == "black").length;
          const color = get.color(card);
          if (player2.hasSkill("chengchong")) {
            if (color == "red") {
              return num - num2 > 3 ? 6 - value : 0;
            } else {
              return 12 - value;
            }
          }
          return ui.selected.cards.length < 2 ? 6 - value : 0;
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const { cards } = event;
      await player.discard({ cards });
      await player.recover();
      const list = [];
      const num = cards.length;
      while (list.length < num) {
        const card = get.cardPile((card2) => !list.includes(card2) && get.color(card2, false) == "red", null, "random");
        if (card) {
          list.push(card);
        } else {
          break;
        }
      }
      if (list.length) {
        await player.addToExpansion({
          cards: list,
          animate: "gain2",
          gaintag: ["daijia"]
        });
      }
    },
    group: ["daijia_eff"],
    subSkill: {
      tag: {},
      eff: {
        trigger: {
          target: ["useCardToTargeted"]
        },
        forced: true,
        filter(event, player) {
          return event.player != player && player.getExpansions("daijia").length > 0;
        },
        async content(event, trigger, player) {
          const cards = player.getExpansions("daijia").randomGets(2);
          await player.gain({
            cards,
            animate: "draw"
          });
        }
      }
    }
  },
  chengchong: {
    forced: true,
    group: ["chengchong_gain", "chengchong_lose"],
    subSkill: {
      gain: {
        trigger: {
          player: ["gainAfter"],
          global: ["loseAsyncAfter"]
        },
        forced: true,
        filter(event, player) {
          if (event.getParent(2).name == "chengchong_gain" || _status.currentPhase == player) {
            return false;
          }
          const gain = event.getg(player);
          const cards = player.getCards("h");
          const num = cards.filter((card) => get.color(card) == "red").length;
          const num2 = cards.filter((card) => get.color(card) == "black").length;
          return num > num2 && gain.length > 0;
        },
        async content(event, trigger, player) {
          await player.draw({ num: 2 });
        }
      },
      lose: {
        trigger: {
          player: ["useCard"]
        },
        filter(event, player) {
          const cards = player.getCards("h");
          const num = cards.filter((card) => get.color(card) == "red").length;
          const num2 = cards.filter((card) => get.color(card) == "black").length;
          return num < num2;
        },
        mod: {
          aiOrder(player, card) {
            if (get.color(card, false) == "black") {
              return 13;
            }
          }
        },
        forced: true,
        async content(event, trigger, player) {
          const card = await player.getCards("h", (card2) => get.color(card2, false) == "black" && lib.filter.cardDiscardable(card2, player)).randomGet();
          await player.discard({ cards: [card] });
        }
      }
    }
  },
  //陆文漪
  caiyun: {
    enable: "phaseUse",
    usable: 1,
    filterTarget: function(card, player, target) {
      return target != player;
    },
    selectTarget: 1,
    filterCard: false,
    selectCard: -1,
    init(player) {
      if (!player.storage.caiyun_eff) {
        player.storage.caiyun_eff = {
          basic: [],
          trick: [],
          equip: []
        };
      }
      player.addSkill("caiyun_eff");
    },
    prompt: "你可选择一名其他角色并与其各从牌堆随机获得1张指定类型的牌，然后直到你的下个回合开始，你与其使用该类型的牌时，从牌堆随机获得2张与使用的牌类型不同的牌(每人至多两次)",
    async content(event, trigger, player) {
      const {
        targets: [target]
      } = event;
      const {
        links: [type]
      } = await player.chooseButton({
        forced: true,
        createDialog: ["你可选择一名其他角色并与其各从牌堆随机获得1张指定类型的牌，然后直到你的下个回合开始，你与其使用该类型的牌时，从牌堆随机获得2张与使用的牌类型不同的牌(每人至多两次)", [["basic", "trick", "equip"].map((i) => [i, get.translation(i)]), "tdnodes"]],
        ai(buttom) {
          return Math.random() - 0.5;
        }
      }).forResult();
      const info = player.getStorage("caiyun_eff");
      info[type].add(target);
      player.setStorage("caiyun_eff", info);
      player.addTempSkill("caiyun_del", { player: ["phaseBegin"] });
      const gainer = [player, target];
      await game.doAsyncInOrder(gainer, async (current) => {
        const gain = [];
        const card = get.cardPile((card2) => get.type2(card2, false) == type);
        if (card) {
          gain.push(card);
          await current.gain({
            cards: gain,
            animate: "gain2"
          });
        }
      });
    },
    subSkill: {
      eff: {
        trigger: {
          global: ["useCard"]
        },
        filter(event, player) {
          const user = event.player;
          const type = get.type2(event.card, false);
          const id = user.playerid;
          const info = player.getStorage("caiyun_eff_count");
          if (info[id] > 1) {
            return false;
          }
          const note = player.getStorage("caiyun_eff")?.[type];
          return note.length && user == player || note.includes(user);
        },
        init(player) {
          const info = {};
          game.players.forEach((curr) => {
            const id = curr.playerid;
            info[id] = 0;
          });
          player.setStorage("caiyun_eff_count", info);
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
          const user = trigger.player;
          const id = user.playerid;
          const info = player.getStorage("caiyun_eff_count");
          info[id]++;
          player.setStorage("caiyun_eff_count", info);
          const type = get.type2(trigger.card, false);
          const cards = [];
          const types = ["basic", "trick", "equip"].remove(type);
          types.forEach((t) => {
            const card = get.cardPile((c) => get.type2(c, false) == t);
            if (card) {
              cards.push(card);
            }
          });
          if (cards.length) {
            await user.gain({
              cards,
              animate: "gain2"
            });
          }
        }
      },
      del: {
        charlotte: true,
        onremove(player) {
          const info = player.getStorage("caiyun_eff_count");
          game.players.forEach((curr) => {
            const id = curr.playerid;
            info[id] = 0;
          });
          player.storage.caiyun_eff = {
            basic: [],
            trick: [],
            equip: []
          };
          player.setStorage("caiyun_eff_count", info);
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player: 3,
        target: 3
      }
    }
  },
  qieyan: {
    trigger: {
      global: ["useCardAfter"]
    },
    forced: true,
    filter(event, player) {
      return event.player != player;
    },
    init(player) {
      player.addSkill("qieyan_del");
    },
    mod: {
      globalTo(from, to, num) {
        to.storage.qieyan_count || 0;
      }
    },
    async content(event, trigger, player) {
      const user = trigger.player;
      get.distance(user, player);
      const bool = user.inRange(player);
      let add = player.storage.qieyan_count || 0;
      add += 1;
      player.setStorage("qieyan_count", add);
      const bool2 = user.inRange(player);
      if (bool && !bool2) {
        await player.recover({ num: 1 });
        await player.draw({ num: 2 });
      }
    },
    group: ["qieyan_eff"],
    subSkill: {
      eff: {
        trigger: {
          global: ["useCardBefore"]
        },
        forced: true,
        filter(event, player) {
          const user = event.player;
          const num = get.distance(user, player);
          return num == 1 && !event.directHit?.includes(player);
        },
        async content(event, trigger, player) {
          if (!trigger.directHit?.length) {
            trigger.directHit = [];
          }
          trigger.directHit.push(player);
        }
      },
      del: {
        trigger: {
          global: ["phaseAfter"]
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
          player.setStorage("qieyan_count", 0);
        }
      }
    }
  },
  //ol郑玄
  shixing: {
    trigger: {
      global: ["phaseUseBegin"]
    },
    filter(event, player) {
      return event.player == player || event.player.storage.shixing_share;
    },
    async cost(event, trigger, player) {
      const types = ["basic", "trick", "equip"];
      const list = [];
      for (let i = 0; i < 3; i++) {
        const list2 = types.map((t) => [`${t}${i}`, get.translation(t)]);
        list.push([list2, "tdnodes"]);
      }
      const user = trigger.player;
      const { bool, links } = await user.chooseButton({
        selectButton: 3,
        createDialog: ["你可以排列三种类型。当你本阶段使用前三张牌时，若此牌类别类别与排列中对应顺序的类别相同，你摸一张牌；若均相同，本回合结束阶段，你可以令一名其他角色于其下个出牌阶段开始时也发动此技能", ...list],
        filterButton(button) {
          return button.link.at(-1) == ui.selected.buttons.length;
        },
        ai(button) {
          const player2 = get.player();
          const name = button.link.slice(0, -1);
          const bool2 = player2.countCards("hs", (c) => get.type2(c, false) == name && player2.hasUseTarget(c)) > ui.selected.buttons.length;
          if (bool2) {
            return 2;
          }
          return 1;
        }
      }).forResult();
      event.result = {
        bool,
        cost_data: {
          types: links
        }
      };
    },
    async content(event, trigger, player) {
      const { types } = event.cost_data;
      const user = trigger.player;
      user.setStorage("shixing_types", types);
      user.addTempSkill("shixing_eff", { player: ["phaseUseEnd"] });
    },
    subSkill: {
      eff: {
        trigger: {
          player: ["useCard"]
        },
        mod: {
          aiOrder(player, card) {
            const list = player.getStorage("shixing_types");
            if (list.length) {
              const type = get.type2(card, false);
              const note = list[0].slice(0, -1);
              if (note == type) {
                return 17;
              }
            }
          }
        },
        mark: true,
        marktext: "师",
        intro: {
          mark(dialog, storage, player) {
            const list = player.getStorage("shixing_types");
            const types = list.map((i) => i.slice(0, -1));
            const str = types.map((i) => get.translation(i)).join("、");
            dialog.addText(str);
          }
        },
        charlotte: true,
        forced: true,
        filter(event, player) {
          const list = player.getStorage("shixing_types");
          return list.Length > 0;
        },
        async content(event, trigger, player) {
          const list = player.getStorage("shixing_types");
          const note = list.shift().slice(0, -1);
          player.setStorage("shixing_types", list);
          const type = get.type2(trigger.card, false);
          let num = player.storage.shixing_count || 0;
          if (note == type) {
            await player.draw();
            num += 1;
            player.setStorage("shixing_count", num);
          }
          if (num == 3) {
            const { targets } = await player.chooseTarget({
              prompt: "你可令一名其他角色于其下个出牌阶段开始时也发动“师行”",
              filterTarget: lib.filter.notMe,
              ai(target) {
                const player2 = get.player();
                return get.attitude(player2, target);
              }
            }).forResult();
            if (targets?.length) {
              targets[0].setStorage("shixing_share", "share");
            }
          }
        },
        ai: {
          effect: {
            player(card, player) {
              const list = player.getStorage("shixing_types");
              if (list.length) {
                const type = get.type2(card, false);
                const note = list[0].slice(0, -1);
                if (note == type) {
                  return 1;
                }
              }
            }
          }
        }
      }
    }
  },
  dejiao: {
    trigger: {
      player: ["damageEnd"]
    },
    filter(event, player) {
      return game.hasPlayer((curr) => curr.countCards("h", (c) => lib.filter.cardRecastable(c, curr)) > 0);
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: "观看一名角色的手牌并重铸其中至多x张(x为此技能发动次数)，若重铸的牌中没有伤害牌，重置x",
        filterTarget(card, player2, target) {
          return target.countCards("h", (c) => lib.filter.cardRecastable(c, target)) > 0;
        },
        ai() {
          return Math.random() - 0.5;
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const {
        targets: [target]
      } = event;
      let num = player.storage.dejiao_count || 0;
      num += 1;
      player.setStorage("dejiao_count", num);
      const list = target.getCards("h", (c) => lib.filter.cardRecastable(c, target));
      const { links } = await player.chooseButton({
        selectButton: num,
        filterButton(button) {
          const target2 = get.event().dejiao_target;
          const card = button.link;
          return lib.filter.cardRecastable(card, target2);
        },
        createDialog: ["重铸其中至多x张(x为此技能发动次数)，若重铸的牌中没有伤害牌，重置x", [list, "card"]],
        ai(button) {
          const card = button.link;
          const player2 = get.player();
          const target2 = get.event().dejiao_target;
          const att = get.attitude(player2, target2);
          const value = 6 - get.value(card);
          if (get.tag(card, "damage") > 0 && !ui.selected.buttons.length) {
            return 114;
          }
          if (att > 0) {
            return 6 - value;
          } else {
            return value;
          }
        }
      }).set("dejiao_target", target).forResult();
      if (links?.length) {
        if (!links.some((card) => get.tag(card, "damage") > 0)) {
          player.setStorage("dejiao_count", 0);
        }
        await target.recast(links);
      }
    }
  },
  //唐棠
  zexing: {
    enable: "phaseUse",
    usable: 1,
    filterCard: true,
    selectCard: 1,
    filterTarget: lib.filter.notMe,
    selectTarget: 1,
    lose: false,
    discard: false,
    delay: false,
    async content(event, trigger, player) {
      let {
        targets: [target],
        cards: [card]
      } = event;
      const gain = card;
      let bool = false;
      while (true) {
        const list = player.getStorage("zexing_used");
        list.add(target);
        player.setStorage("zexing_used", list);
        await player.showCards([card]);
        const {
          links: [link]
        } = await target.chooseButton({
          forced: true,
          createDialog: [
            "择行",
            [
              [
                ["gain", `${get.translation(player)}观看你的手牌并获得两张与展示牌花色不同的牌，然后你获得展示牌`],
                ["lose", `你失去1点体力，然后${get.translation(player)}可重新选择一名其他角色并重复此流程`]
              ],
              "textbutton"
            ]
          ],
          filterButton(button) {
            const link2 = button.link;
            const player2 = get.player();
            if (link2 == "gain") {
              return player2.countCards("h") > 0;
            }
            return true;
          },
          ai(button) {
            const link2 = button.link;
            const player2 = get.player();
            const suit = get.event().zexing_suit;
            const source = get.event().zexing_source;
            if (link2 == "gain") {
              const cards = player2.getCards("h", (c) => get.suit(c, player2) != suit);
              if (cards.every((c) => get.value(c) > 12)) {
                return 0;
              }
            } else {
              const num = get.effect(player2, { name: "losehp" }, player2, player2);
              const att = get.attitude(player2, source);
              if (num > 0 && att > 0) {
                return 2;
              }
            }
            return 1;
          }
        }).set("zexing_suit", get.suit(gain, player)).set("zexing_source", player).forResult();
        if (link == "gain") {
          bool = false;
          const list2 = target.getCards("h");
          const { links: cards } = await player.chooseButton({
            selectButton: [1, 2],
            createDialog: ["选择两张与展示牌花色不同的牌获得", [list2, "card"]],
            filterButton(button) {
              const suit = get.event().zexing_suit;
              const link2 = button.link;
              const target2 = get.event().zexing_target;
              return get.suit(link2, target2) != suit;
            },
            ai(button) {
              const link2 = button.link;
              return get.value(link2);
            }
          }).set("zexing_suit", get.suit(gain, player)).set("zexing_target", target).forResult();
          if (cards?.length) {
            await player.gain({ cards, animate: "gain2" });
            await target.gain({ cards: [gain], animate: "gain2" });
          }
        } else {
          await target.loseHp();
          bool = true;
        }
        if (bool) {
          const { cards, targets } = await player.chooseCardTarget({
            prompt: "是否重复此流程",
            filterCard: true,
            selectCard: 1,
            filterTarget(card2, player2, target2) {
              const list2 = player2.getStorage("zexing_used");
              return target2 != player2 && !list2.includes(target2);
            },
            selectTarget: 1,
            ai1(card2) {
              return -get.value(card2);
            },
            ai2(target2) {
              const player2 = get.player();
              const num = get.effect(target2, { name: "losehp" }, target2, target2);
              const att = get.attitude(player2, target2);
              if (num > 0 && att > 0) {
                return num;
              }
              return 1;
            }
          }).forResult();
          if (targets?.length) {
            target = targets[0];
            card = cards[0];
          }
        } else {
          break;
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player: 2,
        target(player, target) {
          const num = get.effect(target, { name: "losehp" }, target, target);
          if (num > 0) {
            return num;
          }
          return 1;
        }
      }
    }
  },
  zhiyi: {
    trigger: {
      global: ["loseAsyncAfter", "gainAfter"]
    },
    usable: 1,
    filter(event, player) {
      const gain = event.getg(player);
      const lose = event.getl(player).cards2;
      if (!lose.length && !gain.length) {
        return false;
      }
      const colors = player.getCards("h").map((c) => get.color(c, player));
      return game.hasPlayer((curr) => {
        if (curr == player) {
          return false;
        }
        const lose2 = event.getl(curr).cards2;
        const gain2 = event.getg(curr);
        const bool = lose2.some((c) => gain.includes(c) && colors.includes(get.color(c, false)));
        const bool2 = gain2.some((c) => lose.includes(c) && colors.includes(get.color(c, false)));
        return bool || bool2;
      });
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: "令一名角色摸一张牌",
        ai(target) {
          const player2 = get.player();
          return get.attitude(player2, target);
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const {
        targets: [target]
      } = event;
      await target.draw();
    }
  },
  //李昭仪
  dc_mingjie: {
    trigger: {
      global: "phaseBefore",
      player: "enterGame"
    },
    init(player) {
      player.addSkill("dc_mingjie_dis");
    },
    filter(event, player) {
      return event.name != "phase" || game.phaseNumber == 0;
    },
    mark: true,
    marktext: "节",
    intro: {
      content: "players"
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseTarget({
        prompt: "选择一名其他角色，你与其获得对方因为弃牌阶段弃置的牌，你与其的阶段被跳过时各摸2张牌并可令对方防止下次受到的伤害。所选角色阵亡时，你立即阵亡。",
        filterTarget: lib.filter.notMe,
        ai(target) {
          const player2 = get.player();
          return get.attitude(player2, target);
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const {
        targets: [target]
      } = event;
      player.setStorage("dc_mingjie", target);
    },
    group: ["dc_mingjie_eff", "dc_mingjie_die"],
    subSkill: {
      eff: {
        trigger: {
          global: ["phaseAnySkipped", "phaseAnyCancelled"]
        },
        filter(event, player) {
          return event.player == player || event.player == player.storage.dc_mingjie;
        },
        forced: true,
        async content(event, trigger, player) {
          const targets = [player, player.storage.dc_mingjie];
          await game.doAsyncInOrder(targets, async (target) => {
            await target.draw(2);
            const mate = targets.find((t) => t != target);
            const { bool } = await target.chooseBool({
              prompt: `是否防止${get.translation(mate)}受到下次伤害`,
              ai(event2, player2) {
                const mate2 = get.event().dc_mingjie_target;
                const att = get.attitude(player2, mate2);
                if (att > 0) {
                  return true;
                } else {
                  return false;
                }
              }
            }).set("dc_mingjie_target", mate).forResult();
            if (bool) {
              mate.addSkill("dc_mingjie_mate");
            }
          });
        }
      },
      dis: {
        trigger: {
          global: ["phaseDiscardEnd"]
        },
        forced: true,
        charlotte: true,
        filter(event, player) {
          if (!event.cards?.length) {
            return false;
          }
          return event.player == player || event.player == player.storage.dc_mingjie;
        },
        async content(event, trigger, player) {
          const source = trigger.player;
          const gainer = source == player ? player.storage.dc_mingjie : player;
          const cards = trigger.cards.filterInD("d");
          await gainer.gain({
            cards,
            animate: "gain2"
          });
        }
      },
      mate: {
        trigger: {
          player: ["damageBegin4"]
        },
        mark: true,
        marktext: "明",
        intro: {
          content: "防止下次受到的伤害"
        },
        forced: true,
        charlotte: true,
        async content(event, trigger, player) {
          trigger.cancel();
          player.removeSkill("dc_mingjie_mate");
        }
      },
      die: {
        trigger: {
          global: ["dieAfter"]
        },
        filter(event, player) {
          return player.storage.dc_mingjie == event.player;
        },
        direct: true,
        async content(event, trigger, player) {
          await player.die();
        }
      }
    }
  },
  dc_xianfu: {
    trigger: {
      target: ["useCardToTargeted"]
    },
    usable: 1,
    async cost(event, trigger, player) {
      const list = lib.phaseName.filter((i) => !player.skipList.concat(["phaseZhunbei", "phaseJieshu"]).includes(i));
      const { links, bool } = await player.chooseButton({
        createDialog: ["跳过你下个除准备阶段和结束阶段外的一个阶段并与“明节”角色交换手牌，若如此做，此牌对你无效。", [list.map((i) => [i, get.translation(i)]), "tdnodes"]],
        ai(button) {
          const link = button.link;
          const player2 = get.player();
          const evt = get.event().dc_xianfu_use;
          const card = evt.card;
          const user = evt.player;
          const num = get.effect(player2, card, user, player2);
          if (num > 0) {
            return -1;
          } else {
            if (link == "phaseDiscard") {
              return 4;
            } else if (link == "phaseUse") {
              return Math.random() - 0.3;
            } else if (link == "phaseDraw") {
              return Math.random() - 0.5;
            }
            return 3;
          }
        }
      }).set("dc_xianfu_use", list).forResult();
      event.result = {
        bool,
        cost_data: {
          skip: links
        }
      };
    },
    async content(event, trigger, player) {
      const evt = trigger.getParent();
      evt.targets.remove(player);
      evt.excluded.add(player);
      const { skip } = event.cost_data;
      player.skipList.add(skip[0]);
      const target = player.storage.dc_mingjie;
      await player.swapHandcards(target);
    }
  },
  //ol谋祝融
  ol_sb_renche: {
    enable: "phaseUse",
    usable: () => _status.discarded.filter((c) => c.name == "sha").length,
    selectCard() {
      const num = _status.discarded.filter((c) => c.name == "sha").length;
      if (num) {
        return [1, _status.discarded.filter((c) => c.name == "sha").length];
      }
      return 1;
    },
    filterCard: lib.filter.cardDiscardable,
    filterTarget(card, player, target) {
      return target != player && target.countCards("he") > 0;
    },
    selectTarget() {
      if (!ui.selected.cards.length) {
        return 1;
      }
      return [1, _status.discarded.filter((c) => c.name == "sha").length];
    },
    lose: false,
    discard: false,
    delay: false,
    multiline: true,
    multitarget: true,
    complexSelect: true,
    check(card) {
      if (card.name == "sha") {
        return 2;
      }
      if (ui.selected.cards.length > game.players.length) {
        return -1;
      }
      return 1;
    },
    async content(event, trigger, player) {
      const { targets, cards } = event;
      await player.discard({
        cards
      });
      const targets2 = targets.slice();
      const results = await player.chooseCardOL({
        list: targets,
        args: ["he", lib.filter.cardDiscardable, true, "刃掣:弃置一张牌"]
      }).set("ai", (card) => {
        const player2 = get.player();
        const source = get.event().ol_sb_renche_source;
        const value = 6 - get.value(card, player2);
        if (get.attitude(player2, source) > 0) {
          return card.name == "sha" ? 9 - value : 6 - value;
        }
        return card.name == "sha" ? 3 - value : 6 - value;
      }).set("ol_sb_renche_source", player).forResult();
      let draw = 0;
      for (let i = 0; i < targets2.length; i++) {
        const { cards: cards2 } = results[i];
        draw += cards2.filter((c) => c.name != "sha").length;
        await targets2[i].discard(cards2);
      }
      await player.draw({
        num: draw
      });
    },
    ai: {
      order: 10,
      result: {
        player: 3,
        target(player, target) {
          const att = get.attitude(player, target);
          if (att > 0) {
            const bool = player.countCards("he", (card) => get.name(card, false) == "sha");
            target.countCards("he");
            return bool ? -1 : 2;
          }
          return -1;
        }
      }
    }
  },
  ol_sb_yalian: {
    trigger: {
      player: ["phaseAnyAfter"]
    },
    filter(event, player) {
      const num = _status.discarded.filter((c) => c.name == "sha").length;
      if (!game.hasPlayer((curr) => curr.countCards("h") < num)) {
        return false;
      }
      return player.hasHistory("lose", (evt) => evt.cards.some((c) => c.name == "sha") && evt.type != "use" && evt.getParent(event.name) == event);
    },
    async cost(event, trigger, player) {
      const num = _status.discarded.filter((c) => c.name == "sha").length;
      event.result = await player.chooseTarget({
        prompt: `对任意名手牌数小于${num}的角色视为使用一张火【杀】`,
        selectTarget: [1, Infinity],
        filterTarget(card, player2, target) {
          return target.countCards("h") < num;
        },
        ai(target) {
          const player2 = get.player();
          return get.effect(target, { name: "sha", nature: "fire" }, player2, player2);
        }
      }).forResult();
    },
    async content(event, trigger, player) {
      const { targets } = event;
      const card = get.autoViewAs({
        name: "sha",
        nature: "fire"
      });
      await player.useCard({
        card,
        targets
      });
    }
  },
  //ol谋田丰
  ol_sb_zhijian: {
    enable: "phaseUse",
    usable: 1,
    selectCard: -1,
    filterCard: false,
    selectTarget: 1,
    filterTarget: true,
    discard: false,
    lose: false,
    delay: false,
    async content(event, trigger, player) {
      const {
        targets: [target]
      } = event;
      const last = player.getStorage("ol_sb_zhijian_note");
      const num = target == last ? 2 : 1;
      player.setStorage("ol_sb_zhijian_note", target);
      const {
        links: [type]
      } = await target.chooseButton({
        createDialog: [`选择类别然后${get.translation(player)}摸一张牌并交给你一张牌，若此牌与声明的类别不同，你可对其使用一张【杀】。`, [["basic", "trick", "equip"].map((i) => [i, get.translation(i)]), "tdnodes"]],
        forced: true,
        ai: () => Math.random() - 0.5
      }).forResult();
      game.log(target, "选择了", get.translation(type));
      await player.draw({
        num
      });
      if (!player.countCards("he")) {
        return;
      }
      const { cards } = await player.chooseToGive({
        target,
        position: "he",
        forced: true,
        ai(card) {
          const player2 = get.player();
          const target2 = get.event().target;
          const att = get.attitude(player2, target2);
          const value = get.value(card, player2);
          if (att > 0) {
            return value - 6;
          }
          return 6 - value;
        }
      }).forResult();
      const type2 = get.type2(cards[0], false);
      if (type2 != type) {
        await target.chooseToUse({
          prompt: `是否对${get.translation(player)}使用一张杀？`,
          filterCard(card, player2, event2) {
            if (get.name(card) != "sha") {
              return false;
            }
            return lib.filter.filterCard(card, player2);
          },
          filterTarget(card, player2, target2) {
            const source = get.event().sourcex;
            if (target2 != source && !ui.selected.targets.includes(source)) {
              return false;
            }
            return Boolean(lib.filter.targetEnabled(card, player2, target2));
          },
          ai1(card) {
            return -get.value(card);
          },
          ai2(target2) {
            const player2 = get.player();
            return get.effect(target2, { name: "sha" }, player2, player2);
          }
        }).set("sourcex", player).set("logSkill", "weishi").set("complexSelect", true);
      }
    },
    ai: {
      order: 10,
      result: {
        player: 2,
        target(player, target) {
          if (player.storage.ol_sb_zhijian_note == target && get.attitude(player, target) > 0) {
            return 2;
          }
          return 1;
        }
      }
    }
  },
  ol_sb_xiaojie: {
    trigger: {
      target: ["useCardToTargeted"]
    },
    filter(event, player) {
      return event.card.name == "sha";
    },
    mark: true,
    marktext: "效",
    intro: {
      mark(dialog, storage, player) {
        dialog.addText("使用的上一张锦囊牌为:");
        const list = player.getAllHistory("useCard", (evt) => get.type(evt.card, null, false) == "trick");
        if (list.length) {
          const card = list.at(-1).card;
          dialog.addSmall([[card], "vcard"]);
        }
      }
    },
    async cost(event, trigger, player) {
      event.result = await player.chooseBool({
        prompt: "是否令你不可响应之。若如此做，你于此 【杀】结算完毕后:视为使用你使用的上一张普通锦囊牌或摸一张牌。",
        ai() {
          const player2 = get.player();
          const evt = get.event().ol_sb_xiaojie_trigger;
          const use = evt.getParent();
          if (use.directHit?.includes(player2) || !player2.hasCard("shan")) {
            return true;
          }
          const source = evt.player;
          const card = evt.card;
          const num = get.effect(player2, card, source, player2);
          const num2 = get.effect(player2, { name: "sha" }, source, player2);
          if (num >= num2 * 2) {
            return false;
          }
          return Math.random() - 0.5 > 0;
        }
      }).set("ol_sb_xiaojie_trigger", trigger).forResult();
    },
    async content(event, trigger, player) {
      const evt = trigger.getParent();
      const card = evt.card;
      if (!evt.directHit?.length) {
        evt.directHit = [];
      }
      evt.directHit.push(player);
      const list = player.getStorage("ol_sb_xiaojie_note");
      list.add(card);
      player.setStorage("ol_sb_xiaojie_note", list);
      player.addSkill("ol_sb_xiaojie_eff");
    },
    subSkill: {
      eff: {
        trigger: {
          global: ["useCardAfter"]
        },
        charlotte: true,
        forced: true,
        filter(event, player) {
          const cards = player.getStorage("ol_sb_xiaojie_note");
          return cards.includes(event.card);
        },
        async content(event, trigger, player) {
          const list = player.getStorage("ol_sb_xiaojie_note");
          list.remove(trigger.card);
          player.setStorage("ol_sb_xiaojie_note", list);
          if (list.length == 0) {
            player.removeSkill("ol_sb_xiaojie_eff");
          }
          const { links } = await player.chooseButton({
            forced: true,
            createDialog: [
              [
                [
                  ["use", "视为使用你使用的上一张普通锦囊牌"],
                  ["draw", "摸一张牌"]
                ],
                "textbutton"
              ]
            ],
            ai(button) {
              button.link;
              if (button.link == "use") {
                const list2 = player.getAllHistory("useCard", (evt) => get.type(evt.card, null, false) == "trick");
                if (list2.length) {
                  const card = list2.at(-1).card;
                  return get.useful(card, player);
                }
              }
              return 1;
            },
            filterButton(button) {
              const player2 = get.player();
              if (button.link == "use") {
                return player2.hasAllHistory("useCard", (evt) => get.type(evt.card, null, false) == "trick");
              }
              return true;
            }
          }).forResult();
          if (links[0] == "use") {
            const card = player.getAllHistory("useCard", (evt) => get.type(evt.card, null, false) == "trick").at(-1).card;
            const card2 = get.autoViewAs({
              name: card.name,
              suit: card.suit,
              number: card.number,
              nature: card.nature
            });
            await player.chooseUseTarget({
              card: card2
            });
          } else {
            await player.draw({ num: 1 });
          }
        }
      }
    }
  },
  //ol段煨
  taohuai: {
    trigger: {
      player: ["useCardAfter"]
    },
    zhuanhuanji: true,
    forced: true,
    locked: false,
    marktext: "☯",
    mark: true,
    intro: {
      content(storage, player) {
        return `你使用牌后，若此牌点数为你手牌中: ${storage ? "最小" : "最大"},你摸一张牌。否则你可弃置一张牌`;
      }
    },
    mod: {
      aiOrder(player, card, num) {
        const state = player.storage.taohuai;
        const number = get.number(card, false);
        const numbers = player.getCards("h").map((c) => get.number(c, false)).filter((n) => typeof n == "number");
        const max = Math.max(...numbers);
        const min = Math.min(...numbers);
        if (get.numOf(numbers, max) == 1 && number == max && !state) {
          return num + 10;
        } else if (get.numOf(numbers, min) == 1 && number == min && state) {
          return num + 10;
        }
        return num;
      }
    },
    async content(event, trigger, player) {
      const state = player.storage.taohuai;
      const card = trigger.card;
      const number = get.number(card, false);
      const numbers = player.getCards("h").map((c) => get.number(c, false)).concat([number]).filter((n) => typeof n == "number");
      const max = Math.max(...numbers);
      const min = Math.min(...numbers);
      console.log(get.numOf(numbers, max) == 1, number == max, !state);
      if (get.numOf(numbers, max) == 1 && number == max && !state) {
        await player.draw({ num: 1 });
        player.changeZhuanhuanji(event.name);
      } else if (get.numOf(numbers, min) == 1 && number == min && state) {
        await player.draw({ num: 1 });
        player.changeZhuanhuanji(event.name);
      } else {
        await player.chooseToDiscard({
          position: "he",
          prompt: "是否弃置一张牌？",
          ai(card2) {
            const player2 = get.player();
            const equips = player2.getCards("e");
            if (equips.includes(card2) && get.equipValue(card2) < 0) {
              return 1;
            }
            return -1;
          }
        });
      }
    }
  },
  //ol族陆郁生
  shixi: {
    enable: ["chooseToUse"],
    filter(event, player) {
      if (player.countCards("he") == 0) {
        return false;
      }
      const note = player.getStorage("shixi_note", {});
      const list = Object.values(note);
      if (!list.length) {
        return false;
      }
      const leach = event.filterCard;
      if (typeof leach != "function") {
        return true;
      }
      return list.some((i) => {
        const card = get.autoViewAs({ name: i });
        return leach(card, player);
      });
    },
    mark: true,
    marktext: "昔",
    intro: {
      name: "拾昔",
      mark(dialog, storage, player) {
        const note = player.getStorage("shixi_note", {});
        for (let key in note) {
          dialog.addText(`${get.translation(key)}: ${get.translation(note[key])}`);
        }
      }
    },
    chooseButton: {
      dialog(event, player) {
        const note = player.getStorage("shixi_note");
        const list = Object.values(note);
        return ui.create.dialog([list, "vcard"]);
      },
      check(button) {
        const player = get.player();
        const name = button.link;
        const note = player.getStorage("shixi_note");
        let suit = "";
        for (let key in note) {
          if (note[key] == name) {
            suit = key;
          }
        }
        const num = player.countCards("he", (c) => get.suit(c, false) == suit);
        if (num > 1) {
          return -1;
        }
        return 1;
      },
      filter(button, player) {
        const name = button.link;
        const note = player.getStorage("shixi_note");
        let suit = "";
        for (let key in note) {
          if (note[key] == name) {
            suit = key;
          }
        }
        const num = player.countCards("he", (c) => get.suit(c, false) == suit);
        return num > 0;
      },
      backup(links, player) {
        return {
          selectCard: -1,
          filterCard: () => false,
          viewAs: {
            name: links[0][2]
          },
          async precontent(event, trigger, player2) {
            const note = player2.getStorage("shixi_note", {});
            const name = event.result.card.name;
            let suit = "";
            for (let key in note) {
              if (note[key] == name) {
                suit = key;
              }
            }
            const cards = player2.getCards("he", (c) => get.suit(c, false) == suit);
            await player2.loseToDiscardpile({
              cards
            });
          }
        };
      }
    },
    group: ["shixi_eff"],
    subSkill: {
      backup: {},
      eff: {
        trigger: {
          player: ["useCard"]
        },
        forced: true,
        filter(event, player) {
          const card = event.card;
          const suit = card.suit;
          if (!lib.suit.includes(suit)) {
            return false;
          }
          const note = player.getStorage("shixi_note", {});
          if (note[suit]) {
            return false;
          }
          const info = lib.card[card.name];
          return info && info.type == "trick" && !info.notarget && (info.singleCard || info.selectTarget == 1 || info.selectTarget == -1 && info.toself);
        },
        async content(event, trigger, player) {
          const card = trigger.card;
          const note = player.getStorage("shixi_note", {});
          const suit = card.suit;
          const name = card.name;
          note[suit] = name;
          player.setStorage("shixi_note", note);
        }
      }
    },
    ai: {
      order: 10,
      result: {
        player: 2
      }
    }
  },
  jianbai: {
    trigger: {
      player: ["useCardAfter"]
    },
    forced: true,
    filter(event, player) {
      const card = event.card;
      const type = get.type2(card, false);
      return !player.hasHistory("useCard", (evt) => evt != event && get.type2(evt.card, false) == type);
    },
    async content(event, trigger, player) {
      const {
        links: [suit]
      } = await player.chooseButton({
        createDialog: ["选择一种花色的牌保留，重铸其余牌", [lib.suit.map((i) => [i, get.translation(i)]), "tdnodes"]],
        ai: () => Math.random() - 0.5,
        forced: true
      }).forResult();
      const cards = player.getCards("he").filter((c) => get.suit(c) != suit && lib.filter.cardRecastable(c, player, player));
      const cards2 = player.getCards("he").filter((c) => !cards.includes(c));
      await player.recast(cards);
      const skill2 = "jianbai_eff";
      player.addTempSkill(skill2);
      for (let card of cards2) {
        let tag = card.gaintag?.find((tag2) => tag2.startsWith(skill2));
        if (tag) {
          player.removeGaintag(tag, [card]);
        }
        const num = tag ? parseInt(tag.slice(skill2.length)) + 1 : 1;
        const newTag = `${skill2}${num}`;
        game.addTempTag(newTag, `坚白+${num}`);
        player.addGaintag([card], newTag);
      }
    },
    subSkill: {
      eff: {
        trigger: {
          global: ["phaseEnd"]
        },
        charlotte: true,
        onremove(player, skill2) {
          let cards = player.getCards("he", (card) => card.gaintag?.some((tag) => tag.startsWith(skill2)));
          for (const card of cards) {
            let tag = card.gaintag?.find((tag2) => tag2.startsWith(skill2));
            player.removeGaintag(tag, [card]);
          }
        },
        async cost(event, trigger, player) {
          event.result = await player.chooseCardTarget({
            prompt: "交给一名其他角色一张牌并摸X张牌(X为此牌本回合被保留的次数）",
            filterTarget: lib.filter.notMe,
            forced: true,
            ai1(card) {
              const tag = card.gaintag?.find((tag2) => tag2.startsWith("jianbai_eff"));
              const value = 6 - get.value(card, player);
              if (tag) {
                const num = parseInt(tag.slice(skill.length));
                return value + num;
              }
              return value;
            },
            ai2(target) {
              const player2 = get.player();
              return get.attitude(player2, target);
            }
          });
        },
        async content(event, trigger, player) {
          console.log("hhhh");
          const {
            cards: [card],
            targets: [target]
          } = event;
          const tag = card.gaintag?.find((tag2) => tag2.startsWith("jianbai_eff"));
          let num = 0;
          if (tag) {
            num = parseInt(tag.slice(skill.length));
          }
          await player.give([card], target);
          if (num) {
            await player.draw({ num });
          }
        }
      }
    }
  },
  //ol孙寒华
  ol_dangmo: {
    trigger: {
      player: ["useCard"]
    },
    filter(event, player) {
      console.log(get.tag(event.card, "damage"), event.targets.length);
      return get.tag(event.card, "damage") > 0 && event.targets.length == 1;
    },
    forced: true,
    async content(event, trigger, player) {
      const {
        links: [link]
      } = await player.chooseButton({
        createDialog: [
          "选择一个效果执行",
          [
            [
              ["effect", "令此牌额外结算一次"],
              ["target", "令此牌目标数+1"]
            ],
            "textbutton"
          ]
        ],
        ai: () => Math.random() - 0.5,
        forced: true,
        filterButton(button) {
          const link2 = button.link;
          if (link2 == "target") {
            const player2 = get.player();
            const evt = get.event().ol_dangmo_evt;
            const card = evt.card;
            const targets = evt.targets;
            return game.hasPlayer((p) => !targets.includes(p) && player2.canUse(card, p, false, false));
          }
          return true;
        }
      }).set("ol_dangmo_evt", trigger).forResult();
      if (link == "effect") {
        trigger.effectCount++;
      } else {
        const { targets } = await player.chooseTarget({
          prompt: `为${get.translation(trigger.card)}选择一个额外目标`,
          filterTarget(card, player2, target) {
            const card2 = get.event().ol_dangmo_card;
            return player2.canUse(card2, target, false, false);
          },
          ai(target) {
            const card = get.event().ol_dangmo_card;
            const player2 = get.player();
            return get.effect(target, card, player2, player2);
          }
        }).set("ol_dangmo_card", trigger.card).forResult();
        if (targets?.length) {
          trigger.targets.add(targets[0]);
        }
      }
    }
  },
  ol_jihui: {
    trigger: {
      global: ["recoverAfter"]
    },
    forced: true,
    async content(event, trigger, player) {
      await player.draw({ num: 1 });
    },
    group: ["ol_jihui_tao"],
    subSkill: {
      noted: {
        charlotte: true
      },
      tao: {
        trigger: {
          player: ["loseAfter"],
          global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
        },
        filter(event, player) {
          if (player.hasSkill("ol_jihui_noted", null, false, false)) {
            return false;
          }
          const evt = event.getl(player);
          if (!evt.cards2.length) {
            return false;
          }
          const num = player.getRoundHistory("lose").reduce((num2, evt2) => num2 + evt2.cards.length, 0);
          return num > player.hp;
        },
        forced: true,
        async content(event, trigger, player) {
          player.addTempSkill("ol_jihui_noted", "roundStart");
          const cards = [];
          const card = get.cardPile((c) => c.name == "tao");
          if (card) {
            cards.push(card);
            await player.gain({
              cards,
              animate: "gain2"
            });
          }
        }
      }
    }
  },
  ol_xiaju: {
    trigger: {
      player: ["loseAfter"],
      global: ["equipAfter", "addJudgeAfter", "gainAfter", "loseAsyncAfter", "addToExpansionAfter"]
    },
    filter(event, player) {
      const evt = event.getl(player);
      if (!evt.cards2.length) {
        return false;
      }
      return !player.hasHistory("lose", (evt2) => evt2 != event);
    },
    forced: true,
    async content(event, trigger, player) {
      const suits = player.getCards("h").map((c) => get.suit(c, false)).unique();
      let suit = lib.suit.find((s) => !suits.includes(s));
      if (!suit) {
        suit = lib.suit.slice().randomGet();
      }
      const note = player.getStorage("olxiaju_note", false);
      const cards = [];
      const num = note ? 2 : 1;
      while (cards.length < num) {
        const card = get.cardPile((c) => c.suit == suit);
        if (card) {
          cards.push(card);
        } else {
          break;
        }
      }
      player.setStorage("olxiaju_all", false);
      if (cards.length) {
        await player.gain({
          cards,
          animate: "gain2"
        });
        const newSuits = player.getCards("h").map((c) => get.suit(c, false)).unique();
        if (suits.length == 3 && newSuits.length == 4) {
          player.setStorage("olxiaju_all", true);
        }
      }
    }
  },
  //雁翎耀光祝融
  ylyg_lieren: {
    trigger: {
      player: ["useCard"]
    },
    filter(event, player) {
      if (player.hasSkill("ylyg_lieren_noted", null, false, false)) {
        return false;
      }
      if (event.card.name != "sha" && event.targets.length != 1) {
        return false;
      }
      const target = event.targets[0];
      return player.canCompare(target);
    },
    check(event, player) {
      const target = event.targets[0];
      const att = get.attitude(player, target);
      if (att > 0) {
        return false;
      } else {
        const cards = player.getCards("h");
        if (cards.reduce((num, c) => num += get.value(c), 0) > get.value({ name: "nanman" })) {
          return true;
        } else if (get.max(cards.map((c) => get.number(c))) < 3 && target.countCards("h") > 2) {
          return true;
        }
        return false;
      }
    },
    prompt2: "当你每回合首次使用【杀】指定唯一目标后，你可与其拼点，赢的角色于此【杀】结算后将所有手牌当做【南蛮入侵】使用。",
    async content(event, trigger, player) {
      player.addTempSkill("ylyg_lieren_noted");
      const target = trigger.targets[0];
      const result = await player.chooseToCompare(target, (card) => {
        const number = get.number(card);
        if (typeof number == "number") {
          return -number;
        } else {
          return 1;
        }
      }).forResult();
      if (result.winner) {
        const winner = result.winner;
        winner.addSkill("ylyg_lieren_eff");
        const list = winner.getStorage("ylyg_lieren_eff");
        list.add(trigger.card);
        winner.setStorage("ylyg_lieren_eff", list);
      }
    },
    subSkill: {
      eff: {
        trigger: {
          global: ["useCardAfter"]
        },
        filter(event, player) {
          const list = player.getStorage("ylyg_lieren_eff");
          return list.includes(event.card);
        },
        async content(event, trigger, player) {
          const list = player.getStorage("ylyg_lieren_eff");
          list.remove(trigger.card);
          player.setStorage("ylyg_lieren_eff", list);
          const cards = player.getCards("h", (c) => lib.filter.cardUsable(c, player));
          if (cards.length) {
            const card = get.autoViewAs({ name: "nanman", isCard: false }, cards);
            await player.chooseUseTarget({
              card
            });
          }
        }
      }
    }
  },
  ylyg_juxiang: {
    trigger: {
      global: ["useCard2"]
    },
    direct: true,
    filter(event, player) {
      return event.card.name == "nanman";
    },
    async content(event, trigger, player) {
      if (trigger.player == player) {
        for (let target of trigger.targets) {
          const id = target.playerid;
          const map = trigger.customArgs;
          if (!map[id]) {
            map[id] = {};
          }
          if (typeof map[id].extraDamage != "number") {
            map[id].extraDamage = 0;
          }
          map[id].extraDamage++;
        }
      } else {
        trigger.targets.remove(player);
        trigger.excluded.add(player);
        const list = player.getStorage("ylyg_juxiang_note");
        list.add(trigger.card);
        player.setStorage("ylyg_juxiang_note", list);
        player.addTempSkill("ylyg_juxiang_eff");
      }
    },
    subSkill: {
      eff: {
        trigger: {
          global: ["useCardAfter"]
        },
        filter(event, player) {
          const list = player.getStorage("ylyg_juxiang_note");
          return list.includes(event.card);
        },
        async content(event, trigger, player) {
          const card = trigger.card;
          const list = player.getStorage("ylyg_juxiang_note");
          list.remove(card);
          player.setStorage("ylyg_juxiang_note", list);
          const cards = card.cards.filterInD("o").concat(card.cards.filterInD("d"));
          if (cards.length) {
            await player.gain({
              cards,
              animate: "gain2"
            });
          }
        }
      }
    }
  },
  //雁翎耀光徐晃
  ylyg_duanliang: {
    enable: "chooseToUse",
    filterCard(card) {
      if (get.type2(card, false) == "trick") {
        return false;
      }
      return get.color(card) == "black";
    },
    filter(event, player) {
      return player.countCards("hes", (c) => get.type2(c, false) != "trick") > 0;
    },
    position: "hes",
    viewAs: {
      name: "bingliang",
      storage: {
        ylyg_duanliang: true
      }
    },
    prompt: "将一张黑色非欧锦囊牌当兵粮寸断使用",
    check(card) {
      return 6 - get.value(card);
    },
    locked: false,
    mod: {
      targetInRange(card, player, target) {
        if (card.storage.ylyg_duanliang) {
          return true;
        }
      }
    },
    async precontent(event, trigger, player) {
      const target = event.result.targets[0];
      const num = target.countCards("h");
      const num2 = player.countCards("h");
      if (num > num2) {
        await player.draw({ num: 1 });
      }
    },
    ai: {
      order: 8,
      result: {
        player(player, target, card) {
          const num = target.countCards("h");
          const num2 = player.countCards("h");
          if (num > num2) {
            return 1;
          }
        }
      }
    }
  },
  ylyg_zier: {
    trigger: {
      global: ["phaseBefore"]
    },
    round: 1,
    filter(event, player) {
      const list = player.getStorage("ylyg_zier_note");
      return list.length > 0;
    },
    async cost(event, trigger, player) {
      const phaseList = trigger.phaseList || lib.phaseName;
      const phases = phaseList.map((p, i) => [`${p}${i}0`, get.translation(p)]);
      const list = player.getStorage("ylyg_zier_note").map((p) => [`${p}1`, get.translation(p)]);
      const { bool, links } = await player.chooseButton({
        selectButton: 2,
        createDialog: ["将其本回合的一个阶段改为你记录的阶段", [phases, "tdnodes"], [list, "tdnodes"]],
        filterButton(button) {
          return button.link.at(-1) == ui.selected.buttons.length;
        }
      }).forResult();
      event.result = {
        bool,
        cost_data: {
          links
        }
      };
    },
    async content(event, trigger, player) {
      const { links } = event.cost_data;
      const index = links[0].at(-2);
      const phase = links[1].slice(0, -1);
      const phaseList = trigger.phaseList || lib.phaseName;
      phaseList[index] = phase;
      trigger.set("phaseList", phaseList);
    },
    group: ["ylyg_zier_note"],
    subSkill: {
      note: {
        trigger: {
          global: ["phaseAnySkipped", "phaseAnyCancelled"]
        },
        filter(event, player) {
          const list = player.getStorage("ylyg_zier_note");
          return !list.includes(event.name);
        },
        forced: true,
        async content(event, trigger, player) {
          const list = player.getStorage("ylyg_zier_note");
          list.add(trigger.name);
          player.setStorage("ylyg_zier_note", list);
        }
      }
    }
  }
};
export {
  skill
};
