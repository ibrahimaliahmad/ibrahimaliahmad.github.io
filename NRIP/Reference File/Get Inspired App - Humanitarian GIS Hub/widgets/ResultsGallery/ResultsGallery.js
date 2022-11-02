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
            },

            newResults: function (resultInfo) {
                this.displayedResults.forEach((displayedResult) => {
                    displayedResult.destroy();
                });
                this.displayedResults = [];

                this.results = resultInfo.results;
                this.total = resultInfo.results.length;

                this.resultCountContainer.innerText = `${this.results.length.toLocaleString()}`;
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
        }
    );
});

