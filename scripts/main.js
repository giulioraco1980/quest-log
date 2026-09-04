import { QuestLog } from "./quest-log.js";


const MODULE_ID = "quest-log";
const SOCKET_NAME = `module.${MODULE_ID}`;


/*
 * Recupera oppure crea l'applicazione
 * Registro Missioni.
 */
function getQuestLog() {

  if (!window.questLog) {
    window.questLog = new QuestLog();
  }

  return window.questLog;

}


/*
 * Apre il Registro Missioni.
 */
function openQuestLog() {

  const questLog =
    getQuestLog();


  if (!questLog.rendered) {

    questLog.render({
      force: true
    });

  }

  else {

    questLog.bringToFront();

  }

}


/*
 * Apre o chiude il Registro Missioni.
 */
function toggleQuestLog() {

  const questLog =
    getQuestLog();


  if (questLog.rendered) {

    questLog.close();

  }

  else {

    questLog.render({
      force: true
    });

  }

}


/*
 * Creazione rapida di una
 * missione principale.
 */
function createMainQuest() {

  if (!game.user.isGM) {
    return;
  }


  const questLog =
    getQuestLog();


  questLog.createQuest(
    "main"
  );

}


/*
 * Creazione rapida di una
 * missione secondaria.
 */
function createSecondaryQuest() {

  if (!game.user.isGM) {
    return;
  }


  const questLog =
    getQuestLog();


  questLog.createQuest(
    "secondary"
  );

}


/*
 * Riceve le notifiche inviate
 * dal GM attraverso il socket
 * del modulo.
 */
function activateQuestSocket() {

  game.socket.on(
    SOCKET_NAME,
    data => {

      if (!data) {
        return;
      }


      if (
        data.type !==
        "quest-notification"
      ) {
        return;
      }


      if (game.user.isGM) {
        return;
      }


      if (
        !Array.isArray(
          data.recipients
        )
      ) {
        return;
      }


      if (
        !data.recipients.includes(
          game.user.id
        )
      ) {
        return;
      }


      const message =
        data.message ?? "";


      if (!message) {
        return;
      }


      if (data.level === "warn") {

        ui.notifications.warn(
          message
        );

      }

      else if (
        data.level === "error"
      ) {

        ui.notifications.error(
          message
        );

      }

      else {

        ui.notifications.info(
          message
        );

      }


      if (
        window.questLog?.rendered
      ) {

        window.questLog.render(
          true
        );

      }

    }
  );

}


Hooks.once(
  "init",
  () => {

    game.settings.register(
      MODULE_ID,
      "quests",
      {
        name:
          "QUESTLOG.Settings.Quests",

        scope:
          "world",

        config:
          false,

        type:
          Array,

        default:
          [],

        onChange:
          () => {

            if (
              window.questLog?.rendered
            ) {

              window.questLog.render(
                true
              );

            }

          }
      }
    );


    game.keybindings.register(
      MODULE_ID,
      "openQuestLog",
      {
        name:
          "QUESTLOG.Keybindings.Open.Name",

        hint:
          "QUESTLOG.Keybindings.Open.Hint",

        editable: [
          {
            key:
              "KeyQ",

            modifiers: [
              "Control",
              "Shift"
            ]
          }
        ],

        onDown:
          () => {

            openQuestLog();

            return true;

          },

        restricted:
          false
      }
    );


    game.keybindings.register(
      MODULE_ID,
      "createMainQuest",
      {
        name:
          "QUESTLOG.Keybindings.NewMain.Name",

        hint:
          "QUESTLOG.Keybindings.NewMain.Hint",

        editable: [
          {
            key:
              "KeyM",

            modifiers: [
              "Control",
              "Shift"
            ]
          }
        ],

        onDown:
          () => {

            if (!game.user.isGM) {
              return false;
            }


            createMainQuest();

            return true;

          },

        restricted:
          true
      }
    );


    game.keybindings.register(
      MODULE_ID,
      "createSecondaryQuest",
      {
        name:
          "QUESTLOG.Keybindings.NewSecondary.Name",

        hint:
          "QUESTLOG.Keybindings.NewSecondary.Hint",

        editable: [
          {
            key:
              "KeyS",

            modifiers: [
              "Control",
              "Shift"
            ]
          }
        ],

        onDown:
          () => {

            if (!game.user.isGM) {
              return false;
            }


            createSecondaryQuest();

            return true;

          },

        restricted:
          true
      }
    );


    console.log(
      "Quest Log | Init"
    );

  }
);


Hooks.once(
  "ready",
  () => {

    window.questLog =
      new QuestLog();


    activateQuestSocket();


    console.log(
      "Quest Log | Ready"
    );

  }
);


Hooks.on(
  "getSceneControlButtons",
  controls => {

    controls.questLog = {

      name:
        "questLog",

      title:
        game.i18n.localize(
          "QUESTLOG.SceneControls.Group"
        ),

      icon:
        "fa-solid fa-scroll",

      order:
        80,

      visible:
        true,


      tools: {

        openQuestLog: {

          name:
            "openQuestLog",

          title:
            game.i18n.localize(
              "QUESTLOG.SceneControls.Open"
            ),

          icon:
            "fa-solid fa-book-open",

          order:
            0,

          button:
            true,

          visible:
            true,

          onChange:
            () => {

              toggleQuestLog();

            }

        },


        newMainQuest: {

          name:
            "newMainQuest",

          title:
            game.i18n.localize(
              "QUESTLOG.SceneControls.NewMain"
            ),

          icon:
            "fa-solid fa-star",

          order:
            1,

          button:
            true,

          visible:
            game.user.isGM,

          onChange:
            () => {

              createMainQuest();

            }

        },


        newSecondaryQuest: {

          name:
            "newSecondaryQuest",

          title:
            game.i18n.localize(
              "QUESTLOG.SceneControls.NewSecondary"
            ),

          icon:
            "fa-regular fa-star",

          order:
            2,

          button:
            true,

          visible:
            game.user.isGM,

          onChange:
            () => {

              createSecondaryQuest();

            }

        }

      }

    };

  }
);