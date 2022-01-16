define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/text!./templates/resultsGallery.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/Evented",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/query",
    "widgets/ResultCard/ResultCard",
], function (
    declare,
    lang,
    on,
    template,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Evented,
    domConstruct,
    domClass,
    query,
    ResultCard
) {
    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented],
        {
            templateString: template,
            total: 0,
            results: [],
            displayedResults: [],

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                this.resultCountContainer.innerText = this.total;
                on(this.titleHeader, "click", () => {
                    domClass.toggle(this.resultsContainer, "hidden");
                    if (domClass.contains(this.resultsContainer, "hidden")) {
                        domClass.replace(
                            this.expanderIcon,
                            "esri-icon-plus",
                            "esri-icon-minus"
                        );
                    } else {
                        domClass.replace(
                            this.expanderIcon,
                            "esri-icon-minus",
                            "esri-icon-plus"
                        );
                    }
                });
            },

            newResults: function (resultInfo) {
                this.displayedResults.forEach((displayedResult) => {
                    displayedResult.destroy();
                });
                this.displayedResults = [];

                this.results = resultInfo.results;
                this.total = resultInfo.total;

                this.resultCountContainer.innerText = this.total.toLocaleString();
                this.results.forEach((result) => {
                    const resultCard = new ResultCard(
                        { config: this.config, result },
                        domConstruct.create("div", {}, this.resultsContainer)
                    );
                    on(resultCard, "item-selected", (selectedId) => {
                        this.emit("item-selected", selectedId);
                    });
                    this.displayedResults.push(resultCard);
                });
            },

            addResults: function (resultInfo) {
                this.results = [...this.results, ...resultInfo.results];
                resultInfo.results.forEach((result) => {
                    const resultCard = new ResultCard(
                        { config: this.config, result },
                        domConstruct.create("div", {}, this.resultsContainer)
                    );
                    on(resultCard, "item-selected", (selectedId) => {
                        this.emit("item-selected", selectedId);
                    });
                    this.displayedResults.push(resultCard);
                });
            },

            select: function (id) {
                let found = false;
                this.displayedResults.forEach((resultCard) => {
                    if (resultCard.result.id === id) {
                        found = true;
                        resultCard.select();
                    }
                });
                if (!found) {
                    query(".viewBtn").removeClass("active");
                }
            },
        }
    );
});
