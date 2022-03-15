define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-class",
    "dojo/query",
    "dojo/text!./templates/resultCard.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/Evented",
    "esri/portal/Portal",
    "dojo/NodeList-dom",
], function (
    declare,
    lang,
    on,
    domClass,
    query,
    template,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Evented,
    Portal
) {
    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented],
        {
            templateString: template,

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                const portal = new Portal();
                portal.load().then(() => {
                    if (this.result.thumbnail) {
                        this.cardImage.src = `${this.config.portalUrl}/sharing/content/items/${this.result.id}/info/${this.result.thumbnail}?token=${portal.credential.token}`;
                    }
                });
                this.titleDiv.title = this.result.title;
                this.titleLink.href = `${this.config.hublUrl}/maps/${this.result.id}/about`;
                this.titleLink.innerText = this.result.title;
                this.descriptionP.title = this.result.snippet;
                this.descriptionP.innerText = this.snipDesc(
                    this.result.snippet
                );
                const searchParams = new URLSearchParams(
                    window.location.search
                );
                if (searchParams.get("item") === this.result.id) {
                    domClass.add(this.viewBtn, "active");
                }
                this.handleEvents();
            },

            snipDesc: function (desc) {
                if (!desc || desc.length < 75) {
                    return desc;
                } else {
                    desc = desc.substring(0, 72);
                    return desc.substring(0, desc.lastIndexOf(" ")) + "...";
                }
            },

            handleEvents: function () {
                on(this.metadataBtn, "click", () => {
                    window.open(
                        `${this.config.hublUrl}/maps/${this.result.id}/about`,
                        "_blank"
                    );
                });
                on(this.viewBtn, "click", () => {
                    this.emit("item-selected", this.result.id);
                    query(".viewBtn").removeClass("active");
                    domClass.add(this.viewBtn, "active");
                });
            },

            select: function () {
                query(".viewBtn").removeClass("active");
                domClass.add(this.viewBtn, "active");
            },
        }
    );
});
