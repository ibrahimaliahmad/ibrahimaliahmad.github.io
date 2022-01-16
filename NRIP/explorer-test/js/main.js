define([
    "dojo/_base/declare",
    "dojo/query",
    "dojo/dom-class",
    "dojo/on",
    "esri/request",
    "dojo/dom-construct",
    "widgets/Filters/Filters",
    "widgets/ResultsGallery/ResultsGallery",
    "esri/WebMap",
    "esri/views/MapView",
    "esri/widgets/Expand",
    "esri/widgets/Search",
    "esri/widgets/Home",
    "esri/widgets/LayerList",
    "esri/widgets/BasemapGallery",
    "esri/widgets/Print",
    "esri/portal/Portal",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "dojo/domReady!",
], function (
    declare,
    query,
    domClass,
    on,
    esriRequest,
    domConstruct,
    Filters,
    ResultsGallery,
    WebMap,
    MapView,
    Expand,
    Search,
    Home,
    LayerList,
    BasemapGallery,
    Print,
    Portal,
    OAuthInfo,
    esriId
) {
    return declare(null, {
        config: null,
        filters: null,
        gallery: null,
        scrollToBottomSignal: null,

        constructor: function (config) {
            this.config = config;
        },

        startup: function () {
            this.config.portalUrl = this.config.portalUrl.trimEnd("/");
            this.config.isAGOL =
                this.config.portalUrl.indexOf("maps.arcgis.com") > -1;
            this.getPortalId().then(() => {
                this.init();
            });
            const info = new OAuthInfo({
                appId: "7md3uQI5oZ1ZRNIJ",
                popup: false
            });
            esriId.registerOAuthInfos([info]);
            esriId
            .checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                this.handleSignedIn();
            })
            .catch(() => {
                this.handleSignedOut();
            });
            esriId.getCredential(info.portalUrl + "/sharing");
        },

        handleSignedIn: function() {
            const portal = new Portal();
            portal.load().then(() => {
                const results = { name: portal.user.fullName, username: portal.user.username, token: portal.credential.token };
                console.log("Signed In");
            });
        },

        handleSignedOut: function() {
            //esriId.destroyCredentials();
            //window.location.reload();
            console.log("Signed Out");
        },

        init: function () {
            this.filters = new Filters(
                { config: this.config },
                domConstruct.create("div", {}, query("#drawerContent")[0])
            );            
            this.mapview = new MapView({
                container: "mapview-container",
                padding: {
                    bottom: window.innerWidth <= 640 ? 45 : 0,
                },
            });
            const searchParams = new URLSearchParams(window.location.search);
            this.newMap(
                searchParams.has("item")
                    ? searchParams.get("item")
                    : this.config.defaultItem,
                false,
                true
            );
            this.legendExpand = new Expand({
                expandIconClass: "esri-icon-legend",
                view: this.mapview,
                expanded: true,
                content: new LayerList({
                    //container: domConstruct.create("div"),
                    view: this.mapview,
                    listItemCreatedFunction: function(event) {
                        const item = event.item;
                        if (item.layer.type != "group") {
                          // don't show legend twice
                          item.panel = {
                            content: "legend",
                            open: true
                          };
                        }
                    }
                }),
            });
            this.mapview.ui.add(this.legendExpand, "bottom-left");
            this.basemapGalleryExpand = new Expand({
                expandIconClass: "esri-icon-basemap",
                view: this.mapview,
                expanded: false,
                content: new BasemapGallery({
                    view: this.mapview
                }),
            });
            this.mapview.ui.add(this.basemapGalleryExpand, "top-left");
            this.homeWidget = new Home({
                view: this.mapview
            });
            this.mapview.ui.add(this.homeWidget, "top-left");
            this.searchExpand = new Expand({
                expandIconClass: "esri-icon-search",
                view: this.mapview,
                content: new Search({
                    container: domConstruct.create("div"),
                    view: this.mapview,
                }),
            });
            this.mapview.ui.add(this.searchExpand, "top-left");
            /*
            this.filterWidget = new Search({
                view: this.mapview,
                locationEnabled: false,
                allPlaceholder: "World Countries",
            });
            this.filterExpand = new Expand({
                expandIconClass: "esri-icon-filter",
                view: this.mapview,
                content: this.filterWidget
            });
            this.mapview.ui.add(this.filterExpand, "top-left");
            */
            this.printExpand = new Expand({
                expandIconClass: "esri-icon-printer",
                view: this.mapview,
                expanded: true,
                content: new Print({
                    view: this.mapview,
                    printServiceUrl:
              "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
                    templateOptions: {
                        title: "FAO Data in Emergencies Hub",
                        author: "Made by: Office of Emergencies and Resilience",
                        copyright: "The Food and Agriculture Organization of the United Nations",
                        legendEnabled: true,
                        attributionEnabled: true
                    }
                }),
            });
            this.mapview.ui.add(this.printExpand, "bottom-right");
            this.gallery = new ResultsGallery(
                { config: this.config },
                domConstruct.create("div", {}, query("#drawerContent")[0])
            );
            this.handleEvents();
        },

        handleEvents: function () {
            on(query(".drawer .handle")[0], "click", () => {
                domClass.toggle(query(".drawer")[0], "closed");
            });

            if (query(".share-icon-container")[0]) {
                on(query(".share-icon-container")[0], "click", () => {
                    domClass.toggle(query(".sharebox-container")[0], "hidden");
                });
            }

            if (query(".sharebox .closeicon")[0]) {
                on(query(".sharebox .closeicon")[0], "click", () => {
                    domClass.add(query(".sharebox-container")[0], "hidden");
                });
            }

            if (query(".sharebox .copybtn")[0]) {
                on(query(".sharebox .copybtn")[0], "click", () => {
                    const sharelink = query("#sharelink")[0];
                    sharelink.blur();
                    sharelink.focus();
                    sharelink.select();
                    document.execCommand("copy");
                });
            }

            if (query(".sharebox .mailbtn")[0]) {
                on(query(".sharebox .mailbtn")[0], "click", () => {
                    const sharelink = query("#sharelink")[0].value;
                    window.open(
                        `mailto:?subject=${
                            query("#maptitle")[0].innerText
                        }&body=${this.config.shareMsg.replace(
                            "{link}",
                            sharelink
                        )}`
                    );
                });
            }

            /*if (query(".sharebox .printbtn")[0]) {
                on(query(".sharebox .printbtn")[0], "click", () => {
                    this.mapview
                        .takeScreenshot({format: "png" })
                        .then(function (screenshot) {
                            screenshotDiv.classList.remove("hide");
                            const screenshotImage = document.getElementsByClassName("js-screenshot-image")[0];
                            screenshotImage.width = screenshot.data.width/2;
                            screenshotImage.height = screenshot.data.height/2;
                            screenshotImage.src = screenshot.dataUrl;
                        })
                        .then(() =>{
                            window.print();
                            screenshotDiv.classList.add("hide");
                        });
                    
                });
            }*/

            on(this.filters, "new-results", (resultInfo) => {
                this.gallery.newResults(resultInfo);
                this.updateBottomScroll();
            });
            on(this.filters, "added-results", (resultInfo) => {
                this.gallery.addResults(resultInfo);
                this.updateBottomScroll();
            });
            on(this.filters.categoryList, "selection-changed", () => {
                //Selection Changed
            });
            /*
            on(this.filterWidget, "select-result", function(event){
                const selectedCountry = event.result.name;
                const where_clause = "adm0_iso3 = '" + selectedCountry + "'";
                console.log("The selected Country is: ", selectedCountry);
            });
            */
            on(this.gallery, "item-selected", this.newMap.bind(this));
            on(window, "popstate", (evt) => {
                console.log(evt);
                if (evt.state.item) {
                    console.log(evt.state.item);
                    this.newMap(evt.state.item, true);
                    this.gallery.select(evt.state.item);
                }
            });
            if (window.innerWidth < 640) {
                window.setTimeout(() => {
                    query(
                        ".esri-expand__container .esri-widget--button"
                    ).forEach((expandWidgetButton) => {
                        on(expandWidgetButton, "click", () => {
                            console.log("MAPVIEW", this.mapview);
                            const header = query(".app-header")[0];
                            const handle = query(".handle")[0];
                            const wasExpanded =
                                expandWidgetButton.getAttribute(
                                    "aria-expanded"
                                ) === "true";
                            if (!wasExpanded) {
                                header.style = header ? "display: none;" : "";
                                handle.style = handle ? "display: none;" : "";
                            } else {
                                header.style = header ? "display: flex;" : "";
                                handle.style = handle ? "display: flex;" : "";
                            }
                        });
                    });
                }, 1000);
            }
        },

        updateBottomScroll: function () {
            if (this.scrollToBottomSignal) {
                this.scrollToBottomSignal.remove();
            }
            this.scrollToBottomSignal = on(
                query("#drawerContent")[0],
                "scroll",
                (evt) => {
                    if (
                        evt.target.clientHeight + evt.target.scrollTop >=
                        evt.target.scrollHeight - 100
                    ) {
                        this.filters.addResults();
                        if (this.scrollToBottomSignal) {
                            this.scrollToBottomSignal.remove();
                        }
                    }
                }
            );
        },

        getPortalId: function () {
            return new Promise((resolve, reject) => {
                if (this.config.isAGOL) {
                    esriRequest(
                        `${this.config.portalUrl}/sharing/rest/portals/self`,
                        { query: { f: "json" } }
                    ).then((response) => {
                        this.config.portalId = response.data.id;
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        },

        newMap: function (id, keepState, replaceState) {
            query("#maptitle")[0].innerText = "";
            query("#sharelink")[0].value = "";

            const webmap = new WebMap({
                portalItem: {
                    id: id,
                },
                portal: {
                    url: this.config.portalUrl,
                },
            });

            webmap.when(() => {
                query("#maptitle")[0].innerText = webmap.portalItem.title;
                query("#sharelink")[0].value = this.config.sharePath.replace(
                    "{id}",
                    id
                );
                document.title = this.config.title.replace(
                    "{maptitle}",
                    webmap.portalItem.title
                );
                this.mapview.goTo(webmap.initialViewProperties.viewpoint);
                this.homeWidget.goToOverride = function(view, goToParams) {
                    goToParams.target = webmap.initialViewProperties.viewpoint;
                    return view.goTo(goToParams.target, goToParams.options);
                };
                const where_clause = this.filters.where;
                this.mapview.map.layers.forEach((layer, index) => {
                    layer.definitionExpression = where_clause;
                    layer.queryExtent().then((response) => {
                        this.mapview.goTo(response.extent).catch((error) => {
                            console.error(error);
                        });
                    });
                    /*
                    this.mapview
                    .whenLayerView(layer)
                    .then((layerView) => {
                        if (layer.type === "feature") {
                            layerView.filter = featureFilter;
                        }
                    })
                    .catch(console.error);*/
                });
            });

            this.mapview.map = webmap;
            if (!keepState) {
                try {
                    if (replaceState) {
                        window.history.replaceState(
                            { item: id },
                            "",
                            `?item=${id}`
                        );
                    } else {
                        window.history.pushState(
                            { item: id },
                            "",
                            `?item=${id}`
                        );
                    }
                } catch (err) {
                    console.error(
                        "No window history API. Please update your browser."
                    );
                }
            }
        },
    });
});
