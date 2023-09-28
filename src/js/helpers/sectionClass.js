// base class for all created components
export default class sectionClass extends HTMLElement {

    constructor(name, id) {
        // call super
        super();

        // if section array doesn't exist => create it
        if (!window.sections) {
            window.sections = [];
        }

        // add section to array
        // if exist => convert to an array holding all instances
        if (window.sections[name]) {
            if (window.sections[name].id == this.id) {

            }
            else if (Array.isArray(window.sections[name])) {
                window.sections[name] = [...window.sections[name], this]
            }
            else {
                window.sections[name] = [window.sections[name], this]
            }
        }
        else {
            window.sections[name] = this;
        }

        this.sectionElement = document.querySelector('#shopify-section-' + id);

        this.initElements();

    };

    // init elements array for the section
    initElements = function () {

        // set element array from all elements with id attr
        this.elements = this.querySelectorAll('[id]');

        // to use inside foreach=>function
        let self = this;

        this.elements.forEach((element) => {

            // set refresh function per element
            element.refresh = function () {
                self.refresh(element.id);
            };

            // set the element as a property on section class
            this[element.id] = element;
        });
    }

    // section refresh finish event
    onRefreshFinish = function (sectionHtmlString) {
    }

    // refresh section from shopify section-rendering API => replacing the section element in the DOM
    refresh = function (elementID) {
        fetch(window.location.pathname + "?section_id=" + this.id)
            .then(res => res.text())
            .then(htmlString => {
                let newDom = document.createElement('div');
                if (elementID) {
                    let element = this.sectionElement.querySelector('#' + elementID);
                    newDom.innerHTML = htmlString.trim();
                    newDom = newDom.querySelector('#' + elementID);
                    element.parentNode.replaceChild(newDom, element);
                } else {
                    newDom.innerHTML = htmlString.trim();
                    newDom = newDom.querySelector('#' + this.id);
                    this.innerHTML = newDom.innerHTML;
                }

                this.initElements();

                this.onRefreshFinish(newDom);
            })
    }
}