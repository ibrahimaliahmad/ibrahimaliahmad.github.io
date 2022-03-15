define([
    "dojo/_base/declare",
    "esri/request",
    "dojo/dom",
    "dojo/dom-construct",
    "widgets/ResultItem/ResultItem",
    "dojo/domReady!",
], function (declare, esriRequest, dom, domConstruct, ResultItem) {
    return declare(null, {
        config: null,

        constructor: function (config) {
            this.config = {
                ...config,
                ...this.paramsToJSON(),
            };
        },

        startup: function () {
            this.config.portalUrl = this.config.portalUrl.trimEnd("/");
            this.config.isAGOL =
                this.config.portalUrl.indexOf("maps.arcgis.com") > -1;
            this.getPortalId().then(() => {
                this.init();
            });
        },

        paramsToJSON: function () {
            const urlParams = new URLSearchParams(window.location.search);
            const params = urlParams.entries();
            const result = {};
            for (const [key, value] of params) {
                result[key] = (!/[^a-zA-Z]/i.test(value)) ? value : "AFG";
            }
            return result;
        },

        init: function () {
            this.getCountryInfo().then(
                (attributes) => {
                    this.displayCountryInfo(attributes);
                },
                () => {
                    console.error("No features found matching provided ISO");
                    console.log(this.config.iso);
                    this.displayCountryInfo({
                        name: this.config.countryNotFoundMsg || null,
                    });
                }
            );
            this.getCountryResults().then((results) => {
                if (results.length > 0) {
                    this.displayResults(results);
                }
            });
        },

        displayCountryInfo: function (attributes) {
            if (attributes[this.config.fields.image]) {
                dom.byId("countryBanner").style = `background-image:url(${
                    attributes[this.config.fields.image]
                });`;
            } else {
                dom.byId(
                    "countryBanner"
                ).style = `height: 133px; min-height: 133px;`;
            }

            if (attributes[this.config.fields.name]) {
                dom.byId("countryTitle").innerText =
                    attributes[this.config.fields.name];
            } else {
                if (!attributes[this.config.fields.image]) {
                    dom.byId("countryBanner").style = `display: none;`;
                } else {
                    dom.byId("titleContainer").style = `display: none;`;
                }
            }

            if (attributes[this.config.fields.text]) {
                dom.byId("countryDescription").innerHTML =
                    attributes[this.config.fields.text];
            } else {
                dom.byId("textContainer").style = "display: none;";
                dom.byId("statsContainer").style = "width: 100%;";
            }

            let hasStats = false;
            for (var i = 1; i <= 4; i++) {
                if (attributes[this.config.fields[`stat${i}`]]) {
                    hasStats = true;
                    dom.byId(`stat${i}`).innerText =
                        attributes[this.config.fields[`stat${i}`]];
                    dom.byId(`stat${i}subtitle`).innerText =
                        attributes[this.config.fields[`stat${i}subtitle`]];
                    dom.byId(`stat${i}item`).style = "display: block";
                }
            }

            if (!hasStats) {
                dom.byId("statsContainer").style = "display: none;";
                dom.byId("textContainer").style = "width: 100%;";
            }

            if (attributes[this.config.fields.text] || hasStats) {
                dom.byId("infoContainer").style = "display: block;";
            }
            
            if (attributes[this.config.fields.calendarimg]) {
                dom.byId("cropCalendar").style = `background-image:url(${
                    attributes[this.config.fields.calendarimg]
                });`;
                dom.byId("cropCalendarContainer").style = "display: block;";
            } else {
                dom.byId(
                    "cropCalendarContainer"
                ).style = `display: none;`;
            }

            dom.byId("showallLink").href = this.config.showAllPath.replace(
                "{iso}",
                this.config.iso
            );
        },

        displayResults: function (results) {
            for (let i = 0; i < Math.min(this.config.maxResultCount, results.length); i++) {
                new ResultItem(
                    { config: this.config, item: results[i] },
                    domConstruct.create("div", {}, dom.byId("resourceList"))
                );
            }
            dom.byId("resourceContainer").style = "display: block;";
        },

        getCountryInfo: function () {
            return new Promise((resolve, reject) => {
                esriRequest(`${this.config.infoSource.trimEnd("/")}/query`, {
                    query: {
                        f: "json",
                        where: `lower(${this.config.isoField}) = lower('${this.config.iso}')`,
                        outFields: "*",
                    },
                }).then((response) => {
                    if (response.data.features.length > 0) {
                        resolve(response.data.features[0].attributes);
                    } else {
                        reject();
                    }
                });
            });
        },

        getCountryResults: function () {
            return new Promise((resolve) => {
                esriRequest(
                    `${this.config.portalUrl}/sharing/rest/content/groups/${this.config.groupId}/search`,
                    {
                        query: {
                            f: "json",
                            categories: `/Categories/Countries/${this.config.iso}`,
                            sortField: "modified",
                            sortOrder: "desc",
                        },
                    }
                ).then((response) => {
                    resolve(response.data.results);
                });
            });
        },

        getPortalId: function () {
            return new Promise((resolve) => {
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
    });
});
