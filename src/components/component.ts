// // needed for css compilation
import './compFormattedName.scss';

// // base class for component
import sectionClass from '../../js/helpers/sectionClass';

// // create section class from base
const compNameSectionId = "{{ section.id }}";

class compName extends sectionClass {
    constructor() {
        super('compName', compNameSectionId);

        // on load code goes here

    }

    // set functions on the component scope
    // it will be accessible from 'sections.compNameSection' global object
    someFunction = function () {
        // access component elements by id - for example
        this.someID.innerHTML = 'Hello World';

        // call this to refresh the section - reload html from shopify
        this.refresh();
    }

    // refresh finish event
    onRefreshFinish = function (htmlElement) {
        console.log('onRefreshFinish - compNameSection:' + htmlElement.outerHTML);
    }

}

if (!customElements.get('compFormattedName')) {
    // Define the 'compFormattedName' component here
    customElements.define('compFormattedName', compName );
}