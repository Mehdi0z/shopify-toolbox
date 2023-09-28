  <h3>ToolBoxJS Shopify Front-End component framework </h3>
 <p>
    An awesome WEBPACK/TS/SCSS component-based js framework to jumpstart your Shopify projects!
</p>
<br>

[![Shopify][Shopify.com]][Shopify-url]
[![TypeScript][TypeScript.com]][TypeScript-url]
[![sass][sass.com]][sass-url]
[![nodejs][nodejs.com]][nodejs-url]
[![Webpack][Webpack.com]][Webpack-url]
[![npm][npm.com]][npm-url]
[![babeljs][babeljs.com]][babeljs-url]
[![ESLint][ESLint.com]][ESLint-url]
[![stylelint][stylelint.com]][stylelint-url]
[![PostCSS][PostCSS.com]][PostCSS-url]
[![Mocha][Mocha.com]][Mocha-url]



<!-- ABOUT THE PROJECT -->
# About The Project

**ToolBoxJS** is a framework that allows you to build your Shopify theme using a component-based approach. The framework is built using TypeScript, SCSS, and Webpack.

It is a great way to jumpstart your Shopify projects and get up and running quickly.
    
Separating the dev environment from the theme, achieving a better maintainability and reusability of the components.

Each component is a self-contained module under its own folder, with its own scss, ts, json and liquid files.

Typescript and scss are compiled to js and css with webpack, and are made into snippets.

Those snippets are rendered into the liquid file, along with the json scheme, and the section is ready to be used in the theme.

Each component implements a base class 'sectionClass', which implements some extra functionality, such as refreshing the section DOM through shopify section rendering api, and more.

 <details>
    <summary> Here's why you should use it use it </summary>
    &nbsp;  

* Guided 'config.yml' creation.
* Auto adding 'Bundle.js' & bundle.css' to theme.liquid.
* Components framework:
    * Create new components from the CLI.
    * Auto adding new components translation keys to scheme.
    * Dedicated 'component' sub dir inside 'components' dir.
    * Separation of liquid view and scheme, rendering from comp json file.
    * comp.liquid/comp.ts/comp.scss compilations.
    * Use liquid vars in comp ts/scss.
    * Use media query variables in comp scss & global css.
    * Base sectionClass initialized on each comp - gives you access in JS to:
        * Section element.
        * Section elements as html and as objects (for elements with 'id' attr).
        * Section refresh function (see Shopify's [section rendering api](https://shopify.dev/api/section-rendering/).
        * Section elements refresh function (see shopify [section rendering api](https://shopify.dev/api/section-rendering/).
        * Access to all sections from the 'window.sections' array - allowing to run section specific functions - for example: sections[sectionName].refresh().


</details>

<!-- GETTING STARTED -->
# Getting Started

Just grab the compiled 'toolbox.js' from 'dist' dir.

For developers - ToolboxJS can be built from 'src' dir.

## Development

If you want to build the project on your own:


1. Clone the repo
   
      ```properties
   git clone https://github.com/sounds-good-agency/shopify-toolbox.git
   ```
2. Install node packages

    ```properties
    npm install
    ```
3. Run the build script

    ```properties
    node toolbox.build
    ```

## Usage

Check the video tutorial [here](https://youtu.be/qThgFJW2X6A).


To use toolbox.js in your Shopify project, simply:

1. Copy 'toolbox.js' from 'dist' to YOUR project folder

2. Run the toolbox script
    ```properties
    node toolbox
    ```
3. Go through the instructions showed in the console
4. Run watch
    ```properties
    npm run watch
    ```
5. Use the CLI to create new components
    ```properties
    npm run section [NAME]
    ```

## Adding 3rd party libraries from npm
1. Install package from npm
    ```javascript
    npm i slick-carousel
    ```
2. Add JS import in 'libs.js'

    ```javascript
    import * as slick from 'slick-carousel';
    window.slick = slick;
    ```
3. Add CSS import in 'theme.css' (if required for library)

    ```css
    @import '../node_modules/slick-carousel/slick/slick.css';
   ```

## Using media-query-variable
* Variables are configured in '_variables.css' and available anywhere in the CSS/SCSS 

    ```css
    @custom-media --very-large-and-up (min-width: 1440px);
    @custom-media --large-and-up (min-width: 1280px);
    @custom-media --large-and-down (max-width: 1279px);
    @custom-media --medium-and-up (min-width: 1024px);
    @custom-media --medium-and-down (max-width: 1023px);
    @custom-media --small-and-up (min-width: 768px);
    @custom-media --small-and-down (max-width: 767px);
    ```
* Usage

    ```scss
    @media (--small-and-up) {
        .some-class{
            
        }
    }
        @media (--medium-and-down) {
        .some-class{
            
        }
    }
    ```

## ThemeKit npm commands
1. ThemeKit get
   
    ```properties
    npm run themeget
    ```
2. ThemeKit deploy
   
    ```properties
    npm run themedeploy
    ```
3. ThemeKit open
   
    ```properties
    npm run themeopen
    ```
    


<!-- CONTRIBUTING -->
# Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


See the [open issues](https://github.com/sounds-good-agency/shopify-toolbox/issues) for a full list of proposed features (and known issues).
<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[Shopify.com]: https://img.shields.io/badge/Shopify-7AB55C?style=flat&logo=Shopify&logoColor=white
[Shopify-url]: https://www.Shopify.com/

[nodejs.com]: https://img.shields.io/badge/Node.js-339933?style=flat&logo=Node.js&logoColor=white
[nodejs-url]: https://nodejs.org/

[npm.com]: https://img.shields.io/badge/npm-CB3837?style=flat&logo=npm&logoColor=white
[npm-url]: https://www.npmjs.com/

[Webpack.com]: https://img.shields.io/badge/Webpack-8DD6F9?style=flat&logo=Webpack&logoColor=white
[Webpack-url]: https://webpack.js.org/

[babeljs.com]: https://img.shields.io/badge/babel-F9DC3E?style=flat&logo=babel&logoColor=white
[babeljs-url]: https://babeljs.io/

[TypeScript.com]: https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=TypeScript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/

[ESLint.com]: https://img.shields.io/badge/ESLint-4B32C3?style=flat&logo=ESLint&logoColor=white
[ESLint-url]: https://eslint.org/

[sass.com]: https://img.shields.io/badge/sass-CC6699?style=flat&logo=sass&logoColor=white
[sass-url]: https://sass-lang.com/

[PostCSS.com]: https://img.shields.io/badge/PostCSS-DD3A0A?style=flat&logo=PostCSS&logoColor=white
[PostCSS-url]: https://postcss.org/

[stylelint.com]: https://img.shields.io/badge/stylelint-263238?style=flat&logo=stylelint&logoColor=white
[stylelint-url]: https://stylelint.io/

[Mocha.com]: https://img.shields.io/badge/Mocha-8D6748?style=flat&logo=Mocha&logoColor=white
[Mocha-url]: https://mochajs.org/
