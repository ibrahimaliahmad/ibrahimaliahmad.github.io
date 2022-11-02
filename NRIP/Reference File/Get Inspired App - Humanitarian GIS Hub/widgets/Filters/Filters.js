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
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/GraphicsLayer",
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
    Map,
    MapView,
    GraphicsLayer
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
            mapView: null,
            layer: null,
            selectedLocation: null,

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                this.categoryList = new CategoryList(
                    { categories: this.config.userFilters },
                    domConstruct.create("div", {}, this.categoriesContainer)
                );
                if (this.config.userFilters.length === 0) {
                    domClass.add(this.filterToggler, "hidden");
                }
                if (this.config.map && this.config.map.display) {
                    this.initMap();
                    this.addItemsToMap();
                }
                this.handleEvents();
            },

            loadAndDisplayAutocompleteOptions: function () {
                dijit.registry
                    .findWidgets(this.autocompleteList)
                    .forEach((option) => {
                        option.destroyRecursive();
                    });
                let matchingItems = this.items.filter(
                    (item) =>
                        item.attributes[this.config.item.name]
                            .toLowerCase()
                            .indexOf(this.searchbarInput.value.toLowerCase()) >
                        -1
                );
                matchingItems.forEach((result) => {
                    on(
                        new AutocompleteOption(
                            { config: this.config, item: result },
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
                if (matchingItems.length > 0) {
                    domClass.remove(
                        this.autocompleteOptionsContainer,
                        "hidden"
                    );
                } else {
                    domClass.add(this.autocompleteOptionsContainer, "hidden");
                }
            },

            initMap: function () {
                domClass.remove(this.mapContainer, "hidden");
                this.mapContainer.style.height =
                    this.mapContainer.clientWidth * 0.65 + "px";
                const map = new Map({
                    basemap: this.config.map.basemap,
                });
                this.mapView = new MapView({
                    container: "mapViewDiv",
                    map: map,
                    center: this.config.map.center,
                    zoom: this.config.map.zoom,
                });
                if (!this.config.map.showZoomButtons) {
                    this.mapView.ui.components = ["attribution"];
                }
                this.layer = new GraphicsLayer();
                map.add(this.layer);
            },

            addItemsToMap: function () {
                this.items.forEach((item) => {
                    if (
                        item.geometry &&
                        !(item.geometry.x === 0 && item.geometry.y === 0)
                    ) {
                        this.layer.add(item);
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

                on(window, "resize", () => {
                    window.setTimeout(() => {
                        this.mapContainer.style.height =
                            this.mapContainer.clientWidth * 0.65 + "px";
                    }, 500);
                });

                if (this.mapView) {
                    on(this.mapView, "click", (evt) => {
                        this.mapView.hitTest(evt).then((response) => {
                            if (response.results.length) {
                                let result = response.results.filter(
                                    (result) =>
                                        result.graphic.layer === this.layer
                                )[0];
                                if (result) {
                                    this.selectLocation(result.graphic);
                                }
                            }
                        });
                    });
                }
            },

            selectLocation: function (graphic) {
                if (this.selectedLocation) {
                    this.selectedLocation.symbol = this.config.map.locationSymbol;
                }
                graphic.symbol = this.config.map.selectedLocationSymbol;
                this.selectedLocation = graphic;
                this.selectionUpdated();
            },

            selectionUpdated: function () {
                const selection = this.categoryList.getSelection();
                this.filters = selection;
                if (this.selectedLocation) {
                    this.filters.badges.push({
                        title: "Location",
                        value: "APPLOCFILTER",
                    });
                }
                if (this.filters.badges.length === 0) {
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

            deselect: function (deselection) {
                if (deselection === "APPLOCFILTER" || deselection === "all") {
                    if (this.selectedLocation) {
                        this.selectedLocation.symbol = this.config.map.locationSymbol;
                        this.selectedLocation = null;
                    }
                }
                if (deselection !== "APPLOCFILTER") {
                    this.categoryList.deselect(deselection);
                }
                this.selectionUpdated();
            },

            onDrawerOpen: function () {
                window.setTimeout(() => {
                    this.mapContainer.style.height =
                        this.mapContainer.clientWidth * 0.65 + "px";
                }, 500);
            },

            search: function () {
                const matchingItems = this.items.filter((item) => {
                    const nameMatch =
                        item.attributes[this.config.item.name]
                            .toLowerCase()
                            .indexOf(this.searchbarInput.value.toLowerCase()) >
                        -1;

                    let allFilterMatch = true;
                    this.filters.values.forEach((filter) => {
                        let oneFilterMatch = false;
                        filter.values.forEach((value) => {
                            if (
                                item.attributes[filter.field]?.indexOf(value) >
                                -1
                            ) {
                                oneFilterMatch = true;
                            }
                        });
                        allFilterMatch = allFilterMatch && oneFilterMatch;
                    });

                    let locationMatch = true;
                    if (this.selectedLocation) {
                        locationMatch =
                            this.selectedLocation.geometry.x ===
                                item.geometry.x &&
                            this.selectedLocation.geometry.y ===
                                item.geometry.y;
                    }

                    return nameMatch && allFilterMatch && locationMatch;
                });
                this.emit("new-results", {
                    results: matchingItems,
                });
            },
        }
    );
});

