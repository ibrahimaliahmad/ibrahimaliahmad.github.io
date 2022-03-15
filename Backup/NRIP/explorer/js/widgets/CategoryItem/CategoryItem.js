define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/text!./templates/categoryItem.html",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/Evented",
    "widgets/SubcategoryItem/SubcategoryItem",
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
    SubcategoryItem
) {
    return declare(
        [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, Evented],
        {
            templateString: template,
            subcategories: [],
            allSubitem: null,

            constructor: function (options) {
                lang.mixin(this, options);
            },

            postCreate: function () {
                this.handleEvents();
                this.fillInfo();
            },

            handleEvents: function () {
                on(this.titlebar, "click", () => {
                    domClass.toggle(this.subcategoriesContainer, "hidden");
                    domClass.toggle(this.expandBtn, "rotated");
                    if (domClass.contains(this.expandBtn, "rotated")) {
                        this.emit("opened", this.category.title);
                    }
                });
                this.allSubitem = new SubcategoryItem(
                    { subcategory: { title: "All" } },
                    domConstruct.create("div", {}, this.subcategoriesContainer)
                );
                on(this.allSubitem, "change", (allChecked) => {
                    this.subcategories.forEach((subcategory) => {
                        subcategory.setChecked(allChecked);
                    });
                    this.emit("selection-changed");
                });
            },

            setOpen: function () {
                domClass.remove(this.subcategoriesContainer, "hidden");
                domClass.add(this.expandBtn, "rotated");
            },

            setClosed: function () {
                domClass.add(this.subcategoriesContainer, "hidden");
                domClass.remove(this.expandBtn, "rotated");
            },

            fillInfo: function () {
                this.subcategories = [];
                this.titleContainer.innerText = this.category.title;
                this.category.categories.forEach((subcategory) => {
                    this.subcategories.push(
                        new SubcategoryItem(
                            {
                                subcategory: {
                                    ...subcategory,
                                    value: `/Categories/${this.category.title}/${subcategory.title}`,
                                },
                            },
                            domConstruct.create(
                                "div",
                                {},
                                this.subcategoriesContainer
                            )
                        )
                    );
                });
                this.subcategories.forEach((subcategoryItem) => {
                    on(subcategoryItem, "change", () => {
                        let allChecked = true;
                        this.subcategories.forEach(
                            (existingSubcategoryItem) => {
                                if (!existingSubcategoryItem.isChecked()) {
                                    allChecked = false;
                                }
                            }
                        );
                        this.allSubitem.setChecked(allChecked);
                        this.emit("selection-changed");
                    });
                });
            },

            getSelection: function () {
                if (this.allSubitem.isChecked()) {
                    return {
                        values: [`/Categories/${this.category.title}`],
                        badges: this.subcategories
                            .filter((subcategory) => subcategory.isChecked())
                            .map((subcategory) => ({
                                value: `/Categories/${this.category.title}/${subcategory.subcategory.title}`,
                                title: `${subcategory.subcategory.title}`,
                            })),
                    };
                } else {
                    return {
                        values: this.subcategories
                            .filter((subcategory) => subcategory.isChecked())
                            .map(
                                (subcategory) =>
                                    `/Categories/${this.category.title}/${subcategory.subcategory.title}`
                            ),
                        badges: this.subcategories
                            .filter((subcategory) => subcategory.isChecked())
                            .map((subcategory) => ({
                                value: `/Categories/${this.category.title}/${subcategory.subcategory.title}`,
                                title: `${subcategory.subcategory.title}`,
                            })),
                    };
                }
            },

            deselect: function (deselection) {
                this.subcategories.forEach((subcategory) => {
                    if (
                        deselection === "all" ||
                        deselection === subcategory.subcategory.value
                    ) {
                        subcategory.setChecked(false);
                        this.allSubitem.setChecked(false);
                    }
                });
            },
        }
    );
});
