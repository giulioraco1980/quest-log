const {
  ApplicationV2,
  HandlebarsApplicationMixin,
  DialogV2
} = foundry.applications.api;

const MODULE_ID = "quest-log";
const SOCKET_NAME = `module.${MODULE_ID}`;


export class QuestLog extends HandlebarsApplicationMixin(ApplicationV2) {

  _selectedTab = "main";
  _selectedQuestId = null;
  _collapsedQuest = false;
  _selectedDetailTab = "details";


  static DEFAULT_OPTIONS = {
    id: "quest-log-window",

    classes: [
      "quest-log-app",
      "theme-dark"
    ],

    window: {
      title: "QUESTLOG.Title",
      resizable: true
    },

    position: {
      width: 1180,
      height: 760
    }
  };


  static PARTS = {
    content: {
      template:
        "modules/quest-log/templates/quest-log.hbs"
    }
  };


  localize(key) {
    return game.i18n.localize(key);
  }


  format(key, data = {}) {
    return game.i18n.format(
      key,
      data
    );
  }


  getQuests() {

    const quests =
      foundry.utils.deepClone(
        game.settings.get(
          MODULE_ID,
          "quests"
        )
      );


    for (
      let i = 0;
      i < quests.length;
      i++
    ) {

      const quest =
        quests[i];


      if (
        !Array.isArray(
          quest.steps
        )
      ) {

        quest.steps = [];

      }


      for (
        const step
        of quest.steps
      ) {

        if (
          typeof step.completed !==
          "boolean"
        ) {

          step.completed = false;

        }


        if (
          typeof step.secret !==
          "boolean"
        ) {

          step.secret = false;

        }


        step.isSecret =
          step.secret === true;

      }


      if (
        !Array.isArray(
          quest.visibleTo
        )
      ) {

        quest.visibleTo = [];

      }


      if (
        typeof quest.image !==
        "string"
      ) {

        quest.image = "";

      }


      delete quest.gmNotes;
      delete quest.hasGMNotes;

      delete quest.progressTotal;
      delete quest.progressDone;
      delete quest.progressPercent;
      delete quest.hasSteps;


      if (!quest.status) {

        quest.status =
          quest.completed === true
            ? "completed"
            : "active";

      }


      quest.completed =
        quest.status ===
        "completed";


      if (
        typeof quest.revealed !==
        "boolean"
      ) {

        quest.revealed = true;

      }


      if (
        typeof quest.order !==
          "number" ||
        Number.isNaN(
          quest.order
        )
      ) {

        quest.order = i;

      }


      quest.isMain =
        quest.type === "main";

      quest.isSecondary =
        quest.type ===
        "secondary";

      quest.isActive =
        quest.status ===
        "active";

      quest.isCompleted =
        quest.status ===
        "completed";

      quest.isFailed =
        quest.status ===
        "failed";

      quest.isArchived =
        quest.status ===
        "archived";

      quest.isHidden =
        quest.revealed === false;

      quest.isRevealed =
        quest.revealed === true;


      quest.typeLabel =
        quest.type === "secondary"
          ? this.localize(
              "QUESTLOG.Types.Secondary"
            )
          : this.localize(
              "QUESTLOG.Types.Main"
            );


      if (
        quest.status === "active"
      ) {

        quest.statusLabel =
          this.localize(
            "QUESTLOG.Status.Active"
          );

        quest.statusClass =
          "status-active";

      }

      else if (
        quest.status === "completed"
      ) {

        quest.statusLabel =
          this.localize(
            "QUESTLOG.Status.Completed"
          );

        quest.statusClass =
          "status-completed";

      }

      else if (
        quest.status === "failed"
      ) {

        quest.statusLabel =
          this.localize(
            "QUESTLOG.Status.Failed"
          );

        quest.statusClass =
          "status-failed";

      }

      else {

        quest.statusLabel =
          this.localize(
            "QUESTLOG.Status.Archived"
          );

        quest.statusClass =
          "status-archived";

      }


      if (
        quest.status === "archived"
      ) {

        if (
          quest.archivedFrom !==
            "completed" &&
          quest.archivedFrom !==
            "failed"
        ) {

          quest.archivedFrom =
            "completed";

        }


        quest.archiveStatusLabel =
          quest.archivedFrom ===
          "failed"
            ? this.localize(
                "QUESTLOG.Status.Failed"
              )
            : this.localize(
                "QUESTLOG.Status.Completed"
              );


        quest.archiveStatusClass =
          quest.archivedFrom ===
          "failed"
            ? "archive-failed"
            : "archive-completed";

      }

    }


    return quests;

  }


  prepareQuestForDisplay(
    quest
  ) {

    const displayQuest =
      foundry.utils.deepClone(
        quest
      );


    if (!game.user.isGM) {

      displayQuest.steps =
        displayQuest.steps.filter(
          step =>
            !step.secret
        );

    }


    displayQuest.visibleStepCount =
      displayQuest.steps.length;


    displayQuest.completedStepCount =
      displayQuest.steps.filter(
        step =>
          step.completed
      ).length;


    return displayQuest;

  }


  sortQuests(quests) {

    return quests.sort(
      (a, b) =>
        (a.order ?? 0) -
        (b.order ?? 0)
    );

  }


  async saveQuests(quests) {

    for (
      const quest
      of quests
    ) {

      delete quest.gmNotes;
      delete quest.hasGMNotes;

      delete quest.progressTotal;
      delete quest.progressDone;
      delete quest.progressPercent;
      delete quest.hasSteps;

      delete quest.isMain;
      delete quest.isSecondary;
      delete quest.isActive;
      delete quest.isCompleted;
      delete quest.isFailed;
      delete quest.isArchived;
      delete quest.isHidden;
      delete quest.isRevealed;

      delete quest.typeLabel;
      delete quest.statusLabel;
      delete quest.statusClass;

      delete quest.archiveStatusLabel;
      delete quest.archiveStatusClass;

      delete quest.visibleStepCount;
      delete quest.completedStepCount;
      delete quest.visibilityLabel;


      for (
        const step
        of quest.steps ?? []
      ) {

        delete step.isSecret;

      }

    }


    await game.settings.set(
      MODULE_ID,
      "quests",
      quests
    );

  }


  getPlayers() {

    return game.users.filter(
      user =>
        !user.isGM
    );

  }


  getQuestRecipientIds(
    quest
  ) {

    const players =
      this.getPlayers();


    if (
      !Array.isArray(
        quest.visibleTo
      ) ||
      quest.visibleTo.length === 0
    ) {

      return players.map(
        user =>
          user.id
      );

    }


    return players
      .filter(
        user =>
          quest.visibleTo.includes(
            user.id
          )
      )
      .map(
        user =>
          user.id
      );

  }


  getQuestVisibilityLabel(
    quest
  ) {

    if (
      !Array.isArray(
        quest.visibleTo
      ) ||
      quest.visibleTo.length === 0
    ) {

      return this.localize(
        "QUESTLOG.Visibility.AllPlayers"
      );

    }


    const names =
      quest.visibleTo
        .map(
          id =>
            game.users.get(id)?.name
        )
        .filter(Boolean);


    return names.length
      ? names.join(", ")
      : this.localize(
          "QUESTLOG.Visibility.SelectedPlayers"
        );

  }


  notifyPlayers(
    quest,
    message,
    level = "info"
  ) {

    if (!game.user.isGM) {
      return;
    }


    if (!quest.revealed) {
      return;
    }


    if (
      quest.status ===
      "archived"
    ) {
      return;
    }


    const recipients =
      this.getQuestRecipientIds(
        quest
      );


    if (
      recipients.length === 0
    ) {
      return;
    }


    game.socket.emit(
      SOCKET_NAME,
      {
        type:
          "quest-notification",

        recipients,

        message,

        level
      }
    );

  }


  getVisibilitySelector(
    selectedUsers = []
  ) {

    const players =
      this.getPlayers();


    if (!players.length) {

      return `
        <p>
          ${this.localize(
            "QUESTLOG.Visibility.AllPlayers"
          )}
        </p>
      `;

    }


    return players
      .map(
        user => {

          const checked =
            selectedUsers.includes(
              user.id
            )
              ? "checked"
              : "";


          const userName =
            foundry.utils.escapeHTML(
              user.name
            );


          const characterName =
            user.character?.name
              ? foundry.utils.escapeHTML(
                  user.character.name
                )
              : null;


          const label =
            characterName
              ? `${userName} — ${characterName}`
              : userName;


          return `
            <label
              class="quest-visibility-option"
            >

              <input
                type="checkbox"
                name="visibleTo"
                value="${user.id}"
                ${checked}
              >

              <span>
                ${label}
              </span>

            </label>
          `;

        }
      )
      .join("");

  }


  readVisibility(dialog) {

    return Array
      .from(
        dialog.element
          .querySelectorAll(
            'input[name="visibleTo"]:checked'
          )
      )
      .map(
        input =>
          input.value
      );

  }


  async _prepareContext(
    options
  ) {

    const context =
      await super._prepareContext(
        options
      );


    let quests =
      this.getQuests();


    if (!game.user.isGM) {

      quests =
        quests.filter(
          quest => {

            if (
              !quest.revealed
            ) {
              return false;
            }


            if (
              quest.visibleTo
                .length === 0
            ) {

              return true;

            }


            return quest.visibleTo
              .includes(
                game.user.id
              );

          }
        );

    }


    quests =
      quests.map(
        quest =>
          this.prepareQuestForDisplay(
            quest
          )
      );


    let tabQuests;


    if (
      this._selectedTab ===
      "archive"
    ) {

      tabQuests =
        quests.filter(
          quest =>
            quest.status ===
            "archived"
        );

    }

    else {

      tabQuests =
        quests.filter(
          quest =>
            quest.type ===
              this._selectedTab &&
            quest.status !==
              "archived"
        );

    }


    const activeQuests =
      this.sortQuests(
        tabQuests.filter(
          quest =>
            quest.status ===
            "active"
        )
      );


    const completedQuests =
      this.sortQuests(
        tabQuests.filter(
          quest =>
            quest.status ===
            "completed"
        )
      );


    const failedQuests =
      this.sortQuests(
        tabQuests.filter(
          quest =>
            quest.status ===
            "failed"
        )
      );


    const archivedQuests =
      this.sortQuests(
        tabQuests.filter(
          quest =>
            quest.status ===
            "archived"
        )
      );


    let selectedQuest =
      tabQuests.find(
        quest =>
          quest.id ===
          this._selectedQuestId
      );


    if (!selectedQuest) {

      selectedQuest =
        activeQuests[0] ??
        completedQuests[0] ??
        failedQuests[0] ??
        archivedQuests[0] ??
        null;


      this._selectedQuestId =
        selectedQuest?.id ??
        null;

    }


    if (selectedQuest) {

      selectedQuest =
        foundry.utils.deepClone(
          selectedQuest
        );


      selectedQuest.visibilityLabel =
        this.getQuestVisibilityLabel(
          selectedQuest
        );


      selectedQuest.isCollapsed =
        this._collapsedQuest;

    }


    return {
      ...context,

      isGM:
        game.user.isGM,

      selectedTab:
        this._selectedTab,

      isMainTab:
        this._selectedTab ===
        "main",

      isSecondaryTab:
        this._selectedTab ===
        "secondary",

      isArchiveTab:
        this._selectedTab ===
        "archive",

      detailTab:
        this._selectedDetailTab,

      isDetailsTab:
        this._selectedDetailTab ===
        "details",

      isStepsTab:
        this._selectedDetailTab ===
        "steps",

      isInfoTab:
        this._selectedDetailTab ===
        "info",

      activeQuests,
      completedQuests,
      failedQuests,
      archivedQuests,

      selectedQuest,

      hasSelectedQuest:
        !!selectedQuest
    };

  }


  _onRender(
    context,
    options
  ) {

    super._onRender(
      context,
      options
    );


    this.activateTabs();

    this.activateQuestSelection();

    this.activateSearch();

    this.activateCollapse();

    this.activateDetailTabs();


    if (!game.user.isGM) {
      return;
    }


    this.activateQuestActions();

    this.activateStepActions();

  }


  activateTabs() {

    const tabs =
      this.element.querySelectorAll(
        "[data-tab]"
      );


    for (
      const tab
      of tabs
    ) {

      tab.addEventListener(
        "click",
        () => {

          this._selectedTab =
            tab.dataset.tab;

          this._selectedQuestId =
            null;

          this._collapsedQuest =
            false;

          this._selectedDetailTab =
            "details";

          this.render(true);

        }
      );

    }

  }


  activateQuestSelection() {

    const buttons =
      this.element.querySelectorAll(
        "[data-select-quest]"
      );


    for (
      const button
      of buttons
    ) {

      button.addEventListener(
        "click",
        () => {

          this._selectedQuestId =
            button.dataset
              .selectQuest;

          this._collapsedQuest =
            false;

          this._selectedDetailTab =
            "details";

          this.render(true);

        }
      );

    }

  }


  activateSearch() {

    const input =
      this.element.querySelector(
        "[data-quest-search]"
      );


    if (!input) {
      return;
    }


    input.addEventListener(
      "input",
      () => {

        const value =
          input.value
            .trim()
            .toLowerCase();


        const cards =
          this.element
            .querySelectorAll(
              ".quest-list-card"
            );


        for (
          const card
          of cards
        ) {

          const searchText =
            (
              card.dataset
                .searchText ??
              ""
            )
              .toLowerCase();


          card.hidden =
            value &&
            !searchText.includes(
              value
            );

        }

      }
    );

  }


  activateCollapse() {

    const button =
      this.element.querySelector(
        '[data-action="toggle-detail-collapse"]'
      );


    if (!button) {
      return;
    }


    button.addEventListener(
      "click",
      () => {

        this._collapsedQuest =
          !this._collapsedQuest;


        const detail =
          this.element.querySelector(
            ".quest-detail"
          );


        detail?.classList.toggle(
          "is-collapsed",
          this._collapsedQuest
        );


        button.textContent =
          this._collapsedQuest
            ? "▾"
            : "▴";


        button.title =
          this._collapsedQuest
            ? this.localize(
                "QUESTLOG.Tooltips.Expand"
              )
            : this.localize(
                "QUESTLOG.Tooltips.Collapse"
              );

      }
    );

  }


  activateDetailTabs() {

    const buttons =
      this.element.querySelectorAll(
        "[data-detail-tab]"
      );


    for (
      const button
      of buttons
    ) {

      button.addEventListener(
        "click",
        () => {

          this._selectedDetailTab =
            button.dataset
              .detailTab;


          const allButtons =
            this.element
              .querySelectorAll(
                "[data-detail-tab]"
              );


          const panels =
            this.element
              .querySelectorAll(
                "[data-detail-panel]"
              );


          for (
            const tabButton
            of allButtons
          ) {

            tabButton.classList
              .toggle(
                "active",
                tabButton.dataset
                  .detailTab ===
                  this._selectedDetailTab
              );

          }


          for (
            const panel
            of panels
          ) {

            panel.hidden =
              panel.dataset
                .detailPanel !==
              this._selectedDetailTab;

          }

        }
      );

    }

  }


  activateQuestActions() {

    const buttons =
      this.element.querySelectorAll(
        "[data-action]"
      );


    for (
      const button
      of buttons
    ) {

      const action =
        button.dataset.action;


      if (
        action ===
        "new-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.createQuest(
              this._selectedTab ===
                "secondary"
                ? "secondary"
                : "main"
            )
        );

      }


      if (
        action ===
        "complete-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.completeQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "fail-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.failQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "restore-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.restoreQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "edit-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.editQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "delete-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.deleteQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "reveal-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.revealQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "hide-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.hideQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "archive-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.archiveQuest(
              button.dataset
                .questId
            )
        );

      }


      if (
        action ===
        "restore-archived-quest"
      ) {

        button.addEventListener(
          "click",
          () =>
            this.restoreArchivedQuest(
              button.dataset
                .questId
            )
        );

      }

    }

  }


  activateStepActions() {

    const actions = {

      "add-step":
        button =>
          this.addStep(
            button.dataset
              .questId
          ),

      "toggle-step":
        button =>
          this.toggleStep(
            button.dataset
              .questId,
            button.dataset
              .stepId
          ),

      "edit-step":
        button =>
          this.editStep(
            button.dataset
              .questId,
            button.dataset
              .stepId
          ),

      "delete-step":
        button =>
          this.deleteStep(
            button.dataset
              .questId,
            button.dataset
              .stepId
          ),

      "reveal-step":
        button =>
          this.revealStep(
            button.dataset
              .questId,
            button.dataset
              .stepId
          ),

      "hide-step":
        button =>
          this.hideStep(
            button.dataset
              .questId,
            button.dataset
              .stepId
          )

    };


    for (
      const [
        action,
        callback
      ]
      of Object.entries(
        actions
      )
    ) {

      const buttons =
        this.element
          .querySelectorAll(
            `[data-action="${action}"]`
          );


      for (
        const button
        of buttons
      ) {

        button.addEventListener(
          "click",
          () =>
            callback(button)
        );

      }

    }

  }


  async archiveQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    if (
      quest.status !==
        "completed" &&
      quest.status !==
        "failed"
    ) {

      return;

    }


    const confirmed =
      await DialogV2.confirm({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.ArchiveQuest"
            )
        },

        content: `
          <p>
            ${this.format(
              "QUESTLOG.Confirm.Archive",
              {
                title:
                  foundry.utils.escapeHTML(
                    quest.title
                  )
              }
            )}
          </p>
        `,

        yes: {
          label:
            this.localize(
              "QUESTLOG.Actions.Archive"
            )
        },

        no: {
          label:
            this.localize(
              "QUESTLOG.Actions.Cancel"
            )
        }

      });


    if (!confirmed) {
      return;
    }


    quest.archivedFrom =
      quest.status;

    quest.status =
      "archived";

    quest.completed =
      false;


    this.moveQuestToEndOfStatus(
      quests,
      quest
    );


    await this.saveQuests(
      quests
    );


    this._selectedQuestId =
      null;

    this._selectedDetailTab =
      "details";


    this.render(true);

  }


  async restoreArchivedQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (
      !quest ||
      quest.status !==
        "archived"
    ) {

      return;

    }


    const restoredStatus =
      quest.archivedFrom ===
      "failed"
        ? "failed"
        : "completed";


    quest.status =
      restoredStatus;

    quest.completed =
      restoredStatus ===
      "completed";


    delete quest.archivedFrom;


    this.moveQuestToEndOfStatus(
      quests,
      quest
    );


    await this.saveQuests(
      quests
    );


    this._selectedQuestId =
      null;

    this._selectedDetailTab =
      "details";


    this.render(true);

  }


  async revealQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.revealed =
      true;


    await this.saveQuests(
      quests
    );


    this.notifyPlayers(
      quest,
      this.format(
        "QUESTLOG.Notifications.RevealedQuest",
        {
          title:
            quest.title
        }
      )
    );


    this.render(true);

  }


  async hideQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.revealed =
      false;


    await this.saveQuests(
      quests
    );


    this.render(true);

  }


  async revealStep(
    questId,
    stepId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    const step =
      quest?.steps.find(
        step =>
          step.id ===
          stepId
      );


    if (
      !quest ||
      !step
    ) {
      return;
    }


    step.secret =
      false;


    await this.saveQuests(
      quests
    );


    this.notifyPlayers(
      quest,
      this.format(
        "QUESTLOG.Notifications.NewObjective",
        {
          title:
            step.title
        }
      )
    );


    this.render(true);

  }


  async hideStep(
    questId,
    stepId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    const step =
      quest?.steps.find(
        step =>
          step.id ===
          stepId
      );


    if (
      !quest ||
      !step
    ) {
      return;
    }


    step.secret =
      true;


    await this.saveQuests(
      quests
    );


    this.render(true);

  }


  async createQuest(
    defaultType = "main"
  ) {

    if (!game.user.isGM) {
      return;
    }


    const selectedType =
      defaultType ===
      "secondary"
        ? "secondary"
        : "main";


    const visibilityHTML =
      this.getVisibilitySelector();


    const result =
      await DialogV2.wait({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.NewQuest"
            )
        },

        content: `
          <div class="quest-create-form">

            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Title"
                )}
              </label>

              <input
                type="text"
                name="title"
              >

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Description"
                )}
              </label>

              <textarea
                name="description"
                rows="5"
              ></textarea>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Image"
                )}
              </label>

              <file-picker
                name="image"
                type="image"
              ></file-picker>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Type"
                )}
              </label>

              <select
                name="type"
              >

                <option
                  value="main"
                  ${
                    selectedType ===
                    "main"
                      ? "selected"
                      : ""
                  }
                >
                  ${this.localize(
                    "QUESTLOG.Types.Main"
                  )}
                </option>

                <option
                  value="secondary"
                  ${
                    selectedType ===
                    "secondary"
                      ? "selected"
                      : ""
                  }
                >
                  ${this.localize(
                    "QUESTLOG.Types.Secondary"
                  )}
                </option>

              </select>

            </div>


            <div class="form-group">

              <label
                class="quest-hidden-option"
              >

                <input
                  type="checkbox"
                  name="hiddenQuest"
                >

                <span>
                  🙈
                  ${this.localize(
                    "QUESTLOG.Quest.HiddenOption"
                  )}
                </span>

              </label>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.AuthorizedPlayers"
                )}
              </label>

              <div
                class="quest-visibility-list"
              >
                ${visibilityHTML}
              </div>

            </div>

          </div>
        `,

        buttons: [

          {
            action:
              "cancel",

            label:
              this.localize(
                "QUESTLOG.Actions.Cancel"
              )
          },

          {
            action:
              "create",

            label:
              this.localize(
                "QUESTLOG.Actions.Create"
              ),

            default:
              true,

            callback: (
              event,
              button,
              dialog
            ) => {

              const root =
                dialog.element;


              return {

                title:
                  root.querySelector(
                    '[name="title"]'
                  )?.value ??
                  "",

                description:
                  root.querySelector(
                    '[name="description"]'
                  )?.value ??
                  "",

                image:
                  root.querySelector(
                    'file-picker[name="image"]'
                  )?.value ??
                  "",

                type:
                  root.querySelector(
                    '[name="type"]'
                  )?.value ??
                  selectedType,

                hidden:
                  root.querySelector(
                    '[name="hiddenQuest"]'
                  )?.checked ??
                  false,

                visibleTo:
                  this.readVisibility(
                    dialog
                  )

              };

            }

          }

        ]

      });


    if (
      !result ||
      !result.title.trim()
    ) {
      return;
    }


    const quests =
      this.getQuests();


    const newQuest = {

      id:
        foundry.utils.randomID(),

      title:
        result.title.trim(),

      description:
        result.description.trim(),

      image:
        result.image?.trim() ??
        "",

      type:
        result.type,

      status:
        "active",

      completed:
        false,

      revealed:
        !result.hidden,

      order:
        Date.now(),

      steps:
        [],

      visibleTo:
        result.visibleTo

    };


    quests.push(
      newQuest
    );


    await this.saveQuests(
      quests
    );


    this._selectedTab =
      newQuest.type;

    this._selectedQuestId =
      newQuest.id;

    this._selectedDetailTab =
      "details";


    this.notifyPlayers(
      newQuest,
      this.format(
        "QUESTLOG.Notifications.NewQuest",
        {
          title:
            newQuest.title
        }
      )
    );


    this.render(true);

  }


  async completeQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.status =
      "completed";

    quest.completed =
      true;


    for (
      const step
      of quest.steps
    ) {

      step.completed =
        true;

    }


    this.moveQuestToEndOfStatus(
      quests,
      quest
    );


    await this.saveQuests(
      quests
    );


    this.notifyPlayers(
      quest,
      this.format(
        "QUESTLOG.Notifications.CompletedQuest",
        {
          title:
            quest.title
        }
      )
    );


    this.render(true);

  }


  async failQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.status =
      "failed";

    quest.completed =
      false;


    this.moveQuestToEndOfStatus(
      quests,
      quest
    );


    await this.saveQuests(
      quests
    );


    this.notifyPlayers(
      quest,
      this.format(
        "QUESTLOG.Notifications.FailedQuest",
        {
          title:
            quest.title
        }
      ),
      "warn"
    );


    this.render(true);

  }


  async restoreQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.status =
      "active";

    quest.completed =
      false;


    this.moveQuestToEndOfStatus(
      quests,
      quest
    );


    await this.saveQuests(
      quests
    );


    this.render(true);

  }


  moveQuestToEndOfStatus(
    quests,
    quest
  ) {

    const sameGroup =
      quests.filter(
        item =>
          item.id !==
            quest.id &&
          item.type ===
            quest.type &&
          item.status ===
            quest.status
      );


    const maxOrder =
      sameGroup.length
        ? Math.max(
            ...sameGroup.map(
              item =>
                item.order ??
                0
            )
          )
        : 0;


    quest.order =
      maxOrder + 10;

  }


  async addStep(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    const result =
      await DialogV2.wait({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.NewStep"
            )
        },

        content: `
          <div class="quest-create-form">

            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.StepName"
                )}
              </label>

              <input
                type="text"
                name="stepTitle"
              >

            </div>


            <div class="form-group">

              <label
                class="quest-hidden-option"
              >

                <input
                  type="checkbox"
                  name="secretStep"
                >

                <span>
                  🔒
                  ${this.localize(
                    "QUESTLOG.Steps.SecretOption"
                  )}
                </span>

              </label>

            </div>

          </div>
        `,

        buttons: [

          {
            action:
              "cancel",

            label:
              this.localize(
                "QUESTLOG.Actions.Cancel"
              )
          },

          {
            action:
              "create",

            label:
              this.localize(
                "QUESTLOG.Actions.AddStep"
              ),

            default:
              true,

            callback: (
              event,
              button,
              dialog
            ) => {

              const root =
                dialog.element;


              return {

                title:
                  root.querySelector(
                    '[name="stepTitle"]'
                  )?.value ??
                  "",

                secret:
                  root.querySelector(
                    '[name="secretStep"]'
                  )?.checked ??
                  false

              };

            }

          }

        ]

      });


    if (
      !result ||
      !result.title.trim()
    ) {
      return;
    }


    const newStep = {

      id:
        foundry.utils.randomID(),

      title:
        result.title.trim(),

      completed:
        false,

      secret:
        result.secret

    };


    quest.steps.push(
      newStep
    );


    await this.saveQuests(
      quests
    );


    if (
      !newStep.secret
    ) {

      this.notifyPlayers(
        quest,
        this.format(
          "QUESTLOG.Notifications.NewObjective",
          {
            title:
              newStep.title
          }
        )
      );

    }


    this.render(true);

  }


  async toggleStep(
    questId,
    stepId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    const step =
      quest?.steps.find(
        step =>
          step.id ===
          stepId
      );


    if (
      !quest ||
      !step
    ) {
      return;
    }


    step.completed =
      !step.completed;


    await this.saveQuests(
      quests
    );


    if (
      step.completed &&
      !step.secret
    ) {

      this.notifyPlayers(
        quest,
        this.format(
          "QUESTLOG.Notifications.CompletedObjective",
          {
            title:
              step.title
          }
        )
      );

    }


    this.render(true);

  }


  async editStep(
    questId,
    stepId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    const step =
      quest?.steps.find(
        step =>
          step.id ===
          stepId
      );


    if (
      !quest ||
      !step
    ) {
      return;
    }


    const result =
      await DialogV2.wait({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.EditStep"
            )
        },

        content: `
          <div class="quest-create-form">

            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.StepName"
                )}
              </label>

              <input
                type="text"
                name="stepTitle"
                value="${foundry.utils.escapeHTML(
                  step.title
                )}"
              >

            </div>


            <div class="form-group">

              <label
                class="quest-hidden-option"
              >

                <input
                  type="checkbox"
                  name="secretStep"
                  ${
                    step.secret
                      ? "checked"
                      : ""
                  }
                >

                <span>
                  🔒
                  ${this.localize(
                    "QUESTLOG.Steps.SecretOption"
                  )}
                </span>

              </label>

            </div>

          </div>
        `,

        buttons: [

          {
            action:
              "cancel",

            label:
              this.localize(
                "QUESTLOG.Actions.Cancel"
              )
          },

          {
            action:
              "save",

            label:
              this.localize(
                "QUESTLOG.Actions.Save"
              ),

            default:
              true,

            callback: (
              event,
              button,
              dialog
            ) => {

              const root =
                dialog.element;


              return {

                title:
                  root.querySelector(
                    '[name="stepTitle"]'
                  )?.value ??
                  "",

                secret:
                  root.querySelector(
                    '[name="secretStep"]'
                  )?.checked ??
                  false

              };

            }

          }

        ]

      });


    if (
      !result ||
      !result.title.trim()
    ) {
      return;
    }


    const wasSecret =
      step.secret;


    step.title =
      result.title.trim();

    step.secret =
      result.secret;


    await this.saveQuests(
      quests
    );


    if (
      wasSecret &&
      !step.secret
    ) {

      this.notifyPlayers(
        quest,
        this.format(
          "QUESTLOG.Notifications.NewObjective",
          {
            title:
              step.title
          }
        )
      );

    }


    this.render(true);

  }


  async deleteStep(
    questId,
    stepId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    quest.steps =
      quest.steps.filter(
        step =>
          step.id !==
          stepId
      );


    await this.saveQuests(
      quests
    );


    this.render(true);

  }


  async editQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    const oldType =
      quest.type;

    const wasHidden =
      !quest.revealed;


    const visibilityHTML =
      this.getVisibilitySelector(
        quest.visibleTo
      );


    const result =
      await DialogV2.wait({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.EditQuest"
            )
        },

        content: `
          <div class="quest-create-form">

            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Title"
                )}
              </label>

              <input
                type="text"
                name="title"
                value="${foundry.utils.escapeHTML(
                  quest.title
                )}"
              >

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Description"
                )}
              </label>

              <textarea
                name="description"
                rows="5"
              >${foundry.utils.escapeHTML(
                quest.description
              )}</textarea>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Image"
                )}
              </label>

              <file-picker
                name="image"
                type="image"
                value="${foundry.utils.escapeHTML(
                  quest.image ??
                  ""
                )}"
              ></file-picker>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.Type"
                )}
              </label>

              <select
                name="type"
              >

                <option
                  value="main"
                  ${
                    quest.type ===
                    "main"
                      ? "selected"
                      : ""
                  }
                >
                  ${this.localize(
                    "QUESTLOG.Types.Main"
                  )}
                </option>

                <option
                  value="secondary"
                  ${
                    quest.type ===
                    "secondary"
                      ? "selected"
                      : ""
                  }
                >
                  ${this.localize(
                    "QUESTLOG.Types.Secondary"
                  )}
                </option>

              </select>

            </div>


            <div class="form-group">

              <label
                class="quest-hidden-option"
              >

                <input
                  type="checkbox"
                  name="hiddenQuest"
                  ${
                    quest.revealed
                      ? ""
                      : "checked"
                  }
                >

                <span>
                  🙈
                  ${this.localize(
                    "QUESTLOG.Quest.HiddenOption"
                  )}
                </span>

              </label>

            </div>


            <div class="form-group">

              <label>
                ${this.localize(
                  "QUESTLOG.Fields.AuthorizedPlayers"
                )}
              </label>

              <div
                class="quest-visibility-list"
              >
                ${visibilityHTML}
              </div>

            </div>

          </div>
        `,

        buttons: [

          {
            action:
              "cancel",

            label:
              this.localize(
                "QUESTLOG.Actions.Cancel"
              )
          },

          {
            action:
              "save",

            label:
              this.localize(
                "QUESTLOG.Actions.Save"
              ),

            default:
              true,

            callback: (
              event,
              button,
              dialog
            ) => {

              const root =
                dialog.element;


              return {

                title:
                  root.querySelector(
                    '[name="title"]'
                  )?.value ??
                  "",

                description:
                  root.querySelector(
                    '[name="description"]'
                  )?.value ??
                  "",

                image:
                  root.querySelector(
                    'file-picker[name="image"]'
                  )?.value ??
                  "",

                type:
                  root.querySelector(
                    '[name="type"]'
                  )?.value ??
                  "main",

                hidden:
                  root.querySelector(
                    '[name="hiddenQuest"]'
                  )?.checked ??
                  false,

                visibleTo:
                  this.readVisibility(
                    dialog
                  )

              };

            }

          }

        ]

      });


    if (
      !result ||
      !result.title.trim()
    ) {
      return;
    }


    quest.title =
      result.title.trim();

    quest.description =
      result.description.trim();

    quest.image =
      result.image?.trim() ??
      "";

    quest.type =
      result.type;

    quest.revealed =
      !result.hidden;

    quest.visibleTo =
      result.visibleTo;


    if (
      oldType !==
      quest.type
    ) {

      this.moveQuestToEndOfStatus(
        quests,
        quest
      );

    }


    await this.saveQuests(
      quests
    );


    if (
      wasHidden &&
      quest.revealed
    ) {

      this.notifyPlayers(
        quest,
        this.format(
          "QUESTLOG.Notifications.RevealedQuest",
          {
            title:
              quest.title
          }
        )
      );

    }


    if (
      quest.status !==
      "archived"
    ) {

      this._selectedTab =
        quest.type;

    }


    this.render(true);

  }


  async deleteQuest(
    questId
  ) {

    if (!game.user.isGM) {
      return;
    }


    const quests =
      this.getQuests();


    const quest =
      quests.find(
        quest =>
          quest.id ===
          questId
      );


    if (!quest) {
      return;
    }


    const confirmed =
      await DialogV2.confirm({

        window: {
          title:
            this.localize(
              "QUESTLOG.Dialog.DeleteQuest"
            )
        },

        content: `
          <p>
            ${this.format(
              "QUESTLOG.Confirm.Delete",
              {
                title:
                  foundry.utils.escapeHTML(
                    quest.title
                  )
              }
            )}
          </p>
        `,

        yes: {
          label:
            this.localize(
              "QUESTLOG.Actions.Delete"
            )
        },

        no: {
          label:
            this.localize(
              "QUESTLOG.Actions.Cancel"
            )
        }

      });


    if (!confirmed) {
      return;
    }


    const updatedQuests =
      quests.filter(
        quest =>
          quest.id !==
          questId
      );


    await this.saveQuests(
      updatedQuests
    );


    this._selectedQuestId =
      null;

    this._selectedDetailTab =
      "details";


    this.render(true);

  }

}