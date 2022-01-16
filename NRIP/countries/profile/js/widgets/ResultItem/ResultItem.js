define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/text!./templates/resultItem.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/Evented",
], function (
    declare,
    lang,
    template,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    Evented
) {
    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented],
        {
            templateString: template,

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                this.fillInfo();
            },

            fillInfo: function () {
                
                if(!(this.item.id == "f1d017ac889f44ceae76d07977eb5bc1" || this.item.id == "6e4f7208540643e68531d15b2e08e8dd" || this.item.id == "ffe31542ff8841dba63e701f09d877e7" || this.item.id == "eab64778a6de4936b51a869acf589936" || this.item.id == "263f1c1964164ebe82382a03b4a4e1ea")) {
                    this.itemLink.href = `${this.config.sharePath}datasets/${this.item.id}`;
                } else {
                    var filter = `{\"adm0_iso3\":[\"${this.config.iso}\"]}`;
                    var filter_enc = encodeURIComponent(window.btoa(filter));
                    this.itemLink.href = `${this.config.sharePath}datasets/${this.item.id}/explore?filters=${filter_enc}`;
                }
                
                if (this.item.thumbnail) {
                    this.itemImage.src = `${this.config.portalUrl}/sharing/content/items/${this.item.id}/info/${this.item.thumbnail}`;
                    this.itemImage.alt = this.item.snippet;
                } else {
                    this.itemImageContainer.style = "display: none";
                }

                this.itemTime.datetime = this.item.modified;
                this.itemTime.innerText = new Date(
                    this.item.modified
                ).toLocaleDateString();

                this.itemTitle.innerText = this.item.snippet;
            },
        }
    );
});
