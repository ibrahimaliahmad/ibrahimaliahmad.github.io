define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/text!./templates/filters.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/Evented",
    "widgets/CategoryList/CategoryList",
    "widgets/FilterBadge/FilterBadge",
    "widgets/AutocompleteOption/AutocompleteOption",
    "esri/request",
], function (
    declare,
    lang,
    on,
    template,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    domClass,
    domConstruct,
    Evented,
    CategoryList,
    FilterBadge,
    AutocompleteOption,
    esriRequest
) {
    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented],
        {
            templateString: template,
            categoryList: null,
            filters: {
                values: [],
                badges: [],
            },
            filterBadges: [],
            lastSearchResponse: null,
            results: [],

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                this.categoryList = new CategoryList(
                    {},
                    domConstruct.create("div", {}, this.categoriesContainer)
                );
                this.getPortalCategories();
                this.handleEvents();
                this.search();
            },

            loadAndDisplayAutocompleteOptions: function () {
                esriRequest(
                    `${this.config.portalUrl}/sharing/rest/content/groups/${this.config.groupId}/search/suggest`,
                    {
                        query: {
                            f: "json",
                            q: this.searchbarInput.value,
                            filters: `(type:("Web Map") -type:"Web Mapping Application")${
                                this.config.isAGOL
                                    ? " AND orgid:" + this.config.portalId
                                    : ""
                            }`,
                        },
                    }
                ).then((response) => {
                    dijit.registry
                        .findWidgets(this.autocompleteList)
                        .forEach((option) => {
                            option.destroyRecursive();
                        });
                    response.data.results.forEach((result) => {
                        on(
                            new AutocompleteOption(
                                { item: result },
                                domConstruct.create(
                                    "div",
                                    {},
                                    this.autocompleteList
                                )
                            ),
                            "item-selected",
                            (newSearch) => {
                                this.searchbarInput.value = newSearch;
                                this.search();
                                domClass.add(
                                    this.autocompleteOptionsContainer,
                                    "hidden"
                                );
                            }
                        );
                    });
                    if (response.data.results.length > 0) {
                        domClass.remove(
                            this.autocompleteOptionsContainer,
                            "hidden"
                        );
                    } else {
                        domClass.add(
                            this.autocompleteOptionsContainer,
                            "hidden"
                        );
                    }
                });
            },

            handleEvents: function () {
                const showHideClearBtn = () => {
                    if (this.searchbarInput.value.length > 0) {
                        domClass.remove(this.clearBtn, "hidden");
                    } else {
                        domClass.add(this.clearBtn, "hidden");
                    }
                };

                on(this.searchbarInput, "keyup", (evt) => {
                    showHideClearBtn();
                    if (evt.key === "Enter") {
                        this.search();
                    }
                    if (this.searchbarInput.value.length > 0) {
                        this.loadAndDisplayAutocompleteOptions();
                    } else {
                        domClass.add(
                            this.autocompleteOptionsContainer,
                            "hidden"
                        );
                    }
                });

                on(this.clearBtn, "click", () => {
                    this.searchbarInput.value = "";
                    showHideClearBtn();
                    this.search();
                    domClass.add(this.autocompleteOptionsContainer, "hidden");
                });

                on(this.filterToggler, "click", () => {
                    domClass.toggle(this.categoriesContainer, "hidden");
                    domClass.toggle(this.filterToggler, "rotated");
                });

                on(this.clearAllBtn, "click", () => {
                    this.deselect("all");
                });

                on(
                    this.categoryList,
                    "selection-changed",
                    this.selectionUpdated.bind(this)
                );
            },

            selectionUpdated: function () {
                const selection = this.categoryList.getSelection();
                this.filters = selection;
                if (this.filters.values.length === 0) {
                    domClass.add(this.filterGallery, "hidden");
                } else {
                    domClass.remove(this.filterGallery, "hidden");
                    this.filterBadges.forEach((filterBadge) => {
                        filterBadge.destroy();
                    });
                    this.filterBadges = [];
                    this.filters.badges.forEach((badge) => {
                        const filterBadge = new FilterBadge(
                            { title: badge.title, value: badge.value },
                            domConstruct.create(
                                "div",
                                {},
                                this.clearAllBtn,
                                "before"
                            )
                        );
                        on(filterBadge, "cleared", this.deselect.bind(this));
                        this.filterBadges.push(filterBadge);
                    });
                }
                this.search();
            },

            setCategories: function (categories) {
                this.categoryList.setCategories(categories);
            },

            deselect: function (deselection) {
                this.categoryList.deselect(deselection);
                this.selectionUpdated();
            },

            search: function () {
                esriRequest(`${this.config.portalUrl}/sharing/rest/content/groups/${this.config.groupId}/search`, {
                    query: {
                        f: "json",
                        q: `${
                            this.searchbarInput.value.length > 0
                                ? "(" + this.searchbarInput.value + ") "
                                : " "
                        }(type:("Web Map") -type:"Web Mapping Application")${
                            this.config.isAGOL && false
                                ? " orgid:" + this.config.portalId
                                : ""
                        }${
                            this.config.groupId &&
                            this.config.groupId.length > 0
                                ? " group:" + this.config.groupId
                                : ""
                        }`,
                        categories:
                            this.filters.values.length > 0
                                ? this.filters.values.join(",")
                                : "/Categories",
                        sortField: "modified",
                        sortOrder: "desc",
                    },
                }).then((response) => {
                    this.lastSearchResponse = response.data;
                    this.results = this.lastSearchResponse.results;
                    this.emit("new-results", {
                        total: this.lastSearchResponse.total,
                        results: this.results,
                    });
                });
            },

            addResults: function () {
                if (this.lastSearchResponse.nextStart > 0) {
                    esriRequest(
                        `${this.config.portalUrl}/sharing/rest/content/groups/${this.config.groupId}/search`,
                        {
                            query: {
                                f: "json",
                                q: `${
                                    this.searchbarInput.value.length > 0
                                        ? "(" + this.searchbarInput.value + ") "
                                        : " "
                                }(type:("Web Map") -type:"Web Mapping Application")${
                                    this.config.isAGOL &&
                                    false /*TODO: remove false*/
                                        ? " orgid:" + this.config.portalId
                                        : ""
                                }`,
                                categories:
                                    this.filters.values.length > 0
                                        ? this.filters.values.join(",")
                                        : "/Categories",
                                sortField: "modified",
                                sortOrder: "desc",
                                start: this.lastSearchResponse.nextStart,
                            },
                        }
                    ).then((response) => {
                        this.lastSearchResponse = response.data;
                        this.results = [
                            ...this.results,
                            ...this.lastSearchResponse.results,
                        ];
                        this.emit("added-results", {
                            results: this.lastSearchResponse.results,
                        });
                    });
                }
            },

            getPortalCategories: function () {
                esriRequest(
                    `${this.config.portalUrl}/sharing/rest/community/groups/${this.config.groupId}/categorySchema`,
                    {
                        query: {
                            f: "json",
                        },
                        responseType: "json",
                    }
                ).then((response) => {
                    this.setCategories(
                        response.data.categorySchema[0].categories
                    );
                });
            },
        }
    );
});
