// include node fs module
var fs = require('fs');

// include node readline module
const readline = require("readline");
// readline interface config
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// include node util module
const util = require('util');
// wrap readline in promise to make it sync
const question = util.promisify(rl.question).bind(rl);

// color console func
log = async function (text, mode) {
  switch (mode) {
    case 'success':
      mode = '\x1b[32m';
      break;
    case 'error':
      mode = '\x1b[31m';
      break;
    case 'info':
      mode = '\x1b[35m';
      break;
    case 'warning':
      mode = '\x1b[33m';
      break;
    default:
      mode = '';
      break;
  }

  console.log(mode + text + '\x1b[0m');
}

// for user prompt(y/n) => add js script tag to theme.liquid
addJsScriptTagToThemeLiquid = async function (name) {

  var themeFile = fs.readFileSync("layout/theme.liquid", 'utf8');

  if (themeFile.includes(`<script src="{{ '${name}.js' | asset_url }}"></script>`)) {
    log(`[SKIP] - ${name}.js script tag already added to theme.liquid`, 'error');
  }
  else {
    themeFile = themeFile.replace('</head>', `<script src="{{ '${name}.js' | asset_url }}" defer="defer"></script>\n</head>`);

    fs.writeFileSync('layout/theme.liquid', themeFile);

    log(`[ADDED] - ${name}.js script tag added to theme.liquid`, 'success');
  }
}

// for user prompt(y/n) => add css style tag to theme.liquid
addJsStyleTagToThemeLiquid = async function (name) {

  var themeFile = fs.readFileSync("layout/theme.liquid", 'utf8');

  if (themeFile.includes(`<style>{% render '${name}.css' %}</style>`)) {
    log(`[SKIP] - ${name}.css style tag already added to theme.liquid`, 'error');
  }
  else {
    themeFile = themeFile.replace('</head>', `<style>{% render '${name}.css' %}</style>\n</head>`);

    fs.writeFileSync('layout/theme.liquid', themeFile);

    log(`[ADDED] - ${name}.css style tag added to theme.liquid`, 'success');
  }
}

// create all necessary files
createFiles = async function (configYml) {


  // liquid content
  const liquidContent = `\`
<\${formattedName} is="\${formattedName}" class="\${formattedName}" id="{{ section.id }}">
    <h1 class="\${formattedName}-title">{{ section.settings.title }}</h1>
    <img class="\${formattedName}-image" src="{{ section.settings.image | img_url: '400x' }}">
</\${formattedName}>\``;

  // scss content
  const scssContent = `\`
    .\${formattedName} {
        .\${formattedName}-title {
            font-size: '{{ section.settings.fontsize_title | append: "px" }}';
            line-height: '{{ section.settings.lineheight_title | append: "px" }}';
        }

        .\${formattedName}-image {}
    }\``;

  // typescript content
  const tsContent = `\`
// // needed for css compilation
import './\${formattedName}.scss';

// // base class for component
import sectionClass from '../../js/helpers/sectionClass';

// // create section class from base
const \${name}SectionId = "{{ section.id }}";

class \${name} extends sectionClass {
    constructor() {
        super('\${name}', \${name}SectionId);

        // on load code goes here

    }

    // set functions on the component scope
    // it will be accessible from 'sections.\${name}Section' global object
    someFunction = function () {
        // access component elements by id - for example
        this.someID.innerHTML = 'Hello World';

        // call this to refresh the section - reload html from shopify
        this.refresh();
    }

    // refresh finish event
    onRefreshFinish = function (htmlElement) {
        console.log('onRefreshFinish - \${name}Section:' + htmlElement.outerHTML);
    }

}

if (!customElements.get('\${formattedName}')) {
    // Define the '\${formattedName}' component here
    customElements.define('\${formattedName}', \${name} );
}\``;

  // scheme content
  const schemeContent = `\`
{
    "name": "t:sections.\${formattedName}.name",
    "settings": [
        {
            "type": "text",
            "id": "title",
            "label": "t:sections.\${formattedName}.settings.title",
            "default": "\${formattedName} Title"
        },
        {
            "type": "range",
            "id": "fontsize_title",
            "label": "t:sections.\${formattedName}.settings.fontsize_title",
            "min": 6,
            "max": 60,
            "step": 1,
            "unit": "px",
            "default": 16
        },
        {
            "type": "range",
            "id": "lineheight_title",
            "label": "t:sections.\${formattedName}.settings.lineheight_title",
            "min": 6,
            "max": 60,
            "step": 1,
            "unit": "px",
            "default": 16
        },
        {
            "type": "image_picker",
            "id": "image",
            "label": "t:sections.\${formattedName}.settings.image"
        }
    ],
    "presets": [
        {
            "name": "t:sections.\${formattedName}.name",
            "category": "text"
        }
    ]
}\``;

  let filesToCreate = [
    {
      name: '.mocharc.json', content: `
{
    "diff": true,
    "extension": ["js", "ts"],
    "package": "./package.json",
    "reporter": "spec",
    "require": "ts-node/register",
    "recursive": true,
    "slow": 75,
    "timeout": 60000,
    "ui": "bdd",
    "watch-files": ["src/**/*.js", "src/**/*.ts", "test/**/*.js", "test/**/*.ts"]
  }`
    },
    {
      name: '.babelrc', content: `

{
    "presets": ["@babel/preset-env", "@babel/preset-typescript"],
    "comments": false
}`
    },
    {
      name: 'tsconfig.testing.json', content: `tsconfig.testing.json-contentTemplateVariable`
    },
    {
      name: 'js/helpers/createSection.js', content: `

// node script to create new section component

// include node fs module
var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));

// name var
var name = argv._[0].replace('-', '_');
if (!name.includes('_')) {
  name = name + '_section';
}
var formattedName = name.replace('_', '-');
var useTS = argv.ts || false;  // Check if --ts flag was passed

// color console func
log = async function (text, mode) {
  switch (mode) {
    case 'success':
    mode = '[32m'; // green
      break;
    case 'error':
      mode = '[31m'; // red
      break;
    case 'info':
      mode = '[35m'; // purple
      break;
    case 'warning':
      mode = '[33m'; // yellow
      break;
    default:
      mode = '';
      break;
  }

  console.log(mode + text + '[0m');
}

// create component files
createComponent = async function () {
  // create 'components' folder if does not exist
  if (!fs.existsSync('../../components')) {
    fs.mkdirSync('../../components');
  }

  // create the COMP folder inside 'components' folder
  fs.mkdirSync('../../components/' + formattedName);

  // liquid content
  const liquidContent = ${ liquidContent };

  // scss content
  const scssContent = ${ scssContent };

  // typescript content
  const jsContent = ${ tsContent };

  // schema content
  const schemeContent = ${ schemeContent };

  // decide file extension based on --ts flag
  const fileExtension = useTS ? '.ts' : '.js';

  // create ts/js file
  fs.appendFileSync('../../components/' + formattedName + '/' + formattedName + fileExtension, jsContent);
  log('[ADDED] - ' + formattedName + fileExtension + ' created successfully', 'success');

  // create liquid file
  fs.appendFileSync('../../components/' + formattedName + '/' + formattedName + '.liquid', liquidContent)
  log('[ADDED] - ' + formattedName + '.liquid' + ' created successfully', 'success');

  // create scss file
  fs.appendFileSync('../../components/' + formattedName + '/' + formattedName + '.scss', scssContent)
  log('[ADDED] - ' + formattedName + '.scss' + ' created successfully', 'success');


  // create json file
  fs.appendFileSync('../../components/' + formattedName + '/' + formattedName + '.json', schemeContent);
  log('[ADDED] - ' + formattedName + '.json' + ' created successfully', 'success');
}

// and translation keys
addTranslationKeys = async function () {

  const fileName = '../../locales/en.default.schema.json';
  const file = require(fileName);

  file.sections[formattedName] = {
    "name": formattedName,
    "settings": {
      "title": formattedName + " Title",
      "fontsize_title": formattedName + " Title Font-Size",
      "lineheight_title": formattedName + " Line-Height",
      "image": formattedName + " Image"
    }
  };

  await fs.writeFileSync(fileName, JSON.stringify(file, null, 2));
  log('[ADDED] - ' + formattedName + ' section' + ' translation keys added successfully', 'success');

}

// get OS specific command path 
function getCommandLine() {
  switch (process.platform) {
    case 'darwin': return 'open';
    case 'win32': return 'start';
    case 'win64': return 'start';
    default: return 'xdg-open';
  }
}

init = async function () {

  await createComponent();

  // open liquid file in vscode
  var exec = require('child_process').exec;
  exec(getCommandLine() + '../../components/' + formattedName + '/' + formattedName + '.liquid');

  // component files ready
  log('[CREATED] - ' + formattedName + ' section' + ' files successfully created', 'info');

  // npm run watch
  var npmLog = exec('npm run watch');

  await new Promise(resolve => {
    npmLog.stdout.on('data', function (data) {
      // log 'npm run watch' output to console
      if (data.length > 4) {
        console.log(data);

        // wait for theme watch to be ready before updating translation keys
        data.includes('[dev]') ? resolve() : null;
      }
    });
  });

  await addTranslationKeys();

  // component uploaded to shopify - and ready to use in customizer
  log('[UPLOADED] - ' + formattedName + ' section' + ' was successfully uploaded to Shopify', 'info');

};

init();`
    },
    {
      name: `.browserslistrc`, content: `
IE 11`
    },
    {
      name: `js/theme.js`, content: `
import '../css/theme.css';

// import './globals';

import './libs';

// import './partials/navigation';`
    },
    {
      name: `js/libs.js`, content: `
// jquery - https://jquery.com
// import * as jquery from 'jquery';
// window.$ = jquery;
// window.jQuery = jquery;


// slick carousel - https://kenwheeler.github.io/slick/
// import * as slick from 'slick-carousel';
// window.slick = slick;`
    },
    {
      name: `js/globals.js`, content: `
window.globals = {
    
    // declare global functions here - to be accessed from the 'globals' object
    // init: function() {
        // console.log('global init');
    // }

};
`
    },
    {
      name: `js/helpers/ReplaceInFileWebpackPluginCustom.js`, content: `

// original plugin didn't check for change before writing to file, this triggered the 'themekit' watch on all files.
'use strict';

const path = require('path');
const fs = require('fs');

function getAllFiles(root) {
	var res = [],
		files = fs.readdirSync(root);
	files.forEach(function (file) {
		var pathname = root + '/' + file,
			stat = fs.lstatSync(pathname);

		if (!stat.isDirectory()) {
			res.push(pathname);
		} else {
			res = res.concat(getAllFiles(pathname));
		}
	});
	return res
}

function replace(file, rules) {
	const src = path.resolve(file);
	let template = fs.readFileSync(src, 'utf8');
	let newTemplate;
	newTemplate = rules.reduce(
		(template, rule) => template.replace(
			rule.search, (typeof rule.replace === 'string' ? rule.replace : rule.replace.bind(global))
		),
		template
	);

	if (newTemplate != template) {
		fs.writeFileSync(src, newTemplate);
	}
}


function ReplaceInFilePlugin(options = []) {
	this.options = options;
};

ReplaceInFilePlugin.prototype.apply = function (compiler) {
	const root = compiler.options.context;
	const done = (statsData) => {
		if (statsData.hasErrors()) {
			return
		}
		this.options.forEach(option => {
			const dir = option.dir || root;
			const files = option.files;

			if (option.files) {
				const files = option.files;
				if (Array.isArray(files) && files.length) {
					files.forEach(file => {
						replace(path.resolve(dir, file), option.rules);
					})
				}
			} else if (option.test) {
				const test = option.test;
				const testArray = Array.isArray(test) ? test : [test];
				const files = getAllFiles(dir);

				files.forEach(file => {
					const match = testArray.some((test, index, array) => {
						return test.test(file);
					})

					if (!match) {
						return;
					}

					replace(file, option.rules);
				})
			} else {
				const files = getAllFiles(dir);
				files.forEach(file => {
					replace(file, option.rules);
				})
			}
		})
	}

	if (compiler.hooks) {
		const plugin = {
			name: "ReplaceInFilePlugin"
		};
		compiler.hooks.done.tap(plugin, done);
	} else {
		compiler.plugin('done', done);
	}
};

module.exports = ReplaceInFilePlugin;
        `
    },
    {
      name: `js/helpers/sectionClass.js`, content: `
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
}`
    },
    {
      name: `js/partials/navigation.js`, content: `
`
    },
    {
      name: `css/defs/_variables.css`, content: `
  /* Write your styles here */

  :root {
    /*
     example of liquid variable usage:
    --color-white: '{{ settings.colors_text_white }}';
    --product-title-font-size : '{{ settings.product_title_font_size | append: 'px' }}';
    */
}

/* https://github.com/postcss/postcss-custom-media */

@custom-media --very-large-and-up (min-width: 1440px);
@custom-media --large-and-up (min-width: 1280px);
@custom-media --large-and-down (max-width: 1279px);
@custom-media --medium-and-up (min-width: 1024px);
@custom-media --medium-and-down (max-width: 1023px);
@custom-media --small-and-up (min-width: 768px);
@custom-media --small-and-down (max-width: 767px);
    `
    },
    {
      name: `css/theme.css`, content: `
  /* libs */
  /* @import '../node_modules/slick-carousel/slick/slick.css'; */

  /* Definitions */

  @import './defs/_variables.css';
  
  /* Partials */
  
   /* @import './partials/_typo.css'; */
   /* @import './partials/_utils.css'; */
  
  /* Pages */
  
   /* @import './pages/_cart.css'; */
    `
    },
    {
      name: `.eslintignore`, content: `
core/
js/vendor/
`
    },
    {
      name: `.eslintrc`, content: `
{
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": "airbnb-base",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "semi": ["warn", "always"],
        "indent": ["error", "tab", {"SwitchCase": 1}],
        "arrow-parens": ["warn", "always"],
        "comma-dangle": ["warn", "always-multiline"],
        "quotes": ["warn", "single"],
        "no-tabs": "off",
        "no-console": "off",
        "no-useless-escape": "warn",
        "no-param-reassign": ["error", {"props": false}],
        "object-curly-newline": ["warn", {"multiline": true}],
        "object-curly-spacing": ["warn", "never"],
        "operator-linebreak": ["warn", "before"],
        "space-before-function-paren": ["warn", {
            "anonymous": "always",
            "named": "never",
            "asyncArrow": "always"
        }]
    },
    "globals": {
        "gsap": "readonly",
        "ScrollTrigger": "readonly",
        "FloatingUI": "readonly"
    }
}
`
    },
    {
      name: `.eslintrc.json`, content: `
{
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "google"
    ],
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "rules": {
        "indent": ["error", 4]
    }
}
`
    },
    {
      name: `.gitignore`, content: `
config.yml
node_modules/
.vscode/`
    },
    {
      name: `.shopifyignore`, content: `
config/settings_data.json`
    },
    {
      name: `.stylelintignore`, content: `
core/`
    },
    {
      name: `.stylelintrc.json`, content: `
{
    "extends": "stylelint-config-standard",
    "plugins": [
        "stylelint-scss",
        "stylelint-order"
    ],
    "rules": {
        "selector-max-id": 1,
        "color-hex-length": "long",
        "indentation": "tab",
        "function-comma-space-after": "always-single-line",
        "number-leading-zero": "always",
        "selector-pseudo-element-colon-notation": "double",
        "string-quotes": "single",
        "declaration-colon-space-after": "always-single-line",
        "at-rule-empty-line-before": [
            "always", {
                "except": ["blockless-after-same-name-blockless", "first-nested"],
                "ignore": ["after-comment"],
                "ignoreAtRules": ["else"]
            }
        ],
        "max-nesting-depth": [
            3,
            {
                "ignoreAtRules": [
                    "each",
                    "media",
                    "supports",
                    "include"
                ]
            }
        ],
        "rule-empty-line-before": [
            "always", {
                "ignore": ["first-nested", "after-comment"]
            }
        ],
        "order/order": [
            "custom-properties",
            "dollar-variables",
            {
                "type": "at-rule",
                "name": "extend"
            },
            {
                "type": "at-rule",
                "name": "include",
                "hasBlock": false
            },
            "declarations",
            "rules",
            {
                "type": "at-rule",
                "name": "include",
                "parameter": "breakpoint"
            }
        ],
        "order/properties-alphabetical-order": null
    }
}
`
    },
    {
      name: `babel.config.json`, content: `
{
    "presets": [
        [
            "@babel/env",
            {
                "useBuiltIns": "usage",
                "corejs": "3.6.5"
            }
        ]
    ]
}
`
    },
    {
      name: `Makefile`, content: `
.PHONY: all build clean install watch zip
.NOTPARALLEL:

DIRS = assets config layout locales sections snippets templates
LAST_TAG = $(shell git describe --tags)

ifeq ($(LAST_TAG),)
LAST_TAG=devel
endif

build:
	npm run build

clean:
	rm -rf *.zip

install:
	npm install

lint:
	npm run lint

watch:
	npm run watch

zip: build
	@echo "Creating $(LAST_TAG).zip..."
	zip -qr $(LAST_TAG).zip $(DIRS)`
    },
    {
      name: 'package-lock.json', content: `
{
  "name": "shopify-toolbox",
  "version": "1.1.1",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "shopify-toolbox",
      "version": "1.1.1",
      "license": "ISC",
      "dependencies": {
        "@floating-ui/dom": "^0.4.4",
        "bourbon": "^7.2.0",
        "foundation-sites": "^6.7.4",
        "gsap": "^3.10.2",
        "jquery": "^3.6.1",
        "normalize-scss": "^7.0.1",
        "rfs": "^9.0.6",
        "shopify-frontend-api": "github:ohmybrew/Shopify-Frontend-Helper",
        "slick-carousel": "^1.8.1"
      },
      "devDependencies": {
        "@babel/core": "^7.19.3",
        "@babel/preset-env": "^7.19.4",
        "@babel/preset-typescript": "^7.18.6",
        "@types/mocha": "^10.0.0",
        "autoprefixer": "^10.4.4",
        "babel-loader": "^8.2.5",
        "concurrently": "^7.1.0",
        "copy-webpack-plugin": "^11.0.0",
        "core-js": "^3.21.1",
        "css-loader": "^6.7.1",
        "cssnano": "^5.1.7",
        "eslint": "^8.12.0",
        "eslint-config-google": "^0.14.0",
        "glob": "^7.2.0",
        "mini-css-extract-plugin": "^2.6.0",
        "mocha": "^10.0.0",
        "node-sass": "^7.0.1",
        "normalize.css": "^8.0.1",
        "postcss": "^8.4.12",
        "postcss-css-variables": "^0.18.0",
        "postcss-custom-media": "^8.0.0",
        "postcss-discard-comments": "^5.1.1",
        "postcss-flexbugs-fixes": "^5.0.2",
        "postcss-import": "^14.1.0",
        "postcss-loader": "^6.2.1",
        "postcss-nested": "^5.0.6",
        "postcss-preset-env": "^7.4.3",
        "postcss-scss": "^4.0.3",
        "sass": "^1.49.11",
        "sass-loader": "^12.6.0",
        "string-replace-loader": "^3.1.0",
        "style-loader": "^3.3.1",
        "stylelint": "^14.14.0",
        "stylelint-config-standard": "^29.0.0",
        "stylelint-order": "^5.0.0",
        "stylelint-scss": "^4.2.0",
        "ts-node": "^10.9.1",
        "typescript": "^4.8.4",
        "webpack": "^5.74.0",
        "webpack-cli": "^4.9.2",
        "webpack-remove-empty-scripts": "^0.8.0"
      }
    },
    "node_modules/@ampproject/remapping": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@ampproject/remapping/-/remapping-2.2.0.tgz",
      "integrity": "sha512-qRmjj8nj9qmLTQXXmaR1cck3UXSRMPrbsLJAasZpF+t3riI71BXed5ebIOYwQntykeZuhjsdweEc9BxH5Jc26w==",
      "dev": true,
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.1.0",
        "@jridgewell/trace-mapping": "^0.3.9"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.18.6.tgz",
      "integrity": "sha512-TDCmlK5eOvH+eH7cdAFlNXeVJqWIQ7gW9tY1GJIpUtFb6CmjVyq2VM3u71bOyR8CRihcCgMUYoDNyLXao3+70Q==",
      "dev": true,
      "dependencies": {
        "@babel/highlight": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.19.4.tgz",
      "integrity": "sha512-CHIGpJcUQ5lU9KrPHTjBMhVwQG6CQjxfg36fGXl3qk/Gik1WwWachaXFuo0uCWJT/mStOKtcbFJCaVLihC1CMw==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.19.3.tgz",
      "integrity": "sha512-WneDJxdsjEvyKtXKsaBGbDeiyOjR5vYq4HcShxnIbG0qixpoHjI3MqeZM9NDvsojNCEBItQE4juOo/bU6e72gQ==",
      "dev": true,
      "dependencies": {
        "@ampproject/remapping": "^2.1.0",
        "@babel/code-frame": "^7.18.6",
        "@babel/generator": "^7.19.3",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-module-transforms": "^7.19.0",
        "@babel/helpers": "^7.19.0",
        "@babel/parser": "^7.19.3",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.3",
        "@babel/types": "^7.19.3",
        "convert-source-map": "^1.7.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.1",
        "semver": "^6.3.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/core/node_modules/semver": {
      "version": "6.3.0",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.19.3.tgz",
      "integrity": "sha512-fqVZnmp1ncvZU757UzDheKZpfPgatqY59XtW2/j/18H7u76akb8xqvjw82f+i2UKd/ksYsSick/BCLQUUtJ/qQ==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.19.3",
        "@jridgewell/gen-mapping": "^0.3.2",
        "jsesc": "^2.5.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/generator/node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.2.tgz",
      "integrity": "sha512-mh65xKQAzI6iBcFzwv28KVWSmCkdRBWoOh+bYQGW3+6OZvbbN3TqMGo5hqYxQniRcH9F2VZIoJCm4pa3BPDK/A==",
      "dev": true,
      "dependencies": {
        "@jridgewell/set-array": "^1.0.1",
        "@jridgewell/sourcemap-codec": "^1.4.10",
        "@jridgewell/trace-mapping": "^0.3.9"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.18.6.tgz",
      "integrity": "sha512-duORpUiYrEpzKIop6iNbjnwKLAKnJ47csTyRACyEmWj0QdUrm5aqNJGHSSEQSUAvNW0ojX0dOmK9dZduvkfeXA==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-builder-binary-assignment-operator-visitor": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-builder-binary-assignment-operator-visitor/-/helper-builder-binary-assignment-operator-visitor-7.18.9.tgz",
      "integrity": "sha512-yFQ0YCHoIqarl8BCRwBL8ulYUaZpz3bNsA7oFepAzee+8/+ImtADXNOmO5vJvsPff3qi+hvpkY/NYBTrBQgdNw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-explode-assignable-expression": "^7.18.6",
        "@babel/types": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.19.3.tgz",
      "integrity": "sha512-65ESqLGyGmLvgR0mst5AdW1FkNlj9rQsCKduzEoEPhBCDFGXvz2jW6bXFG6i0/MrV2s7hhXjjb2yAzcPuQlLwg==",
      "dev": true,
      "dependencies": {
        "@babel/compat-data": "^7.19.3",
        "@babel/helper-validator-option": "^7.18.6",
        "browserslist": "^4.21.3",
        "semver": "^6.3.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets/node_modules/semver": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
      "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
      "dev": true,
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/helper-create-class-features-plugin": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-class-features-plugin/-/helper-create-class-features-plugin-7.19.0.tgz",
      "integrity": "sha512-NRz8DwF4jT3UfrmUoZjd0Uph9HQnP30t7Ash+weACcyNkiYTywpIjDBgReJMKgr+n86sn2nPVVmJ28Dm053Kqw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-member-expression-to-functions": "^7.18.9",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/helper-replace-supers": "^7.18.9",
        "@babel/helper-split-export-declaration": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-create-regexp-features-plugin": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-regexp-features-plugin/-/helper-create-regexp-features-plugin-7.19.0.tgz",
      "integrity": "sha512-htnV+mHX32DF81amCDrwIDr8nrp1PTm+3wfBN9/v8QJOLEioOCOG7qNyq0nHeFiWbT3Eb7gsPwEmV64UCQ1jzw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "regexpu-core": "^5.1.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-define-polyfill-provider": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-define-polyfill-provider/-/helper-define-polyfill-provider-0.3.3.tgz",
      "integrity": "sha512-z5aQKU4IzbqCC1XH0nAqfsFLMVSo22SBKUc0BxGrLkolTdPTructy0ToNnlO2zA4j9Q/7pjMZf0DSY+DSTYzww==",
      "dev": true,
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.17.7",
        "@babel/helper-plugin-utils": "^7.16.7",
        "debug": "^4.1.1",
        "lodash.debounce": "^4.0.8",
        "resolve": "^1.14.2",
        "semver": "^6.1.2"
      },
      "peerDependencies": {
        "@babel/core": "^7.4.0-0"
      }
    },
    "node_modules/@babel/helper-define-polyfill-provider/node_modules/semver": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
      "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
      "dev": true,
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/helper-environment-visitor": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-environment-visitor/-/helper-environment-visitor-7.18.9.tgz",
      "integrity": "sha512-3r/aACDJ3fhQ/EVgFy0hpj8oHyHpQc+LPtJoY9SzTThAsStm4Ptegq92vqKoE3vD706ZVFWITnMnxucw+S9Ipg==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-explode-assignable-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-explode-assignable-expression/-/helper-explode-assignable-expression-7.18.6.tgz",
      "integrity": "sha512-eyAYAsQmB80jNfg4baAtLeWAQHfHFiR483rzFK+BhETlGZaQC9bsfrugfXDCbRHLQbIA7U5NxhhOxN7p/dWIcg==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-function-name": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-function-name/-/helper-function-name-7.19.0.tgz",
      "integrity": "sha512-WAwHBINyrpqywkUH0nTnNgI5ina5TFn85HKS0pbPDfxFfhyR/aNQEn4hGi1P1JyT//I0t4OgXUlofzWILRvS5w==",
      "dev": true,
      "dependencies": {
        "@babel/template": "^7.18.10",
        "@babel/types": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-hoist-variables": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-hoist-variables/-/helper-hoist-variables-7.18.6.tgz",
      "integrity": "sha512-UlJQPkFqFULIcyW5sbzgbkxn2FKRgwWiRexcuaR8RNJRy8+LLveqPjwZV/bwrLZCN0eUHD/x8D0heK1ozuoo6Q==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-member-expression-to-functions": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-member-expression-to-functions/-/helper-member-expression-to-functions-7.18.9.tgz",
      "integrity": "sha512-RxifAh2ZoVU67PyKIO4AMi1wTenGfMR/O/ae0CCRqwgBAt5v7xjdtRw7UoSbsreKrQn5t7r89eruK/9JjYHuDg==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-imports": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.18.6.tgz",
      "integrity": "sha512-0NFvs3VkuSYbFi1x2Vd6tKrywq+z/cLeYC/RJNFrIX/30Bf5aiGYbtvGXolEktzJH8o5E5KJ3tT+nkxuuZFVlA==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-module-transforms": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.19.0.tgz",
      "integrity": "sha512-3HBZ377Fe14RbLIA+ac3sY4PTgpxHVkFrESaWhoI5PuyXPBBX8+C34qblV9G89ZtycGJCmCI/Ut+VUDK4bltNQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-module-imports": "^7.18.6",
        "@babel/helper-simple-access": "^7.18.6",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "@babel/helper-validator-identifier": "^7.18.6",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-optimise-call-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-optimise-call-expression/-/helper-optimise-call-expression-7.18.6.tgz",
      "integrity": "sha512-HP59oD9/fEHQkdcbgFCnbmgH5vIQTJbxh2yf+CdM89/glUNnuzr87Q8GIjGEnOktTROemO0Pe0iPAYbqZuOUiA==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-plugin-utils": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.19.0.tgz",
      "integrity": "sha512-40Ryx7I8mT+0gaNxm8JGTZFUITNqdLAgdg0hXzeVZxVD6nFsdhQvip6v8dqkRHzsz1VFpFAaOCHNn0vKBL7Czw==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-remap-async-to-generator": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-remap-async-to-generator/-/helper-remap-async-to-generator-7.18.9.tgz",
      "integrity": "sha512-dI7q50YKd8BAv3VEfgg7PS7yD3Rtbi2J1XMXaalXO0W0164hYLnh8zpjRS0mte9MfVp/tltvr/cfdXPvJr1opA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-wrap-function": "^7.18.9",
        "@babel/types": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/helper-replace-supers": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-replace-supers/-/helper-replace-supers-7.19.1.tgz",
      "integrity": "sha512-T7ahH7wV0Hfs46SFh5Jz3s0B6+o8g3c+7TMxu7xKfmHikg7EAZ3I2Qk9LFhjxXq8sL7UkP5JflezNwoZa8WvWw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-member-expression-to-functions": "^7.18.9",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/traverse": "^7.19.1",
        "@babel/types": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-simple-access": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-simple-access/-/helper-simple-access-7.18.6.tgz",
      "integrity": "sha512-iNpIgTgyAvDQpDj76POqg+YEt8fPxx3yaNBg3S30dxNKm2SWfYhD0TGrK/Eu9wHpUW63VQU894TsTg+GLbUa1g==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-skip-transparent-expression-wrappers": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-skip-transparent-expression-wrappers/-/helper-skip-transparent-expression-wrappers-7.18.9.tgz",
      "integrity": "sha512-imytd2gHi3cJPsybLRbmFrF7u5BIEuI2cNheyKi3/iOBC63kNn3q8Crn2xVuESli0aM4KYsyEqKyS7lFL8YVtw==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-split-export-declaration": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-split-export-declaration/-/helper-split-export-declaration-7.18.6.tgz",
      "integrity": "sha512-bde1etTx6ZyTmobl9LLMMQsaizFVZrquTEHOqKeQESMKo4PlObf+8+JA25ZsIpZhT/WEd39+vOdLXAFG/nELpA==",
      "dev": true,
      "dependencies": {
        "@babel/types": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-string-parser": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.19.4.tgz",
      "integrity": "sha512-nHtDoQcuqFmwYNYPz3Rah5ph2p8PFeFCsZk9A/48dPc/rGocJ5J3hAAZ7pb76VWX3fZKu+uEr/FhH5jLx7umrw==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-identifier": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.19.1.tgz",
      "integrity": "sha512-awrNfaMtnHUr653GgGEs++LlAvW6w+DcPrOliSMXWCKo597CwL5Acf/wWdNkf/tfEQE3mjkeD1YOVZOUV/od1w==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-validator-option": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.18.6.tgz",
      "integrity": "sha512-XO7gESt5ouv/LRJdrVjkShckw6STTaB7l9BrpBaAHDeF5YZT+01PCwmR0SJHnkW6i8OwW/EVWRShfi4j2x+KQw==",
      "dev": true,
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-wrap-function": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-wrap-function/-/helper-wrap-function-7.19.0.tgz",
      "integrity": "sha512-txX8aN8CZyYGTwcLhlk87KRqncAzhh5TpQamZUa0/u3an36NtDpUP6bQgBCBcLeBs09R/OwQu3OjK0k/HwfNDg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-function-name": "^7.19.0",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helpers": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.19.0.tgz",
      "integrity": "sha512-DRBCKGwIEdqY3+rPJgG/dKfQy9+08rHIAJx8q2p+HSWP87s2HCrQmaAMMyMll2kIXKCW0cO1RdQskx15Xakftg==",
      "dev": true,
      "dependencies": {
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/highlight": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/highlight/-/highlight-7.18.6.tgz",
      "integrity": "sha512-u7stbOuYjaPezCuLj29hNW1v64M2Md2qupEKP1fHc7WdOA3DgLh37suiSrZYY7haUB7iBeQZ9P1uiRF359do3g==",
      "dev": true,
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.18.6",
        "chalk": "^2.0.0",
        "js-tokens": "^4.0.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/parser": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.19.3.tgz",
      "integrity": "sha512-pJ9xOlNWHiy9+FuFP09DEAFbAn4JskgRsVcc169w2xRBC3FRGuQEwjeIMMND9L2zc0iEhO/tGv4Zq+km+hxNpQ==",
      "dev": true,
      "bin": {
        "parser": "bin/babel-parser.js"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression/-/plugin-bugfix-safari-id-destructuring-collision-in-function-expression-7.18.6.tgz",
      "integrity": "sha512-Dgxsyg54Fx1d4Nge8UnvTrED63vrwOdPmyvPzlNN/boaliRP54pm3pGzZD1SJUwrBA+Cs/xdG8kXX6Mn/RfISQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining/-/plugin-bugfix-v8-spread-parameters-in-optional-chaining-7.18.9.tgz",
      "integrity": "sha512-AHrP9jadvH7qlOj6PINbgSuphjQUAK7AOT7DPjBo9EHoLhQTnnK5u45e1Hd4DbSQEO9nqPWtQ89r+XEOWFScKg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9",
        "@babel/plugin-proposal-optional-chaining": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.13.0"
      }
    },
    "node_modules/@babel/plugin-proposal-async-generator-functions": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-async-generator-functions/-/plugin-proposal-async-generator-functions-7.19.1.tgz",
      "integrity": "sha512-0yu8vNATgLy4ivqMNBIwb1HebCelqN7YX8SL3FDXORv/RqT0zEEWUCH4GH44JsSrvCu6GqnAdR5EBFAPeNBB4Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-remap-async-to-generator": "^7.18.9",
        "@babel/plugin-syntax-async-generators": "^7.8.4"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-class-properties": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-class-properties/-/plugin-proposal-class-properties-7.18.6.tgz",
      "integrity": "sha512-cumfXOF0+nzZrrN8Rf0t7M+tF6sZc7vhQwYQck9q1/5w2OExlD+b4v4RpMJFaV1Z7WcDRgO6FqvxqxGlwo+RHQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-class-static-block": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-class-static-block/-/plugin-proposal-class-static-block-7.18.6.tgz",
      "integrity": "sha512-+I3oIiNxrCpup3Gi8n5IGMwj0gOCAjcJUSQEcotNnCCPMEnixawOQ+KeJPlgfjzx+FKQ1QSyZOWe7wmoJp7vhw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-class-static-block": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.12.0"
      }
    },
    "node_modules/@babel/plugin-proposal-dynamic-import": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-dynamic-import/-/plugin-proposal-dynamic-import-7.18.6.tgz",
      "integrity": "sha512-1auuwmK+Rz13SJj36R+jqFPMJWyKEDd7lLSdOj4oJK0UTgGueSAtkrCvz9ewmgyU/P941Rv2fQwZJN8s6QruXw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-dynamic-import": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-export-namespace-from": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-export-namespace-from/-/plugin-proposal-export-namespace-from-7.18.9.tgz",
      "integrity": "sha512-k1NtHyOMvlDDFeb9G5PhUXuGj8m/wiwojgQVEhJ/fsVsMCpLyOP4h0uGEjYJKrRI+EVPlb5Jk+Gt9P97lOGwtA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/plugin-syntax-export-namespace-from": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-json-strings": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-json-strings/-/plugin-proposal-json-strings-7.18.6.tgz",
      "integrity": "sha512-lr1peyn9kOdbYc0xr0OdHTZ5FMqS6Di+H0Fz2I/JwMzGmzJETNeOFq2pBySw6X/KFL5EWDjlJuMsUGRFb8fQgQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-json-strings": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-logical-assignment-operators": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-logical-assignment-operators/-/plugin-proposal-logical-assignment-operators-7.18.9.tgz",
      "integrity": "sha512-128YbMpjCrP35IOExw2Fq+x55LMP42DzhOhX2aNNIdI9avSWl2PI0yuBWarr3RYpZBSPtabfadkH2yeRiMD61Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/plugin-syntax-logical-assignment-operators": "^7.10.4"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-nullish-coalescing-operator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-nullish-coalescing-operator/-/plugin-proposal-nullish-coalescing-operator-7.18.6.tgz",
      "integrity": "sha512-wQxQzxYeJqHcfppzBDnm1yAY0jSRkUXR2z8RePZYrKwMKgMlE8+Z6LUno+bd6LvbGh8Gltvy74+9pIYkr+XkKA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-nullish-coalescing-operator": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-numeric-separator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-numeric-separator/-/plugin-proposal-numeric-separator-7.18.6.tgz",
      "integrity": "sha512-ozlZFogPqoLm8WBr5Z8UckIoE4YQ5KESVcNudyXOR8uqIkliTEgJ3RoketfG6pmzLdeZF0H/wjE9/cCEitBl7Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-numeric-separator": "^7.10.4"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-object-rest-spread": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-object-rest-spread/-/plugin-proposal-object-rest-spread-7.19.4.tgz",
      "integrity": "sha512-wHmj6LDxVDnL+3WhXteUBaoM1aVILZODAUjg11kHqG4cOlfgMQGxw6aCgvrXrmaJR3Bn14oZhImyCPZzRpC93Q==",
      "dev": true,
      "dependencies": {
        "@babel/compat-data": "^7.19.4",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/plugin-syntax-object-rest-spread": "^7.8.3",
        "@babel/plugin-transform-parameters": "^7.18.8"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-optional-catch-binding": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-optional-catch-binding/-/plugin-proposal-optional-catch-binding-7.18.6.tgz",
      "integrity": "sha512-Q40HEhs9DJQyaZfUjjn6vE8Cv4GmMHCYuMGIWUnlxH6400VGxOuwWsPt4FxXxJkC/5eOzgn0z21M9gMT4MOhbw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-optional-catch-binding": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-optional-chaining": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-optional-chaining/-/plugin-proposal-optional-chaining-7.18.9.tgz",
      "integrity": "sha512-v5nwt4IqBXihxGsW2QmCWMDS3B3bzGIk/EQVZz2ei7f3NJl8NzAJVvUmpDW5q1CRNY+Beb/k58UAH1Km1N411w==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9",
        "@babel/plugin-syntax-optional-chaining": "^7.8.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-private-methods": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-methods/-/plugin-proposal-private-methods-7.18.6.tgz",
      "integrity": "sha512-nutsvktDItsNn4rpGItSNV2sz1XwS+nfU0Rg8aCx3W3NOKVzdMjJRu0O5OkgDp3ZGICSTbgRpxZoWsxoKRvbeA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-private-property-in-object": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-property-in-object/-/plugin-proposal-private-property-in-object-7.18.6.tgz",
      "integrity": "sha512-9Rysx7FOctvT5ouj5JODjAFAkgGoudQuLPamZb0v1TGLpapdNaftzifU8NTWQm0IRjqoYypdrSmyWgkocDQ8Dw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-private-property-in-object": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-proposal-unicode-property-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-unicode-property-regex/-/plugin-proposal-unicode-property-regex-7.18.6.tgz",
      "integrity": "sha512-2BShG/d5yoZyXZfVePH91urL5wTG6ASZU9M4o03lKK8u8UW1y08OMttBSOADTcJrnPMpvDXRG3G8fyLh4ovs8w==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-async-generators": {
      "version": "7.8.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-async-generators/-/plugin-syntax-async-generators-7.8.4.tgz",
      "integrity": "sha512-tycmZxkGfZaxhMRbXlPXuVFpdWlXpir2W4AMhSJgRKzk/eDlIXOhb2LHWoLpDF7TEHylV5zNhykX6KAgHJmTNw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-properties": {
      "version": "7.12.13",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.12.13"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-class-static-block": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-static-block/-/plugin-syntax-class-static-block-7.14.5.tgz",
      "integrity": "sha512-b+YyPmr6ldyNnM6sqYeMWE+bgJcJpO6yS4QD7ymxgH34GBPNDM/THBh8iunyvKIZztiwLH4CJZ0RxTk9emgpjw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-dynamic-import": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-dynamic-import/-/plugin-syntax-dynamic-import-7.8.3.tgz",
      "integrity": "sha512-5gdGbFon+PszYzqs83S3E5mpi7/y/8M9eC90MRTZfduQOYW76ig6SOSPNe41IG5LoP3FGBn2N0RjVDSQiS94kQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-export-namespace-from": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-export-namespace-from/-/plugin-syntax-export-namespace-from-7.8.3.tgz",
      "integrity": "sha512-MXf5laXo6c1IbEbegDmzGPwGNTsHZmEy6QGznu5Sh2UCWvueywb2ee+CCE4zQiZstxU9BMoQO9i6zUFSY0Kj0Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.3"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-import-assertions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-assertions/-/plugin-syntax-import-assertions-7.18.6.tgz",
      "integrity": "sha512-/DU3RXad9+bZwrgWJQKbr39gYbJpLJHezqEzRzi/BHRlJ9zsQb4CK2CA/5apllXNomwA1qHwzvHl+AdEmC5krQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-json-strings": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-json-strings/-/plugin-syntax-json-strings-7.8.3.tgz",
      "integrity": "sha512-lY6kdGpWHvjoe2vk4WrAapEuBR69EMxZl+RoGRhrFGNYVK8mOPAW8VfbT/ZgrFbXlDNiiaxQnAtgVCZ6jv30EA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-logical-assignment-operators": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-logical-assignment-operators/-/plugin-syntax-logical-assignment-operators-7.10.4.tgz",
      "integrity": "sha512-d8waShlpFDinQ5MtvGU9xDAOzKH47+FFoney2baFIoMr952hKOLp1HR7VszoZvOsV/4+RRszNY7D17ba0te0ig==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-nullish-coalescing-operator": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-nullish-coalescing-operator/-/plugin-syntax-nullish-coalescing-operator-7.8.3.tgz",
      "integrity": "sha512-aSff4zPII1u2QD7y+F8oDsz19ew4IGEJg9SVW+bqwpwtfFleiQDMdzA/R+UlWDzfnHFCxxleFT0PMIrR36XLNQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-numeric-separator": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-numeric-separator/-/plugin-syntax-numeric-separator-7.10.4.tgz",
      "integrity": "sha512-9H6YdfkcK/uOnY/K7/aA2xpzaAgkQn37yzWUMRK7OaPOqOpGS1+n0H5hxT9AUw9EsSjPW8SVyMJwYRtWs3X3ug==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.10.4"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-object-rest-spread": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-object-rest-spread/-/plugin-syntax-object-rest-spread-7.8.3.tgz",
      "integrity": "sha512-XoqMijGZb9y3y2XskN+P1wUGiVwWZ5JmoDRwx5+3GmEplNyVM2s2Dg8ILFQm8rWM48orGy5YpI5Bl8U1y7ydlA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-catch-binding": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-catch-binding/-/plugin-syntax-optional-catch-binding-7.8.3.tgz",
      "integrity": "sha512-6VPD0Pc1lpTqw0aKoeRTMiB+kWhAoT24PA+ksWSBrFtl5SIRVpZlwN3NNPQjehA2E/91FV3RjLWoVTglWcSV3Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-optional-chaining": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-chaining/-/plugin-syntax-optional-chaining-7.8.3.tgz",
      "integrity": "sha512-KoK9ErH1MBlCPxV0VANkXW2/dw4vlbGDrFgz8bmUsBGYkFRcbRwMh6cIJubdPrkxRwuGdtCk0v/wPTKbQgBjkg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.8.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-private-property-in-object": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-private-property-in-object/-/plugin-syntax-private-property-in-object-7.14.5.tgz",
      "integrity": "sha512-0wVnp9dxJ72ZUJDV27ZfbSj6iHLoytYZmh3rFcxNnvsJF3ktkzLDZPy/mA17HGsaQT3/DQsWYX1f1QGWkCoVUg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-top-level-await": {
      "version": "7.14.5",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.14.5"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-syntax-typescript": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.18.6.tgz",
      "integrity": "sha512-mAWAuq4rvOepWCBid55JuRNvpTNf2UGVgoz4JV0fXEKolsVZDzsa4NqCef758WZJj/GDu0gVGItjKFiClTAmZA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-arrow-functions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.18.6.tgz",
      "integrity": "sha512-9S9X9RUefzrsHZmKMbDXxweEH+YlE8JJEuat9FdvW9Qh1cw7W64jELCtWNkPBPX5En45uy28KGvA/AySqUh8CQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-async-to-generator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-to-generator/-/plugin-transform-async-to-generator-7.18.6.tgz",
      "integrity": "sha512-ARE5wZLKnTgPW7/1ftQmSi1CmkqqHo2DNmtztFhvgtOWSDfq0Cq9/9L+KnZNYSNrydBekhW3rwShduf59RoXag==",
      "dev": true,
      "dependencies": {
        "@babel/helper-module-imports": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-remap-async-to-generator": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-block-scoped-functions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoped-functions/-/plugin-transform-block-scoped-functions-7.18.6.tgz",
      "integrity": "sha512-ExUcOqpPWnliRcPqves5HJcJOvHvIIWfuS4sroBUenPuMdmW+SMHDakmtS7qOo13sVppmUijqeTv7qqGsvURpQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-block-scoping": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoping/-/plugin-transform-block-scoping-7.19.4.tgz",
      "integrity": "sha512-934S2VLLlt2hRJwPf4MczaOr4hYF0z+VKPwqTNxyKX7NthTiPfhuKFWQZHXRM0vh/wo/VyXB3s4bZUNA08l+tQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-classes": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-classes/-/plugin-transform-classes-7.19.0.tgz",
      "integrity": "sha512-YfeEE9kCjqTS9IitkgfJuxjcEtLUHMqa8yUJ6zdz8vR7hKuo6mOy2C05P0F1tdMmDCeuyidKnlrw/iTppHcr2A==",
      "dev": true,
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-compilation-targets": "^7.19.0",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-replace-supers": "^7.18.9",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "globals": "^11.1.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-computed-properties": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-computed-properties/-/plugin-transform-computed-properties-7.18.9.tgz",
      "integrity": "sha512-+i0ZU1bCDymKakLxn5srGHrsAPRELC2WIbzwjLhHW9SIE1cPYkLCL0NlnXMZaM1vhfgA2+M7hySk42VBvrkBRw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-destructuring": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-destructuring/-/plugin-transform-destructuring-7.19.4.tgz",
      "integrity": "sha512-t0j0Hgidqf0aM86dF8U+vXYReUgJnlv4bZLsyoPnwZNrGY+7/38o8YjaELrvHeVfTZao15kjR0PVv0nju2iduA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-dotall-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dotall-regex/-/plugin-transform-dotall-regex-7.18.6.tgz",
      "integrity": "sha512-6S3jpun1eEbAxq7TdjLotAsl4WpQI9DxfkycRcKrjhQYzU87qpXdknpBg/e+TdcMehqGnLFi7tnFUBR02Vq6wg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-duplicate-keys": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-keys/-/plugin-transform-duplicate-keys-7.18.9.tgz",
      "integrity": "sha512-d2bmXCtZXYc59/0SanQKbiWINadaJXqtvIQIzd4+hNwkWBgyCd5F/2t1kXoUdvPMrxzPvhK6EMQRROxsue+mfw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-exponentiation-operator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-exponentiation-operator/-/plugin-transform-exponentiation-operator-7.18.6.tgz",
      "integrity": "sha512-wzEtc0+2c88FVR34aQmiz56dxEkxr2g8DQb/KfaFa1JYXOFVsbhvAonFN6PwVWj++fKmku8NP80plJ5Et4wqHw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-builder-binary-assignment-operator-visitor": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-for-of": {
      "version": "7.18.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-for-of/-/plugin-transform-for-of-7.18.8.tgz",
      "integrity": "sha512-yEfTRnjuskWYo0k1mHUqrVWaZwrdq8AYbfrpqULOJOaucGSp4mNMVps+YtA8byoevxS/urwU75vyhQIxcCgiBQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-function-name": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-function-name/-/plugin-transform-function-name-7.18.9.tgz",
      "integrity": "sha512-WvIBoRPaJQ5yVHzcnJFor7oS5Ls0PYixlTYE63lCj2RtdQEl15M68FXQlxnG6wdraJIXRdR7KI+hQ7q/9QjrCQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-compilation-targets": "^7.18.9",
        "@babel/helper-function-name": "^7.18.9",
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-literals": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-literals/-/plugin-transform-literals-7.18.9.tgz",
      "integrity": "sha512-IFQDSRoTPnrAIrI5zoZv73IFeZu2dhu6irxQjY9rNjTT53VmKg9fenjvoiOWOkJ6mm4jKVPtdMzBY98Fp4Z4cg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-member-expression-literals": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-member-expression-literals/-/plugin-transform-member-expression-literals-7.18.6.tgz",
      "integrity": "sha512-qSF1ihLGO3q+/g48k85tUjD033C29TNTVB2paCwZPVmOsjn9pClvYYrM2VeJpBY2bcNkuny0YUyTNRyRxJ54KA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-amd": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-amd/-/plugin-transform-modules-amd-7.18.6.tgz",
      "integrity": "sha512-Pra5aXsmTsOnjM3IajS8rTaLCy++nGM4v3YR4esk5PCsyg9z8NA5oQLwxzMUtDBd8F+UmVza3VxoAaWCbzH1rg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-commonjs": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.18.6.tgz",
      "integrity": "sha512-Qfv2ZOWikpvmedXQJDSbxNqy7Xr/j2Y8/KfijM0iJyKkBTmWuvCA1yeH1yDM7NJhBW/2aXxeucLj6i80/LAJ/Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-simple-access": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-systemjs": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-systemjs/-/plugin-transform-modules-systemjs-7.19.0.tgz",
      "integrity": "sha512-x9aiR0WXAWmOWsqcsnrzGR+ieaTMVyGyffPVA7F8cXAGt/UxefYv6uSHZLkAFChN5M5Iy1+wjE+xJuPt22H39A==",
      "dev": true,
      "dependencies": {
        "@babel/helper-hoist-variables": "^7.18.6",
        "@babel/helper-module-transforms": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-validator-identifier": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-modules-umd": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-umd/-/plugin-transform-modules-umd-7.18.6.tgz",
      "integrity": "sha512-dcegErExVeXcRqNtkRU/z8WlBLnvD4MRnHgNs3MytRO1Mn1sHRyhbcpYbVMGclAqOjdW+9cfkdZno9dFdfKLfQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-named-capturing-groups-regex": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-named-capturing-groups-regex/-/plugin-transform-named-capturing-groups-regex-7.19.1.tgz",
      "integrity": "sha512-oWk9l9WItWBQYS4FgXD4Uyy5kq898lvkXpXQxoJEY1RnvPk4R/Dvu2ebXU9q8lP+rlMwUQTFf2Ok6d78ODa0kw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0"
      }
    },
    "node_modules/@babel/plugin-transform-new-target": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-new-target/-/plugin-transform-new-target-7.18.6.tgz",
      "integrity": "sha512-DjwFA/9Iu3Z+vrAn+8pBUGcjhxKguSMlsFqeCKbhb9BAV756v0krzVK04CRDi/4aqmk8BsHb4a/gFcaA5joXRw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-object-super": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-super/-/plugin-transform-object-super-7.18.6.tgz",
      "integrity": "sha512-uvGz6zk+pZoS1aTZrOvrbj6Pp/kK2mp45t2B+bTDre2UgsZZ8EZLSJtUg7m/no0zOJUWgFONpB7Zv9W2tSaFlA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-replace-supers": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-parameters": {
      "version": "7.18.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-parameters/-/plugin-transform-parameters-7.18.8.tgz",
      "integrity": "sha512-ivfbE3X2Ss+Fj8nnXvKJS6sjRG4gzwPMsP+taZC+ZzEGjAYlvENixmt1sZ5Ca6tWls+BlKSGKPJ6OOXvXCbkFg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-property-literals": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-property-literals/-/plugin-transform-property-literals-7.18.6.tgz",
      "integrity": "sha512-cYcs6qlgafTud3PAzrrRNbQtfpQ8+y/+M5tKmksS9+M1ckbH6kzY8MrexEM9mcA6JDsukE19iIRvAyYl463sMg==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-regenerator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regenerator/-/plugin-transform-regenerator-7.18.6.tgz",
      "integrity": "sha512-poqRI2+qiSdeldcz4wTSTXBRryoq3Gc70ye7m7UD5Ww0nE29IXqMl6r7Nd15WBgRd74vloEMlShtH6CKxVzfmQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "regenerator-transform": "^0.15.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-reserved-words": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-reserved-words/-/plugin-transform-reserved-words-7.18.6.tgz",
      "integrity": "sha512-oX/4MyMoypzHjFrT1CdivfKZ+XvIPMFXwwxHp/r0Ddy2Vuomt4HDFGmft1TAY2yiTKiNSsh3kjBAzcM8kSdsjA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-shorthand-properties": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-shorthand-properties/-/plugin-transform-shorthand-properties-7.18.6.tgz",
      "integrity": "sha512-eCLXXJqv8okzg86ywZJbRn19YJHU4XUa55oz2wbHhaQVn/MM+XhukiT7SYqp/7o00dg52Rj51Ny+Ecw4oyoygw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-spread": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-spread/-/plugin-transform-spread-7.19.0.tgz",
      "integrity": "sha512-RsuMk7j6n+r752EtzyScnWkQyuJdli6LdO5Klv8Yx0OfPVTcQkIUfS8clx5e9yHXzlnhOZF3CbQ8C2uP5j074w==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-sticky-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-sticky-regex/-/plugin-transform-sticky-regex-7.18.6.tgz",
      "integrity": "sha512-kfiDrDQ+PBsQDO85yj1icueWMfGfJFKN1KCkndygtu/C9+XUfydLC8Iv5UYJqRwy4zk8EcplRxEOeLyjq1gm6Q==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-template-literals": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-template-literals/-/plugin-transform-template-literals-7.18.9.tgz",
      "integrity": "sha512-S8cOWfT82gTezpYOiVaGHrCbhlHgKhQt8XH5ES46P2XWmX92yisoZywf5km75wv5sYcXDUCLMmMxOLCtthDgMA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-typeof-symbol": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typeof-symbol/-/plugin-transform-typeof-symbol-7.18.9.tgz",
      "integrity": "sha512-SRfwTtF11G2aemAZWivL7PD+C9z52v9EvMqH9BuYbabyPuKUvSWks3oCg6041pT925L4zVFqaVBeECwsmlguEw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-typescript": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typescript/-/plugin-transform-typescript-7.19.3.tgz",
      "integrity": "sha512-z6fnuK9ve9u/0X0rRvI9MY0xg+DOUaABDYOe+/SQTxtlptaBB/V9JIUxJn6xp3lMBeb9qe8xSFmHU35oZDXD+w==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-class-features-plugin": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/plugin-syntax-typescript": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-escapes": {
      "version": "7.18.10",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-escapes/-/plugin-transform-unicode-escapes-7.18.10.tgz",
      "integrity": "sha512-kKAdAI+YzPgGY/ftStBFXTI1LZFju38rYThnfMykS+IXy8BVx+res7s2fxf1l8I35DV2T97ezo6+SGrXz6B3iQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.9"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/plugin-transform-unicode-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-regex/-/plugin-transform-unicode-regex-7.18.6.tgz",
      "integrity": "sha512-gE7A6Lt7YLnNOL3Pb9BNeZvi+d8l7tcRrG4+pwJjK9hD2xX4mEvjlQW60G9EEmfXVYRPv9VRQcyegIVHCql/AA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/preset-env": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/preset-env/-/preset-env-7.19.4.tgz",
      "integrity": "sha512-5QVOTXUdqTCjQuh2GGtdd7YEhoRXBMVGROAtsBeLGIbIz3obCBIfRMT1I3ZKkMgNzwkyCkftDXSSkHxnfVf4qg==",
      "dev": true,
      "dependencies": {
        "@babel/compat-data": "^7.19.4",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-validator-option": "^7.18.6",
        "@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": "^7.18.6",
        "@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": "^7.18.9",
        "@babel/plugin-proposal-async-generator-functions": "^7.19.1",
        "@babel/plugin-proposal-class-properties": "^7.18.6",
        "@babel/plugin-proposal-class-static-block": "^7.18.6",
        "@babel/plugin-proposal-dynamic-import": "^7.18.6",
        "@babel/plugin-proposal-export-namespace-from": "^7.18.9",
        "@babel/plugin-proposal-json-strings": "^7.18.6",
        "@babel/plugin-proposal-logical-assignment-operators": "^7.18.9",
        "@babel/plugin-proposal-nullish-coalescing-operator": "^7.18.6",
        "@babel/plugin-proposal-numeric-separator": "^7.18.6",
        "@babel/plugin-proposal-object-rest-spread": "^7.19.4",
        "@babel/plugin-proposal-optional-catch-binding": "^7.18.6",
        "@babel/plugin-proposal-optional-chaining": "^7.18.9",
        "@babel/plugin-proposal-private-methods": "^7.18.6",
        "@babel/plugin-proposal-private-property-in-object": "^7.18.6",
        "@babel/plugin-proposal-unicode-property-regex": "^7.18.6",
        "@babel/plugin-syntax-async-generators": "^7.8.4",
        "@babel/plugin-syntax-class-properties": "^7.12.13",
        "@babel/plugin-syntax-class-static-block": "^7.14.5",
        "@babel/plugin-syntax-dynamic-import": "^7.8.3",
        "@babel/plugin-syntax-export-namespace-from": "^7.8.3",
        "@babel/plugin-syntax-import-assertions": "^7.18.6",
        "@babel/plugin-syntax-json-strings": "^7.8.3",
        "@babel/plugin-syntax-logical-assignment-operators": "^7.10.4",
        "@babel/plugin-syntax-nullish-coalescing-operator": "^7.8.3",
        "@babel/plugin-syntax-numeric-separator": "^7.10.4",
        "@babel/plugin-syntax-object-rest-spread": "^7.8.3",
        "@babel/plugin-syntax-optional-catch-binding": "^7.8.3",
        "@babel/plugin-syntax-optional-chaining": "^7.8.3",
        "@babel/plugin-syntax-private-property-in-object": "^7.14.5",
        "@babel/plugin-syntax-top-level-await": "^7.14.5",
        "@babel/plugin-transform-arrow-functions": "^7.18.6",
        "@babel/plugin-transform-async-to-generator": "^7.18.6",
        "@babel/plugin-transform-block-scoped-functions": "^7.18.6",
        "@babel/plugin-transform-block-scoping": "^7.19.4",
        "@babel/plugin-transform-classes": "^7.19.0",
        "@babel/plugin-transform-computed-properties": "^7.18.9",
        "@babel/plugin-transform-destructuring": "^7.19.4",
        "@babel/plugin-transform-dotall-regex": "^7.18.6",
        "@babel/plugin-transform-duplicate-keys": "^7.18.9",
        "@babel/plugin-transform-exponentiation-operator": "^7.18.6",
        "@babel/plugin-transform-for-of": "^7.18.8",
        "@babel/plugin-transform-function-name": "^7.18.9",
        "@babel/plugin-transform-literals": "^7.18.9",
        "@babel/plugin-transform-member-expression-literals": "^7.18.6",
        "@babel/plugin-transform-modules-amd": "^7.18.6",
        "@babel/plugin-transform-modules-commonjs": "^7.18.6",
        "@babel/plugin-transform-modules-systemjs": "^7.19.0",
        "@babel/plugin-transform-modules-umd": "^7.18.6",
        "@babel/plugin-transform-named-capturing-groups-regex": "^7.19.1",
        "@babel/plugin-transform-new-target": "^7.18.6",
        "@babel/plugin-transform-object-super": "^7.18.6",
        "@babel/plugin-transform-parameters": "^7.18.8",
        "@babel/plugin-transform-property-literals": "^7.18.6",
        "@babel/plugin-transform-regenerator": "^7.18.6",
        "@babel/plugin-transform-reserved-words": "^7.18.6",
        "@babel/plugin-transform-shorthand-properties": "^7.18.6",
        "@babel/plugin-transform-spread": "^7.19.0",
        "@babel/plugin-transform-sticky-regex": "^7.18.6",
        "@babel/plugin-transform-template-literals": "^7.18.9",
        "@babel/plugin-transform-typeof-symbol": "^7.18.9",
        "@babel/plugin-transform-unicode-escapes": "^7.18.10",
        "@babel/plugin-transform-unicode-regex": "^7.18.6",
        "@babel/preset-modules": "^0.1.5",
        "@babel/types": "^7.19.4",
        "babel-plugin-polyfill-corejs2": "^0.3.3",
        "babel-plugin-polyfill-corejs3": "^0.6.0",
        "babel-plugin-polyfill-regenerator": "^0.4.1",
        "core-js-compat": "^3.25.1",
        "semver": "^6.3.0"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/preset-env/node_modules/semver": {
      "version": "6.3.0",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/@babel/preset-modules": {
      "version": "0.1.5",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@babel/plugin-proposal-unicode-property-regex": "^7.4.4",
        "@babel/plugin-transform-dotall-regex": "^7.4.4",
        "@babel/types": "^7.4.4",
        "esutils": "^2.0.2"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/preset-typescript": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/preset-typescript/-/preset-typescript-7.18.6.tgz",
      "integrity": "sha512-s9ik86kXBAnD760aybBucdpnLsAt0jK1xqJn2juOn9lkOvSHV60os5hxoVJsPzMQxvnUJFAlkont2DvvaYEBtQ==",
      "dev": true,
      "dependencies": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-validator-option": "^7.18.6",
        "@babel/plugin-transform-typescript": "^7.18.6"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/@babel/runtime": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.19.0.tgz",
      "integrity": "sha512-eR8Lo9hnDS7tqkO7NsV+mKvCmv5boaXFSZ70DnfhcgiEne8hv9oCEd36Klw74EtizEqLsy4YnW8UWwpBVolHZA==",
      "dev": true,
      "dependencies": {
        "regenerator-runtime": "^0.13.4"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/template": {
      "version": "7.18.10",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.18.10.tgz",
      "integrity": "sha512-TI+rCtooWHr3QJ27kJxfjutghu44DLnasDMwpDqCXVTal9RLp3RSYNh4NdBrRP2cQAoG9A8juOQl6P6oZG4JxA==",
      "dev": true,
      "dependencies": {
        "@babel/code-frame": "^7.18.6",
        "@babel/parser": "^7.18.10",
        "@babel/types": "^7.18.10"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/traverse": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.19.3.tgz",
      "integrity": "sha512-qh5yf6149zhq2sgIXmwjnsvmnNQC2iw70UFjp4olxucKrWd/dvlUsBI88VSLUsnMNF7/vnOiA+nk1+yLoCqROQ==",
      "dev": true,
      "dependencies": {
        "@babel/code-frame": "^7.18.6",
        "@babel/generator": "^7.19.3",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-hoist-variables": "^7.18.6",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "@babel/parser": "^7.19.3",
        "@babel/types": "^7.19.3",
        "debug": "^4.1.0",
        "globals": "^11.1.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/types": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.19.4.tgz",
      "integrity": "sha512-M5LK7nAeS6+9j7hAq+b3fQs+pNfUtTGq+yFFfHnauFA8zQtLRfmuipmsKDKKLuyG+wC8ABW43A153YNawNTEtw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-string-parser": "^7.19.4",
        "@babel/helper-validator-identifier": "^7.19.1",
        "to-fast-properties": "^2.0.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@cspotcode/source-map-support": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/@cspotcode/source-map-support/-/source-map-support-0.8.1.tgz",
      "integrity": "sha512-IchNf6dN4tHoMFIn/7OE8LWZ19Y6q/67Bmf6vnGREv8RSbBVb9LPJxEcnwrcwX6ixSvaiGoomAUvu4YSxXrVgw==",
      "dev": true,
      "dependencies": {
        "@jridgewell/trace-mapping": "0.3.9"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/@cspotcode/source-map-support/node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.9",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.9.tgz",
      "integrity": "sha512-3Belt6tdc8bPgAtbcmdtNJlirVoTmEb5e2gC94PnkwEW9jI6CAHUeoG85tjWP5WquqfavoMtMwiG4P926ZKKuQ==",
      "dev": true,
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "node_modules/@csstools/postcss-cascade-layers": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-cascade-layers/-/postcss-cascade-layers-1.1.1.tgz",
      "integrity": "sha512-+KdYrpKC5TgomQr2DlZF4lDEpHcoxnj5IGddYYfBWJAKfj1JtuHUIqMa+E1pJJ+z3kvDViWMqyqPlG4Ja7amQA==",
      "dev": true,
      "dependencies": {
        "@csstools/selector-specificity": "^2.0.2",
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-color-function": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-color-function/-/postcss-color-function-1.1.1.tgz",
      "integrity": "sha512-Bc0f62WmHdtRDjf5f3e2STwRAl89N2CLb+9iAwzrv4L2hncrbDwnQD9PCq0gtAt7pOI2leIV08HIBUd4jxD8cw==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-font-format-keywords": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-font-format-keywords/-/postcss-font-format-keywords-1.0.1.tgz",
      "integrity": "sha512-ZgrlzuUAjXIOc2JueK0X5sZDjCtgimVp/O5CEqTcs5ShWBa6smhWYbS0x5cVc/+rycTDbjjzoP0KTDnUneZGOg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-hwb-function": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-hwb-function/-/postcss-hwb-function-1.0.2.tgz",
      "integrity": "sha512-YHdEru4o3Rsbjmu6vHy4UKOXZD+Rn2zmkAmLRfPet6+Jz4Ojw8cbWxe1n42VaXQhD3CQUXXTooIy8OkVbUcL+w==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-ic-unit": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-ic-unit/-/postcss-ic-unit-1.0.1.tgz",
      "integrity": "sha512-Ot1rcwRAaRHNKC9tAqoqNZhjdYBzKk1POgWfhN4uCOE47ebGcLRqXjKkApVDpjifL6u2/55ekkpnFcp+s/OZUw==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-is-pseudo-class": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-is-pseudo-class/-/postcss-is-pseudo-class-2.0.7.tgz",
      "integrity": "sha512-7JPeVVZHd+jxYdULl87lvjgvWldYu+Bc62s9vD/ED6/QTGjy0jy0US/f6BG53sVMTBJ1lzKZFpYmofBN9eaRiA==",
      "dev": true,
      "dependencies": {
        "@csstools/selector-specificity": "^2.0.0",
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-nested-calc": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-nested-calc/-/postcss-nested-calc-1.0.0.tgz",
      "integrity": "sha512-JCsQsw1wjYwv1bJmgjKSoZNvf7R6+wuHDAbi5f/7MbFhl2d/+v+TvBTU4BJH3G1X1H87dHl0mh6TfYogbT/dJQ==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-normalize-display-values": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-normalize-display-values/-/postcss-normalize-display-values-1.0.1.tgz",
      "integrity": "sha512-jcOanIbv55OFKQ3sYeFD/T0Ti7AMXc9nM1hZWu8m/2722gOTxFg7xYu4RDLJLeZmPUVQlGzo4jhzvTUq3x4ZUw==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-oklab-function": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-oklab-function/-/postcss-oklab-function-1.1.1.tgz",
      "integrity": "sha512-nJpJgsdA3dA9y5pgyb/UfEzE7W5Ka7u0CX0/HIMVBNWzWemdcTH3XwANECU6anWv/ao4vVNLTMxhiPNZsTK6iA==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-progressive-custom-properties": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-progressive-custom-properties/-/postcss-progressive-custom-properties-1.3.0.tgz",
      "integrity": "sha512-ASA9W1aIy5ygskZYuWams4BzafD12ULvSypmaLJT2jvQ8G0M3I8PRQhC0h7mG0Z3LI05+agZjqSR9+K9yaQQjA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.3"
      }
    },
    "node_modules/@csstools/postcss-stepped-value-functions": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-stepped-value-functions/-/postcss-stepped-value-functions-1.0.1.tgz",
      "integrity": "sha512-dz0LNoo3ijpTOQqEJLY8nyaapl6umbmDcgj4AD0lgVQ572b2eqA1iGZYTTWhrcrHztWDDRAX2DGYyw2VBjvCvQ==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-text-decoration-shorthand": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-text-decoration-shorthand/-/postcss-text-decoration-shorthand-1.0.0.tgz",
      "integrity": "sha512-c1XwKJ2eMIWrzQenN0XbcfzckOLLJiczqy+YvfGmzoVXd7pT9FfObiSEfzs84bpE/VqfpEuAZ9tCRbZkZxxbdw==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-trigonometric-functions": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-trigonometric-functions/-/postcss-trigonometric-functions-1.0.2.tgz",
      "integrity": "sha512-woKaLO///4bb+zZC2s80l+7cm07M7268MsyG3M0ActXXEFi6SuhvriQYcb58iiKGbjwwIU7n45iRLEHypB47Og==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/postcss-unset-value": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-unset-value/-/postcss-unset-value-1.0.2.tgz",
      "integrity": "sha512-c8J4roPBILnelAsdLr4XOAR/GsTm0GJi4XpcfvoWk3U6KiTCqiFYc63KhRMQQX35jYMp4Ao8Ij9+IZRgMfJp1g==",
      "dev": true,
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/@csstools/selector-specificity": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/selector-specificity/-/selector-specificity-2.0.2.tgz",
      "integrity": "sha512-IkpVW/ehM1hWKln4fCA3NzJU8KwD+kIOvPZA4cqxoJHtE21CCzjyp+Kxbu0i5I4tBNOlXPL9mjwnWlL0VEG4Fg==",
      "dev": true,
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2",
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "node_modules/@discoveryjs/json-ext": {
      "version": "0.5.6",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/@eslint/eslintrc": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-1.3.2.tgz",
      "integrity": "sha512-AXYd23w1S/bv3fTs3Lz0vjiYemS08jWkI3hYyS9I1ry+0f+Yjs1wm+sU0BS8qDOPrBIkp4qHYC16I8uVtpLajQ==",
      "dev": true,
      "dependencies": {
        "ajv": "^6.12.4",
        "debug": "^4.3.2",
        "espree": "^9.4.0",
        "globals": "^13.15.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.0",
        "minimatch": "^3.1.2",
        "strip-json-comments": "^3.1.1"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/@eslint/eslintrc/node_modules/globals": {
      "version": "13.17.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-13.17.0.tgz",
      "integrity": "sha512-1C+6nQRb1GwGMKm2dH/E7enFAMxGTmGI7/dEdhy/DNelv85w9B72t3uc5frtMNXIbzrarJJ/lTCjcaZwbLJmyw==",
      "dev": true,
      "dependencies": {
        "type-fest": "^0.20.2"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@eslint/eslintrc/node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/@eslint/eslintrc/node_modules/type-fest": {
      "version": "0.20.2",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
      "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/@floating-ui/core": {
      "version": "0.6.2",
      "resolved": "https://registry.npmjs.org/@floating-ui/core/-/core-0.6.2.tgz",
      "integrity": "sha512-jktYRmZwmau63adUG3GKOAVCofBXkk55S/zQ94XOorAHhwqFIOFAy1rSp2N0Wp6/tGbe9V3u/ExlGZypyY17rg=="
    },
    "node_modules/@floating-ui/dom": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/@floating-ui/dom/-/dom-0.4.5.tgz",
      "integrity": "sha512-b+prvQgJt8pieaKYMSJBXHxX/DYwdLsAWxKYqnO5dO2V4oo/TYBZJAUQCVNjTWWsrs6o4VDrNcP9+E70HAhJdw==",
      "dependencies": {
        "@floating-ui/core": "^0.6.2"
      }
    },
    "node_modules/@gar/promisify": {
      "version": "1.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@humanwhocodes/config-array": {
      "version": "0.10.7",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/config-array/-/config-array-0.10.7.tgz",
      "integrity": "sha512-MDl6D6sBsaV452/QSdX+4CXIjZhIcI0PELsxUjk4U828yd58vk3bTIvk/6w5FY+4hIy9sLW0sfrV7K7Kc++j/w==",
      "dev": true,
      "dependencies": {
        "@humanwhocodes/object-schema": "^1.2.1",
        "debug": "^4.1.1",
        "minimatch": "^3.0.4"
      },
      "engines": {
        "node": ">=10.10.0"
      }
    },
    "node_modules/@humanwhocodes/gitignore-to-minimatch": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/gitignore-to-minimatch/-/gitignore-to-minimatch-1.0.2.tgz",
      "integrity": "sha512-rSqmMJDdLFUsyxR6FMtD00nfQKKLFb1kv+qBbOVKqErvloEIJLo5bDTJTQNTYgeyp78JsA7u/NPi5jT1GR/MuA==",
      "dev": true,
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true,
      "engines": {
        "node": ">=12.22"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/nzakas"
      }
    },
    "node_modules/@humanwhocodes/object-schema": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/object-schema/-/object-schema-1.2.1.tgz",
      "integrity": "sha512-ZnQMnLV4e7hDlUvw8H+U8ASL02SS2Gn6+9Ac3wGGLIe7+je2AeAOxPY+izIPJDfFDb7eDjev0Us8MO1iFRN8hA==",
      "dev": true
    },
    "node_modules/@jridgewell/gen-mapping": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.1.1.tgz",
      "integrity": "sha512-sQXCasFk+U8lWYEe66WxRDOE9PjVz4vSM51fTu3Hw+ClTpUSQb718772vH3pyS5pShp6lvQM7SxgIDXXXmOX7w==",
      "dev": true,
      "dependencies": {
        "@jridgewell/set-array": "^1.0.0",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/resolve-uri": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.0.tgz",
      "integrity": "sha512-F2msla3tad+Mfht5cJq7LSXcdudKTWCVYUgw6pLFOOHSTtZlj6SWNYAp+AhuqLmWdBO2X5hPrLcu8cVP8fy28w==",
      "dev": true,
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/set-array": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/set-array/-/set-array-1.1.2.tgz",
      "integrity": "sha512-xnkseuNADM0gt2bs+BvhO0p78Mk762YnZdsuzFV018NoG1Sj1SCQvpSqa7XUaTam5vAGasABV9qXASMKnFMwMw==",
      "dev": true,
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/source-map": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/source-map/-/source-map-0.3.2.tgz",
      "integrity": "sha512-m7O9o2uR8k2ObDysZYzdfhb08VuEml5oWGiosa1VdaPZ/A6QyPkAJuwN0Q1lhULOf6B7MtQmHENS743hWtCrgw==",
      "dev": true,
      "dependencies": {
        "@jridgewell/gen-mapping": "^0.3.0",
        "@jridgewell/trace-mapping": "^0.3.9"
      }
    },
    "node_modules/@jridgewell/source-map/node_modules/@jridgewell/gen-mapping": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.2.tgz",
      "integrity": "sha512-mh65xKQAzI6iBcFzwv28KVWSmCkdRBWoOh+bYQGW3+6OZvbbN3TqMGo5hqYxQniRcH9F2VZIoJCm4pa3BPDK/A==",
      "dev": true,
      "dependencies": {
        "@jridgewell/set-array": "^1.0.1",
        "@jridgewell/sourcemap-codec": "^1.4.10",
        "@jridgewell/trace-mapping": "^0.3.9"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/@jridgewell/sourcemap-codec": {
      "version": "1.4.14",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.4.14.tgz",
      "integrity": "sha512-XPSJHWmi394fuUuzDnGz1wiKqWfo1yXecHQMRf2l6hztTO+nPru658AyDngaBe7isIxEkRsPR3FZh+s7iVa4Uw==",
      "dev": true
    },
    "node_modules/@jridgewell/trace-mapping": {
      "version": "0.3.15",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.15.tgz",
      "integrity": "sha512-oWZNOULl+UbhsgB51uuZzglikfIKSUBO/M9W2OfEjn7cmqoAiCgmv9lyACTUacZwBz0ITnJ2NqjU8Tx0DHL88g==",
      "dev": true,
      "dependencies": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "node_modules/@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true,
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/@npmcli/fs": {
      "version": "1.1.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@gar/promisify": "^1.0.1",
        "semver": "^7.3.5"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/@npmcli/fs/node_modules/lru-cache": {
      "version": "6.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/fs/node_modules/semver": {
      "version": "7.3.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/fs/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/@npmcli/move-file": {
      "version": "1.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mkdirp": "^1.0.4",
        "rimraf": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/move-file/node_modules/mkdirp": {
      "version": "1.0.4",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/@npmcli/move-file/node_modules/rimraf": {
      "version": "3.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/@tootallnate/once": {
      "version": "1.1.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/@trysound/sax": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@trysound/sax/-/sax-0.2.0.tgz",
      "integrity": "sha512-L7z9BgrNEcYyUYtF+HaEfiS5ebkh9jXqbszz7pC0hRBPaatV0XjSD3+eHrpqFemQfgwiFF0QPIarnIihIDn7OA==",
      "dev": true,
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/@tsconfig/node10": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@tsconfig/node10/-/node10-1.0.9.tgz",
      "integrity": "sha512-jNsYVVxU8v5g43Erja32laIDHXeoNvFEpX33OK4d6hljo3jDhCBDhx5dhCCTMWUojscpAagGiRkBKxpdl9fxqA==",
      "dev": true
    },
    "node_modules/@tsconfig/node12": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@tsconfig/node12/-/node12-1.0.11.tgz",
      "integrity": "sha512-cqefuRsh12pWyGsIoBKJA9luFu3mRxCA+ORZvA4ktLSzIuCUtWVxGIuXigEwO5/ywWFMZ2QEGKWvkZG1zDMTag==",
      "dev": true
    },
    "node_modules/@tsconfig/node14": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node14/-/node14-1.0.3.tgz",
      "integrity": "sha512-ysT8mhdixWK6Hw3i1V2AeRqZ5WfXg1G43mqoYlM2nc6388Fq5jcXyr5mRsqViLx/GJYdoL0bfXD8nmF+Zn/Iow==",
      "dev": true
    },
    "node_modules/@tsconfig/node16": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node16/-/node16-1.0.3.tgz",
      "integrity": "sha512-yOlFc+7UtL/89t2ZhjPvvB/DeAr3r+Dq58IgzsFkOAvVC6NMJXmCGjbptdXdR9qsX7pKcTL+s87FtYREi2dEEQ==",
      "dev": true
    },
    "node_modules/@types/eslint": {
      "version": "8.4.6",
      "resolved": "https://registry.npmjs.org/@types/eslint/-/eslint-8.4.6.tgz",
      "integrity": "sha512-/fqTbjxyFUaYNO7VcW5g+4npmqVACz1bB7RTHYuLj+PRjw9hrCwrUXVQFpChUS0JsyEFvMZ7U/PfmvWgxJhI9g==",
      "dev": true,
      "dependencies": {
        "@types/estree": "*",
        "@types/json-schema": "*"
      }
    },
    "node_modules/@types/eslint-scope": {
      "version": "3.7.4",
      "resolved": "https://registry.npmjs.org/@types/eslint-scope/-/eslint-scope-3.7.4.tgz",
      "integrity": "sha512-9K4zoImiZc3HlIp6AVUDE4CWYx22a+lhSZMYNpbjW04+YF0KWj4pJXnEMjdnFTiQibFFmElcsasJXDbdI/EPhA==",
      "dev": true,
      "dependencies": {
        "@types/eslint": "*",
        "@types/estree": "*"
      }
    },
    "node_modules/@types/estree": {
      "version": "0.0.51",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-0.0.51.tgz",
      "integrity": "sha512-CuPgU6f3eT/XgKKPqKd/gLZV1Xmvf1a2R5POBOGQa6uv82xpls89HU5zKeVoyR8XzHd1RGNOlQlvUe3CFkjWNQ==",
      "dev": true
    },
    "node_modules/@types/json-schema": {
      "version": "7.0.9",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/minimist": {
      "version": "1.2.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/mocha": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/@types/mocha/-/mocha-10.0.0.tgz",
      "integrity": "sha512-rADY+HtTOA52l9VZWtgQfn4p+UDVM2eDVkMZT1I6syp0YKxW2F9v+0pbRZLsvskhQv/vMb6ZfCay81GHbz5SHg==",
      "dev": true
    },
    "node_modules/@types/node": {
      "version": "17.0.7",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/normalize-package-data": {
      "version": "2.4.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@types/parse-json": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@ungap/promise-all-settled": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@ungap/promise-all-settled/-/promise-all-settled-1.1.2.tgz",
      "integrity": "sha512-sL/cEvJWAnClXw0wHk85/2L0G6Sj8UB0Ctc1TEMbKSsmpRosqhwj9gWgFRZSrBr2f9tiXISwNhCPmlfqUqyb9Q==",
      "dev": true
    },
    "node_modules/@webassemblyjs/ast": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/helper-numbers": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/floating-point-hex-parser": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webassemblyjs/helper-api-error": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webassemblyjs/helper-buffer": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webassemblyjs/helper-numbers": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/floating-point-hex-parser": "1.11.1",
        "@webassemblyjs/helper-api-error": "1.11.1",
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@webassemblyjs/helper-wasm-bytecode": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webassemblyjs/helper-wasm-section": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/ieee754": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@xtuc/ieee754": "^1.2.0"
      }
    },
    "node_modules/@webassemblyjs/leb128": {
      "version": "1.11.1",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@webassemblyjs/utf8": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/@webassemblyjs/wasm-edit": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/helper-wasm-section": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1",
        "@webassemblyjs/wasm-opt": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1",
        "@webassemblyjs/wast-printer": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/wasm-gen": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/ieee754": "1.11.1",
        "@webassemblyjs/leb128": "1.11.1",
        "@webassemblyjs/utf8": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/wasm-opt": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/wasm-parser": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-api-error": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/ieee754": "1.11.1",
        "@webassemblyjs/leb128": "1.11.1",
        "@webassemblyjs/utf8": "1.11.1"
      }
    },
    "node_modules/@webassemblyjs/wast-printer": {
      "version": "1.11.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@webassemblyjs/ast": "1.11.1",
        "@xtuc/long": "4.2.2"
      }
    },
    "node_modules/@webpack-cli/configtest": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/configtest/-/configtest-1.2.0.tgz",
      "integrity": "sha512-4FB8Tj6xyVkyqjj1OaTqCjXYULB9FMkqQ8yGrZjRDrYh0nOE+7Lhs45WioWQQMV+ceFlE368Ukhe6xdvJM9Egg==",
      "dev": true,
      "peerDependencies": {
        "webpack": "4.x.x || 5.x.x",
        "webpack-cli": "4.x.x"
      }
    },
    "node_modules/@webpack-cli/info": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/info/-/info-1.5.0.tgz",
      "integrity": "sha512-e8tSXZpw2hPl2uMJY6fsMswaok5FdlGNRTktvFk2sD8RjH0hE2+XistawJx1vmKteh4NmGmNUrp+Tb2w+udPcQ==",
      "dev": true,
      "dependencies": {
        "envinfo": "^7.7.3"
      },
      "peerDependencies": {
        "webpack-cli": "4.x.x"
      }
    },
    "node_modules/@webpack-cli/serve": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/serve/-/serve-1.7.0.tgz",
      "integrity": "sha512-oxnCNGj88fL+xzV+dacXs44HcDwf1ovs3AuEzvP7mqXw7fQntqIhQ1BRmynh4qEKQSSSRSWVyXRjmTbZIX9V2Q==",
      "dev": true,
      "peerDependencies": {
        "webpack-cli": "4.x.x"
      },
      "peerDependenciesMeta": {
        "webpack-dev-server": {
          "optional": true
        }
      }
    },
    "node_modules/@xtuc/ieee754": {
      "version": "1.2.0",
      "dev": true,
      "license": "BSD-3-Clause"
    },
    "node_modules/@xtuc/long": {
      "version": "4.2.2",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/abbrev": {
      "version": "1.1.1",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/acorn": {
      "version": "8.8.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.8.0.tgz",
      "integrity": "sha512-QOxyigPVrpZ2GXT+PFyZTl6TtOFc5egxHIP9IlQ+RbupQuX4RkT/Bee4/kQuC02Xkzg84JcT7oLYtDIQxp+v7w==",
      "dev": true,
      "bin": {
        "acorn": "bin/acorn"
      },
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/acorn-import-assertions": {
      "version": "1.8.0",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "acorn": "^8"
      }
    },
    "node_modules/acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "peerDependencies": {
        "acorn": "^6.0.0 || ^7.0.0 || ^8.0.0"
      }
    },
    "node_modules/acorn-walk": {
      "version": "8.2.0",
      "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.2.0.tgz",
      "integrity": "sha512-k+iyHEuPgSw6SbuDpGQM+06HQUa04DZ3o+F6CSzXMvvI5KMvnaEqXe+YVe555R9nn6GPt404fos4wcgpw12SDA==",
      "dev": true,
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/agent-base": {
      "version": "6.0.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/agentkeepalive": {
      "version": "4.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "debug": "^4.1.0",
        "depd": "^1.1.2",
        "humanize-ms": "^1.2.1"
      },
      "engines": {
        "node": ">= 8.0.0"
      }
    },
    "node_modules/aggregate-error": {
      "version": "3.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "clean-stack": "^2.0.0",
        "indent-string": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-formats": {
      "version": "2.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependencies": {
        "ajv": "^8.0.0"
      },
      "peerDependenciesMeta": {
        "ajv": {
          "optional": true
        }
      }
    },
    "node_modules/ajv-formats/node_modules/ajv": {
      "version": "8.8.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/ajv-formats/node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/ajv-keywords": {
      "version": "3.5.2",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "ajv": "^6.9.1"
      }
    },
    "node_modules/ansi-colors": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/ansi-colors/-/ansi-colors-4.1.1.tgz",
      "integrity": "sha512-JoX0apGbHaUJBNl6yF+p6JAFYZ666/hhCGKN5t9QFjbJQKUU/g8MNbFDbvfrgKXvI1QpZplPOnwIo99lX/AAmA==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "3.2.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^1.9.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/ansis": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/ansis/-/ansis-1.4.0.tgz",
      "integrity": "sha512-jaJCg2/68pwinZeW86YBSNv0kNPr3PSog/IqflOVCbqCedSCvrDCBUW1y4V9gcEUDNxrGtVLAkMIivvpsq1VwA==",
      "dev": true,
      "engines": {
        "node": ">=12.13"
      },
      "funding": {
        "type": "patreon",
        "url": "https://patreon.com/biodiscus"
      }
    },
    "node_modules/anymatch": {
      "version": "3.1.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/aproba": {
      "version": "1.2.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/are-we-there-yet": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "delegates": "^1.0.0",
        "readable-stream": "^3.6.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/arg": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/arg/-/arg-4.1.3.tgz",
      "integrity": "sha512-58S9QDqG0Xx27YwPSt9fJxivjYl432YCwfDMfZ+71RAqUrZef7LrKQZ3LHLOwCS4FLNBplP533Zx895SeOCHvA==",
      "dev": true
    },
    "node_modules/argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true
    },
    "node_modules/array-union": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/array-union/-/array-union-2.1.0.tgz",
      "integrity": "sha512-HGyxoOTYUyCM6stUe6EJgnd4EoewAI7zMdfqO+kGjnlZmBDz/cR5pf8r/cR4Wq60sL/p0IkcjUEEPwS3GFrIyw==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/arrify": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/asn1": {
      "version": "0.2.6",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safer-buffer": "~2.1.0"
      }
    },
    "node_modules/assert-plus": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/astral-regex": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/astral-regex/-/astral-regex-2.0.0.tgz",
      "integrity": "sha512-Z7tMw1ytTXt5jqMcOP+OQteU1VuNK9Y02uuJtKQ1Sv69jXQKKg5cibLwGJow8yzZP+eAc18EmLGPal0bp36rvQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/async-foreach": {
      "version": "0.1.3",
      "dev": true,
      "engines": {
        "node": "*"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/autoprefixer": {
      "version": "10.4.12",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.4.12.tgz",
      "integrity": "sha512-WrCGV9/b97Pa+jtwf5UGaRjgQIg7OK3D06GnoYoZNcG1Xb8Gt3EfuKjlhh9i/VtT16g6PYjZ69jdJ2g8FxSC4Q==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/autoprefixer"
        }
      ],
      "dependencies": {
        "browserslist": "^4.21.4",
        "caniuse-lite": "^1.0.30001407",
        "fraction.js": "^4.2.0",
        "normalize-range": "^0.1.2",
        "picocolors": "^1.0.0",
        "postcss-value-parser": "^4.2.0"
      },
      "bin": {
        "autoprefixer": "bin/autoprefixer"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/aws-sign2": {
      "version": "0.7.0",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/aws4": {
      "version": "1.11.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/babel-loader": {
      "version": "8.2.5",
      "resolved": "https://registry.npmjs.org/babel-loader/-/babel-loader-8.2.5.tgz",
      "integrity": "sha512-OSiFfH89LrEMiWd4pLNqGz4CwJDtbs2ZVc+iGu2HrkRfPxId9F2anQj38IxWpmRfsUY0aBZYi1EFcd3mhtRMLQ==",
      "dev": true,
      "dependencies": {
        "find-cache-dir": "^3.3.1",
        "loader-utils": "^2.0.0",
        "make-dir": "^3.1.0",
        "schema-utils": "^2.6.5"
      },
      "engines": {
        "node": ">= 8.9"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0",
        "webpack": ">=2"
      }
    },
    "node_modules/babel-plugin-dynamic-import-node": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/babel-plugin-dynamic-import-node/-/babel-plugin-dynamic-import-node-2.3.3.tgz",
      "integrity": "sha512-jZVI+s9Zg3IqA/kdi0i6UDCybUI3aSBLnglhYbSSjKlV7yF1F/5LWv8MakQmvYpnbJDS6fcBL2KzHSxNCMtWSQ==",
      "dev": true,
      "dependencies": {
        "object.assign": "^4.1.0"
      }
    },
    "node_modules/babel-plugin-polyfill-corejs2": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs2/-/babel-plugin-polyfill-corejs2-0.3.3.tgz",
      "integrity": "sha512-8hOdmFYFSZhqg2C/JgLUQ+t52o5nirNwaWM2B9LWteozwIvM14VSwdsCAUET10qT+kmySAlseadmfeeSWFCy+Q==",
      "dev": true,
      "dependencies": {
        "@babel/compat-data": "^7.17.7",
        "@babel/helper-define-polyfill-provider": "^0.3.3",
        "semver": "^6.1.1"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/babel-plugin-polyfill-corejs2/node_modules/semver": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
      "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
      "dev": true,
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/babel-plugin-polyfill-corejs3": {
      "version": "0.6.0",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs3/-/babel-plugin-polyfill-corejs3-0.6.0.tgz",
      "integrity": "sha512-+eHqR6OPcBhJOGgsIar7xoAB1GcSwVUA3XjAd7HJNzOXT4wv6/H7KIdA/Nc60cvUlDbKApmqNvD1B1bzOt4nyA==",
      "dev": true,
      "dependencies": {
        "@babel/helper-define-polyfill-provider": "^0.3.3",
        "core-js-compat": "^3.25.1"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/babel-plugin-polyfill-regenerator": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-regenerator/-/babel-plugin-polyfill-regenerator-0.4.1.tgz",
      "integrity": "sha512-NtQGmyQDXjQqQ+IzRkBVwEOz9lQ4zxAQZgoAYEtU9dJjnl1Oc98qnN7jcp+bE7O7aYzVpavXE3/VKXNzUbh7aw==",
      "dev": true,
      "dependencies": {
        "@babel/helper-define-polyfill-provider": "^0.3.3"
      },
      "peerDependencies": {
        "@babel/core": "^7.0.0-0"
      }
    },
    "node_modules/balanced-match": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/bcrypt-pbkdf": {
      "version": "1.0.2",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "tweetnacl": "^0.14.3"
      }
    },
    "node_modules/big.js": {
      "version": "5.2.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/binary-extensions": {
      "version": "2.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/boolbase": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/boolbase/-/boolbase-1.0.0.tgz",
      "integrity": "sha512-JZOSA7Mo9sNGB8+UjSgzdLtokWAky1zbztM3WRLCbZ70/3cTANmQmOdR7y2g+J0e2WXywy1yS468tY+IruqEww==",
      "dev": true
    },
    "node_modules/bourbon": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/bourbon/-/bourbon-7.2.0.tgz",
      "integrity": "sha512-Zx/lY/YzMkSyFC7yYPp9QcI2OCWnUHQdSrXvRtfnaUGT/edKNh44mVPYkP7QEyk6yQOLCJottsuTnidqKcpbNg=="
    },
    "node_modules/brace-expansion": {
      "version": "1.1.11",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "node_modules/braces": {
      "version": "3.0.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fill-range": "^7.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/browser-stdout": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/browser-stdout/-/browser-stdout-1.3.1.tgz",
      "integrity": "sha512-qhAVI1+Av2X7qelOfAIYwXONood6XlZE/fXaBSmW/T5SzLAmCgzi+eiWE7fUvbHaeNBQH13UftjpXxsfLkMpgw==",
      "dev": true
    },
    "node_modules/browserslist": {
      "version": "4.21.4",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.21.4.tgz",
      "integrity": "sha512-CBHJJdDmgjl3daYjN5Cp5kbTf1mUhZoS+beLklHIvkOWscs83YAhLlF3Wsh/lciQYAcbBJgTOD44VtG31ZM4Hw==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        }
      ],
      "dependencies": {
        "caniuse-lite": "^1.0.30001400",
        "electron-to-chromium": "^1.4.251",
        "node-releases": "^2.0.6",
        "update-browserslist-db": "^1.0.9"
      },
      "bin": {
        "browserslist": "cli.js"
      },
      "engines": {
        "node": "^6 || ^7 || ^8 || ^9 || ^10 || ^11 || ^12 || >=13.7"
      }
    },
    "node_modules/buffer-from": {
      "version": "1.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/call-bind": {
      "version": "1.0.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.1",
        "get-intrinsic": "^1.0.2"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/callsites": {
      "version": "3.1.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/camelcase": {
      "version": "5.3.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/camelcase-keys": {
      "version": "6.2.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "camelcase": "^5.3.1",
        "map-obj": "^4.0.0",
        "quick-lru": "^4.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/caniuse-api": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/caniuse-api/-/caniuse-api-3.0.0.tgz",
      "integrity": "sha512-bsTwuIg/BZZK/vreVTYYbSWoe2F+71P7K5QGEX+pT250DZbfU1MQ5prOKpPR+LL6uWKK3KMwMCAS74QB3Um1uw==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.0.0",
        "caniuse-lite": "^1.0.0",
        "lodash.memoize": "^4.1.2",
        "lodash.uniq": "^4.5.0"
      }
    },
    "node_modules/caniuse-lite": {
      "version": "1.0.30001418",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001418.tgz",
      "integrity": "sha512-oIs7+JL3K9JRQ3jPZjlH6qyYDp+nBTCais7hjh0s+fuBwufc7uZ7hPYMXrDOJhV360KGMTcczMRObk0/iMqZRg==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/caniuse-lite"
        }
      ]
    },
    "node_modules/caseless": {
      "version": "0.12.0",
      "dev": true,
      "license": "Apache-2.0"
    },
    "node_modules/chalk": {
      "version": "2.4.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^3.2.1",
        "escape-string-regexp": "^1.0.5",
        "supports-color": "^5.3.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/chalk/node_modules/supports-color": {
      "version": "5.5.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^3.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/chokidar": {
      "version": "3.5.3",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.5.3.tgz",
      "integrity": "sha512-Dr3sfKRP6oTcjf2JmUmFJfeVMvXBdegxB0iVQ5eb2V10uFJUCAS8OByZdVAyVb8xXNz3GjjTgj9kLWsZTqE6kw==",
      "dev": true,
      "funding": [
        {
          "type": "individual",
          "url": "https://paulmillr.com/funding/"
        }
      ],
      "dependencies": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "engines": {
        "node": ">= 8.10.0"
      },
      "optionalDependencies": {
        "fsevents": "~2.3.2"
      }
    },
    "node_modules/chokidar/node_modules/glob-parent": {
      "version": "5.1.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/chrome-trace-event": {
      "version": "1.0.3",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.0"
      }
    },
    "node_modules/clean-stack": {
      "version": "2.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/cliui": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz",
      "integrity": "sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==",
      "dev": true,
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.1",
        "wrap-ansi": "^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/clone-deep": {
      "version": "4.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-plain-object": "^2.0.4",
        "kind-of": "^6.0.2",
        "shallow-clone": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/clone-deep/node_modules/is-plain-object": {
      "version": "2.0.4",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "isobject": "^3.0.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/color-convert": {
      "version": "1.9.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "1.1.3"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/color-support": {
      "version": "1.1.3",
      "dev": true,
      "license": "ISC",
      "bin": {
        "color-support": "bin.js"
      }
    },
    "node_modules/colord": {
      "version": "2.9.3",
      "resolved": "https://registry.npmjs.org/colord/-/colord-2.9.3.tgz",
      "integrity": "sha512-jeC1axXpnb0/2nn/Y1LPuLdgXBLH7aDcHu4KEKfqw3CUhX7ZpfBSlPKyqXE6btIgEzfWtrX3/tyBCaCvXvMkOw==",
      "dev": true
    },
    "node_modules/colorette": {
      "version": "2.0.16",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/commander": {
      "version": "7.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/commondir": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concat-map": {
      "version": "0.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concurrently": {
      "version": "7.4.0",
      "resolved": "https://registry.npmjs.org/concurrently/-/concurrently-7.4.0.tgz",
      "integrity": "sha512-M6AfrueDt/GEna/Vg9BqQ+93yuvzkSKmoTixnwEJkH0LlcGrRC2eCmjeG1tLLHIYfpYJABokqSGyMcXjm96AFA==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.1.0",
        "date-fns": "^2.29.1",
        "lodash": "^4.17.21",
        "rxjs": "^7.0.0",
        "shell-quote": "^1.7.3",
        "spawn-command": "^0.0.2-1",
        "supports-color": "^8.1.0",
        "tree-kill": "^1.2.2",
        "yargs": "^17.3.1"
      },
      "bin": {
        "conc": "dist/bin/concurrently.js",
        "concurrently": "dist/bin/concurrently.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.6.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/open-cli-tools/concurrently?sponsor=1"
      }
    },
    "node_modules/concurrently/node_modules/ansi-styles": {
      "version": "4.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/concurrently/node_modules/chalk": {
      "version": "4.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/concurrently/node_modules/chalk/node_modules/supports-color": {
      "version": "7.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/concurrently/node_modules/color-convert": {
      "version": "2.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/concurrently/node_modules/color-name": {
      "version": "1.1.4",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/concurrently/node_modules/has-flag": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/console-control-strings": {
      "version": "1.1.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/convert-source-map": {
      "version": "1.8.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.1.1"
      }
    },
    "node_modules/copy-webpack-plugin": {
      "version": "11.0.0",
      "resolved": "https://registry.npmjs.org/copy-webpack-plugin/-/copy-webpack-plugin-11.0.0.tgz",
      "integrity": "sha512-fX2MWpamkW0hZxMEg0+mYnA40LTosOSa5TqZ9GYIBzyJa9C3QUaMPSE2xAi/buNr8u89SfD9wHSQVBzrRa/SOQ==",
      "dev": true,
      "dependencies": {
        "fast-glob": "^3.2.11",
        "glob-parent": "^6.0.1",
        "globby": "^13.1.1",
        "normalize-path": "^3.0.0",
        "schema-utils": "^4.0.0",
        "serialize-javascript": "^6.0.0"
      },
      "engines": {
        "node": ">= 14.15.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.1.0"
      }
    },
    "node_modules/copy-webpack-plugin/node_modules/ajv": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.11.0.tgz",
      "integrity": "sha512-wGgprdCvMalC0BztXvitD2hC04YffAvtsUn93JbGXYLAtCUO4xd17mCCZQxUOItiBwZvJScWo8NIvQMQ71rdpg==",
      "dev": true,
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/copy-webpack-plugin/node_modules/ajv-keywords": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/ajv-keywords/-/ajv-keywords-5.1.0.tgz",
      "integrity": "sha512-YCS/JNFAUyr5vAuhk1DWm1CBxRHW9LbJ2ozWeemrIqpbsqKjHVxYPyi5GC0rjZIT5JxJ3virVTS8wk4i/Z+krw==",
      "dev": true,
      "dependencies": {
        "fast-deep-equal": "^3.1.3"
      },
      "peerDependencies": {
        "ajv": "^8.8.2"
      }
    },
    "node_modules/copy-webpack-plugin/node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
      "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
      "dev": true
    },
    "node_modules/copy-webpack-plugin/node_modules/schema-utils": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/schema-utils/-/schema-utils-4.0.0.tgz",
      "integrity": "sha512-1edyXKgh6XnJsJSQ8mKWXnN/BVaIbFMLpouRUrXgVq7WYne5kw3MW7UPhO44uRXQSIpTSXoJbmrR2X0w9kUTyg==",
      "dev": true,
      "dependencies": {
        "@types/json-schema": "^7.0.9",
        "ajv": "^8.8.0",
        "ajv-formats": "^2.1.1",
        "ajv-keywords": "^5.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/core-js": {
      "version": "3.25.5",
      "resolved": "https://registry.npmjs.org/core-js/-/core-js-3.25.5.tgz",
      "integrity": "sha512-nbm6eZSjm+ZuBQxCUPQKQCoUEfFOXjUZ8dTTyikyKaWrTYmAVbykQfwsKE5dBK88u3QCkCrzsx/PPlKfhsvgpw==",
      "dev": true,
      "hasInstallScript": true,
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/core-js"
      }
    },
    "node_modules/core-js-compat": {
      "version": "3.25.5",
      "resolved": "https://registry.npmjs.org/core-js-compat/-/core-js-compat-3.25.5.tgz",
      "integrity": "sha512-ovcyhs2DEBUIE0MGEKHP4olCUW/XYte3Vroyxuh38rD1wAO4dHohsovUC4eAOuzFxE6b+RXvBU3UZ9o0YhUTkA==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.21.4"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/core-js"
      }
    },
    "node_modules/core-util-is": {
      "version": "1.0.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/cosmiconfig": {
      "version": "7.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/parse-json": "^4.0.0",
        "import-fresh": "^3.2.1",
        "parse-json": "^5.0.0",
        "path-type": "^4.0.0",
        "yaml": "^1.10.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/create-require": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/create-require/-/create-require-1.1.1.tgz",
      "integrity": "sha512-dcKFX3jn0MpIaXjisoRvexIJVEKzaq7z2rZKxf+MSr9TkdmHmsU4m2lcLojrj/FHl8mk5VxMmYA+ftRkP/3oKQ==",
      "dev": true
    },
    "node_modules/cross-spawn": {
      "version": "7.0.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/css-blank-pseudo": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/css-blank-pseudo/-/css-blank-pseudo-3.0.3.tgz",
      "integrity": "sha512-VS90XWtsHGqoM0t4KpH053c4ehxZ2E6HtGI7x68YFV0pTo/QmkV/YFA+NnlvK8guxZVNWGQhVNJGC39Q8XF4OQ==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.9"
      },
      "bin": {
        "css-blank-pseudo": "dist/cli.cjs"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/css-declaration-sorter": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/css-declaration-sorter/-/css-declaration-sorter-6.3.1.tgz",
      "integrity": "sha512-fBffmak0bPAnyqc/HO8C3n2sHrp9wcqQz6ES9koRF2/mLOVAx9zIQ3Y7R29sYCteTPqMCwns4WYQoCX91Xl3+w==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14"
      },
      "peerDependencies": {
        "postcss": "^8.0.9"
      }
    },
    "node_modules/css-functions-list": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/css-functions-list/-/css-functions-list-3.1.0.tgz",
      "integrity": "sha512-/9lCvYZaUbBGvYUgYGFJ4dcYiyqdhSjG7IPVluoV8A1ILjkF7ilmhp1OGUz8n+nmBcu0RNrQAzgD8B6FJbrt2w==",
      "dev": true,
      "engines": {
        "node": ">=12.22"
      }
    },
    "node_modules/css-has-pseudo": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/css-has-pseudo/-/css-has-pseudo-3.0.4.tgz",
      "integrity": "sha512-Vse0xpR1K9MNlp2j5w1pgWIJtm1a8qS0JwS9goFYcImjlHEmywP9VUF05aGBXzGpDJF86QXk4L0ypBmwPhGArw==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.9"
      },
      "bin": {
        "css-has-pseudo": "dist/cli.cjs"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/css-loader": {
      "version": "6.7.1",
      "resolved": "https://registry.npmjs.org/css-loader/-/css-loader-6.7.1.tgz",
      "integrity": "sha512-yB5CNFa14MbPJcomwNh3wLThtkZgcNyI2bNMRt8iE5Z8Vwl7f8vQXFAzn2HDOJvtDq2NTZBUGMSUNNyrv3/+cw==",
      "dev": true,
      "dependencies": {
        "icss-utils": "^5.1.0",
        "postcss": "^8.4.7",
        "postcss-modules-extract-imports": "^3.0.0",
        "postcss-modules-local-by-default": "^4.0.0",
        "postcss-modules-scope": "^3.0.0",
        "postcss-modules-values": "^4.0.0",
        "postcss-value-parser": "^4.2.0",
        "semver": "^7.3.5"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.0.0"
      }
    },
    "node_modules/css-loader/node_modules/semver": {
      "version": "7.3.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/css-prefers-color-scheme": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/css-prefers-color-scheme/-/css-prefers-color-scheme-6.0.3.tgz",
      "integrity": "sha512-4BqMbZksRkJQx2zAjrokiGMd07RqOa2IxIrrN10lyBe9xhn9DEvjUK79J6jkeiv9D9hQFXKb6g1jwU62jziJZA==",
      "dev": true,
      "bin": {
        "css-prefers-color-scheme": "dist/cli.cjs"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/css-select": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/css-select/-/css-select-4.3.0.tgz",
      "integrity": "sha512-wPpOYtnsVontu2mODhA19JrqWxNsfdatRKd64kmpRbQgh1KtItko5sTnEpPdpSaJszTOhEMlF/RPz28qj4HqhQ==",
      "dev": true,
      "dependencies": {
        "boolbase": "^1.0.0",
        "css-what": "^6.0.1",
        "domhandler": "^4.3.1",
        "domutils": "^2.8.0",
        "nth-check": "^2.0.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/css-tree": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/css-tree/-/css-tree-1.1.3.tgz",
      "integrity": "sha512-tRpdppF7TRazZrjJ6v3stzv93qxRcSsFmW6cX0Zm2NVKpxE1WV1HblnghVv9TreireHkqI/VDEsfolRF1p6y7Q==",
      "dev": true,
      "dependencies": {
        "mdn-data": "2.0.14",
        "source-map": "^0.6.1"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/css-tree/node_modules/source-map": {
      "version": "0.6.1",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/css-what": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/css-what/-/css-what-6.1.0.tgz",
      "integrity": "sha512-HTUrgRJ7r4dsZKU6GjmpfRK1O76h97Z8MfS1G0FozR+oF2kG6Vfe8JE6zwrkbxigziPHinCJ+gCPjA9EaBDtRw==",
      "dev": true,
      "engines": {
        "node": ">= 6"
      },
      "funding": {
        "url": "https://github.com/sponsors/fb55"
      }
    },
    "node_modules/cssdb": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/cssdb/-/cssdb-7.0.1.tgz",
      "integrity": "sha512-pT3nzyGM78poCKLAEy2zWIVX2hikq6dIrjuZzLV98MumBg+xMTNYfHx7paUlfiRTgg91O/vR889CIf+qiv79Rw==",
      "dev": true,
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      }
    },
    "node_modules/cssesc": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "bin": {
        "cssesc": "bin/cssesc"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/cssnano": {
      "version": "5.1.13",
      "resolved": "https://registry.npmjs.org/cssnano/-/cssnano-5.1.13.tgz",
      "integrity": "sha512-S2SL2ekdEz6w6a2epXn4CmMKU4K3KpcyXLKfAYc9UQQqJRkD/2eLUG0vJ3Db/9OvO5GuAdgXw3pFbR6abqghDQ==",
      "dev": true,
      "dependencies": {
        "cssnano-preset-default": "^5.2.12",
        "lilconfig": "^2.0.3",
        "yaml": "^1.10.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/cssnano"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/cssnano-preset-default": {
      "version": "5.2.12",
      "resolved": "https://registry.npmjs.org/cssnano-preset-default/-/cssnano-preset-default-5.2.12.tgz",
      "integrity": "sha512-OyCBTZi+PXgylz9HAA5kHyoYhfGcYdwFmyaJzWnzxuGRtnMw/kR6ilW9XzlzlRAtB6PLT/r+prYgkef7hngFew==",
      "dev": true,
      "dependencies": {
        "css-declaration-sorter": "^6.3.0",
        "cssnano-utils": "^3.1.0",
        "postcss-calc": "^8.2.3",
        "postcss-colormin": "^5.3.0",
        "postcss-convert-values": "^5.1.2",
        "postcss-discard-comments": "^5.1.2",
        "postcss-discard-duplicates": "^5.1.0",
        "postcss-discard-empty": "^5.1.1",
        "postcss-discard-overridden": "^5.1.0",
        "postcss-merge-longhand": "^5.1.6",
        "postcss-merge-rules": "^5.1.2",
        "postcss-minify-font-values": "^5.1.0",
        "postcss-minify-gradients": "^5.1.1",
        "postcss-minify-params": "^5.1.3",
        "postcss-minify-selectors": "^5.2.1",
        "postcss-normalize-charset": "^5.1.0",
        "postcss-normalize-display-values": "^5.1.0",
        "postcss-normalize-positions": "^5.1.1",
        "postcss-normalize-repeat-style": "^5.1.1",
        "postcss-normalize-string": "^5.1.0",
        "postcss-normalize-timing-functions": "^5.1.0",
        "postcss-normalize-unicode": "^5.1.0",
        "postcss-normalize-url": "^5.1.0",
        "postcss-normalize-whitespace": "^5.1.1",
        "postcss-ordered-values": "^5.1.3",
        "postcss-reduce-initial": "^5.1.0",
        "postcss-reduce-transforms": "^5.1.0",
        "postcss-svgo": "^5.1.0",
        "postcss-unique-selectors": "^5.1.1"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/cssnano-utils": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/cssnano-utils/-/cssnano-utils-3.1.0.tgz",
      "integrity": "sha512-JQNR19/YZhz4psLX/rQ9M83e3z2Wf/HdJbryzte4a3NSuafyp9w/I4U+hx5C2S9g41qlstH7DEWnZaaj83OuEA==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/csso": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/csso/-/csso-4.2.0.tgz",
      "integrity": "sha512-wvlcdIbf6pwKEk7vHj8/Bkc0B4ylXZruLvOgs9doS5eOsOpuodOV2zJChSpkp+pRpYQLQMeF04nr3Z68Sta9jA==",
      "dev": true,
      "dependencies": {
        "css-tree": "^1.1.2"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/dashdash": {
      "version": "1.14.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/date-fns": {
      "version": "2.29.3",
      "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-2.29.3.tgz",
      "integrity": "sha512-dDCnyH2WnnKusqvZZ6+jA1O51Ibt8ZMRNkDZdyAyK4YfbDwa/cEmuztzG5pk6hqlp9aSBPYcjOlktquahGwGeA==",
      "dev": true,
      "engines": {
        "node": ">=0.11"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/date-fns"
      }
    },
    "node_modules/debug": {
      "version": "4.3.4",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.4.tgz",
      "integrity": "sha512-PRWFHuSU3eDtQJPvnNY7Jcket1j0t5OuOsFzPPzsekD52Zl8qUfFIPEiswXqIvHWGVHOgX+7G/vCNNhehwxfkQ==",
      "dev": true,
      "dependencies": {
        "ms": "2.1.2"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/decamelize": {
      "version": "1.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/decamelize-keys": {
      "version": "1.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "decamelize": "^1.1.0",
        "map-obj": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/decamelize-keys/node_modules/map-obj": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/deep-is": {
      "version": "0.1.4",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/define-properties": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.1.4.tgz",
      "integrity": "sha512-uckOqKcfaVvtBdsVkdPv3XjveQJsNQqmhXgRi8uhvWWuPYZCNlzT8qAyblUgNoXdHdjMTzAqeGjAoli8f+bzPA==",
      "dev": true,
      "dependencies": {
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/delegates": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/depd": {
      "version": "1.1.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/diff": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/diff/-/diff-5.0.0.tgz",
      "integrity": "sha512-/VTCrvm5Z0JGty/BWHljh+BAiw3IK+2j87NGMu8Nwc/f48WoDAC395uomO9ZD117ZOBaHmkX1oyLvkVM/aIT3w==",
      "dev": true,
      "engines": {
        "node": ">=0.3.1"
      }
    },
    "node_modules/dir-glob": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/dir-glob/-/dir-glob-3.0.1.tgz",
      "integrity": "sha512-WkrWp9GR4KXfKGYzOLmTuGVi1UWFfws377n9cc55/tb6DuqyF6pcQ5AbiHEshaDpY9v6oaSr2XCDidGmMwdzIA==",
      "dev": true,
      "dependencies": {
        "path-type": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/doctrine": {
      "version": "3.0.0",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "esutils": "^2.0.2"
      },
      "engines": {
        "node": ">=6.0.0"
      }
    },
    "node_modules/dom-serializer": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/dom-serializer/-/dom-serializer-1.4.1.tgz",
      "integrity": "sha512-VHwB3KfrcOOkelEG2ZOfxqLZdfkil8PtJi4P8N2MMXucZq2yLp75ClViUlOVwyoHEDjYU433Aq+5zWP61+RGag==",
      "dev": true,
      "dependencies": {
        "domelementtype": "^2.0.1",
        "domhandler": "^4.2.0",
        "entities": "^2.0.0"
      },
      "funding": {
        "url": "https://github.com/cheeriojs/dom-serializer?sponsor=1"
      }
    },
    "node_modules/domelementtype": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/domelementtype/-/domelementtype-2.3.0.tgz",
      "integrity": "sha512-OLETBj6w0OsagBwdXnPdN0cnMfF9opN69co+7ZrbfPGrdpPVNBUj02spi6B1N7wChLQiPn4CSH/zJvXw56gmHw==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/fb55"
        }
      ]
    },
    "node_modules/domhandler": {
      "version": "4.3.1",
      "resolved": "https://registry.npmjs.org/domhandler/-/domhandler-4.3.1.tgz",
      "integrity": "sha512-GrwoxYN+uWlzO8uhUXRl0P+kHE4GtVPfYzVLcUxPL7KNdHKj66vvlhiweIHqYYXWlw+T8iLMp42Lm67ghw4WMQ==",
      "dev": true,
      "dependencies": {
        "domelementtype": "^2.2.0"
      },
      "engines": {
        "node": ">= 4"
      },
      "funding": {
        "url": "https://github.com/fb55/domhandler?sponsor=1"
      }
    },
    "node_modules/domutils": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/domutils/-/domutils-2.8.0.tgz",
      "integrity": "sha512-w96Cjofp72M5IIhpjgobBimYEfoPjx1Vx0BSX9P30WBdZW2WIKU0T1Bd0kz2eNZ9ikjKgHbEyKx8BB6H1L3h3A==",
      "dev": true,
      "dependencies": {
        "dom-serializer": "^1.0.1",
        "domelementtype": "^2.2.0",
        "domhandler": "^4.2.0"
      },
      "funding": {
        "url": "https://github.com/fb55/domutils?sponsor=1"
      }
    },
    "node_modules/ecc-jsbn": {
      "version": "0.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "node_modules/electron-to-chromium": {
      "version": "1.4.275",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.4.275.tgz",
      "integrity": "sha512-aJeQQ+Hl9Jyyzv4chBqYJwmVRY46N5i2BEX5Cuyk/5gFCUZ5F3i7Hnba6snZftWla7Gglwc5pIgcd+E7cW+rPg==",
      "dev": true
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true
    },
    "node_modules/emojis-list": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/encoding": {
      "version": "0.1.13",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "iconv-lite": "^0.6.2"
      }
    },
    "node_modules/enhanced-resolve": {
      "version": "5.10.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.10.0.tgz",
      "integrity": "sha512-T0yTFjdpldGY8PmuXXR0PyQ1ufZpEGiHVrp7zHKB7jdR4qlmZHhONVM5AQOAWXuF/w3dnHbEQVrNptJgt7F+cQ==",
      "dev": true,
      "dependencies": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.2.0"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/entities": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/entities/-/entities-2.2.0.tgz",
      "integrity": "sha512-p92if5Nz619I0w+akJrLZH0MX0Pb5DX39XOwQTtXSdQQOaYH03S1uIQp4mhOZtAXrxq4ViO67YTiLBo2638o9A==",
      "dev": true,
      "funding": {
        "url": "https://github.com/fb55/entities?sponsor=1"
      }
    },
    "node_modules/env-paths": {
      "version": "2.2.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/envinfo": {
      "version": "7.8.1",
      "resolved": "https://registry.npmjs.org/envinfo/-/envinfo-7.8.1.tgz",
      "integrity": "sha512-/o+BXHmB7ocbHEAs6F2EnG0ogybVVUdkRunTT2glZU9XAaGmhqskrvKwqXuDfNjEO0LZKWdejEEpnq8aM0tOaw==",
      "dev": true,
      "bin": {
        "envinfo": "dist/cli.js"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/err-code": {
      "version": "2.0.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/error-ex": {
      "version": "1.3.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-arrayish": "^0.2.1"
      }
    },
    "node_modules/es-module-lexer": {
      "version": "0.9.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/escalade": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.1.1.tgz",
      "integrity": "sha512-k0er2gUkLf8O0zKJiAhmkTnJlTvINGv7ygDNPbeIsX/TJjGJZHuh9B2UxbsaEkmlEo9MfhrSzmhIlhRlI2GXnw==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-string-regexp": {
      "version": "1.0.5",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/eslint": {
      "version": "8.24.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-8.24.0.tgz",
      "integrity": "sha512-dWFaPhGhTAiPcCgm3f6LI2MBWbogMnTJzFBbhXVRQDJPkr9pGZvVjlVfXd+vyDcWPA2Ic9L2AXPIQM0+vk/cSQ==",
      "dev": true,
      "dependencies": {
        "@eslint/eslintrc": "^1.3.2",
        "@humanwhocodes/config-array": "^0.10.5",
        "@humanwhocodes/gitignore-to-minimatch": "^1.0.2",
        "@humanwhocodes/module-importer": "^1.0.1",
        "ajv": "^6.10.0",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.2",
        "debug": "^4.3.2",
        "doctrine": "^3.0.0",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^7.1.1",
        "eslint-utils": "^3.0.0",
        "eslint-visitor-keys": "^3.3.0",
        "espree": "^9.4.0",
        "esquery": "^1.4.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^6.0.1",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.1",
        "globals": "^13.15.0",
        "globby": "^11.1.0",
        "grapheme-splitter": "^1.0.4",
        "ignore": "^5.2.0",
        "import-fresh": "^3.0.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "js-sdsl": "^4.1.4",
        "js-yaml": "^4.1.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "levn": "^0.4.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.2",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.1",
        "regexpp": "^3.2.0",
        "strip-ansi": "^6.0.1",
        "strip-json-comments": "^3.1.0",
        "text-table": "^0.2.0"
      },
      "bin": {
        "eslint": "bin/eslint.js"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/eslint-config-google": {
      "version": "0.14.0",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.10.0"
      },
      "peerDependencies": {
        "eslint": ">=5.16.0"
      }
    },
    "node_modules/eslint-scope": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-7.1.1.tgz",
      "integrity": "sha512-QKQM/UXpIiHcLqJ5AOyIW7XZmzjkzQXYE54n1++wb0u9V/abW3l9uQnxX8Z5Xd18xyKIMTUAyQ0k1e8pz6LUrw==",
      "dev": true,
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      }
    },
    "node_modules/eslint-utils": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "eslint-visitor-keys": "^2.0.0"
      },
      "engines": {
        "node": "^10.0.0 || ^12.0.0 || >= 14.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/mysticatea"
      },
      "peerDependencies": {
        "eslint": ">=5"
      }
    },
    "node_modules/eslint-utils/node_modules/eslint-visitor-keys": {
      "version": "2.1.0",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/eslint-visitor-keys": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.3.0.tgz",
      "integrity": "sha512-mQ+suqKJVyeuwGYHAdjMFqjCyfl8+Ldnxuyp3ldiMBFKkvytrXUZWaiPCEav8qDHKty44bD+qV1IP4T+w+xXRA==",
      "dev": true,
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      }
    },
    "node_modules/eslint/node_modules/ansi-styles": {
      "version": "4.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/eslint/node_modules/chalk": {
      "version": "4.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/eslint/node_modules/color-convert": {
      "version": "2.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/eslint/node_modules/color-name": {
      "version": "1.1.4",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/eslint/node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/globals": {
      "version": "13.17.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-13.17.0.tgz",
      "integrity": "sha512-1C+6nQRb1GwGMKm2dH/E7enFAMxGTmGI7/dEdhy/DNelv85w9B72t3uc5frtMNXIbzrarJJ/lTCjcaZwbLJmyw==",
      "dev": true,
      "dependencies": {
        "type-fest": "^0.20.2"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/globby": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/globby/-/globby-11.1.0.tgz",
      "integrity": "sha512-jhIXaOzy1sb8IyocaruWSn1TjmnBVs8Ayhcy83rmxNJ8q2uWKCAj3CnJY+KpGSXCueAPc0i05kVvVKtP1t9S3g==",
      "dev": true,
      "dependencies": {
        "array-union": "^2.1.0",
        "dir-glob": "^3.0.1",
        "fast-glob": "^3.2.9",
        "ignore": "^5.2.0",
        "merge2": "^1.4.1",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/has-flag": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/eslint/node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/minimatch": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
      "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
      "dev": true,
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/eslint/node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/eslint/node_modules/slash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
      "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/eslint/node_modules/supports-color": {
      "version": "7.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/eslint/node_modules/type-fest": {
      "version": "0.20.2",
      "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
      "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/espree": {
      "version": "9.4.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-9.4.0.tgz",
      "integrity": "sha512-DQmnRpLj7f6TgN/NYb0MTzJXL+vJF9h3pHy4JhCIs3zwcgez8xmGg3sXHcEO97BrmO2OSvCwMdfdlyl+E9KjOw==",
      "dev": true,
      "dependencies": {
        "acorn": "^8.8.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^3.3.0"
      },
      "engines": {
        "node": "^12.22.0 || ^14.17.0 || >=16.0.0"
      },
      "funding": {
        "url": "https://opencollective.com/eslint"
      }
    },
    "node_modules/esquery": {
      "version": "1.4.0",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "estraverse": "^5.1.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/esrecurse": {
      "version": "4.3.0",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "estraverse": "^5.2.0"
      },
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/estraverse": {
      "version": "5.3.0",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/esutils": {
      "version": "2.0.3",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/events": {
      "version": "3.3.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.x"
      }
    },
    "node_modules/extend": {
      "version": "3.0.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/extsprintf": {
      "version": "1.3.0",
      "dev": true,
      "engines": [
        "node >=0.6.0"
      ],
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-glob": {
      "version": "3.2.12",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.2.12.tgz",
      "integrity": "sha512-DVj4CQIYYow0BlaelwK1pHl5n5cRSJfM60UA0zK891sVInoPri2Ekj7+e1CT3/3qxXenpI+nBBmQAcJPJgaj4w==",
      "dev": true,
      "dependencies": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/fast-glob/node_modules/glob-parent": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
      "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
      "dev": true,
      "dependencies": {
        "is-glob": "^4.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fast-levenshtein": {
      "version": "2.0.6",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/fastest-levenshtein": {
      "version": "1.0.16",
      "resolved": "https://registry.npmjs.org/fastest-levenshtein/-/fastest-levenshtein-1.0.16.tgz",
      "integrity": "sha512-eRnCtTTtGZFpQCwhJiUOuxPQWRXVKYDn0b2PeHfXL6/Zi53SLAzAHfVhVWK2AryC/WH05kGfxhFIPvTF0SXQzg==",
      "dev": true,
      "engines": {
        "node": ">= 4.9.1"
      }
    },
    "node_modules/fastq": {
      "version": "1.13.0",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.13.0.tgz",
      "integrity": "sha512-YpkpUnK8od0o1hmeSc7UUs/eB/vIPWJYjKck2QKIzAf71Vm1AAQ3EbuZB3g2JIy+pg+ERD0vqI79KyZiB2e2Nw==",
      "dev": true,
      "dependencies": {
        "reusify": "^1.0.4"
      }
    },
    "node_modules/file-entry-cache": {
      "version": "6.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flat-cache": "^3.0.4"
      },
      "engines": {
        "node": "^10.12.0 || >=12.0.0"
      }
    },
    "node_modules/fill-range": {
      "version": "7.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "to-regex-range": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/find-cache-dir": {
      "version": "3.3.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "commondir": "^1.0.1",
        "make-dir": "^3.0.2",
        "pkg-dir": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/avajs/find-cache-dir?sponsor=1"
      }
    },
    "node_modules/find-up": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/flat": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/flat/-/flat-5.0.2.tgz",
      "integrity": "sha512-b6suED+5/3rTpUBdG1gupIl8MPFCAMA0QXwmljLhvCUKcUvdE4gWky9zpuGCcXHOsz4J9wPGNWq6OKpmIzz3hQ==",
      "dev": true,
      "bin": {
        "flat": "cli.js"
      }
    },
    "node_modules/flat-cache": {
      "version": "3.0.4",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "flatted": "^3.1.0",
        "rimraf": "^3.0.2"
      },
      "engines": {
        "node": "^10.12.0 || >=12.0.0"
      }
    },
    "node_modules/flatted": {
      "version": "3.2.4",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/forever-agent": {
      "version": "0.6.1",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/form-data": {
      "version": "2.3.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.6",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 0.12"
      }
    },
    "node_modules/foundation-sites": {
      "version": "6.7.4",
      "resolved": "https://registry.npmjs.org/foundation-sites/-/foundation-sites-6.7.4.tgz",
      "integrity": "sha512-2QPaZJ0Od0DyklhQyKC3zPbr8AAUXSkr1scZJrQTgj/KTLresuCgUBfi7ft32NlOWhuqVXisjOgTE8N5EPS3cg==",
      "engines": {
        "node": ">=12.0"
      },
      "peerDependencies": {
        "jquery": ">=3.6.0",
        "motion-ui": "latest",
        "what-input": ">=5.2.10"
      }
    },
    "node_modules/fraction.js": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-4.2.0.tgz",
      "integrity": "sha512-MhLuK+2gUcnZe8ZHlaaINnQLl0xRIGRfcGk2yl8xoQAfHrSsL3rYu6FCmBdkdbhc9EPlwyGHewaRsvwRMJtAlA==",
      "dev": true,
      "engines": {
        "node": "*"
      },
      "funding": {
        "type": "patreon",
        "url": "https://www.patreon.com/infusion"
      }
    },
    "node_modules/fs-minipass": {
      "version": "2.1.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/fs.realpath": {
      "version": "1.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/fsevents": {
      "version": "2.3.2",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "os": [
        "darwin"
      ],
      "engines": {
        "node": "^8.16.0 || ^10.6.0 || >=11.0.0"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/gauge": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "ansi-regex": "^5.0.1",
        "aproba": "^1.0.3 || ^2.0.0",
        "color-support": "^1.1.2",
        "console-control-strings": "^1.0.0",
        "has-unicode": "^2.0.1",
        "signal-exit": "^3.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "wide-align": "^1.1.2"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/gaze": {
      "version": "1.1.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "globule": "^1.0.0"
      },
      "engines": {
        "node": ">= 4.0.0"
      }
    },
    "node_modules/gensync": {
      "version": "1.0.0-beta.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.1.3.tgz",
      "integrity": "sha512-QJVz1Tj7MS099PevUG5jvnt9tSkXN8K14dxQlikJuPt4uD9hHAHjLyLBiLR5zELelBdD9QNRAXZzsJx0WaDL9A==",
      "dev": true,
      "dependencies": {
        "function-bind": "^1.1.1",
        "has": "^1.0.3",
        "has-symbols": "^1.0.3"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/getpass": {
      "version": "0.1.7",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0"
      }
    },
    "node_modules/glob": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.0.tgz",
      "integrity": "sha512-lmLf6gtyrPq8tTjSmrO94wBeQbFR3HbLHbuyD69wuyQkImp2hWqMGB47OX65FBkPffO641IP9jWa1z4ivqG26Q==",
      "dev": true,
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.0.4",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/glob-parent": {
      "version": "6.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "is-glob": "^4.0.3"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/glob-to-regexp": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/glob-to-regexp/-/glob-to-regexp-0.4.1.tgz",
      "integrity": "sha512-lkX1HJXwyMcprw/5YUZc2s7DrpAiHB21/V+E1rHUrVNokkvB6bqMzT0VfV6/86ZNabt1k14YOIaT7nDvOX3Iiw==",
      "dev": true
    },
    "node_modules/global-modules": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "global-prefix": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/global-prefix": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ini": "^1.3.5",
        "kind-of": "^6.0.2",
        "which": "^1.3.1"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/global-prefix/node_modules/which": {
      "version": "1.3.1",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "which": "bin/which"
      }
    },
    "node_modules/globals": {
      "version": "11.12.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-11.12.0.tgz",
      "integrity": "sha512-WOBp/EEGUiIsJSp7wcv/y6MO+lV9UoncWqxuFfm8eBwzWNgyfBd6Gz+IeKQ9jCmyhoH99g15M3T+QaVHFjizVA==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/globby": {
      "version": "13.1.2",
      "resolved": "https://registry.npmjs.org/globby/-/globby-13.1.2.tgz",
      "integrity": "sha512-LKSDZXToac40u8Q1PQtZihbNdTYSNMuWe+K5l+oa6KgDzSvVrHXlJy40hUP522RjAIoNLJYBJi7ow+rbFpIhHQ==",
      "dev": true,
      "dependencies": {
        "dir-glob": "^3.0.1",
        "fast-glob": "^3.2.11",
        "ignore": "^5.2.0",
        "merge2": "^1.4.1",
        "slash": "^4.0.0"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/globjoin": {
      "version": "0.1.4",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/globule": {
      "version": "1.3.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "glob": "~7.1.1",
        "lodash": "~4.17.10",
        "minimatch": "~3.0.2"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/globule/node_modules/glob": {
      "version": "7.1.7",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.1.7.tgz",
      "integrity": "sha512-OvD9ENzPLbegENnYP5UUfJIirTg4+XwMWGaQfQTY0JenxNvvIKP3U3/tAQSPIu/lHxXYSZmpXlUHeqAIdKzBLQ==",
      "dev": true,
      "dependencies": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.0.4",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      },
      "engines": {
        "node": "*"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/graceful-fs": {
      "version": "4.2.10",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.10.tgz",
      "integrity": "sha512-9ByhssR2fPVsNZj478qUUbKfmL0+t5BDVyjShtyZZLiK7ZDAArFFfopyOTj0M05wE2tJPisA4iTnnXl2YoPvOA==",
      "dev": true
    },
    "node_modules/grapheme-splitter": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/grapheme-splitter/-/grapheme-splitter-1.0.4.tgz",
      "integrity": "sha512-bzh50DW9kTPM00T8y4o8vQg89Di9oLJVLW/KaOGIXJWP/iqCN6WKYkbNOF04vFLJhwcpYUh9ydh/+5vpOqV4YQ==",
      "dev": true
    },
    "node_modules/gsap": {
      "version": "3.11.3",
      "resolved": "https://registry.npmjs.org/gsap/-/gsap-3.11.3.tgz",
      "integrity": "sha512-xc/iIJy+LWiMbRa4IdMtdnnKa/7PXEK6NNzV71gdOYUVeTZN7UWnLU0fB7Hi1iwiz4ZZoYkBZPPYGg+2+zzFHA=="
    },
    "node_modules/har-schema": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/har-validator": {
      "version": "5.1.5",
      "deprecated": "this library is no longer supported",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.12.3",
        "har-schema": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/hard-rejection": {
      "version": "2.1.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/has": {
      "version": "1.0.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4.0"
      }
    },
    "node_modules/has-flag": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/has-property-descriptors": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.0.tgz",
      "integrity": "sha512-62DVLZGoiEBDHQyqG4w9xCuZ7eJEwNmJRWw2VY84Oedb7WFcA27fiEVe8oUQx9hAUJ4ekurquucTGwsyO1XGdQ==",
      "dev": true,
      "dependencies": {
        "get-intrinsic": "^1.1.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.0.3.tgz",
      "integrity": "sha512-l3LCuF6MgDNwTDKkdYGEihYjt5pRPbEg46rtlmnSPlUbgmB8LOIrKJbYYFBSbnPaJexMKtiPO8hmeRjRz2Td+A==",
      "dev": true,
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-unicode": {
      "version": "2.0.1",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/he": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/he/-/he-1.2.0.tgz",
      "integrity": "sha512-F/1DnUGPopORZi0ni+CvrCgHQ5FyEAHRLSApuYWMmrbSwoN2Mn/7k+Gl38gJnR7yyDZk6WLXwiGod1JOWNDKGw==",
      "dev": true,
      "bin": {
        "he": "bin/he"
      }
    },
    "node_modules/hosted-git-info": {
      "version": "2.8.9",
      "resolved": "https://registry.npmjs.org/hosted-git-info/-/hosted-git-info-2.8.9.tgz",
      "integrity": "sha512-mxIDAb9Lsm6DoOJ7xH+5+X4y1LU/4Hi50L9C5sIswK3JzULS4bwk1FvjdBgvYR4bzT4tuUQiC15FE2f5HbLvYw==",
      "dev": true
    },
    "node_modules/html-tags": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/html-tags/-/html-tags-3.2.0.tgz",
      "integrity": "sha512-vy7ClnArOZwCnqZgvv+ddgHgJiAFXe3Ge9ML5/mBctVJoUoYPCdxVucOywjDARn6CVoh3dRSFdPHy2sX80L0Wg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/http-cache-semantics": {
      "version": "4.1.0",
      "dev": true,
      "license": "BSD-2-Clause"
    },
    "node_modules/http-proxy-agent": {
      "version": "4.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@tootallnate/once": "1",
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/http-signature": {
      "version": "1.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0",
        "jsprim": "^1.2.2",
        "sshpk": "^1.7.0"
      },
      "engines": {
        "node": ">=0.8",
        "npm": ">=1.3.7"
      }
    },
    "node_modules/https-proxy-agent": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/humanize-ms": {
      "version": "1.2.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ms": "^2.0.0"
      }
    },
    "node_modules/iconv-lite": {
      "version": "0.6.3",
      "dev": true,
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/icss-utils": {
      "version": "5.1.0",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "^10 || ^12 || >= 14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/ignore": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.2.0.tgz",
      "integrity": "sha512-CmxgYGiEPCLhfLnpPp1MoRmifwEIOgjcHXxOBjv7mY96c+eWScsOP9c112ZyLdWHi0FxHjI+4uVhKYp/gcdRmQ==",
      "dev": true,
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/immutable": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/import-fresh": {
      "version": "3.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/import-lazy": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/import-local": {
      "version": "3.0.3",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "pkg-dir": "^4.2.0",
        "resolve-cwd": "^3.0.0"
      },
      "bin": {
        "import-local-fixture": "fixtures/cli.js"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/imurmurhash": {
      "version": "0.1.4",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.8.19"
      }
    },
    "node_modules/indent-string": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/infer-owner": {
      "version": "1.0.4",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/inflight": {
      "version": "1.0.6",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/ini": {
      "version": "1.3.8",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/interpret": {
      "version": "2.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/ip": {
      "version": "1.1.5",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-arrayish": {
      "version": "0.2.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-binary-path": {
      "version": "2.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "binary-extensions": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-core-module": {
      "version": "2.10.0",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.10.0.tgz",
      "integrity": "sha512-Erxj2n/LDAZ7H8WNJXd9tw38GYM3dv8rk8Zcs+jJuxYTW7sozH+SS8NtrSjVL1/vpLvWi1hxy96IzjJ3EHTJJg==",
      "dev": true,
      "dependencies": {
        "has": "^1.0.3"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/is-extglob": {
      "version": "2.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "dependencies": {
        "is-extglob": "^2.1.1"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-lambda": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-number": {
      "version": "7.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.12.0"
      }
    },
    "node_modules/is-plain-obj": {
      "version": "1.1.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-plain-object": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-5.0.0.tgz",
      "integrity": "sha512-VRSzKkbMm5jMDoKLbltAkFQ5Qr7VDiTFGXxYFXXowVj387GeGNOCsOH6Msy00SGZ3Fp84b1Naa1psqgcCIEP5Q==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/is-typedarray": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/is-unicode-supported": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-0.1.0.tgz",
      "integrity": "sha512-knxG2q4UC3u8stRGyAVJCOdxFmv5DZiRcdlIaAQXAbSfJya+OhopNotLQrstBhququ4ZpuKbDc/8S6mgXgPFPw==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/isarray": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/isexe": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/isobject": {
      "version": "3.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/isstream": {
      "version": "0.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/jest-worker": {
      "version": "27.4.5",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/node": "*",
        "merge-stream": "^2.0.0",
        "supports-color": "^8.0.0"
      },
      "engines": {
        "node": ">= 10.13.0"
      }
    },
    "node_modules/jquery": {
      "version": "3.6.1",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-3.6.1.tgz",
      "integrity": "sha512-opJeO4nCucVnsjiXOE+/PcCgYw9Gwpvs/a6B1LL/lQhwWwpbVEVYDZ1FokFr8PRc7ghYlrFPuyHuiiDNTQxmcw=="
    },
    "node_modules/js-base64": {
      "version": "2.6.4",
      "resolved": "https://registry.npmjs.org/js-base64/-/js-base64-2.6.4.tgz",
      "integrity": "sha512-pZe//GGmwJndub7ZghVHz7vjb2LgC1m8B07Au3eYqeqv9emhESByMXxaEgkUkEqJe87oBbSniGYoQNIBklc7IQ==",
      "dev": true
    },
    "node_modules/js-sdsl": {
      "version": "4.1.5",
      "resolved": "https://registry.npmjs.org/js-sdsl/-/js-sdsl-4.1.5.tgz",
      "integrity": "sha512-08bOAKweV2NUC1wqTtf3qZlnpOX/R2DU9ikpjOHs0H+ibQv3zpncVQg6um4uYtRtrwIX8M4Nh3ytK4HGlYAq7Q==",
      "dev": true
    },
    "node_modules/js-tokens": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/js-yaml": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
      "dev": true,
      "dependencies": {
        "argparse": "^2.0.1"
      },
      "bin": {
        "js-yaml": "bin/js-yaml.js"
      }
    },
    "node_modules/jsbn": {
      "version": "0.1.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/jsesc": {
      "version": "2.5.2",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-2.5.2.tgz",
      "integrity": "sha512-OYu7XEzjkCQ3C5Ps3QIZsQfNpqoJyZZA99wd9aWd05NCtC5pWOkShK2mkL6HXQR6/Cy2lbNdPlZBpuQHXE63gA==",
      "dev": true,
      "bin": {
        "jsesc": "bin/jsesc"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/json-parse-even-better-errors": {
      "version": "2.3.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-schema": {
      "version": "0.4.0",
      "dev": true,
      "license": "(AFL-2.1 OR BSD-3-Clause)"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/json-stringify-safe": {
      "version": "5.0.1",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/json5": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.1.tgz",
      "integrity": "sha512-1hqLFMSrGHRHxav9q9gNjJ5EXznIxGVO09xQRrwplcS8qs28pZ8s8hupZAmqDwZUmVZ2Qb2jnyPOWcDH8m8dlA==",
      "dev": true,
      "bin": {
        "json5": "lib/cli.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/jsprim": {
      "version": "1.4.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "assert-plus": "1.0.0",
        "extsprintf": "1.3.0",
        "json-schema": "0.4.0",
        "verror": "1.10.0"
      },
      "engines": {
        "node": ">=0.6.0"
      }
    },
    "node_modules/kind-of": {
      "version": "6.0.3",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/klona": {
      "version": "2.0.4",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/known-css-properties": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/known-css-properties/-/known-css-properties-0.25.0.tgz",
      "integrity": "sha512-b0/9J1O9Jcyik1GC6KC42hJ41jKwdO/Mq8Mdo5sYN+IuRTXs2YFHZC3kZSx6ueusqa95x3wLYe/ytKjbAfGixA==",
      "dev": true
    },
    "node_modules/levn": {
      "version": "0.4.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/lilconfig": {
      "version": "2.0.4",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/lines-and-columns": {
      "version": "1.1.6",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/loader-runner": {
      "version": "4.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6.11.5"
      }
    },
    "node_modules/loader-utils": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/loader-utils/-/loader-utils-2.0.2.tgz",
      "integrity": "sha512-TM57VeHptv569d/GKh6TAYdzKblwDNiumOdkFnejjD0XwTH87K90w3O7AiJRqdQoXygvi1VQTJTLGhJl7WqA7A==",
      "dev": true,
      "dependencies": {
        "big.js": "^5.2.2",
        "emojis-list": "^3.0.0",
        "json5": "^2.1.2"
      },
      "engines": {
        "node": ">=8.9.0"
      }
    },
    "node_modules/locate-path": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
      "dev": true
    },
    "node_modules/lodash.debounce": {
      "version": "4.0.8",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lodash.memoize": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/lodash.memoize/-/lodash.memoize-4.1.2.tgz",
      "integrity": "sha512-t7j+NzmgnQzTAYXcsHYLgimltOV1MXHtlOWf6GjL9Kj8GK5FInw5JotxvbOs+IvV1/Dzo04/fCGfLVs7aXb4Ag==",
      "dev": true
    },
    "node_modules/lodash.merge": {
      "version": "4.6.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/lodash.truncate": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/lodash.truncate/-/lodash.truncate-4.4.2.tgz",
      "integrity": "sha512-jttmRe7bRse52OsWIMDLaXxWqRAmtIUccAQ3garviCqJjafXOfNMO0yMfNpdD6zbGaTU0P5Nz7e7gAT6cKmJRw==",
      "dev": true
    },
    "node_modules/lodash.uniq": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/lodash.uniq/-/lodash.uniq-4.5.0.tgz",
      "integrity": "sha512-xfBaXQd9ryd9dlSDvnvI0lvxfLJlYAZzXomUYzLKtUeOQvOP5piqAWuGtrhWeqaXK9hhoM/iyJc5AV+XfsX3HQ==",
      "dev": true
    },
    "node_modules/log-symbols": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-4.1.0.tgz",
      "integrity": "sha512-8XPvpAA8uyhfteu8pIvQxpJZ7SYYdpUivZpGy6sFsBuKRY/7rQGavedeB8aK+Zkyq6upMFVL/9AW6vOYzfRyLg==",
      "dev": true,
      "dependencies": {
        "chalk": "^4.1.0",
        "is-unicode-supported": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/log-symbols/node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/log-symbols/node_modules/chalk": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
      "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/log-symbols/node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/log-symbols/node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true
    },
    "node_modules/log-symbols/node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/log-symbols/node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/lru-cache": {
      "version": "6.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/make-dir": {
      "version": "3.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "semver": "^6.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/make-dir/node_modules/semver": {
      "version": "6.3.0",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      }
    },
    "node_modules/make-error": {
      "version": "1.3.6",
      "resolved": "https://registry.npmjs.org/make-error/-/make-error-1.3.6.tgz",
      "integrity": "sha512-s8UhlNe7vPKomQhC1qFelMokr/Sc3AgNbso3n74mVPA5LTZwkB9NlXf4XPamLxJE8h0gh73rM94xvwRT2CVInw==",
      "dev": true
    },
    "node_modules/make-fetch-happen": {
      "version": "9.1.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "agentkeepalive": "^4.1.3",
        "cacache": "^15.2.0",
        "http-cache-semantics": "^4.1.0",
        "http-proxy-agent": "^4.0.1",
        "https-proxy-agent": "^5.0.0",
        "is-lambda": "^1.0.1",
        "lru-cache": "^6.0.0",
        "minipass": "^3.1.3",
        "minipass-collect": "^1.0.2",
        "minipass-fetch": "^1.3.2",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.4",
        "negotiator": "^0.6.2",
        "promise-retry": "^2.0.1",
        "socks-proxy-agent": "^6.0.0",
        "ssri": "^8.0.0"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/make-fetch-happen/node_modules/cacache": {
      "version": "15.3.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "@npmcli/fs": "^1.0.0",
        "@npmcli/move-file": "^1.0.1",
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "glob": "^7.1.4",
        "infer-owner": "^1.0.4",
        "lru-cache": "^6.0.0",
        "minipass": "^3.1.1",
        "minipass-collect": "^1.0.2",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.2",
        "mkdirp": "^1.0.3",
        "p-map": "^4.0.0",
        "promise-inflight": "^1.0.1",
        "rimraf": "^3.0.2",
        "ssri": "^8.0.1",
        "tar": "^6.0.2",
        "unique-filename": "^1.1.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/make-fetch-happen/node_modules/chownr": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/make-fetch-happen/node_modules/lru-cache": {
      "version": "6.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/make-fetch-happen/node_modules/mkdirp": {
      "version": "1.0.4",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/make-fetch-happen/node_modules/rimraf": {
      "version": "3.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/make-fetch-happen/node_modules/ssri": {
      "version": "8.0.1",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.1.1"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/make-fetch-happen/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/map-obj": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/mathml-tag-names": {
      "version": "2.1.3",
      "dev": true,
      "license": "MIT",
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/wooorm"
      }
    },
    "node_modules/mdn-data": {
      "version": "2.0.14",
      "resolved": "https://registry.npmjs.org/mdn-data/-/mdn-data-2.0.14.tgz",
      "integrity": "sha512-dn6wd0uw5GsdswPFfsgMp5NSB0/aDe6fK94YJV/AJDYXL6HVLWBsxeq7js7Ad+mU2K9LAlwpk6kN2D5mwCPVow==",
      "dev": true
    },
    "node_modules/meow": {
      "version": "9.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/minimist": "^1.2.0",
        "camelcase-keys": "^6.2.2",
        "decamelize": "^1.2.0",
        "decamelize-keys": "^1.1.0",
        "hard-rejection": "^2.1.0",
        "minimist-options": "4.1.0",
        "normalize-package-data": "^3.0.0",
        "read-pkg-up": "^7.0.1",
        "redent": "^3.0.0",
        "trim-newlines": "^3.0.0",
        "type-fest": "^0.18.0",
        "yargs-parser": "^20.2.3"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/meow/node_modules/hosted-git-info": {
      "version": "4.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/meow/node_modules/normalize-package-data": {
      "version": "3.0.3",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "hosted-git-info": "^4.0.1",
        "is-core-module": "^2.5.0",
        "semver": "^7.3.4",
        "validate-npm-package-license": "^3.0.1"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/meow/node_modules/semver": {
      "version": "7.3.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/meow/node_modules/type-fest": {
      "version": "0.18.1",
      "dev": true,
      "license": "(MIT OR CC0-1.0)",
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/merge-stream": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true,
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/micromatch": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.5.tgz",
      "integrity": "sha512-DMy+ERcEW2q8Z2Po+WNXuw3c5YaUSFjAO5GsJqfEl7UjvtIuFKO6ZrKvcItdy98dwFI2N1tg3zNIdKaQT+aNdA==",
      "dev": true,
      "dependencies": {
        "braces": "^3.0.2",
        "picomatch": "^2.3.1"
      },
      "engines": {
        "node": ">=8.6"
      }
    },
    "node_modules/mime-db": {
      "version": "1.51.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.34",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.51.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/min-indent": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/mini-css-extract-plugin": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/mini-css-extract-plugin/-/mini-css-extract-plugin-2.6.1.tgz",
      "integrity": "sha512-wd+SD57/K6DiV7jIR34P+s3uckTRuQvx0tKPcvjFlrEylk6P4mQ2KSWk1hblj1Kxaqok7LogKOieygXqBczNlg==",
      "dev": true,
      "dependencies": {
        "schema-utils": "^4.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.0.0"
      }
    },
    "node_modules/mini-css-extract-plugin/node_modules/ajv": {
      "version": "8.8.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/mini-css-extract-plugin/node_modules/ajv-keywords": {
      "version": "5.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.3"
      },
      "peerDependencies": {
        "ajv": "^8.8.2"
      }
    },
    "node_modules/mini-css-extract-plugin/node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/mini-css-extract-plugin/node_modules/schema-utils": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.9",
        "ajv": "^8.8.0",
        "ajv-formats": "^2.1.1",
        "ajv-keywords": "^5.0.0"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/minimatch": {
      "version": "3.0.4",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "brace-expansion": "^1.1.7"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/minimist-options": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "arrify": "^1.0.1",
        "is-plain-obj": "^1.1.0",
        "kind-of": "^6.0.3"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/minipass": {
      "version": "3.1.6",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-collect": {
      "version": "1.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minipass-fetch": {
      "version": "1.4.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minipass": "^3.1.0",
        "minipass-sized": "^1.0.3",
        "minizlib": "^2.0.0"
      },
      "engines": {
        "node": ">=8"
      },
      "optionalDependencies": {
        "encoding": "^0.1.12"
      }
    },
    "node_modules/minipass-flush": {
      "version": "1.0.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minipass-pipeline": {
      "version": "1.2.4",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass-sized": {
      "version": "1.0.3",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "minipass": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/minipass/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/minizlib": {
      "version": "2.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "minipass": "^3.0.0",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/minizlib/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/mocha": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/mocha/-/mocha-10.0.0.tgz",
      "integrity": "sha512-0Wl+elVUD43Y0BqPZBzZt8Tnkw9CMUdNYnUsTfOM1vuhJVZL+kiesFYsqwBkEEuEixaiPe5ZQdqDgX2jddhmoA==",
      "dev": true,
      "dependencies": {
        "@ungap/promise-all-settled": "1.1.2",
        "ansi-colors": "4.1.1",
        "browser-stdout": "1.3.1",
        "chokidar": "3.5.3",
        "debug": "4.3.4",
        "diff": "5.0.0",
        "escape-string-regexp": "4.0.0",
        "find-up": "5.0.0",
        "glob": "7.2.0",
        "he": "1.2.0",
        "js-yaml": "4.1.0",
        "log-symbols": "4.1.0",
        "minimatch": "5.0.1",
        "ms": "2.1.3",
        "nanoid": "3.3.3",
        "serialize-javascript": "6.0.0",
        "strip-json-comments": "3.1.1",
        "supports-color": "8.1.1",
        "workerpool": "6.2.1",
        "yargs": "16.2.0",
        "yargs-parser": "20.2.4",
        "yargs-unparser": "2.0.0"
      },
      "bin": {
        "_mocha": "bin/_mocha",
        "mocha": "bin/mocha.js"
      },
      "engines": {
        "node": ">= 14.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/mochajs"
      }
    },
    "node_modules/mocha/node_modules/brace-expansion": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
      "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
      "dev": true,
      "dependencies": {
        "balanced-match": "^1.0.0"
      }
    },
    "node_modules/mocha/node_modules/cliui": {
      "version": "7.0.4",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-7.0.4.tgz",
      "integrity": "sha512-OcRE68cOsVMXp1Yvonl/fzkQOyjLSu/8bhPDfQt0e0/Eb283TKP20Fs2MqoPsr9SwA595rRCA+QMzYc9nBP+JQ==",
      "dev": true,
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.0",
        "wrap-ansi": "^7.0.0"
      }
    },
    "node_modules/mocha/node_modules/escape-string-regexp": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
      "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mocha/node_modules/find-up": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
      "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
      "dev": true,
      "dependencies": {
        "locate-path": "^6.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mocha/node_modules/locate-path": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
      "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
      "dev": true,
      "dependencies": {
        "p-locate": "^5.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mocha/node_modules/minimatch": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-5.0.1.tgz",
      "integrity": "sha512-nLDxIFRyhDblz3qMuq+SoRZED4+miJ/G+tdDrjkkkRnjAsBexeGpgjLEQ0blJy7rHhR2b93rhQY4SvyWu9v03g==",
      "dev": true,
      "dependencies": {
        "brace-expansion": "^2.0.1"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/mocha/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "dev": true
    },
    "node_modules/mocha/node_modules/nanoid": {
      "version": "3.3.3",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.3.tgz",
      "integrity": "sha512-p1sjXuopFs0xg+fPASzQ28agW1oHD7xDsd9Xkf3T15H3c/cifrFHVwrh74PdoklAPi+i7MdRsE47vm2r6JoB+w==",
      "dev": true,
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/mocha/node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "dev": true,
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mocha/node_modules/p-locate": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
      "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
      "dev": true,
      "dependencies": {
        "p-limit": "^3.0.2"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/mocha/node_modules/yargs": {
      "version": "16.2.0",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-16.2.0.tgz",
      "integrity": "sha512-D1mvvtDG0L5ft/jGWkLpG1+m0eQxOfaBvTNELraWj22wSVUMWxZUvYgJYcKh6jGGIkJFhH4IZPQhR4TKpc8mBw==",
      "dev": true,
      "dependencies": {
        "cliui": "^7.0.2",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.0",
        "y18n": "^5.0.5",
        "yargs-parser": "^20.2.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/mocha/node_modules/yargs-parser": {
      "version": "20.2.4",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-20.2.4.tgz",
      "integrity": "sha512-WOkpgNhPTlE73h4VFAFsOnomJVaovO8VqLDzy5saChRBFQFBoMYirowyW+Q9HB4HFF4Z7VZTiG3iSzJJA29yRA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/motion-ui": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/motion-ui/-/motion-ui-2.0.3.tgz",
      "integrity": "sha512-f9xzh/hbZTUYjk4M7y1aDcsiPTfqUbuvCv/+If05TSIBEJMu3hGBU+YSe9csQPP7WBBHXxjossEygM/TJo2enw==",
      "peer": true,
      "peerDependencies": {
        "jquery": ">=2.2.0"
      }
    },
    "node_modules/ms": {
      "version": "2.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/nan": {
      "version": "2.14.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/nanoid": {
      "version": "3.3.4",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.4.tgz",
      "integrity": "sha512-MqBkQh/OHTS2egovRtLk45wEyNXwF+cokD+1YPf9u5VfJiRdAiRwB2froX5Co9Rh20xs4siNPm8naNotSD6RBw==",
      "dev": true,
      "bin": {
        "nanoid": "bin/nanoid.cjs"
      },
      "engines": {
        "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
      }
    },
    "node_modules/natural-compare": {
      "version": "1.4.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "0.6.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/neo-async": {
      "version": "2.6.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-gyp": {
      "version": "8.4.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "env-paths": "^2.2.0",
        "glob": "^7.1.4",
        "graceful-fs": "^4.2.6",
        "make-fetch-happen": "^9.1.0",
        "nopt": "^5.0.0",
        "npmlog": "^6.0.0",
        "rimraf": "^3.0.2",
        "semver": "^7.3.5",
        "tar": "^6.1.2",
        "which": "^2.0.2"
      },
      "bin": {
        "node-gyp": "bin/node-gyp.js"
      },
      "engines": {
        "node": ">= 10.12.0"
      }
    },
    "node_modules/node-gyp/node_modules/lru-cache": {
      "version": "6.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/node-gyp/node_modules/npmlog": {
      "version": "6.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "are-we-there-yet": "^2.0.0",
        "console-control-strings": "^1.1.0",
        "gauge": "^4.0.0",
        "set-blocking": "^2.0.0"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16"
      }
    },
    "node_modules/node-gyp/node_modules/rimraf": {
      "version": "3.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/node-gyp/node_modules/semver": {
      "version": "7.3.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/node-gyp/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/node-releases": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.6.tgz",
      "integrity": "sha512-PiVXnNuFm5+iYkLBNeq5211hvO38y63T0i2KKh2KnUs3RpzJ+JtODFjkD8yjLwnDkTYF1eKXheUwdssR+NRZdg==",
      "dev": true
    },
    "node_modules/node-sass": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/node-sass/-/node-sass-7.0.3.tgz",
      "integrity": "sha512-8MIlsY/4dXUkJDYht9pIWBhMil3uHmE8b/AdJPjmFn1nBx9X9BASzfzmsCy0uCCb8eqI3SYYzVPDswWqSx7gjw==",
      "dev": true,
      "hasInstallScript": true,
      "dependencies": {
        "async-foreach": "^0.1.3",
        "chalk": "^4.1.2",
        "cross-spawn": "^7.0.3",
        "gaze": "^1.0.0",
        "get-stdin": "^4.0.1",
        "glob": "^7.0.3",
        "lodash": "^4.17.15",
        "meow": "^9.0.0",
        "nan": "^2.13.2",
        "node-gyp": "^8.4.1",
        "npmlog": "^5.0.0",
        "request": "^2.88.0",
        "sass-graph": "^4.0.1",
        "stdout-stream": "^1.4.0",
        "true-case-path": "^1.0.2"
      },
      "bin": {
        "node-sass": "bin/node-sass"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/node-sass/node_modules/ansi-styles": {
      "version": "4.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/node-sass/node_modules/chalk": {
      "version": "4.1.2",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ansi-styles": "^4.1.0",
        "supports-color": "^7.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/chalk?sponsor=1"
      }
    },
    "node_modules/node-sass/node_modules/color-convert": {
      "version": "2.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/node-sass/node_modules/color-name": {
      "version": "1.1.4",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/node-sass/node_modules/get-stdin": {
      "version": "4.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/node-sass/node_modules/has-flag": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/node-sass/node_modules/supports-color": {
      "version": "7.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/nopt": {
      "version": "5.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "abbrev": "1"
      },
      "bin": {
        "nopt": "bin/nopt.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/normalize-package-data": {
      "version": "2.5.0",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "hosted-git-info": "^2.1.4",
        "resolve": "^1.10.0",
        "semver": "2 || 3 || 4 || 5",
        "validate-npm-package-license": "^3.0.1"
      }
    },
    "node_modules/normalize-path": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/normalize-range": {
      "version": "0.1.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/normalize-scss": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/normalize-scss/-/normalize-scss-7.0.1.tgz",
      "integrity": "sha512-qj16bWnYs+9/ac29IgGjySg4R5qQTp1lXfm7ApFOZNVBYFY8RZ3f8+XQNDDLHeDtI3Ba7Jj4+LuPgz9v/fne2A=="
    },
    "node_modules/normalize-url": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/normalize-url/-/normalize-url-6.1.0.tgz",
      "integrity": "sha512-DlL+XwOy3NxAQ8xuC0okPgK46iuVNAK01YN7RueYBqqFeGsBjV9XmCAzAdgt+667bCl5kPh9EqKKDwnaPG1I7A==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/normalize.css": {
      "version": "8.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/npmlog": {
      "version": "5.0.1",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "are-we-there-yet": "^2.0.0",
        "console-control-strings": "^1.1.0",
        "gauge": "^3.0.0",
        "set-blocking": "^2.0.0"
      }
    },
    "node_modules/npmlog/node_modules/gauge": {
      "version": "3.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "aproba": "^1.0.3 || ^2.0.0",
        "color-support": "^1.1.2",
        "console-control-strings": "^1.0.0",
        "has-unicode": "^2.0.1",
        "object-assign": "^4.1.1",
        "signal-exit": "^3.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "wide-align": "^1.1.2"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/nth-check": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/nth-check/-/nth-check-2.1.1.tgz",
      "integrity": "sha512-lqjrjmaOoAnWfMmBPL+XNnynZh2+swxiX3WUE0s4yEHI6m+AwrK2UZOimIRl3X/4QctVqS8AiZjFqyOGrMXb/w==",
      "dev": true,
      "dependencies": {
        "boolbase": "^1.0.0"
      },
      "funding": {
        "url": "https://github.com/fb55/nth-check?sponsor=1"
      }
    },
    "node_modules/oauth-sign": {
      "version": "0.9.0",
      "dev": true,
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-keys": {
      "version": "1.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/object.assign": {
      "version": "4.1.4",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.4.tgz",
      "integrity": "sha512-1mxKf0e58bvyjSCtKYY4sRe9itRk3PJpquJOjeIkz885CczcI4IvJJDLPS72oowuSh+pBxUFROpX+TU++hxhZQ==",
      "dev": true,
      "dependencies": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.1.4",
        "has-symbols": "^1.0.3",
        "object-keys": "^1.1.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/optionator": {
      "version": "0.9.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.3"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/p-limit": {
      "version": "2.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-try": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-locate": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/p-map": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "aggregate-error": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/p-try": {
      "version": "2.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parent-module": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "callsites": "^3.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/parse-json": {
      "version": "5.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.0.0",
        "error-ex": "^1.3.1",
        "json-parse-even-better-errors": "^2.3.0",
        "lines-and-columns": "^1.1.6"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/path-exists": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-is-absolute": {
      "version": "1.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/path-key": {
      "version": "3.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true
    },
    "node_modules/path-type": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/performance-now": {
      "version": "2.1.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/picocolors": {
      "version": "1.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true,
      "engines": {
        "node": ">=8.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/jonschlinkert"
      }
    },
    "node_modules/pify": {
      "version": "2.3.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/pkg-dir": {
      "version": "4.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "find-up": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/postcss": {
      "version": "8.4.17",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.17.tgz",
      "integrity": "sha512-UNxNOLQydcOFi41yHNMcKRZ39NeXlr8AxGuZJsdub8vIb12fHzcq37DTU/QtbI6WLxNg2gF9Z+8qtRwTj1UI1Q==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss"
        }
      ],
      "dependencies": {
        "nanoid": "^3.3.4",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      },
      "engines": {
        "node": "^10 || ^12 || >=14"
      }
    },
    "node_modules/postcss-attribute-case-insensitive": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/postcss-attribute-case-insensitive/-/postcss-attribute-case-insensitive-5.0.2.tgz",
      "integrity": "sha512-XIidXV8fDr0kKt28vqki84fRK8VW8eTuIa4PChv2MqKuT6C9UjmSKzen6KaWhWEoYvwxFCa7n/tC1SZ3tyq4SQ==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-calc": {
      "version": "8.2.4",
      "resolved": "https://registry.npmjs.org/postcss-calc/-/postcss-calc-8.2.4.tgz",
      "integrity": "sha512-SmWMSJmB8MRnnULldx0lQIyhSNvuDl9HfrZkaqqE/WHAhToYsAvDq+yAsA/kIyINDszOp3Rh0GFoNuH5Ypsm3Q==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.9",
        "postcss-value-parser": "^4.2.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.2"
      }
    },
    "node_modules/postcss-clamp": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/postcss-clamp/-/postcss-clamp-4.1.0.tgz",
      "integrity": "sha512-ry4b1Llo/9zz+PKC+030KUnPITTJAHeOwjfAyyB60eT0AorGLdzp52s31OsPRHRf8NchkgFoG2y6fCfn1IV1Ow==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": ">=7.6.0"
      },
      "peerDependencies": {
        "postcss": "^8.4.6"
      }
    },
    "node_modules/postcss-color-functional-notation": {
      "version": "4.2.4",
      "resolved": "https://registry.npmjs.org/postcss-color-functional-notation/-/postcss-color-functional-notation-4.2.4.tgz",
      "integrity": "sha512-2yrTAUZUab9s6CpxkxC4rVgFEVaR6/2Pipvi6qcgvnYiVqZcbDHEoBDhrXzyb7Efh2CCfHQNtcqWcIruDTIUeg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-color-hex-alpha": {
      "version": "8.0.4",
      "resolved": "https://registry.npmjs.org/postcss-color-hex-alpha/-/postcss-color-hex-alpha-8.0.4.tgz",
      "integrity": "sha512-nLo2DCRC9eE4w2JmuKgVA3fGL3d01kGq752pVALF68qpGLmx2Qrk91QTKkdUqqp45T1K1XV8IhQpcu1hoAQflQ==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/postcss-color-rebeccapurple": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/postcss-color-rebeccapurple/-/postcss-color-rebeccapurple-7.1.1.tgz",
      "integrity": "sha512-pGxkuVEInwLHgkNxUc4sdg4g3py7zUeCQ9sMfwyHAT+Ezk8a4OaaVZ8lIY5+oNqA/BXXgLyXv0+5wHP68R79hg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-colormin": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/postcss-colormin/-/postcss-colormin-5.3.0.tgz",
      "integrity": "sha512-WdDO4gOFG2Z8n4P8TWBpshnL3JpmNmJwdnfP2gbk2qBA8PWwOYcmjmI/t3CmMeL72a7Hkd+x/Mg9O2/0rD54Pg==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0",
        "colord": "^2.9.1",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-convert-values": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-convert-values/-/postcss-convert-values-5.1.2.tgz",
      "integrity": "sha512-c6Hzc4GAv95B7suy4udszX9Zy4ETyMCgFPUDtWjdFTKH1SE9eFY/jEpHSwTH1QPuwxHpWslhckUQWbNRM4ho5g==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.20.3",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-css-variables": {
      "version": "0.18.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "balanced-match": "^1.0.0",
        "escape-string-regexp": "^1.0.3",
        "extend": "^3.0.1"
      },
      "peerDependencies": {
        "postcss": "^8.2.6"
      }
    },
    "node_modules/postcss-custom-media": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/postcss-custom-media/-/postcss-custom-media-8.0.2.tgz",
      "integrity": "sha512-7yi25vDAoHAkbhAzX9dHx2yc6ntS4jQvejrNcC+csQJAXjj15e7VcWfMgLqBNAbOvqi5uIa9huOVwdHbf+sKqg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.3"
      }
    },
    "node_modules/postcss-custom-properties": {
      "version": "12.1.9",
      "resolved": "https://registry.npmjs.org/postcss-custom-properties/-/postcss-custom-properties-12.1.9.tgz",
      "integrity": "sha512-/E7PRvK8DAVljBbeWrcEQJPG72jaImxF3vvCNFwv9cC8CzigVoNIpeyfnJzphnN3Fd8/auBf5wvkw6W9MfmTyg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-custom-selectors": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/postcss-custom-selectors/-/postcss-custom-selectors-6.0.3.tgz",
      "integrity": "sha512-fgVkmyiWDwmD3JbpCmB45SvvlCD6z9CG6Ie6Iere22W5aHea6oWa7EM2bpnv2Fj3I94L3VbtvX9KqwSi5aFzSg==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.4"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.3"
      }
    },
    "node_modules/postcss-dir-pseudo-class": {
      "version": "6.0.5",
      "resolved": "https://registry.npmjs.org/postcss-dir-pseudo-class/-/postcss-dir-pseudo-class-6.0.5.tgz",
      "integrity": "sha512-eqn4m70P031PF7ZQIvSgy9RSJ5uI2171O/OO/zcRNYpJbvaeKFUlar1aJ7rmgiQtbm0FSPsRewjpdS0Oew7MPA==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-discard-comments": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-discard-comments/-/postcss-discard-comments-5.1.2.tgz",
      "integrity": "sha512-+L8208OVbHVF2UQf1iDmRcbdjJkuBF6IS29yBDSiWUIzpYaAhtNl6JYnYm12FnkeCwQqF5LeklOu6rAqgfBZqQ==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-discard-duplicates": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-discard-duplicates/-/postcss-discard-duplicates-5.1.0.tgz",
      "integrity": "sha512-zmX3IoSI2aoenxHV6C7plngHWWhUOV3sP1T8y2ifzxzbtnuhk1EdPwm0S1bIUNaJ2eNbWeGLEwzw8huPD67aQw==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-discard-empty": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-discard-empty/-/postcss-discard-empty-5.1.1.tgz",
      "integrity": "sha512-zPz4WljiSuLWsI0ir4Mcnr4qQQ5e1Ukc3i7UfE2XcrwKK2LIPIqE5jxMRxO6GbI3cv//ztXDsXwEWT3BHOGh3A==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-discard-overridden": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-discard-overridden/-/postcss-discard-overridden-5.1.0.tgz",
      "integrity": "sha512-21nOL7RqWR1kasIVdKs8HNqQJhFxLsyRfAnUDm4Fe4t4mCWL9OJiHvlHPjcd8zc5Myu89b/7wZDnOSjFgeWRtw==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-double-position-gradients": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/postcss-double-position-gradients/-/postcss-double-position-gradients-3.1.2.tgz",
      "integrity": "sha512-GX+FuE/uBR6eskOK+4vkXgT6pDkexLokPaz/AbJna9s5Kzp/yl488pKPjhy0obB475ovfT1Wv8ho7U/cHNaRgQ==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-env-function": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/postcss-env-function/-/postcss-env-function-4.0.6.tgz",
      "integrity": "sha512-kpA6FsLra+NqcFnL81TnsU+Z7orGtDTxcOhl6pwXeEq1yFPpRMkCDpHhrz8CFQDr/Wfm0jLiNQ1OsGGPjlqPwA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/postcss-flexbugs-fixes": {
      "version": "5.0.2",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "postcss": "^8.1.4"
      }
    },
    "node_modules/postcss-focus-visible": {
      "version": "6.0.4",
      "resolved": "https://registry.npmjs.org/postcss-focus-visible/-/postcss-focus-visible-6.0.4.tgz",
      "integrity": "sha512-QcKuUU/dgNsstIK6HELFRT5Y3lbrMLEOwG+A4s5cA+fx3A3y/JTq3X9LaOj3OC3ALH0XqyrgQIgey/MIZ8Wczw==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.9"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/postcss-focus-within": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/postcss-focus-within/-/postcss-focus-within-5.0.4.tgz",
      "integrity": "sha512-vvjDN++C0mu8jz4af5d52CB184ogg/sSxAFS+oUJQq2SuCe7T5U2iIsVJtsCp2d6R4j0jr5+q3rPkBVZkXD9fQ==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.9"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/postcss-font-variant": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-gap-properties": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/postcss-gap-properties/-/postcss-gap-properties-3.0.5.tgz",
      "integrity": "sha512-IuE6gKSdoUNcvkGIqdtjtcMtZIFyXZhmFd5RUlg97iVEvp1BZKV5ngsAjCjrVy+14uhGBQl9tzmi1Qwq4kqVOg==",
      "dev": true,
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-image-set-function": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/postcss-image-set-function/-/postcss-image-set-function-4.0.7.tgz",
      "integrity": "sha512-9T2r9rsvYzm5ndsBE8WgtrMlIT7VbtTfE7b3BQnudUqnBcBo7L758oc+o+pdj/dUV0l5wjwSdjeOH2DZtfv8qw==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-import": {
      "version": "14.1.0",
      "resolved": "https://registry.npmjs.org/postcss-import/-/postcss-import-14.1.0.tgz",
      "integrity": "sha512-flwI+Vgm4SElObFVPpTIT7SU7R3qk2L7PyduMcokiaVKuWv9d/U+Gm/QAd8NDLuykTWTkcrjOeD2Pp1rMeBTGw==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.0.0",
        "read-cache": "^1.0.0",
        "resolve": "^1.1.7"
      },
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "postcss": "^8.0.0"
      }
    },
    "node_modules/postcss-initial": {
      "version": "4.0.1",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "postcss": "^8.0.0"
      }
    },
    "node_modules/postcss-lab-function": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/postcss-lab-function/-/postcss-lab-function-4.2.1.tgz",
      "integrity": "sha512-xuXll4isR03CrQsmxyz92LJB2xX9n+pZJ5jE9JgcnmsCammLyKdlzrBin+25dy6wIjfhJpKBAN80gsTlCgRk2w==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-loader": {
      "version": "6.2.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "cosmiconfig": "^7.0.0",
        "klona": "^2.0.5",
        "semver": "^7.3.5"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "postcss": "^7.0.0 || ^8.0.1",
        "webpack": "^5.0.0"
      }
    },
    "node_modules/postcss-loader/node_modules/klona": {
      "version": "2.0.5",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/postcss-loader/node_modules/semver": {
      "version": "7.3.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "lru-cache": "^6.0.0"
      },
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/postcss-logical": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/postcss-logical/-/postcss-logical-5.0.4.tgz",
      "integrity": "sha512-RHXxplCeLh9VjinvMrZONq7im4wjWGlRJAqmAVLXyZaXwfDWP73/oq4NdIp+OZwhQUMj0zjqDfM5Fj7qby+B4g==",
      "dev": true,
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "peerDependencies": {
        "postcss": "^8.4"
      }
    },
    "node_modules/postcss-media-minmax": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=10.0.0"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-media-query-parser": {
      "version": "0.2.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/postcss-merge-longhand": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/postcss-merge-longhand/-/postcss-merge-longhand-5.1.6.tgz",
      "integrity": "sha512-6C/UGF/3T5OE2CEbOuX7iNO63dnvqhGZeUnKkDeifebY0XqkkvrctYSZurpNE902LDf2yKwwPFgotnfSoPhQiw==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0",
        "stylehacks": "^5.1.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-merge-rules": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-merge-rules/-/postcss-merge-rules-5.1.2.tgz",
      "integrity": "sha512-zKMUlnw+zYCWoPN6yhPjtcEdlJaMUZ0WyVcxTAmw3lkkN/NDMRkOkiuctQEoWAOvH7twaxUUdvBWl0d4+hifRQ==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0",
        "cssnano-utils": "^3.1.0",
        "postcss-selector-parser": "^6.0.5"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-minify-font-values": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-minify-font-values/-/postcss-minify-font-values-5.1.0.tgz",
      "integrity": "sha512-el3mYTgx13ZAPPirSVsHqFzl+BBBDrXvbySvPGFnQcTI4iNslrPaFq4muTkLZmKlGk4gyFAYUBMH30+HurREyA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-minify-gradients": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-minify-gradients/-/postcss-minify-gradients-5.1.1.tgz",
      "integrity": "sha512-VGvXMTpCEo4qHTNSa9A0a3D+dxGFZCYwR6Jokk+/3oB6flu2/PnPXAh2x7x52EkY5xlIHLm+Le8tJxe/7TNhzw==",
      "dev": true,
      "dependencies": {
        "colord": "^2.9.1",
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-minify-params": {
      "version": "5.1.3",
      "resolved": "https://registry.npmjs.org/postcss-minify-params/-/postcss-minify-params-5.1.3.tgz",
      "integrity": "sha512-bkzpWcjykkqIujNL+EVEPOlLYi/eZ050oImVtHU7b4lFS82jPnsCb44gvC6pxaNt38Els3jWYDHTjHKf0koTgg==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-minify-selectors": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/postcss-minify-selectors/-/postcss-minify-selectors-5.2.1.tgz",
      "integrity": "sha512-nPJu7OjZJTsVUmPdm2TcaiohIwxP+v8ha9NehQ2ye9szv4orirRU3SDdtUmKH+10nzn0bAyOXZ0UEr7OpvLehg==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.5"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-modules-extract-imports": {
      "version": "3.0.0",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": "^10 || ^12 || >= 14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-modules-local-by-default": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "icss-utils": "^5.0.0",
        "postcss-selector-parser": "^6.0.2",
        "postcss-value-parser": "^4.1.0"
      },
      "engines": {
        "node": "^10 || ^12 || >= 14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-modules-scope": {
      "version": "3.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "postcss-selector-parser": "^6.0.4"
      },
      "engines": {
        "node": "^10 || ^12 || >= 14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-modules-values": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "icss-utils": "^5.0.0"
      },
      "engines": {
        "node": "^10 || ^12 || >= 14"
      },
      "peerDependencies": {
        "postcss": "^8.1.0"
      }
    },
    "node_modules/postcss-nested": {
      "version": "5.0.6",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "postcss-selector-parser": "^6.0.6"
      },
      "engines": {
        "node": ">=12.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/postcss/"
      },
      "peerDependencies": {
        "postcss": "^8.2.14"
      }
    },
    "node_modules/postcss-nesting": {
      "version": "10.2.0",
      "resolved": "https://registry.npmjs.org/postcss-nesting/-/postcss-nesting-10.2.0.tgz",
      "integrity": "sha512-EwMkYchxiDiKUhlJGzWsD9b2zvq/r2SSubcRrgP+jujMXFzqvANLt16lJANC+5uZ6hjI7lpRmI6O8JIl+8l1KA==",
      "dev": true,
      "dependencies": {
        "@csstools/selector-specificity": "^2.0.0",
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-normalize-charset": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-charset/-/postcss-normalize-charset-5.1.0.tgz",
      "integrity": "sha512-mSgUJ+pd/ldRGVx26p2wz9dNZ7ji6Pn8VWBajMXFf8jk7vUoSrZ2lt/wZR7DtlZYKesmZI680qjr2CeFF2fbUg==",
      "dev": true,
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-display-values": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-display-values/-/postcss-normalize-display-values-5.1.0.tgz",
      "integrity": "sha512-WP4KIM4o2dazQXWmFaqMmcvsKmhdINFblgSeRgn8BJ6vxaMyaJkwAzpPpuvSIoG/rmX3M+IrRZEz2H0glrQNEA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-positions": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-positions/-/postcss-normalize-positions-5.1.1.tgz",
      "integrity": "sha512-6UpCb0G4eofTCQLFVuI3EVNZzBNPiIKcA1AKVka+31fTVySphr3VUgAIULBhxZkKgwLImhzMR2Bw1ORK+37INg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-repeat-style": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-repeat-style/-/postcss-normalize-repeat-style-5.1.1.tgz",
      "integrity": "sha512-mFpLspGWkQtBcWIRFLmewo8aC3ImN2i/J3v8YCFUwDnPu3Xz4rLohDO26lGjwNsQxB3YF0KKRwspGzE2JEuS0g==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-string": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-string/-/postcss-normalize-string-5.1.0.tgz",
      "integrity": "sha512-oYiIJOf4T9T1N4i+abeIc7Vgm/xPCGih4bZz5Nm0/ARVJ7K6xrDlLwvwqOydvyL3RHNf8qZk6vo3aatiw/go3w==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-timing-functions": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-timing-functions/-/postcss-normalize-timing-functions-5.1.0.tgz",
      "integrity": "sha512-DOEkzJ4SAXv5xkHl0Wa9cZLF3WCBhF3o1SKVxKQAa+0pYKlueTpCgvkFAHfk+Y64ezX9+nITGrDZeVGgITJXjg==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-unicode": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-unicode/-/postcss-normalize-unicode-5.1.0.tgz",
      "integrity": "sha512-J6M3MizAAZ2dOdSjy2caayJLQT8E8K9XjLce8AUQMwOrCvjCHv24aLC/Lps1R1ylOfol5VIDMaM/Lo9NGlk1SQ==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-url": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-url/-/postcss-normalize-url-5.1.0.tgz",
      "integrity": "sha512-5upGeDO+PVthOxSmds43ZeMeZfKH+/DKgGRD7TElkkyS46JXAUhMzIKiCa7BabPeIy3AQcTkXwVVN7DbqsiCew==",
      "dev": true,
      "dependencies": {
        "normalize-url": "^6.0.1",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-normalize-whitespace": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-whitespace/-/postcss-normalize-whitespace-5.1.1.tgz",
      "integrity": "sha512-83ZJ4t3NUDETIHTa3uEg6asWjSBYL5EdkVB0sDncx9ERzOKBVJIUeDO9RyA9Zwtig8El1d79HBp0JEi8wvGQnA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-opacity-percentage": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/postcss-opacity-percentage/-/postcss-opacity-percentage-1.1.2.tgz",
      "integrity": "sha512-lyUfF7miG+yewZ8EAk9XUBIlrHyUE6fijnesuz+Mj5zrIHIEw6KcIZSOk/elVMqzLvREmXB83Zi/5QpNRYd47w==",
      "dev": true,
      "funding": [
        {
          "type": "kofi",
          "url": "https://ko-fi.com/mrcgrtz"
        },
        {
          "type": "liberapay",
          "url": "https://liberapay.com/mrcgrtz"
        }
      ],
      "engines": {
        "node": "^12 || ^14 || >=16"
      }
    },
    "node_modules/postcss-ordered-values": {
      "version": "5.1.3",
      "resolved": "https://registry.npmjs.org/postcss-ordered-values/-/postcss-ordered-values-5.1.3.tgz",
      "integrity": "sha512-9UO79VUhPwEkzbb3RNpqqghc6lcYej1aveQteWY+4POIwlqkYE21HKWaLDF6lWNuqCobEAyTovVhtI32Rbv2RQ==",
      "dev": true,
      "dependencies": {
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-overflow-shorthand": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/postcss-overflow-shorthand/-/postcss-overflow-shorthand-3.0.4.tgz",
      "integrity": "sha512-otYl/ylHK8Y9bcBnPLo3foYFLL6a6Ak+3EQBPOTR7luMYCOsiVTUk1iLvNf6tVPNGXcoL9Hoz37kpfriRIFb4A==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-page-break": {
      "version": "3.0.4",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "postcss": "^8"
      }
    },
    "node_modules/postcss-place": {
      "version": "7.0.5",
      "resolved": "https://registry.npmjs.org/postcss-place/-/postcss-place-7.0.5.tgz",
      "integrity": "sha512-wR8igaZROA6Z4pv0d+bvVrvGY4GVHihBCBQieXFY3kuSuMyOmEnnfFzHl/tQuqHZkfkIVBEbDvYcFfHmpSet9g==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-preset-env": {
      "version": "7.8.2",
      "resolved": "https://registry.npmjs.org/postcss-preset-env/-/postcss-preset-env-7.8.2.tgz",
      "integrity": "sha512-rSMUEaOCnovKnwc5LvBDHUDzpGP+nrUeWZGWt9M72fBvckCi45JmnJigUr4QG4zZeOHmOCNCZnd2LKDvP++ZuQ==",
      "dev": true,
      "dependencies": {
        "@csstools/postcss-cascade-layers": "^1.1.0",
        "@csstools/postcss-color-function": "^1.1.1",
        "@csstools/postcss-font-format-keywords": "^1.0.1",
        "@csstools/postcss-hwb-function": "^1.0.2",
        "@csstools/postcss-ic-unit": "^1.0.1",
        "@csstools/postcss-is-pseudo-class": "^2.0.7",
        "@csstools/postcss-nested-calc": "^1.0.0",
        "@csstools/postcss-normalize-display-values": "^1.0.1",
        "@csstools/postcss-oklab-function": "^1.1.1",
        "@csstools/postcss-progressive-custom-properties": "^1.3.0",
        "@csstools/postcss-stepped-value-functions": "^1.0.1",
        "@csstools/postcss-text-decoration-shorthand": "^1.0.0",
        "@csstools/postcss-trigonometric-functions": "^1.0.2",
        "@csstools/postcss-unset-value": "^1.0.2",
        "autoprefixer": "^10.4.11",
        "browserslist": "^4.21.3",
        "css-blank-pseudo": "^3.0.3",
        "css-has-pseudo": "^3.0.4",
        "css-prefers-color-scheme": "^6.0.3",
        "cssdb": "^7.0.1",
        "postcss-attribute-case-insensitive": "^5.0.2",
        "postcss-clamp": "^4.1.0",
        "postcss-color-functional-notation": "^4.2.4",
        "postcss-color-hex-alpha": "^8.0.4",
        "postcss-color-rebeccapurple": "^7.1.1",
        "postcss-custom-media": "^8.0.2",
        "postcss-custom-properties": "^12.1.9",
        "postcss-custom-selectors": "^6.0.3",
        "postcss-dir-pseudo-class": "^6.0.5",
        "postcss-double-position-gradients": "^3.1.2",
        "postcss-env-function": "^4.0.6",
        "postcss-focus-visible": "^6.0.4",
        "postcss-focus-within": "^5.0.4",
        "postcss-font-variant": "^5.0.0",
        "postcss-gap-properties": "^3.0.5",
        "postcss-image-set-function": "^4.0.7",
        "postcss-initial": "^4.0.1",
        "postcss-lab-function": "^4.2.1",
        "postcss-logical": "^5.0.4",
        "postcss-media-minmax": "^5.0.0",
        "postcss-nesting": "^10.2.0",
        "postcss-opacity-percentage": "^1.1.2",
        "postcss-overflow-shorthand": "^3.0.4",
        "postcss-page-break": "^3.0.4",
        "postcss-place": "^7.0.5",
        "postcss-pseudo-class-any-link": "^7.1.6",
        "postcss-replace-overflow-wrap": "^4.0.0",
        "postcss-selector-not": "^6.0.1",
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-pseudo-class-any-link": {
      "version": "7.1.6",
      "resolved": "https://registry.npmjs.org/postcss-pseudo-class-any-link/-/postcss-pseudo-class-any-link-7.1.6.tgz",
      "integrity": "sha512-9sCtZkO6f/5ML9WcTLcIyV1yz9D1rf0tWc+ulKcvV30s0iZKS/ONyETvoWsr6vnrmW+X+KmuK3gV/w5EWnT37w==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-reduce-initial": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-reduce-initial/-/postcss-reduce-initial-5.1.0.tgz",
      "integrity": "sha512-5OgTUviz0aeH6MtBjHfbr57tml13PuedK/Ecg8szzd4XRMbYxH4572JFG067z+FqBIf6Zp/d+0581glkvvWMFw==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-reduce-transforms": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-reduce-transforms/-/postcss-reduce-transforms-5.1.0.tgz",
      "integrity": "sha512-2fbdbmgir5AvpW9RLtdONx1QoYG2/EtqpNQbFASDlixBbAYuTcJ0dECwlqNqH7VbaUnEnh8SrxOe2sRIn24XyQ==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-replace-overflow-wrap": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "peerDependencies": {
        "postcss": "^8.0.3"
      }
    },
    "node_modules/postcss-resolve-nested-selector": {
      "version": "0.1.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/postcss-safe-parser": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/postcss-safe-parser/-/postcss-safe-parser-6.0.0.tgz",
      "integrity": "sha512-FARHN8pwH+WiS2OPCxJI8FuRJpTVnn6ZNFiqAM2aeW2LwTHWWmWgIyKC6cUo0L8aeKiF/14MNvnpls6R2PBeMQ==",
      "dev": true,
      "engines": {
        "node": ">=12.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/postcss/"
      },
      "peerDependencies": {
        "postcss": "^8.3.3"
      }
    },
    "node_modules/postcss-scss": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/postcss-scss/-/postcss-scss-4.0.5.tgz",
      "integrity": "sha512-F7xpB6TrXyqUh3GKdyB4Gkp3QL3DDW1+uI+gxx/oJnUt/qXI4trj5OGlp9rOKdoABGULuqtqeG+3HEVQk4DjmA==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/postcss/"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/postcss-scss"
        }
      ],
      "engines": {
        "node": ">=12.0"
      },
      "peerDependencies": {
        "postcss": "^8.3.3"
      }
    },
    "node_modules/postcss-selector-not": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/postcss-selector-not/-/postcss-selector-not-6.0.1.tgz",
      "integrity": "sha512-1i9affjAe9xu/y9uqWH+tD4r6/hDaXJruk8xn2x1vzxC2U3J3LKO3zJW4CyxlNhA56pADJ/djpEwpH1RClI2rQ==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.10"
      },
      "engines": {
        "node": "^12 || ^14 || >=16"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/csstools"
      },
      "peerDependencies": {
        "postcss": "^8.2"
      }
    },
    "node_modules/postcss-selector-parser": {
      "version": "6.0.10",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.0.10.tgz",
      "integrity": "sha512-IQ7TZdoaqbT+LCpShg46jnZVlhWD2w6iQYAcYXfHARZ7X1t/UGhhceQDs5X0cGqKvYlHNOuv7Oa1xmb0oQuA3w==",
      "dev": true,
      "dependencies": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/postcss-sorting": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/postcss-sorting/-/postcss-sorting-7.0.1.tgz",
      "integrity": "sha512-iLBFYz6VRYyLJEJsBJ8M3TCqNcckVzz4wFounSc5Oez35ogE/X+aoC5fFu103Ot7NyvjU3/xqIXn93Gp3kJk4g==",
      "dev": true,
      "peerDependencies": {
        "postcss": "^8.3.9"
      }
    },
    "node_modules/postcss-svgo": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-svgo/-/postcss-svgo-5.1.0.tgz",
      "integrity": "sha512-D75KsH1zm5ZrHyxPakAxJWtkyXew5qwS70v56exwvw542d9CRtTo78K0WeFxZB4G7JXKKMbEZtZayTGdIky/eA==",
      "dev": true,
      "dependencies": {
        "postcss-value-parser": "^4.2.0",
        "svgo": "^2.7.0"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-unique-selectors": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-unique-selectors/-/postcss-unique-selectors-5.1.1.tgz",
      "integrity": "sha512-5JiODlELrz8L2HwxfPnhOWZYWDxVHWL83ufOv84NrcgipI7TaeRsatAhK4Tr2/ZiYldpK/wBvw5BD3qfaK96GA==",
      "dev": true,
      "dependencies": {
        "postcss-selector-parser": "^6.0.5"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/postcss-value-parser": {
      "version": "4.2.0",
      "license": "MIT"
    },
    "node_modules/prelude-ls": {
      "version": "1.2.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/process-nextick-args": {
      "version": "2.0.1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/promise-inflight": {
      "version": "1.0.1",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/promise-retry": {
      "version": "2.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "err-code": "^2.0.2",
        "retry": "^0.12.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/psl": {
      "version": "1.8.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/punycode": {
      "version": "2.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qs": {
      "version": "6.5.2",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ]
    },
    "node_modules/quick-lru": {
      "version": "4.0.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/randombytes": {
      "version": "2.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "^5.1.0"
      }
    },
    "node_modules/read-cache": {
      "version": "1.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "pify": "^2.3.0"
      }
    },
    "node_modules/read-pkg-up": {
      "version": "7.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "find-up": "^4.1.0",
        "read-pkg": "^5.2.0",
        "type-fest": "^0.8.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/read-pkg-up/node_modules/find-up": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/read-pkg-up/node_modules/locate-path": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-locate": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/read-pkg-up/node_modules/p-locate": {
      "version": "4.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "p-limit": "^2.2.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/read-pkg-up/node_modules/parse-json": {
      "version": "5.1.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.0.0",
        "error-ex": "^1.3.1",
        "json-parse-even-better-errors": "^2.3.0",
        "lines-and-columns": "^1.1.6"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/read-pkg-up/node_modules/path-exists": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/read-pkg-up/node_modules/read-pkg": {
      "version": "5.2.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/normalize-package-data": "^2.4.0",
        "normalize-package-data": "^2.5.0",
        "parse-json": "^5.0.0",
        "type-fest": "^0.6.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/read-pkg-up/node_modules/read-pkg/node_modules/type-fest": {
      "version": "0.6.0",
      "dev": true,
      "license": "(MIT OR CC0-1.0)",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/readdirp": {
      "version": "3.6.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "picomatch": "^2.2.1"
      },
      "engines": {
        "node": ">=8.10.0"
      }
    },
    "node_modules/rechoir": {
      "version": "0.7.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve": "^1.9.0"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/redent": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "indent-string": "^4.0.0",
        "strip-indent": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/regenerate": {
      "version": "1.4.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/regenerate-unicode-properties": {
      "version": "10.1.0",
      "resolved": "https://registry.npmjs.org/regenerate-unicode-properties/-/regenerate-unicode-properties-10.1.0.tgz",
      "integrity": "sha512-d1VudCLoIGitcU/hEg2QqvyGZQmdC0Lf8BqdOMXGFSvJP4bNV1+XqbPQeHHLD51Jh4QJJ225dlIFvY4Ly6MXmQ==",
      "dev": true,
      "dependencies": {
        "regenerate": "^1.4.2"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/regenerator-runtime": {
      "version": "0.13.9",
      "resolved": "https://registry.npmjs.org/regenerator-runtime/-/regenerator-runtime-0.13.9.tgz",
      "integrity": "sha512-p3VT+cOEgxFsRRA9X4lkI1E+k2/CtnKtU4gcxyaCUreilL/vqI6CdZ3wxVUx3UOUg+gnUOQQcRI7BmSI656MYA==",
      "dev": true
    },
    "node_modules/regenerator-transform": {
      "version": "0.15.0",
      "resolved": "https://registry.npmjs.org/regenerator-transform/-/regenerator-transform-0.15.0.tgz",
      "integrity": "sha512-LsrGtPmbYg19bcPHwdtmXwbW+TqNvtY4riE3P83foeHRroMbH6/2ddFBfab3t7kbzc7v7p4wbkIecHImqt0QNg==",
      "dev": true,
      "dependencies": {
        "@babel/runtime": "^7.8.4"
      }
    },
    "node_modules/regexpp": {
      "version": "3.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/mysticatea"
      }
    },
    "node_modules/regexpu-core": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/regexpu-core/-/regexpu-core-5.2.1.tgz",
      "integrity": "sha512-HrnlNtpvqP1Xkb28tMhBUO2EbyUHdQlsnlAhzWcwHy8WJR53UWr7/MAvqrsQKMbV4qdpv03oTMG8iIhfsPFktQ==",
      "dev": true,
      "dependencies": {
        "regenerate": "^1.4.2",
        "regenerate-unicode-properties": "^10.1.0",
        "regjsgen": "^0.7.1",
        "regjsparser": "^0.9.1",
        "unicode-match-property-ecmascript": "^2.0.0",
        "unicode-match-property-value-ecmascript": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/regjsgen": {
      "version": "0.7.1",
      "resolved": "https://registry.npmjs.org/regjsgen/-/regjsgen-0.7.1.tgz",
      "integrity": "sha512-RAt+8H2ZEzHeYWxZ3H2z6tF18zyyOnlcdaafLrm21Bguj7uZy6ULibiAFdXEtKQY4Sy7wDTwDiOazasMLc4KPA==",
      "dev": true
    },
    "node_modules/regjsparser": {
      "version": "0.9.1",
      "resolved": "https://registry.npmjs.org/regjsparser/-/regjsparser-0.9.1.tgz",
      "integrity": "sha512-dQUtn90WanSNl+7mQKcXAgZxvUe7Z0SqXlgzv0za4LwiUhyzBC58yQO3liFoUgu8GiJVInAhJjkj1N0EtQ5nkQ==",
      "dev": true,
      "dependencies": {
        "jsesc": "~0.5.0"
      },
      "bin": {
        "regjsparser": "bin/parser"
      }
    },
    "node_modules/regjsparser/node_modules/jsesc": {
      "version": "0.5.0",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-0.5.0.tgz",
      "integrity": "sha512-uZz5UnB7u4T9LvwmFqXii7pZSouaRPorGs5who1Ip7VO0wxanFvBL7GkM6dTHlgX+jhBApRetaWpnDabOeTcnA==",
      "dev": true,
      "bin": {
        "jsesc": "bin/jsesc"
      }
    },
    "node_modules/request": {
      "version": "2.88.2",
      "deprecated": "request has been deprecated, see https://github.com/request/request/issues/3142",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "aws-sign2": "~0.7.0",
        "aws4": "^1.8.0",
        "caseless": "~0.12.0",
        "combined-stream": "~1.0.6",
        "extend": "~3.0.2",
        "forever-agent": "~0.6.1",
        "form-data": "~2.3.2",
        "har-validator": "~5.1.3",
        "http-signature": "~1.2.0",
        "is-typedarray": "~1.0.0",
        "isstream": "~0.1.2",
        "json-stringify-safe": "~5.0.1",
        "mime-types": "~2.1.19",
        "oauth-sign": "~0.9.0",
        "performance-now": "^2.1.0",
        "qs": "~6.5.2",
        "safe-buffer": "^5.1.2",
        "tough-cookie": "~2.5.0",
        "tunnel-agent": "^0.6.0",
        "uuid": "^3.3.2"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/require-from-string": {
      "version": "2.0.2",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/resolve": {
      "version": "1.21.0",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.21.0.tgz",
      "integrity": "sha512-3wCbTpk5WJlyE4mSOtDLhqQmGFi0/TD9VPwmiolnk8U0wRgMEktqCXd3vy5buTO3tljvalNvKrjHEfrd2WpEKA==",
      "dev": true,
      "dependencies": {
        "is-core-module": "^2.8.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      },
      "bin": {
        "resolve": "bin/resolve"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/resolve-cwd": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "resolve-from": "^5.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/resolve-cwd/node_modules/resolve-from": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/resolve-from": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/retry": {
      "version": "0.12.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/reusify": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.0.4.tgz",
      "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
      "dev": true,
      "engines": {
        "iojs": ">=1.0.0",
        "node": ">=0.10.0"
      }
    },
    "node_modules/rfs": {
      "version": "9.0.6",
      "resolved": "https://registry.npmjs.org/rfs/-/rfs-9.0.6.tgz",
      "integrity": "sha512-KQ0EGVP4l3B3ynUZ1UNX3UoRAeswiX+ljGRcT+MoJKXRwXSUFpVZIPsqurH9pmY/AOGBFq7KKBq9fhRCkkg+SQ==",
      "dependencies": {
        "postcss-value-parser": "^4.1.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/rimraf": {
      "version": "3.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "glob": "^7.1.3"
      },
      "bin": {
        "rimraf": "bin.js"
      },
      "funding": {
        "url": "https://github.com/sponsors/isaacs"
      }
    },
    "node_modules/run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "dependencies": {
        "queue-microtask": "^1.2.2"
      }
    },
    "node_modules/rxjs": {
      "version": "7.5.7",
      "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-7.5.7.tgz",
      "integrity": "sha512-z9MzKh/UcOqB3i20H6rtrlaE/CgjLOvheWK/9ILrbhROGTweAi1BaFsTT9FbwZi5Trr1qNRs+MXkhmR06awzQA==",
      "dev": true,
      "dependencies": {
        "tslib": "^2.1.0"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/sass": {
      "version": "1.55.0",
      "resolved": "https://registry.npmjs.org/sass/-/sass-1.55.0.tgz",
      "integrity": "sha512-Pk+PMy7OGLs9WaxZGJMn7S96dvlyVBwwtToX895WmCpAOr5YiJYEUJfiJidMuKb613z2xNWcXCHEuOvjZbqC6A==",
      "dev": true,
      "dependencies": {
        "chokidar": ">=3.0.0 <4.0.0",
        "immutable": "^4.0.0",
        "source-map-js": ">=0.6.2 <2.0.0"
      },
      "bin": {
        "sass": "sass.js"
      },
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/sass-graph": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/sass-graph/-/sass-graph-4.0.1.tgz",
      "integrity": "sha512-5YCfmGBmxoIRYHnKK2AKzrAkCoQ8ozO+iumT8K4tXJXRVCPf+7s1/9KxTSW3Rbvf+7Y7b4FR3mWyLnQr3PHocA==",
      "dev": true,
      "dependencies": {
        "glob": "^7.0.0",
        "lodash": "^4.17.11",
        "scss-tokenizer": "^0.4.3",
        "yargs": "^17.2.1"
      },
      "bin": {
        "sassgraph": "bin/sassgraph"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/sass-loader": {
      "version": "12.6.0",
      "resolved": "https://registry.npmjs.org/sass-loader/-/sass-loader-12.6.0.tgz",
      "integrity": "sha512-oLTaH0YCtX4cfnJZxKSLAyglED0naiYfNG1iXfU5w1LNZ+ukoA5DtyDIN5zmKVZwYNJP4KRc5Y3hkWga+7tYfA==",
      "dev": true,
      "dependencies": {
        "klona": "^2.0.4",
        "neo-async": "^2.6.2"
      },
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "fibers": ">= 3.1.0",
        "node-sass": "^4.0.0 || ^5.0.0 || ^6.0.0 || ^7.0.0",
        "sass": "^1.3.0",
        "sass-embedded": "*",
        "webpack": "^5.0.0"
      },
      "peerDependenciesMeta": {
        "fibers": {
          "optional": true
        },
        "node-sass": {
          "optional": true
        },
        "sass": {
          "optional": true
        },
        "sass-embedded": {
          "optional": true
        }
      }
    },
    "node_modules/schema-utils": {
      "version": "2.7.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.5",
        "ajv": "^6.12.4",
        "ajv-keywords": "^3.5.2"
      },
      "engines": {
        "node": ">= 8.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/scss-tokenizer": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/scss-tokenizer/-/scss-tokenizer-0.4.3.tgz",
      "integrity": "sha512-raKLgf1LI5QMQnG+RxHz6oK0sL3x3I4FN2UDLqgLOGO8hodECNnNh5BXn7fAyBxrA8zVzdQizQ6XjNJQ+uBwMw==",
      "dev": true,
      "dependencies": {
        "js-base64": "^2.4.9",
        "source-map": "^0.7.3"
      }
    },
    "node_modules/semver": {
      "version": "5.7.1",
      "dev": true,
      "license": "ISC",
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/serialize-javascript": {
      "version": "6.0.0",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "randombytes": "^2.1.0"
      }
    },
    "node_modules/set-blocking": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/shallow-clone": {
      "version": "3.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "kind-of": "^6.0.2"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-command": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "shebang-regex": "^3.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shebang-regex": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/shell-quote": {
      "version": "1.7.3",
      "resolved": "https://registry.npmjs.org/shell-quote/-/shell-quote-1.7.3.tgz",
      "integrity": "sha512-Vpfqwm4EnqGdlsBFNmHhxhElJYrdfcxPThu+ryKS5J8L/fhAwLazFZtq+S+TWZ9ANj2piSQLGj6NQg+lKPmxrw==",
      "dev": true
    },
    "node_modules/shopify-frontend-api": {
      "version": "1.0.1",
      "resolved": "git+ssh://git@github.com/ohmybrew/Shopify-Frontend-Helper.git#b2c85a057de1c9ba84b5e38ed8de22bd017a8510",
      "license": "MIT"
    },
    "node_modules/signal-exit": {
      "version": "3.0.7",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
      "integrity": "sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==",
      "dev": true
    },
    "node_modules/slash": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-4.0.0.tgz",
      "integrity": "sha512-3dOsAHXXUkQTpOYcoAxLIorMTp4gIQr5IW3iVb7A7lFIp0VHhnynm9izx6TssdrIcVIESAlVjtnO2K8bg+Coew==",
      "dev": true,
      "engines": {
        "node": ">=12"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/slice-ansi": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/slice-ansi/-/slice-ansi-4.0.0.tgz",
      "integrity": "sha512-qMCMfhY040cVHT43K9BFygqYbUPFZKHOg7K73mtTWJRb8pyP3fzf4Ixd5SzdEJQ6MRUg/WBnOLxghZtKKurENQ==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "astral-regex": "^2.0.0",
        "is-fullwidth-code-point": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/slice-ansi?sponsor=1"
      }
    },
    "node_modules/slice-ansi/node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/slice-ansi/node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/slice-ansi/node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true
    },
    "node_modules/slice-ansi/node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/slick-carousel": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/slick-carousel/-/slick-carousel-1.8.1.tgz",
      "integrity": "sha512-XB9Ftrf2EEKfzoQXt3Nitrt/IPbT+f1fgqBdoxO3W/+JYvtEOW6EgxnWfr9GH6nmULv7Y2tPmEX3koxThVmebA==",
      "peerDependencies": {
        "jquery": ">=1.8.0"
      }
    },
    "node_modules/smart-buffer": {
      "version": "4.2.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 6.0.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks": {
      "version": "2.6.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "ip": "^1.1.5",
        "smart-buffer": "^4.1.0"
      },
      "engines": {
        "node": ">= 10.13.0",
        "npm": ">= 3.0.0"
      }
    },
    "node_modules/socks-proxy-agent": {
      "version": "6.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "agent-base": "^6.0.2",
        "debug": "^4.3.1",
        "socks": "^2.6.1"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/source-map": {
      "version": "0.7.4",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.7.4.tgz",
      "integrity": "sha512-l3BikUxvPOcn5E74dZiq5BGsTb5yEwhaTSzccU6t4sDOH8NWJCstKO5QT2CvtFoK6F0saL7p9xHAqHOlCPJygA==",
      "dev": true,
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/source-map-js": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.0.2.tgz",
      "integrity": "sha512-R0XvVJ9WusLiqTCEiGCmICCMplcCkIwwR11mOSD9CR5u+IXYdiseeEuXCVAjS54zqwkLcPNnmU4OeJ6tUrWhDw==",
      "dev": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/source-map-support": {
      "version": "0.5.21",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      }
    },
    "node_modules/source-map-support/node_modules/source-map": {
      "version": "0.6.1",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/spawn-command": {
      "version": "0.0.2-1",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/spdx-correct": {
      "version": "3.1.1",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "spdx-expression-parse": "^3.0.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-exceptions": {
      "version": "2.3.0",
      "dev": true,
      "license": "CC-BY-3.0"
    },
    "node_modules/spdx-expression-parse": {
      "version": "3.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "spdx-exceptions": "^2.1.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "node_modules/spdx-license-ids": {
      "version": "3.0.6",
      "dev": true,
      "license": "CC0-1.0"
    },
    "node_modules/sshpk": {
      "version": "1.16.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "asn1": "~0.2.3",
        "assert-plus": "^1.0.0",
        "bcrypt-pbkdf": "^1.0.0",
        "dashdash": "^1.12.0",
        "ecc-jsbn": "~0.1.1",
        "getpass": "^0.1.1",
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.0.2",
        "tweetnacl": "~0.14.0"
      },
      "bin": {
        "sshpk-conv": "bin/sshpk-conv",
        "sshpk-sign": "bin/sshpk-sign",
        "sshpk-verify": "bin/sshpk-verify"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/stable": {
      "version": "0.1.8",
      "resolved": "https://registry.npmjs.org/stable/-/stable-0.1.8.tgz",
      "integrity": "sha512-ji9qxRnOVfcuLDySj9qzhGSEFVobyt1kIOSkj1qZzYLzq7Tos/oUUWvotUPQLlrsidqsK6tBH89Bc9kL5zHA6w==",
      "deprecated": "Modern JS already guarantees Array#sort() is a stable sort, so this library is deprecated. See the compatibility table on MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#browser_compatibility",
      "dev": true
    },
    "node_modules/stdout-stream": {
      "version": "1.4.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "readable-stream": "^2.0.1"
      }
    },
    "node_modules/stdout-stream/node_modules/readable-stream": {
      "version": "2.3.7",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "core-util-is": "~1.0.0",
        "inherits": "~2.0.3",
        "isarray": "~1.0.0",
        "process-nextick-args": "~2.0.0",
        "safe-buffer": "~5.1.1",
        "string_decoder": "~1.1.1",
        "util-deprecate": "~1.0.1"
      }
    },
    "node_modules/stdout-stream/node_modules/string_decoder": {
      "version": "1.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.1.0"
      }
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string_decoder/node_modules/safe-buffer": {
      "version": "5.2.1",
      "dev": true,
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/string-replace-loader": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/string-replace-loader/-/string-replace-loader-3.1.0.tgz",
      "integrity": "sha512-5AOMUZeX5HE/ylKDnEa/KKBqvlnFmRZudSOjVJHxhoJg9QYTwl1rECx7SLR8BBH7tfxb4Rp7EM2XVfQFxIhsbQ==",
      "dev": true,
      "dependencies": {
        "loader-utils": "^2.0.0",
        "schema-utils": "^3.0.0"
      },
      "peerDependencies": {
        "webpack": "^5"
      }
    },
    "node_modules/string-replace-loader/node_modules/schema-utils": {
      "version": "3.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.8",
        "ajv": "^6.12.5",
        "ajv-keywords": "^3.5.2"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/string-width/node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dev": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-indent": {
      "version": "3.0.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "min-indent": "^1.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true,
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/style-loader": {
      "version": "3.3.1",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">= 12.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.0.0"
      }
    },
    "node_modules/style-search": {
      "version": "0.1.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/stylehacks": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/stylehacks/-/stylehacks-5.1.0.tgz",
      "integrity": "sha512-SzLmvHQTrIWfSgljkQCw2++C9+Ne91d/6Sp92I8c5uHTcy/PgeHamwITIbBW9wnFTY/3ZfSXR9HIL6Ikqmcu6Q==",
      "dev": true,
      "dependencies": {
        "browserslist": "^4.16.6",
        "postcss-selector-parser": "^6.0.4"
      },
      "engines": {
        "node": "^10 || ^12 || >=14.0"
      },
      "peerDependencies": {
        "postcss": "^8.2.15"
      }
    },
    "node_modules/stylelint": {
      "version": "14.14.0",
      "resolved": "https://registry.npmjs.org/stylelint/-/stylelint-14.14.0.tgz",
      "integrity": "sha512-yUI+4xXfPHVnueYddSQ/e1GuEA/2wVhWQbGj16AmWLtQJtn28lVxfS4b0CsWyVRPgd3Auzi0NXOthIEUhtQmmA==",
      "dev": true,
      "dependencies": {
        "@csstools/selector-specificity": "^2.0.2",
        "balanced-match": "^2.0.0",
        "colord": "^2.9.3",
        "cosmiconfig": "^7.0.1",
        "css-functions-list": "^3.1.0",
        "debug": "^4.3.4",
        "fast-glob": "^3.2.12",
        "fastest-levenshtein": "^1.0.16",
        "file-entry-cache": "^6.0.1",
        "global-modules": "^2.0.0",
        "globby": "^11.1.0",
        "globjoin": "^0.1.4",
        "html-tags": "^3.2.0",
        "ignore": "^5.2.0",
        "import-lazy": "^4.0.0",
        "imurmurhash": "^0.1.4",
        "is-plain-object": "^5.0.0",
        "known-css-properties": "^0.25.0",
        "mathml-tag-names": "^2.1.3",
        "meow": "^9.0.0",
        "micromatch": "^4.0.5",
        "normalize-path": "^3.0.0",
        "picocolors": "^1.0.0",
        "postcss": "^8.4.17",
        "postcss-media-query-parser": "^0.2.3",
        "postcss-resolve-nested-selector": "^0.1.1",
        "postcss-safe-parser": "^6.0.0",
        "postcss-selector-parser": "^6.0.10",
        "postcss-value-parser": "^4.2.0",
        "resolve-from": "^5.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "style-search": "^0.1.0",
        "supports-hyperlinks": "^2.3.0",
        "svg-tags": "^1.0.0",
        "table": "^6.8.0",
        "v8-compile-cache": "^2.3.0",
        "write-file-atomic": "^4.0.2"
      },
      "bin": {
        "stylelint": "bin/stylelint.js"
      },
      "engines": {
        "node": "^12.20.0 || ^14.13.1 || >=16.0.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/stylelint"
      }
    },
    "node_modules/stylelint-config-recommended": {
      "version": "9.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-config-recommended/-/stylelint-config-recommended-9.0.0.tgz",
      "integrity": "sha512-9YQSrJq4NvvRuTbzDsWX3rrFOzOlYBmZP+o513BJN/yfEmGSr0AxdvrWs0P/ilSpVV/wisamAHu5XSk8Rcf4CQ==",
      "dev": true,
      "peerDependencies": {
        "stylelint": "^14.10.0"
      }
    },
    "node_modules/stylelint-config-standard": {
      "version": "29.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-config-standard/-/stylelint-config-standard-29.0.0.tgz",
      "integrity": "sha512-uy8tZLbfq6ZrXy4JKu3W+7lYLgRQBxYTUUB88vPgQ+ZzAxdrvcaSUW9hOMNLYBnwH+9Kkj19M2DHdZ4gKwI7tg==",
      "dev": true,
      "dependencies": {
        "stylelint-config-recommended": "^9.0.0"
      },
      "peerDependencies": {
        "stylelint": "^14.14.0"
      }
    },
    "node_modules/stylelint-order": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-order/-/stylelint-order-5.0.0.tgz",
      "integrity": "sha512-OWQ7pmicXufDw5BlRqzdz3fkGKJPgLyDwD1rFY3AIEfIH/LQY38Vu/85v8/up0I+VPiuGRwbc2Hg3zLAsJaiyw==",
      "dev": true,
      "dependencies": {
        "postcss": "^8.3.11",
        "postcss-sorting": "^7.0.1"
      },
      "peerDependencies": {
        "stylelint": "^14.0.0"
      }
    },
    "node_modules/stylelint-scss": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/stylelint-scss/-/stylelint-scss-4.3.0.tgz",
      "integrity": "sha512-GvSaKCA3tipzZHoz+nNO7S02ZqOsdBzMiCx9poSmLlb3tdJlGddEX/8QzCOD8O7GQan9bjsvLMsO5xiw6IhhIQ==",
      "dev": true,
      "dependencies": {
        "lodash": "^4.17.21",
        "postcss-media-query-parser": "^0.2.3",
        "postcss-resolve-nested-selector": "^0.1.1",
        "postcss-selector-parser": "^6.0.6",
        "postcss-value-parser": "^4.1.0"
      },
      "peerDependencies": {
        "stylelint": "^14.5.1"
      }
    },
    "node_modules/stylelint/node_modules/balanced-match": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/stylelint/node_modules/globby": {
      "version": "11.1.0",
      "resolved": "https://registry.npmjs.org/globby/-/globby-11.1.0.tgz",
      "integrity": "sha512-jhIXaOzy1sb8IyocaruWSn1TjmnBVs8Ayhcy83rmxNJ8q2uWKCAj3CnJY+KpGSXCueAPc0i05kVvVKtP1t9S3g==",
      "dev": true,
      "dependencies": {
        "array-union": "^2.1.0",
        "dir-glob": "^3.0.1",
        "fast-glob": "^3.2.9",
        "ignore": "^5.2.0",
        "merge2": "^1.4.1",
        "slash": "^3.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/stylelint/node_modules/resolve-from": {
      "version": "5.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/stylelint/node_modules/slash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
      "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-color": {
      "version": "8.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/supports-color?sponsor=1"
      }
    },
    "node_modules/supports-color/node_modules/has-flag": {
      "version": "4.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-hyperlinks": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/supports-hyperlinks/-/supports-hyperlinks-2.3.0.tgz",
      "integrity": "sha512-RpsAZlpWcDwOPQA22aCH4J0t7L8JmAvsCxfOSEwm7cQs3LshN36QaTkwd70DnBOXDWGssw2eUoc8CaRWT0XunA==",
      "dev": true,
      "dependencies": {
        "has-flag": "^4.0.0",
        "supports-color": "^7.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-hyperlinks/node_modules/has-flag": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
      "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-hyperlinks/node_modules/supports-color": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
      "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
      "dev": true,
      "dependencies": {
        "has-flag": "^4.0.0"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true,
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/svg-tags": {
      "version": "1.0.0",
      "dev": true
    },
    "node_modules/svgo": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/svgo/-/svgo-2.8.0.tgz",
      "integrity": "sha512-+N/Q9kV1+F+UeWYoSiULYo4xYSDQlTgb+ayMobAXPwMnLvop7oxKMo9OzIrX5x3eS4L4f2UHhc9axXwY8DpChg==",
      "dev": true,
      "dependencies": {
        "@trysound/sax": "0.2.0",
        "commander": "^7.2.0",
        "css-select": "^4.1.3",
        "css-tree": "^1.1.3",
        "csso": "^4.2.0",
        "picocolors": "^1.0.0",
        "stable": "^0.1.8"
      },
      "bin": {
        "svgo": "bin/svgo"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/table": {
      "version": "6.8.0",
      "resolved": "https://registry.npmjs.org/table/-/table-6.8.0.tgz",
      "integrity": "sha512-s/fitrbVeEyHKFa7mFdkuQMWlH1Wgw/yEXMt5xACT4ZpzWFluehAxRtUUQKPuWhaLAWhFcVx6w3oC8VKaUfPGA==",
      "dev": true,
      "dependencies": {
        "ajv": "^8.0.1",
        "lodash.truncate": "^4.4.2",
        "slice-ansi": "^4.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/table/node_modules/ajv": {
      "version": "8.11.0",
      "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.11.0.tgz",
      "integrity": "sha512-wGgprdCvMalC0BztXvitD2hC04YffAvtsUn93JbGXYLAtCUO4xd17mCCZQxUOItiBwZvJScWo8NIvQMQ71rdpg==",
      "dev": true,
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "json-schema-traverse": "^1.0.0",
        "require-from-string": "^2.0.2",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/table/node_modules/json-schema-traverse": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
      "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
      "dev": true
    },
    "node_modules/tapable": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.2.1.tgz",
      "integrity": "sha512-GNzQvQTOIP6RyTfE2Qxb8ZVlNmw0n88vp1szwWRimP02mnTsx3Wtn5qRdqY9w2XduFNUgvOwhNnQsjwCp+kqaQ==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/tar": {
      "version": "6.1.11",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "minipass": "^3.0.0",
        "minizlib": "^2.1.1",
        "mkdirp": "^1.0.3",
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/tar/node_modules/chownr": {
      "version": "2.0.0",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/tar/node_modules/mkdirp": {
      "version": "1.0.4",
      "dev": true,
      "license": "MIT",
      "bin": {
        "mkdirp": "bin/cmd.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/tar/node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/terser": {
      "version": "5.15.1",
      "resolved": "https://registry.npmjs.org/terser/-/terser-5.15.1.tgz",
      "integrity": "sha512-K1faMUvpm/FBxjBXud0LWVAGxmvoPbZbfTCYbSgaaYQaIXI3/TdI7a7ZGA73Zrou6Q8Zmz3oeUTsp/dj+ag2Xw==",
      "dev": true,
      "dependencies": {
        "@jridgewell/source-map": "^0.3.2",
        "acorn": "^8.5.0",
        "commander": "^2.20.0",
        "source-map-support": "~0.5.20"
      },
      "bin": {
        "terser": "bin/terser"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/terser-webpack-plugin": {
      "version": "5.3.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "jest-worker": "^27.4.1",
        "schema-utils": "^3.1.1",
        "serialize-javascript": "^6.0.0",
        "source-map": "^0.6.1",
        "terser": "^5.7.2"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "^5.1.0"
      },
      "peerDependenciesMeta": {
        "@swc/core": {
          "optional": true
        },
        "esbuild": {
          "optional": true
        },
        "uglify-js": {
          "optional": true
        }
      }
    },
    "node_modules/terser-webpack-plugin/node_modules/schema-utils": {
      "version": "3.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.8",
        "ajv": "^6.12.5",
        "ajv-keywords": "^3.5.2"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/terser-webpack-plugin/node_modules/source-map": {
      "version": "0.6.1",
      "dev": true,
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/terser/node_modules/commander": {
      "version": "2.20.3",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/text-table": {
      "version": "0.2.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/to-fast-properties": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/to-regex-range": {
      "version": "5.0.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "is-number": "^7.0.0"
      },
      "engines": {
        "node": ">=8.0"
      }
    },
    "node_modules/tough-cookie": {
      "version": "2.5.0",
      "dev": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "psl": "^1.1.28",
        "punycode": "^2.1.1"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tree-kill": {
      "version": "1.2.2",
      "dev": true,
      "license": "MIT",
      "bin": {
        "tree-kill": "cli.js"
      }
    },
    "node_modules/trim-newlines": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/trim-newlines/-/trim-newlines-3.0.1.tgz",
      "integrity": "sha512-c1PTsA3tYrIsLGkJkzHF+w9F2EyxfXGo4UyJc4pFL++FMjnq0HJS69T3M7d//gKrFKwy429bouPescbjecU+Zw==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/true-case-path": {
      "version": "1.0.3",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "glob": "^7.1.2"
      }
    },
    "node_modules/ts-node": {
      "version": "10.9.1",
      "resolved": "https://registry.npmjs.org/ts-node/-/ts-node-10.9.1.tgz",
      "integrity": "sha512-NtVysVPkxxrwFGUUxGYhfux8k78pQB3JqYBXlLRZgdGUqTO5wU/UyHop5p70iEbGhB7q5KmiZiU0Y3KlJrScEw==",
      "dev": true,
      "dependencies": {
        "@cspotcode/source-map-support": "^0.8.0",
        "@tsconfig/node10": "^1.0.7",
        "@tsconfig/node12": "^1.0.7",
        "@tsconfig/node14": "^1.0.0",
        "@tsconfig/node16": "^1.0.2",
        "acorn": "^8.4.1",
        "acorn-walk": "^8.1.1",
        "arg": "^4.1.0",
        "create-require": "^1.1.0",
        "diff": "^4.0.1",
        "make-error": "^1.1.1",
        "v8-compile-cache-lib": "^3.0.1",
        "yn": "3.1.1"
      },
      "bin": {
        "ts-node": "dist/bin.js",
        "ts-node-cwd": "dist/bin-cwd.js",
        "ts-node-esm": "dist/bin-esm.js",
        "ts-node-script": "dist/bin-script.js",
        "ts-node-transpile-only": "dist/bin-transpile.js",
        "ts-script": "dist/bin-script-deprecated.js"
      },
      "peerDependencies": {
        "@swc/core": ">=1.2.50",
        "@swc/wasm": ">=1.2.50",
        "@types/node": "*",
        "typescript": ">=2.7"
      },
      "peerDependenciesMeta": {
        "@swc/core": {
          "optional": true
        },
        "@swc/wasm": {
          "optional": true
        }
      }
    },
    "node_modules/ts-node/node_modules/diff": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/diff/-/diff-4.0.2.tgz",
      "integrity": "sha512-58lmxKSA4BNyLz+HHMUzlOEpg09FV+ev6ZMe3vJihgdxzgcwZ8VoEEPmALCZG9LmqfVoNMMKpttIYTVG6uDY7A==",
      "dev": true,
      "engines": {
        "node": ">=0.3.1"
      }
    },
    "node_modules/tslib": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.4.0.tgz",
      "integrity": "sha512-d6xOpEDfsi2CZVlPQzGeux8XMwLT9hssAsaPYExaQMuYskwb+x1x7J371tWlbBdWHroy99KnVB6qIkUbs5X3UQ==",
      "dev": true
    },
    "node_modules/tunnel-agent": {
      "version": "0.6.0",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/tweetnacl": {
      "version": "0.14.5",
      "dev": true,
      "license": "Unlicense"
    },
    "node_modules/type-check": {
      "version": "0.4.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "prelude-ls": "^1.2.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/type-fest": {
      "version": "0.8.1",
      "dev": true,
      "license": "(MIT OR CC0-1.0)",
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/typescript": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-4.8.4.tgz",
      "integrity": "sha512-QCh+85mCy+h0IGff8r5XWzOVSbBO+KfeYrMQh7NJ58QujwcE22u+NUSmUxqF+un70P9GXKxa2HCNiTTMJknyjQ==",
      "dev": true,
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=4.2.0"
      }
    },
    "node_modules/unicode-canonical-property-names-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-canonical-property-names-ecmascript/-/unicode-canonical-property-names-ecmascript-2.0.0.tgz",
      "integrity": "sha512-yY5PpDlfVIU5+y/BSCxAJRBIS1Zc2dDG3Ujq+sR0U+JjUevW2JhocOF+soROYDSaAezOzOKuyyixhD6mBknSmQ==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-match-property-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-match-property-ecmascript/-/unicode-match-property-ecmascript-2.0.0.tgz",
      "integrity": "sha512-5kaZCrbp5mmbz5ulBkDkbY0SsPOjKqVS35VpL9ulMPfSl0J0Xsm+9Evphv9CoIZFwre7aJoa94AY6seMKGVN5Q==",
      "dev": true,
      "dependencies": {
        "unicode-canonical-property-names-ecmascript": "^2.0.0",
        "unicode-property-aliases-ecmascript": "^2.0.0"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-match-property-value-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-match-property-value-ecmascript/-/unicode-match-property-value-ecmascript-2.0.0.tgz",
      "integrity": "sha512-7Yhkc0Ye+t4PNYzOGKedDhXbYIBe1XEQYQxOPyhcXNMJ0WCABqqj6ckydd6pWRZTHV4GuCPKdBAUiMc60tsKVw==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unicode-property-aliases-ecmascript": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/unicode-property-aliases-ecmascript/-/unicode-property-aliases-ecmascript-2.1.0.tgz",
      "integrity": "sha512-6t3foTQI9qne+OZoVQB/8x8rk2k1eVy1gRXhV3oFQ5T6R1dqQ1xtin3XqSlx3+ATBkliTaR/hHyJBm+LVPNM8w==",
      "dev": true,
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/unique-filename": {
      "version": "1.1.1",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "unique-slug": "^2.0.0"
      }
    },
    "node_modules/unique-slug": {
      "version": "2.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "imurmurhash": "^0.1.4"
      }
    },
    "node_modules/update-browserslist-db": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.0.10.tgz",
      "integrity": "sha512-OztqDenkfFkbSG+tRxBeAnCVPckDBcvibKd35yDONx6OU8N7sqgwc7rCbkJ/WcYtVRZ4ba68d6byhC21GFh7sQ==",
      "dev": true,
      "funding": [
        {
          "type": "opencollective",
          "url": "https://opencollective.com/browserslist"
        },
        {
          "type": "tidelift",
          "url": "https://tidelift.com/funding/github/npm/browserslist"
        }
      ],
      "dependencies": {
        "escalade": "^3.1.1",
        "picocolors": "^1.0.0"
      },
      "bin": {
        "browserslist-lint": "cli.js"
      },
      "peerDependencies": {
        "browserslist": ">= 4.21.0"
      }
    },
    "node_modules/uri-js": {
      "version": "4.4.0",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/uuid": {
      "version": "3.4.0",
      "dev": true,
      "license": "MIT",
      "bin": {
        "uuid": "bin/uuid"
      }
    },
    "node_modules/v8-compile-cache": {
      "version": "2.3.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/v8-compile-cache-lib": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/v8-compile-cache-lib/-/v8-compile-cache-lib-3.0.1.tgz",
      "integrity": "sha512-wa7YjyUGfNZngI/vtK0UHAN+lgDCxBPCylVXGp0zu59Fz5aiGtNXaq3DhIov063MorB+VfufLh3JlF2KdTK3xg==",
      "dev": true
    },
    "node_modules/validate-npm-package-license": {
      "version": "3.0.4",
      "dev": true,
      "license": "Apache-2.0",
      "dependencies": {
        "spdx-correct": "^3.0.0",
        "spdx-expression-parse": "^3.0.0"
      }
    },
    "node_modules/verror": {
      "version": "1.10.0",
      "dev": true,
      "engines": [
        "node >=0.6.0"
      ],
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0",
        "core-util-is": "1.0.2",
        "extsprintf": "^1.2.0"
      }
    },
    "node_modules/watchpack": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/watchpack/-/watchpack-2.4.0.tgz",
      "integrity": "sha512-Lcvm7MGST/4fup+ifyKi2hjyIAwcdI4HRgtvTpIUxBRhB+RFtUh8XtDOxUfctVCnhVi+QQj49i91OyvzkJl6cg==",
      "dev": true,
      "dependencies": {
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.1.2"
      },
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/webpack": {
      "version": "5.74.0",
      "resolved": "https://registry.npmjs.org/webpack/-/webpack-5.74.0.tgz",
      "integrity": "sha512-A2InDwnhhGN4LYctJj6M1JEaGL7Luj6LOmyBHjcI8529cm5p6VXiTIW2sn6ffvEAKmveLzvu4jrihwXtPojlAA==",
      "dev": true,
      "dependencies": {
        "@types/eslint-scope": "^3.7.3",
        "@types/estree": "^0.0.51",
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/wasm-edit": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1",
        "acorn": "^8.7.1",
        "acorn-import-assertions": "^1.7.6",
        "browserslist": "^4.14.5",
        "chrome-trace-event": "^1.0.2",
        "enhanced-resolve": "^5.10.0",
        "es-module-lexer": "^0.9.0",
        "eslint-scope": "5.1.1",
        "events": "^3.2.0",
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.2.9",
        "json-parse-even-better-errors": "^2.3.1",
        "loader-runner": "^4.2.0",
        "mime-types": "^2.1.27",
        "neo-async": "^2.6.2",
        "schema-utils": "^3.1.0",
        "tapable": "^2.1.1",
        "terser-webpack-plugin": "^5.1.3",
        "watchpack": "^2.4.0",
        "webpack-sources": "^3.2.3"
      },
      "bin": {
        "webpack": "bin/webpack.js"
      },
      "engines": {
        "node": ">=10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependenciesMeta": {
        "webpack-cli": {
          "optional": true
        }
      }
    },
    "node_modules/webpack-cli": {
      "version": "4.10.0",
      "resolved": "https://registry.npmjs.org/webpack-cli/-/webpack-cli-4.10.0.tgz",
      "integrity": "sha512-NLhDfH/h4O6UOy+0LSso42xvYypClINuMNBVVzX4vX98TmTaTUxwRbXdhucbFMd2qLaCTcLq/PdYrvi8onw90w==",
      "dev": true,
      "dependencies": {
        "@discoveryjs/json-ext": "^0.5.0",
        "@webpack-cli/configtest": "^1.2.0",
        "@webpack-cli/info": "^1.5.0",
        "@webpack-cli/serve": "^1.7.0",
        "colorette": "^2.0.14",
        "commander": "^7.0.0",
        "cross-spawn": "^7.0.3",
        "fastest-levenshtein": "^1.0.12",
        "import-local": "^3.0.2",
        "interpret": "^2.2.0",
        "rechoir": "^0.7.0",
        "webpack-merge": "^5.7.3"
      },
      "bin": {
        "webpack-cli": "bin/cli.js"
      },
      "engines": {
        "node": ">=10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      },
      "peerDependencies": {
        "webpack": "4.x.x || 5.x.x"
      },
      "peerDependenciesMeta": {
        "@webpack-cli/generators": {
          "optional": true
        },
        "@webpack-cli/migrate": {
          "optional": true
        },
        "webpack-bundle-analyzer": {
          "optional": true
        },
        "webpack-dev-server": {
          "optional": true
        }
      }
    },
    "node_modules/webpack-merge": {
      "version": "5.8.0",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "clone-deep": "^4.0.1",
        "wildcard": "^2.0.0"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/webpack-remove-empty-scripts": {
      "version": "0.8.4",
      "resolved": "https://registry.npmjs.org/webpack-remove-empty-scripts/-/webpack-remove-empty-scripts-0.8.4.tgz",
      "integrity": "sha512-X9TVQ5mkl00aW33v1EAe4SZVzvz7EEpbXbNNDSUnY6IeePbrnODl7r3HS9Cy2Dq2pvY7FGfqWsL0GO1q2Vq6KA==",
      "dev": true,
      "dependencies": {
        "ansis": "1.4.0"
      },
      "engines": {
        "node": ">=12.14"
      },
      "funding": {
        "type": "patreon",
        "url": "https://patreon.com/biodiscus"
      },
      "peerDependencies": {
        "webpack": ">=5.32.0"
      }
    },
    "node_modules/webpack-sources": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/webpack-sources/-/webpack-sources-3.2.3.tgz",
      "integrity": "sha512-/DyMEOrDgLKKIG0fmvtz+4dUX/3Ghozwgm6iPp8KRhvn+eQf9+Q7GWxVNMk3+uCPWfdXYC4ExGBckIXdFEfH1w==",
      "dev": true,
      "engines": {
        "node": ">=10.13.0"
      }
    },
    "node_modules/webpack/node_modules/eslint-scope": {
      "version": "5.1.1",
      "dev": true,
      "license": "BSD-2-Clause",
      "dependencies": {
        "esrecurse": "^4.3.0",
        "estraverse": "^4.1.1"
      },
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/webpack/node_modules/estraverse": {
      "version": "4.3.0",
      "dev": true,
      "license": "BSD-2-Clause",
      "engines": {
        "node": ">=4.0"
      }
    },
    "node_modules/webpack/node_modules/schema-utils": {
      "version": "3.1.1",
      "dev": true,
      "license": "MIT",
      "dependencies": {
        "@types/json-schema": "^7.0.8",
        "ajv": "^6.12.5",
        "ajv-keywords": "^3.5.2"
      },
      "engines": {
        "node": ">= 10.13.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/webpack"
      }
    },
    "node_modules/what-input": {
      "version": "5.2.10",
      "resolved": "https://registry.npmjs.org/what-input/-/what-input-5.2.10.tgz",
      "integrity": "sha512-7AQoIMGq7uU8esmKniOtZG3A+pzlwgeyFpkS3f/yzRbxknSL68tvn5gjE6bZ4OMFxCPjpaBd2udUTqlZ0HwrXQ==",
      "peer": true
    },
    "node_modules/which": {
      "version": "2.0.2",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "isexe": "^2.0.0"
      },
      "bin": {
        "node-which": "bin/node-which"
      },
      "engines": {
        "node": ">= 8"
      }
    },
    "node_modules/wide-align": {
      "version": "1.1.5",
      "dev": true,
      "license": "ISC",
      "dependencies": {
        "string-width": "^1.0.2 || 2 || 3 || 4"
      }
    },
    "node_modules/wildcard": {
      "version": "2.0.0",
      "dev": true,
      "license": "MIT"
    },
    "node_modules/word-wrap": {
      "version": "1.2.3",
      "dev": true,
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/workerpool": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/workerpool/-/workerpool-6.2.1.tgz",
      "integrity": "sha512-ILEIE97kDZvF9Wb9f6h5aXK4swSlKGUcOEGiIYb2OOu/IrDU9iwj0fD//SsA6E5ibwJxpEvhullJY4Sl4GcpAw==",
      "dev": true
    },
    "node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "dev": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/wrap-ansi/node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "dev": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/wrap-ansi/node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "dev": true
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/write-file-atomic": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/write-file-atomic/-/write-file-atomic-4.0.2.tgz",
      "integrity": "sha512-7KxauUdBmSdWnmpaGFg+ppNjKF8uNLry8LyzjauQDOVONfFLNKrKvQOxZ/VuTIcS/gge/YNahf5RIIQWTSarlg==",
      "dev": true,
      "dependencies": {
        "imurmurhash": "^0.1.4",
        "signal-exit": "^3.0.7"
      },
      "engines": {
        "node": "^12.13.0 || ^14.15.0 || >=16.0.0"
      }
    },
    "node_modules/y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yallist": {
      "version": "4.0.0",
      "dev": true,
      "license": "ISC"
    },
    "node_modules/yaml": {
      "version": "1.10.2",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/yargs": {
      "version": "17.6.0",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.6.0.tgz",
      "integrity": "sha512-8H/wTDqlSwoSnScvV2N/JHfLWOKuh5MVla9hqLjK3nsfyy6Y4kDSYSvkU5YCUEPOSnRXfIyx3Sq+B/IWudTo4g==",
      "dev": true,
      "dependencies": {
        "cliui": "^8.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yargs-parser": {
      "version": "20.2.9",
      "dev": true,
      "license": "ISC",
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yargs-unparser": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/yargs-unparser/-/yargs-unparser-2.0.0.tgz",
      "integrity": "sha512-7pRTIA9Qc1caZ0bZ6RYRGbHJthJWuakf+WmHK0rVeLkNrrGhfoabBNdue6kdINI6r4if7ocq9aD/n7xwKOdzOA==",
      "dev": true,
      "dependencies": {
        "camelcase": "^6.0.0",
        "decamelize": "^4.0.0",
        "flat": "^5.0.2",
        "is-plain-obj": "^2.1.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yargs-unparser/node_modules/camelcase": {
      "version": "6.3.0",
      "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
      "integrity": "sha512-Gmy6FhYlCY7uOElZUSbxo2UCDH8owEk996gkbrpsgGtrJLM3J7jGxl9Ic7Qwwj4ivOE5AWZWRMecDdF7hqGjFA==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/yargs-unparser/node_modules/decamelize": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-4.0.0.tgz",
      "integrity": "sha512-9iE1PgSik9HeIIw2JO94IidnE3eBoQrFJ3w7sFuzSX4DpmZ3v5sZpUiV5Swcf6mQEF+Y0ru8Neo+p+nyh2J+hQ==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/yargs-unparser/node_modules/is-plain-obj": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/is-plain-obj/-/is-plain-obj-2.1.0.tgz",
      "integrity": "sha512-YWnfyRwxL/+SsrWYfOpUtz5b3YD+nyfkHvjbcanzk8zgyO4ASD67uVMRt8k5bM4lLMDnXfriRhOpemw+NfT1eA==",
      "dev": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/yargs/node_modules/yargs-parser": {
      "version": "21.1.1",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz",
      "integrity": "sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==",
      "dev": true,
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yn": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yn/-/yn-3.1.1.tgz",
      "integrity": "sha512-Ux4ygGWsu2c7isFWe8Yu1YluJmqVhxqK2cLXNQA5AcC3QfbGNpM7fu0Y8b/z16pXLnFxZYvWhd3fhBY9DLmC6Q==",
      "dev": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    }
  },
  "dependencies": {
    "@ampproject/remapping": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@ampproject/remapping/-/remapping-2.2.0.tgz",
      "integrity": "sha512-qRmjj8nj9qmLTQXXmaR1cck3UXSRMPrbsLJAasZpF+t3riI71BXed5ebIOYwQntykeZuhjsdweEc9BxH5Jc26w==",
      "dev": true,
      "requires": {
        "@jridgewell/gen-mapping": "^0.1.0",
        "@jridgewell/trace-mapping": "^0.3.9"
      }
    },
    "@babel/code-frame": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.18.6.tgz",
      "integrity": "sha512-TDCmlK5eOvH+eH7cdAFlNXeVJqWIQ7gW9tY1GJIpUtFb6CmjVyq2VM3u71bOyR8CRihcCgMUYoDNyLXao3+70Q==",
      "dev": true,
      "requires": {
        "@babel/highlight": "^7.18.6"
      }
    },
    "@babel/compat-data": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.19.4.tgz",
      "integrity": "sha512-CHIGpJcUQ5lU9KrPHTjBMhVwQG6CQjxfg36fGXl3qk/Gik1WwWachaXFuo0uCWJT/mStOKtcbFJCaVLihC1CMw==",
      "dev": true
    },
    "@babel/core": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.19.3.tgz",
      "integrity": "sha512-WneDJxdsjEvyKtXKsaBGbDeiyOjR5vYq4HcShxnIbG0qixpoHjI3MqeZM9NDvsojNCEBItQE4juOo/bU6e72gQ==",
      "dev": true,
      "requires": {
        "@ampproject/remapping": "^2.1.0",
        "@babel/code-frame": "^7.18.6",
        "@babel/generator": "^7.19.3",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-module-transforms": "^7.19.0",
        "@babel/helpers": "^7.19.0",
        "@babel/parser": "^7.19.3",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.3",
        "@babel/types": "^7.19.3",
        "convert-source-map": "^1.7.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.1",
        "semver": "^6.3.0"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "dev": true
        }
      }
    },
    "@babel/generator": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.19.3.tgz",
      "integrity": "sha512-fqVZnmp1ncvZU757UzDheKZpfPgatqY59XtW2/j/18H7u76akb8xqvjw82f+i2UKd/ksYsSick/BCLQUUtJ/qQ==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.19.3",
        "@jridgewell/gen-mapping": "^0.3.2",
        "jsesc": "^2.5.1"
      },
      "dependencies": {
        "@jridgewell/gen-mapping": {
          "version": "0.3.2",
          "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.2.tgz",
          "integrity": "sha512-mh65xKQAzI6iBcFzwv28KVWSmCkdRBWoOh+bYQGW3+6OZvbbN3TqMGo5hqYxQniRcH9F2VZIoJCm4pa3BPDK/A==",
          "dev": true,
          "requires": {
            "@jridgewell/set-array": "^1.0.1",
            "@jridgewell/sourcemap-codec": "^1.4.10",
            "@jridgewell/trace-mapping": "^0.3.9"
          }
        }
      }
    },
    "@babel/helper-annotate-as-pure": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.18.6.tgz",
      "integrity": "sha512-duORpUiYrEpzKIop6iNbjnwKLAKnJ47csTyRACyEmWj0QdUrm5aqNJGHSSEQSUAvNW0ojX0dOmK9dZduvkfeXA==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-builder-binary-assignment-operator-visitor": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-builder-binary-assignment-operator-visitor/-/helper-builder-binary-assignment-operator-visitor-7.18.9.tgz",
      "integrity": "sha512-yFQ0YCHoIqarl8BCRwBL8ulYUaZpz3bNsA7oFepAzee+8/+ImtADXNOmO5vJvsPff3qi+hvpkY/NYBTrBQgdNw==",
      "dev": true,
      "requires": {
        "@babel/helper-explode-assignable-expression": "^7.18.6",
        "@babel/types": "^7.18.9"
      }
    },
    "@babel/helper-compilation-targets": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.19.3.tgz",
      "integrity": "sha512-65ESqLGyGmLvgR0mst5AdW1FkNlj9rQsCKduzEoEPhBCDFGXvz2jW6bXFG6i0/MrV2s7hhXjjb2yAzcPuQlLwg==",
      "dev": true,
      "requires": {
        "@babel/compat-data": "^7.19.3",
        "@babel/helper-validator-option": "^7.18.6",
        "browserslist": "^4.21.3",
        "semver": "^6.3.0"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
          "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
          "dev": true
        }
      }
    },
    "@babel/helper-create-class-features-plugin": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-class-features-plugin/-/helper-create-class-features-plugin-7.19.0.tgz",
      "integrity": "sha512-NRz8DwF4jT3UfrmUoZjd0Uph9HQnP30t7Ash+weACcyNkiYTywpIjDBgReJMKgr+n86sn2nPVVmJ28Dm053Kqw==",
      "dev": true,
      "requires": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-member-expression-to-functions": "^7.18.9",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/helper-replace-supers": "^7.18.9",
        "@babel/helper-split-export-declaration": "^7.18.6"
      }
    },
    "@babel/helper-create-regexp-features-plugin": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-regexp-features-plugin/-/helper-create-regexp-features-plugin-7.19.0.tgz",
      "integrity": "sha512-htnV+mHX32DF81amCDrwIDr8nrp1PTm+3wfBN9/v8QJOLEioOCOG7qNyq0nHeFiWbT3Eb7gsPwEmV64UCQ1jzw==",
      "dev": true,
      "requires": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "regexpu-core": "^5.1.0"
      }
    },
    "@babel/helper-define-polyfill-provider": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/@babel/helper-define-polyfill-provider/-/helper-define-polyfill-provider-0.3.3.tgz",
      "integrity": "sha512-z5aQKU4IzbqCC1XH0nAqfsFLMVSo22SBKUc0BxGrLkolTdPTructy0ToNnlO2zA4j9Q/7pjMZf0DSY+DSTYzww==",
      "dev": true,
      "requires": {
        "@babel/helper-compilation-targets": "^7.17.7",
        "@babel/helper-plugin-utils": "^7.16.7",
        "debug": "^4.1.1",
        "lodash.debounce": "^4.0.8",
        "resolve": "^1.14.2",
        "semver": "^6.1.2"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
          "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
          "dev": true
        }
      }
    },
    "@babel/helper-environment-visitor": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-environment-visitor/-/helper-environment-visitor-7.18.9.tgz",
      "integrity": "sha512-3r/aACDJ3fhQ/EVgFy0hpj8oHyHpQc+LPtJoY9SzTThAsStm4Ptegq92vqKoE3vD706ZVFWITnMnxucw+S9Ipg==",
      "dev": true
    },
    "@babel/helper-explode-assignable-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-explode-assignable-expression/-/helper-explode-assignable-expression-7.18.6.tgz",
      "integrity": "sha512-eyAYAsQmB80jNfg4baAtLeWAQHfHFiR483rzFK+BhETlGZaQC9bsfrugfXDCbRHLQbIA7U5NxhhOxN7p/dWIcg==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-function-name": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-function-name/-/helper-function-name-7.19.0.tgz",
      "integrity": "sha512-WAwHBINyrpqywkUH0nTnNgI5ina5TFn85HKS0pbPDfxFfhyR/aNQEn4hGi1P1JyT//I0t4OgXUlofzWILRvS5w==",
      "dev": true,
      "requires": {
        "@babel/template": "^7.18.10",
        "@babel/types": "^7.19.0"
      }
    },
    "@babel/helper-hoist-variables": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-hoist-variables/-/helper-hoist-variables-7.18.6.tgz",
      "integrity": "sha512-UlJQPkFqFULIcyW5sbzgbkxn2FKRgwWiRexcuaR8RNJRy8+LLveqPjwZV/bwrLZCN0eUHD/x8D0heK1ozuoo6Q==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-member-expression-to-functions": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-member-expression-to-functions/-/helper-member-expression-to-functions-7.18.9.tgz",
      "integrity": "sha512-RxifAh2ZoVU67PyKIO4AMi1wTenGfMR/O/ae0CCRqwgBAt5v7xjdtRw7UoSbsreKrQn5t7r89eruK/9JjYHuDg==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.9"
      }
    },
    "@babel/helper-module-imports": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-imports/-/helper-module-imports-7.18.6.tgz",
      "integrity": "sha512-0NFvs3VkuSYbFi1x2Vd6tKrywq+z/cLeYC/RJNFrIX/30Bf5aiGYbtvGXolEktzJH8o5E5KJ3tT+nkxuuZFVlA==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-module-transforms": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-module-transforms/-/helper-module-transforms-7.19.0.tgz",
      "integrity": "sha512-3HBZ377Fe14RbLIA+ac3sY4PTgpxHVkFrESaWhoI5PuyXPBBX8+C34qblV9G89ZtycGJCmCI/Ut+VUDK4bltNQ==",
      "dev": true,
      "requires": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-module-imports": "^7.18.6",
        "@babel/helper-simple-access": "^7.18.6",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "@babel/helper-validator-identifier": "^7.18.6",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      }
    },
    "@babel/helper-optimise-call-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-optimise-call-expression/-/helper-optimise-call-expression-7.18.6.tgz",
      "integrity": "sha512-HP59oD9/fEHQkdcbgFCnbmgH5vIQTJbxh2yf+CdM89/glUNnuzr87Q8GIjGEnOktTROemO0Pe0iPAYbqZuOUiA==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-plugin-utils": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-plugin-utils/-/helper-plugin-utils-7.19.0.tgz",
      "integrity": "sha512-40Ryx7I8mT+0gaNxm8JGTZFUITNqdLAgdg0hXzeVZxVD6nFsdhQvip6v8dqkRHzsz1VFpFAaOCHNn0vKBL7Czw==",
      "dev": true
    },
    "@babel/helper-remap-async-to-generator": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-remap-async-to-generator/-/helper-remap-async-to-generator-7.18.9.tgz",
      "integrity": "sha512-dI7q50YKd8BAv3VEfgg7PS7yD3Rtbi2J1XMXaalXO0W0164hYLnh8zpjRS0mte9MfVp/tltvr/cfdXPvJr1opA==",
      "dev": true,
      "requires": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-wrap-function": "^7.18.9",
        "@babel/types": "^7.18.9"
      }
    },
    "@babel/helper-replace-supers": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-replace-supers/-/helper-replace-supers-7.19.1.tgz",
      "integrity": "sha512-T7ahH7wV0Hfs46SFh5Jz3s0B6+o8g3c+7TMxu7xKfmHikg7EAZ3I2Qk9LFhjxXq8sL7UkP5JflezNwoZa8WvWw==",
      "dev": true,
      "requires": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-member-expression-to-functions": "^7.18.9",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/traverse": "^7.19.1",
        "@babel/types": "^7.19.0"
      }
    },
    "@babel/helper-simple-access": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-simple-access/-/helper-simple-access-7.18.6.tgz",
      "integrity": "sha512-iNpIgTgyAvDQpDj76POqg+YEt8fPxx3yaNBg3S30dxNKm2SWfYhD0TGrK/Eu9wHpUW63VQU894TsTg+GLbUa1g==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-skip-transparent-expression-wrappers": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/helper-skip-transparent-expression-wrappers/-/helper-skip-transparent-expression-wrappers-7.18.9.tgz",
      "integrity": "sha512-imytd2gHi3cJPsybLRbmFrF7u5BIEuI2cNheyKi3/iOBC63kNn3q8Crn2xVuESli0aM4KYsyEqKyS7lFL8YVtw==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.9"
      }
    },
    "@babel/helper-split-export-declaration": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-split-export-declaration/-/helper-split-export-declaration-7.18.6.tgz",
      "integrity": "sha512-bde1etTx6ZyTmobl9LLMMQsaizFVZrquTEHOqKeQESMKo4PlObf+8+JA25ZsIpZhT/WEd39+vOdLXAFG/nELpA==",
      "dev": true,
      "requires": {
        "@babel/types": "^7.18.6"
      }
    },
    "@babel/helper-string-parser": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/helper-string-parser/-/helper-string-parser-7.19.4.tgz",
      "integrity": "sha512-nHtDoQcuqFmwYNYPz3Rah5ph2p8PFeFCsZk9A/48dPc/rGocJ5J3hAAZ7pb76VWX3fZKu+uEr/FhH5jLx7umrw==",
      "dev": true
    },
    "@babel/helper-validator-identifier": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.19.1.tgz",
      "integrity": "sha512-awrNfaMtnHUr653GgGEs++LlAvW6w+DcPrOliSMXWCKo597CwL5Acf/wWdNkf/tfEQE3mjkeD1YOVZOUV/od1w==",
      "dev": true
    },
    "@babel/helper-validator-option": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/helper-validator-option/-/helper-validator-option-7.18.6.tgz",
      "integrity": "sha512-XO7gESt5ouv/LRJdrVjkShckw6STTaB7l9BrpBaAHDeF5YZT+01PCwmR0SJHnkW6i8OwW/EVWRShfi4j2x+KQw==",
      "dev": true
    },
    "@babel/helper-wrap-function": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helper-wrap-function/-/helper-wrap-function-7.19.0.tgz",
      "integrity": "sha512-txX8aN8CZyYGTwcLhlk87KRqncAzhh5TpQamZUa0/u3an36NtDpUP6bQgBCBcLeBs09R/OwQu3OjK0k/HwfNDg==",
      "dev": true,
      "requires": {
        "@babel/helper-function-name": "^7.19.0",
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      }
    },
    "@babel/helpers": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/helpers/-/helpers-7.19.0.tgz",
      "integrity": "sha512-DRBCKGwIEdqY3+rPJgG/dKfQy9+08rHIAJx8q2p+HSWP87s2HCrQmaAMMyMll2kIXKCW0cO1RdQskx15Xakftg==",
      "dev": true,
      "requires": {
        "@babel/template": "^7.18.10",
        "@babel/traverse": "^7.19.0",
        "@babel/types": "^7.19.0"
      }
    },
    "@babel/highlight": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/highlight/-/highlight-7.18.6.tgz",
      "integrity": "sha512-u7stbOuYjaPezCuLj29hNW1v64M2Md2qupEKP1fHc7WdOA3DgLh37suiSrZYY7haUB7iBeQZ9P1uiRF359do3g==",
      "dev": true,
      "requires": {
        "@babel/helper-validator-identifier": "^7.18.6",
        "chalk": "^2.0.0",
        "js-tokens": "^4.0.0"
      }
    },
    "@babel/parser": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/parser/-/parser-7.19.3.tgz",
      "integrity": "sha512-pJ9xOlNWHiy9+FuFP09DEAFbAn4JskgRsVcc169w2xRBC3FRGuQEwjeIMMND9L2zc0iEhO/tGv4Zq+km+hxNpQ==",
      "dev": true
    },
    "@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression/-/plugin-bugfix-safari-id-destructuring-collision-in-function-expression-7.18.6.tgz",
      "integrity": "sha512-Dgxsyg54Fx1d4Nge8UnvTrED63vrwOdPmyvPzlNN/boaliRP54pm3pGzZD1SJUwrBA+Cs/xdG8kXX6Mn/RfISQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining/-/plugin-bugfix-v8-spread-parameters-in-optional-chaining-7.18.9.tgz",
      "integrity": "sha512-AHrP9jadvH7qlOj6PINbgSuphjQUAK7AOT7DPjBo9EHoLhQTnnK5u45e1Hd4DbSQEO9nqPWtQ89r+XEOWFScKg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9",
        "@babel/plugin-proposal-optional-chaining": "^7.18.9"
      }
    },
    "@babel/plugin-proposal-async-generator-functions": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-async-generator-functions/-/plugin-proposal-async-generator-functions-7.19.1.tgz",
      "integrity": "sha512-0yu8vNATgLy4ivqMNBIwb1HebCelqN7YX8SL3FDXORv/RqT0zEEWUCH4GH44JsSrvCu6GqnAdR5EBFAPeNBB4Q==",
      "dev": true,
      "requires": {
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-remap-async-to-generator": "^7.18.9",
        "@babel/plugin-syntax-async-generators": "^7.8.4"
      }
    },
    "@babel/plugin-proposal-class-properties": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-class-properties/-/plugin-proposal-class-properties-7.18.6.tgz",
      "integrity": "sha512-cumfXOF0+nzZrrN8Rf0t7M+tF6sZc7vhQwYQck9q1/5w2OExlD+b4v4RpMJFaV1Z7WcDRgO6FqvxqxGlwo+RHQ==",
      "dev": true,
      "requires": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-proposal-class-static-block": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-class-static-block/-/plugin-proposal-class-static-block-7.18.6.tgz",
      "integrity": "sha512-+I3oIiNxrCpup3Gi8n5IGMwj0gOCAjcJUSQEcotNnCCPMEnixawOQ+KeJPlgfjzx+FKQ1QSyZOWe7wmoJp7vhw==",
      "dev": true,
      "requires": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-class-static-block": "^7.14.5"
      }
    },
    "@babel/plugin-proposal-dynamic-import": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-dynamic-import/-/plugin-proposal-dynamic-import-7.18.6.tgz",
      "integrity": "sha512-1auuwmK+Rz13SJj36R+jqFPMJWyKEDd7lLSdOj4oJK0UTgGueSAtkrCvz9ewmgyU/P941Rv2fQwZJN8s6QruXw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-dynamic-import": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-export-namespace-from": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-export-namespace-from/-/plugin-proposal-export-namespace-from-7.18.9.tgz",
      "integrity": "sha512-k1NtHyOMvlDDFeb9G5PhUXuGj8m/wiwojgQVEhJ/fsVsMCpLyOP4h0uGEjYJKrRI+EVPlb5Jk+Gt9P97lOGwtA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/plugin-syntax-export-namespace-from": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-json-strings": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-json-strings/-/plugin-proposal-json-strings-7.18.6.tgz",
      "integrity": "sha512-lr1peyn9kOdbYc0xr0OdHTZ5FMqS6Di+H0Fz2I/JwMzGmzJETNeOFq2pBySw6X/KFL5EWDjlJuMsUGRFb8fQgQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-json-strings": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-logical-assignment-operators": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-logical-assignment-operators/-/plugin-proposal-logical-assignment-operators-7.18.9.tgz",
      "integrity": "sha512-128YbMpjCrP35IOExw2Fq+x55LMP42DzhOhX2aNNIdI9avSWl2PI0yuBWarr3RYpZBSPtabfadkH2yeRiMD61Q==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/plugin-syntax-logical-assignment-operators": "^7.10.4"
      }
    },
    "@babel/plugin-proposal-nullish-coalescing-operator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-nullish-coalescing-operator/-/plugin-proposal-nullish-coalescing-operator-7.18.6.tgz",
      "integrity": "sha512-wQxQzxYeJqHcfppzBDnm1yAY0jSRkUXR2z8RePZYrKwMKgMlE8+Z6LUno+bd6LvbGh8Gltvy74+9pIYkr+XkKA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-nullish-coalescing-operator": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-numeric-separator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-numeric-separator/-/plugin-proposal-numeric-separator-7.18.6.tgz",
      "integrity": "sha512-ozlZFogPqoLm8WBr5Z8UckIoE4YQ5KESVcNudyXOR8uqIkliTEgJ3RoketfG6pmzLdeZF0H/wjE9/cCEitBl7Q==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-numeric-separator": "^7.10.4"
      }
    },
    "@babel/plugin-proposal-object-rest-spread": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-object-rest-spread/-/plugin-proposal-object-rest-spread-7.19.4.tgz",
      "integrity": "sha512-wHmj6LDxVDnL+3WhXteUBaoM1aVILZODAUjg11kHqG4cOlfgMQGxw6aCgvrXrmaJR3Bn14oZhImyCPZzRpC93Q==",
      "dev": true,
      "requires": {
        "@babel/compat-data": "^7.19.4",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/plugin-syntax-object-rest-spread": "^7.8.3",
        "@babel/plugin-transform-parameters": "^7.18.8"
      }
    },
    "@babel/plugin-proposal-optional-catch-binding": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-optional-catch-binding/-/plugin-proposal-optional-catch-binding-7.18.6.tgz",
      "integrity": "sha512-Q40HEhs9DJQyaZfUjjn6vE8Cv4GmMHCYuMGIWUnlxH6400VGxOuwWsPt4FxXxJkC/5eOzgn0z21M9gMT4MOhbw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-optional-catch-binding": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-optional-chaining": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-optional-chaining/-/plugin-proposal-optional-chaining-7.18.9.tgz",
      "integrity": "sha512-v5nwt4IqBXihxGsW2QmCWMDS3B3bzGIk/EQVZz2ei7f3NJl8NzAJVvUmpDW5q1CRNY+Beb/k58UAH1Km1N411w==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9",
        "@babel/plugin-syntax-optional-chaining": "^7.8.3"
      }
    },
    "@babel/plugin-proposal-private-methods": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-methods/-/plugin-proposal-private-methods-7.18.6.tgz",
      "integrity": "sha512-nutsvktDItsNn4rpGItSNV2sz1XwS+nfU0Rg8aCx3W3NOKVzdMjJRu0O5OkgDp3ZGICSTbgRpxZoWsxoKRvbeA==",
      "dev": true,
      "requires": {
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-proposal-private-property-in-object": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-private-property-in-object/-/plugin-proposal-private-property-in-object-7.18.6.tgz",
      "integrity": "sha512-9Rysx7FOctvT5ouj5JODjAFAkgGoudQuLPamZb0v1TGLpapdNaftzifU8NTWQm0IRjqoYypdrSmyWgkocDQ8Dw==",
      "dev": true,
      "requires": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-create-class-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/plugin-syntax-private-property-in-object": "^7.14.5"
      }
    },
    "@babel/plugin-proposal-unicode-property-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-proposal-unicode-property-regex/-/plugin-proposal-unicode-property-regex-7.18.6.tgz",
      "integrity": "sha512-2BShG/d5yoZyXZfVePH91urL5wTG6ASZU9M4o03lKK8u8UW1y08OMttBSOADTcJrnPMpvDXRG3G8fyLh4ovs8w==",
      "dev": true,
      "requires": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-syntax-async-generators": {
      "version": "7.8.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-async-generators/-/plugin-syntax-async-generators-7.8.4.tgz",
      "integrity": "sha512-tycmZxkGfZaxhMRbXlPXuVFpdWlXpir2W4AMhSJgRKzk/eDlIXOhb2LHWoLpDF7TEHylV5zNhykX6KAgHJmTNw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-class-properties": {
      "version": "7.12.13",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.12.13"
      }
    },
    "@babel/plugin-syntax-class-static-block": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-class-static-block/-/plugin-syntax-class-static-block-7.14.5.tgz",
      "integrity": "sha512-b+YyPmr6ldyNnM6sqYeMWE+bgJcJpO6yS4QD7ymxgH34GBPNDM/THBh8iunyvKIZztiwLH4CJZ0RxTk9emgpjw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.14.5"
      }
    },
    "@babel/plugin-syntax-dynamic-import": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-dynamic-import/-/plugin-syntax-dynamic-import-7.8.3.tgz",
      "integrity": "sha512-5gdGbFon+PszYzqs83S3E5mpi7/y/8M9eC90MRTZfduQOYW76ig6SOSPNe41IG5LoP3FGBn2N0RjVDSQiS94kQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-export-namespace-from": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-export-namespace-from/-/plugin-syntax-export-namespace-from-7.8.3.tgz",
      "integrity": "sha512-MXf5laXo6c1IbEbegDmzGPwGNTsHZmEy6QGznu5Sh2UCWvueywb2ee+CCE4zQiZstxU9BMoQO9i6zUFSY0Kj0Q==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.3"
      }
    },
    "@babel/plugin-syntax-import-assertions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-import-assertions/-/plugin-syntax-import-assertions-7.18.6.tgz",
      "integrity": "sha512-/DU3RXad9+bZwrgWJQKbr39gYbJpLJHezqEzRzi/BHRlJ9zsQb4CK2CA/5apllXNomwA1qHwzvHl+AdEmC5krQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-syntax-json-strings": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-json-strings/-/plugin-syntax-json-strings-7.8.3.tgz",
      "integrity": "sha512-lY6kdGpWHvjoe2vk4WrAapEuBR69EMxZl+RoGRhrFGNYVK8mOPAW8VfbT/ZgrFbXlDNiiaxQnAtgVCZ6jv30EA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-logical-assignment-operators": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-logical-assignment-operators/-/plugin-syntax-logical-assignment-operators-7.10.4.tgz",
      "integrity": "sha512-d8waShlpFDinQ5MtvGU9xDAOzKH47+FFoney2baFIoMr952hKOLp1HR7VszoZvOsV/4+RRszNY7D17ba0te0ig==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.10.4"
      }
    },
    "@babel/plugin-syntax-nullish-coalescing-operator": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-nullish-coalescing-operator/-/plugin-syntax-nullish-coalescing-operator-7.8.3.tgz",
      "integrity": "sha512-aSff4zPII1u2QD7y+F8oDsz19ew4IGEJg9SVW+bqwpwtfFleiQDMdzA/R+UlWDzfnHFCxxleFT0PMIrR36XLNQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-numeric-separator": {
      "version": "7.10.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-numeric-separator/-/plugin-syntax-numeric-separator-7.10.4.tgz",
      "integrity": "sha512-9H6YdfkcK/uOnY/K7/aA2xpzaAgkQn37yzWUMRK7OaPOqOpGS1+n0H5hxT9AUw9EsSjPW8SVyMJwYRtWs3X3ug==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.10.4"
      }
    },
    "@babel/plugin-syntax-object-rest-spread": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-object-rest-spread/-/plugin-syntax-object-rest-spread-7.8.3.tgz",
      "integrity": "sha512-XoqMijGZb9y3y2XskN+P1wUGiVwWZ5JmoDRwx5+3GmEplNyVM2s2Dg8ILFQm8rWM48orGy5YpI5Bl8U1y7ydlA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-optional-catch-binding": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-catch-binding/-/plugin-syntax-optional-catch-binding-7.8.3.tgz",
      "integrity": "sha512-6VPD0Pc1lpTqw0aKoeRTMiB+kWhAoT24PA+ksWSBrFtl5SIRVpZlwN3NNPQjehA2E/91FV3RjLWoVTglWcSV3Q==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-optional-chaining": {
      "version": "7.8.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-optional-chaining/-/plugin-syntax-optional-chaining-7.8.3.tgz",
      "integrity": "sha512-KoK9ErH1MBlCPxV0VANkXW2/dw4vlbGDrFgz8bmUsBGYkFRcbRwMh6cIJubdPrkxRwuGdtCk0v/wPTKbQgBjkg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.8.0"
      }
    },
    "@babel/plugin-syntax-private-property-in-object": {
      "version": "7.14.5",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-private-property-in-object/-/plugin-syntax-private-property-in-object-7.14.5.tgz",
      "integrity": "sha512-0wVnp9dxJ72ZUJDV27ZfbSj6iHLoytYZmh3rFcxNnvsJF3ktkzLDZPy/mA17HGsaQT3/DQsWYX1f1QGWkCoVUg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.14.5"
      }
    },
    "@babel/plugin-syntax-top-level-await": {
      "version": "7.14.5",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.14.5"
      }
    },
    "@babel/plugin-syntax-typescript": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.18.6.tgz",
      "integrity": "sha512-mAWAuq4rvOepWCBid55JuRNvpTNf2UGVgoz4JV0fXEKolsVZDzsa4NqCef758WZJj/GDu0gVGItjKFiClTAmZA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-arrow-functions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-arrow-functions/-/plugin-transform-arrow-functions-7.18.6.tgz",
      "integrity": "sha512-9S9X9RUefzrsHZmKMbDXxweEH+YlE8JJEuat9FdvW9Qh1cw7W64jELCtWNkPBPX5En45uy28KGvA/AySqUh8CQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-async-to-generator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-async-to-generator/-/plugin-transform-async-to-generator-7.18.6.tgz",
      "integrity": "sha512-ARE5wZLKnTgPW7/1ftQmSi1CmkqqHo2DNmtztFhvgtOWSDfq0Cq9/9L+KnZNYSNrydBekhW3rwShduf59RoXag==",
      "dev": true,
      "requires": {
        "@babel/helper-module-imports": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-remap-async-to-generator": "^7.18.6"
      }
    },
    "@babel/plugin-transform-block-scoped-functions": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoped-functions/-/plugin-transform-block-scoped-functions-7.18.6.tgz",
      "integrity": "sha512-ExUcOqpPWnliRcPqves5HJcJOvHvIIWfuS4sroBUenPuMdmW+SMHDakmtS7qOo13sVppmUijqeTv7qqGsvURpQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-block-scoping": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-block-scoping/-/plugin-transform-block-scoping-7.19.4.tgz",
      "integrity": "sha512-934S2VLLlt2hRJwPf4MczaOr4hYF0z+VKPwqTNxyKX7NthTiPfhuKFWQZHXRM0vh/wo/VyXB3s4bZUNA08l+tQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.19.0"
      }
    },
    "@babel/plugin-transform-classes": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-classes/-/plugin-transform-classes-7.19.0.tgz",
      "integrity": "sha512-YfeEE9kCjqTS9IitkgfJuxjcEtLUHMqa8yUJ6zdz8vR7hKuo6mOy2C05P0F1tdMmDCeuyidKnlrw/iTppHcr2A==",
      "dev": true,
      "requires": {
        "@babel/helper-annotate-as-pure": "^7.18.6",
        "@babel/helper-compilation-targets": "^7.19.0",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-optimise-call-expression": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-replace-supers": "^7.18.9",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "globals": "^11.1.0"
      }
    },
    "@babel/plugin-transform-computed-properties": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-computed-properties/-/plugin-transform-computed-properties-7.18.9.tgz",
      "integrity": "sha512-+i0ZU1bCDymKakLxn5srGHrsAPRELC2WIbzwjLhHW9SIE1cPYkLCL0NlnXMZaM1vhfgA2+M7hySk42VBvrkBRw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-destructuring": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-destructuring/-/plugin-transform-destructuring-7.19.4.tgz",
      "integrity": "sha512-t0j0Hgidqf0aM86dF8U+vXYReUgJnlv4bZLsyoPnwZNrGY+7/38o8YjaELrvHeVfTZao15kjR0PVv0nju2iduA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.19.0"
      }
    },
    "@babel/plugin-transform-dotall-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-dotall-regex/-/plugin-transform-dotall-regex-7.18.6.tgz",
      "integrity": "sha512-6S3jpun1eEbAxq7TdjLotAsl4WpQI9DxfkycRcKrjhQYzU87qpXdknpBg/e+TdcMehqGnLFi7tnFUBR02Vq6wg==",
      "dev": true,
      "requires": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-duplicate-keys": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-duplicate-keys/-/plugin-transform-duplicate-keys-7.18.9.tgz",
      "integrity": "sha512-d2bmXCtZXYc59/0SanQKbiWINadaJXqtvIQIzd4+hNwkWBgyCd5F/2t1kXoUdvPMrxzPvhK6EMQRROxsue+mfw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-exponentiation-operator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-exponentiation-operator/-/plugin-transform-exponentiation-operator-7.18.6.tgz",
      "integrity": "sha512-wzEtc0+2c88FVR34aQmiz56dxEkxr2g8DQb/KfaFa1JYXOFVsbhvAonFN6PwVWj++fKmku8NP80plJ5Et4wqHw==",
      "dev": true,
      "requires": {
        "@babel/helper-builder-binary-assignment-operator-visitor": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-for-of": {
      "version": "7.18.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-for-of/-/plugin-transform-for-of-7.18.8.tgz",
      "integrity": "sha512-yEfTRnjuskWYo0k1mHUqrVWaZwrdq8AYbfrpqULOJOaucGSp4mNMVps+YtA8byoevxS/urwU75vyhQIxcCgiBQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-function-name": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-function-name/-/plugin-transform-function-name-7.18.9.tgz",
      "integrity": "sha512-WvIBoRPaJQ5yVHzcnJFor7oS5Ls0PYixlTYE63lCj2RtdQEl15M68FXQlxnG6wdraJIXRdR7KI+hQ7q/9QjrCQ==",
      "dev": true,
      "requires": {
        "@babel/helper-compilation-targets": "^7.18.9",
        "@babel/helper-function-name": "^7.18.9",
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-literals": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-literals/-/plugin-transform-literals-7.18.9.tgz",
      "integrity": "sha512-IFQDSRoTPnrAIrI5zoZv73IFeZu2dhu6irxQjY9rNjTT53VmKg9fenjvoiOWOkJ6mm4jKVPtdMzBY98Fp4Z4cg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-member-expression-literals": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-member-expression-literals/-/plugin-transform-member-expression-literals-7.18.6.tgz",
      "integrity": "sha512-qSF1ihLGO3q+/g48k85tUjD033C29TNTVB2paCwZPVmOsjn9pClvYYrM2VeJpBY2bcNkuny0YUyTNRyRxJ54KA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-modules-amd": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-amd/-/plugin-transform-modules-amd-7.18.6.tgz",
      "integrity": "sha512-Pra5aXsmTsOnjM3IajS8rTaLCy++nGM4v3YR4esk5PCsyg9z8NA5oQLwxzMUtDBd8F+UmVza3VxoAaWCbzH1rg==",
      "dev": true,
      "requires": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      }
    },
    "@babel/plugin-transform-modules-commonjs": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-commonjs/-/plugin-transform-modules-commonjs-7.18.6.tgz",
      "integrity": "sha512-Qfv2ZOWikpvmedXQJDSbxNqy7Xr/j2Y8/KfijM0iJyKkBTmWuvCA1yeH1yDM7NJhBW/2aXxeucLj6i80/LAJ/Q==",
      "dev": true,
      "requires": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-simple-access": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      }
    },
    "@babel/plugin-transform-modules-systemjs": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-systemjs/-/plugin-transform-modules-systemjs-7.19.0.tgz",
      "integrity": "sha512-x9aiR0WXAWmOWsqcsnrzGR+ieaTMVyGyffPVA7F8cXAGt/UxefYv6uSHZLkAFChN5M5Iy1+wjE+xJuPt22H39A==",
      "dev": true,
      "requires": {
        "@babel/helper-hoist-variables": "^7.18.6",
        "@babel/helper-module-transforms": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-validator-identifier": "^7.18.6",
        "babel-plugin-dynamic-import-node": "^2.3.3"
      }
    },
    "@babel/plugin-transform-modules-umd": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-modules-umd/-/plugin-transform-modules-umd-7.18.6.tgz",
      "integrity": "sha512-dcegErExVeXcRqNtkRU/z8WlBLnvD4MRnHgNs3MytRO1Mn1sHRyhbcpYbVMGclAqOjdW+9cfkdZno9dFdfKLfQ==",
      "dev": true,
      "requires": {
        "@babel/helper-module-transforms": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-named-capturing-groups-regex": {
      "version": "7.19.1",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-named-capturing-groups-regex/-/plugin-transform-named-capturing-groups-regex-7.19.1.tgz",
      "integrity": "sha512-oWk9l9WItWBQYS4FgXD4Uyy5kq898lvkXpXQxoJEY1RnvPk4R/Dvu2ebXU9q8lP+rlMwUQTFf2Ok6d78ODa0kw==",
      "dev": true,
      "requires": {
        "@babel/helper-create-regexp-features-plugin": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0"
      }
    },
    "@babel/plugin-transform-new-target": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-new-target/-/plugin-transform-new-target-7.18.6.tgz",
      "integrity": "sha512-DjwFA/9Iu3Z+vrAn+8pBUGcjhxKguSMlsFqeCKbhb9BAV756v0krzVK04CRDi/4aqmk8BsHb4a/gFcaA5joXRw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-object-super": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-object-super/-/plugin-transform-object-super-7.18.6.tgz",
      "integrity": "sha512-uvGz6zk+pZoS1aTZrOvrbj6Pp/kK2mp45t2B+bTDre2UgsZZ8EZLSJtUg7m/no0zOJUWgFONpB7Zv9W2tSaFlA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-replace-supers": "^7.18.6"
      }
    },
    "@babel/plugin-transform-parameters": {
      "version": "7.18.8",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-parameters/-/plugin-transform-parameters-7.18.8.tgz",
      "integrity": "sha512-ivfbE3X2Ss+Fj8nnXvKJS6sjRG4gzwPMsP+taZC+ZzEGjAYlvENixmt1sZ5Ca6tWls+BlKSGKPJ6OOXvXCbkFg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-property-literals": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-property-literals/-/plugin-transform-property-literals-7.18.6.tgz",
      "integrity": "sha512-cYcs6qlgafTud3PAzrrRNbQtfpQ8+y/+M5tKmksS9+M1ckbH6kzY8MrexEM9mcA6JDsukE19iIRvAyYl463sMg==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-regenerator": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-regenerator/-/plugin-transform-regenerator-7.18.6.tgz",
      "integrity": "sha512-poqRI2+qiSdeldcz4wTSTXBRryoq3Gc70ye7m7UD5Ww0nE29IXqMl6r7Nd15WBgRd74vloEMlShtH6CKxVzfmQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "regenerator-transform": "^0.15.0"
      }
    },
    "@babel/plugin-transform-reserved-words": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-reserved-words/-/plugin-transform-reserved-words-7.18.6.tgz",
      "integrity": "sha512-oX/4MyMoypzHjFrT1CdivfKZ+XvIPMFXwwxHp/r0Ddy2Vuomt4HDFGmft1TAY2yiTKiNSsh3kjBAzcM8kSdsjA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-shorthand-properties": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-shorthand-properties/-/plugin-transform-shorthand-properties-7.18.6.tgz",
      "integrity": "sha512-eCLXXJqv8okzg86ywZJbRn19YJHU4XUa55oz2wbHhaQVn/MM+XhukiT7SYqp/7o00dg52Rj51Ny+Ecw4oyoygw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-spread": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-spread/-/plugin-transform-spread-7.19.0.tgz",
      "integrity": "sha512-RsuMk7j6n+r752EtzyScnWkQyuJdli6LdO5Klv8Yx0OfPVTcQkIUfS8clx5e9yHXzlnhOZF3CbQ8C2uP5j074w==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-skip-transparent-expression-wrappers": "^7.18.9"
      }
    },
    "@babel/plugin-transform-sticky-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-sticky-regex/-/plugin-transform-sticky-regex-7.18.6.tgz",
      "integrity": "sha512-kfiDrDQ+PBsQDO85yj1icueWMfGfJFKN1KCkndygtu/C9+XUfydLC8Iv5UYJqRwy4zk8EcplRxEOeLyjq1gm6Q==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/plugin-transform-template-literals": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-template-literals/-/plugin-transform-template-literals-7.18.9.tgz",
      "integrity": "sha512-S8cOWfT82gTezpYOiVaGHrCbhlHgKhQt8XH5ES46P2XWmX92yisoZywf5km75wv5sYcXDUCLMmMxOLCtthDgMA==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-typeof-symbol": {
      "version": "7.18.9",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typeof-symbol/-/plugin-transform-typeof-symbol-7.18.9.tgz",
      "integrity": "sha512-SRfwTtF11G2aemAZWivL7PD+C9z52v9EvMqH9BuYbabyPuKUvSWks3oCg6041pT925L4zVFqaVBeECwsmlguEw==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-typescript": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-typescript/-/plugin-transform-typescript-7.19.3.tgz",
      "integrity": "sha512-z6fnuK9ve9u/0X0rRvI9MY0xg+DOUaABDYOe+/SQTxtlptaBB/V9JIUxJn6xp3lMBeb9qe8xSFmHU35oZDXD+w==",
      "dev": true,
      "requires": {
        "@babel/helper-create-class-features-plugin": "^7.19.0",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/plugin-syntax-typescript": "^7.18.6"
      }
    },
    "@babel/plugin-transform-unicode-escapes": {
      "version": "7.18.10",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-escapes/-/plugin-transform-unicode-escapes-7.18.10.tgz",
      "integrity": "sha512-kKAdAI+YzPgGY/ftStBFXTI1LZFju38rYThnfMykS+IXy8BVx+res7s2fxf1l8I35DV2T97ezo6+SGrXz6B3iQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.9"
      }
    },
    "@babel/plugin-transform-unicode-regex": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/plugin-transform-unicode-regex/-/plugin-transform-unicode-regex-7.18.6.tgz",
      "integrity": "sha512-gE7A6Lt7YLnNOL3Pb9BNeZvi+d8l7tcRrG4+pwJjK9hD2xX4mEvjlQW60G9EEmfXVYRPv9VRQcyegIVHCql/AA==",
      "dev": true,
      "requires": {
        "@babel/helper-create-regexp-features-plugin": "^7.18.6",
        "@babel/helper-plugin-utils": "^7.18.6"
      }
    },
    "@babel/preset-env": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/preset-env/-/preset-env-7.19.4.tgz",
      "integrity": "sha512-5QVOTXUdqTCjQuh2GGtdd7YEhoRXBMVGROAtsBeLGIbIz3obCBIfRMT1I3ZKkMgNzwkyCkftDXSSkHxnfVf4qg==",
      "dev": true,
      "requires": {
        "@babel/compat-data": "^7.19.4",
        "@babel/helper-compilation-targets": "^7.19.3",
        "@babel/helper-plugin-utils": "^7.19.0",
        "@babel/helper-validator-option": "^7.18.6",
        "@babel/plugin-bugfix-safari-id-destructuring-collision-in-function-expression": "^7.18.6",
        "@babel/plugin-bugfix-v8-spread-parameters-in-optional-chaining": "^7.18.9",
        "@babel/plugin-proposal-async-generator-functions": "^7.19.1",
        "@babel/plugin-proposal-class-properties": "^7.18.6",
        "@babel/plugin-proposal-class-static-block": "^7.18.6",
        "@babel/plugin-proposal-dynamic-import": "^7.18.6",
        "@babel/plugin-proposal-export-namespace-from": "^7.18.9",
        "@babel/plugin-proposal-json-strings": "^7.18.6",
        "@babel/plugin-proposal-logical-assignment-operators": "^7.18.9",
        "@babel/plugin-proposal-nullish-coalescing-operator": "^7.18.6",
        "@babel/plugin-proposal-numeric-separator": "^7.18.6",
        "@babel/plugin-proposal-object-rest-spread": "^7.19.4",
        "@babel/plugin-proposal-optional-catch-binding": "^7.18.6",
        "@babel/plugin-proposal-optional-chaining": "^7.18.9",
        "@babel/plugin-proposal-private-methods": "^7.18.6",
        "@babel/plugin-proposal-private-property-in-object": "^7.18.6",
        "@babel/plugin-proposal-unicode-property-regex": "^7.18.6",
        "@babel/plugin-syntax-async-generators": "^7.8.4",
        "@babel/plugin-syntax-class-properties": "^7.12.13",
        "@babel/plugin-syntax-class-static-block": "^7.14.5",
        "@babel/plugin-syntax-dynamic-import": "^7.8.3",
        "@babel/plugin-syntax-export-namespace-from": "^7.8.3",
        "@babel/plugin-syntax-import-assertions": "^7.18.6",
        "@babel/plugin-syntax-json-strings": "^7.8.3",
        "@babel/plugin-syntax-logical-assignment-operators": "^7.10.4",
        "@babel/plugin-syntax-nullish-coalescing-operator": "^7.8.3",
        "@babel/plugin-syntax-numeric-separator": "^7.10.4",
        "@babel/plugin-syntax-object-rest-spread": "^7.8.3",
        "@babel/plugin-syntax-optional-catch-binding": "^7.8.3",
        "@babel/plugin-syntax-optional-chaining": "^7.8.3",
        "@babel/plugin-syntax-private-property-in-object": "^7.14.5",
        "@babel/plugin-syntax-top-level-await": "^7.14.5",
        "@babel/plugin-transform-arrow-functions": "^7.18.6",
        "@babel/plugin-transform-async-to-generator": "^7.18.6",
        "@babel/plugin-transform-block-scoped-functions": "^7.18.6",
        "@babel/plugin-transform-block-scoping": "^7.19.4",
        "@babel/plugin-transform-classes": "^7.19.0",
        "@babel/plugin-transform-computed-properties": "^7.18.9",
        "@babel/plugin-transform-destructuring": "^7.19.4",
        "@babel/plugin-transform-dotall-regex": "^7.18.6",
        "@babel/plugin-transform-duplicate-keys": "^7.18.9",
        "@babel/plugin-transform-exponentiation-operator": "^7.18.6",
        "@babel/plugin-transform-for-of": "^7.18.8",
        "@babel/plugin-transform-function-name": "^7.18.9",
        "@babel/plugin-transform-literals": "^7.18.9",
        "@babel/plugin-transform-member-expression-literals": "^7.18.6",
        "@babel/plugin-transform-modules-amd": "^7.18.6",
        "@babel/plugin-transform-modules-commonjs": "^7.18.6",
        "@babel/plugin-transform-modules-systemjs": "^7.19.0",
        "@babel/plugin-transform-modules-umd": "^7.18.6",
        "@babel/plugin-transform-named-capturing-groups-regex": "^7.19.1",
        "@babel/plugin-transform-new-target": "^7.18.6",
        "@babel/plugin-transform-object-super": "^7.18.6",
        "@babel/plugin-transform-parameters": "^7.18.8",
        "@babel/plugin-transform-property-literals": "^7.18.6",
        "@babel/plugin-transform-regenerator": "^7.18.6",
        "@babel/plugin-transform-reserved-words": "^7.18.6",
        "@babel/plugin-transform-shorthand-properties": "^7.18.6",
        "@babel/plugin-transform-spread": "^7.19.0",
        "@babel/plugin-transform-sticky-regex": "^7.18.6",
        "@babel/plugin-transform-template-literals": "^7.18.9",
        "@babel/plugin-transform-typeof-symbol": "^7.18.9",
        "@babel/plugin-transform-unicode-escapes": "^7.18.10",
        "@babel/plugin-transform-unicode-regex": "^7.18.6",
        "@babel/preset-modules": "^0.1.5",
        "@babel/types": "^7.19.4",
        "babel-plugin-polyfill-corejs2": "^0.3.3",
        "babel-plugin-polyfill-corejs3": "^0.6.0",
        "babel-plugin-polyfill-regenerator": "^0.4.1",
        "core-js-compat": "^3.25.1",
        "semver": "^6.3.0"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "dev": true
        }
      }
    },
    "@babel/preset-modules": {
      "version": "0.1.5",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.0.0",
        "@babel/plugin-proposal-unicode-property-regex": "^7.4.4",
        "@babel/plugin-transform-dotall-regex": "^7.4.4",
        "@babel/types": "^7.4.4",
        "esutils": "^2.0.2"
      }
    },
    "@babel/preset-typescript": {
      "version": "7.18.6",
      "resolved": "https://registry.npmjs.org/@babel/preset-typescript/-/preset-typescript-7.18.6.tgz",
      "integrity": "sha512-s9ik86kXBAnD760aybBucdpnLsAt0jK1xqJn2juOn9lkOvSHV60os5hxoVJsPzMQxvnUJFAlkont2DvvaYEBtQ==",
      "dev": true,
      "requires": {
        "@babel/helper-plugin-utils": "^7.18.6",
        "@babel/helper-validator-option": "^7.18.6",
        "@babel/plugin-transform-typescript": "^7.18.6"
      }
    },
    "@babel/runtime": {
      "version": "7.19.0",
      "resolved": "https://registry.npmjs.org/@babel/runtime/-/runtime-7.19.0.tgz",
      "integrity": "sha512-eR8Lo9hnDS7tqkO7NsV+mKvCmv5boaXFSZ70DnfhcgiEne8hv9oCEd36Klw74EtizEqLsy4YnW8UWwpBVolHZA==",
      "dev": true,
      "requires": {
        "regenerator-runtime": "^0.13.4"
      }
    },
    "@babel/template": {
      "version": "7.18.10",
      "resolved": "https://registry.npmjs.org/@babel/template/-/template-7.18.10.tgz",
      "integrity": "sha512-TI+rCtooWHr3QJ27kJxfjutghu44DLnasDMwpDqCXVTal9RLp3RSYNh4NdBrRP2cQAoG9A8juOQl6P6oZG4JxA==",
      "dev": true,
      "requires": {
        "@babel/code-frame": "^7.18.6",
        "@babel/parser": "^7.18.10",
        "@babel/types": "^7.18.10"
      }
    },
    "@babel/traverse": {
      "version": "7.19.3",
      "resolved": "https://registry.npmjs.org/@babel/traverse/-/traverse-7.19.3.tgz",
      "integrity": "sha512-qh5yf6149zhq2sgIXmwjnsvmnNQC2iw70UFjp4olxucKrWd/dvlUsBI88VSLUsnMNF7/vnOiA+nk1+yLoCqROQ==",
      "dev": true,
      "requires": {
        "@babel/code-frame": "^7.18.6",
        "@babel/generator": "^7.19.3",
        "@babel/helper-environment-visitor": "^7.18.9",
        "@babel/helper-function-name": "^7.19.0",
        "@babel/helper-hoist-variables": "^7.18.6",
        "@babel/helper-split-export-declaration": "^7.18.6",
        "@babel/parser": "^7.19.3",
        "@babel/types": "^7.19.3",
        "debug": "^4.1.0",
        "globals": "^11.1.0"
      }
    },
    "@babel/types": {
      "version": "7.19.4",
      "resolved": "https://registry.npmjs.org/@babel/types/-/types-7.19.4.tgz",
      "integrity": "sha512-M5LK7nAeS6+9j7hAq+b3fQs+pNfUtTGq+yFFfHnauFA8zQtLRfmuipmsKDKKLuyG+wC8ABW43A153YNawNTEtw==",
      "dev": true,
      "requires": {
        "@babel/helper-string-parser": "^7.19.4",
        "@babel/helper-validator-identifier": "^7.19.1",
        "to-fast-properties": "^2.0.0"
      }
    },
    "@cspotcode/source-map-support": {
      "version": "0.8.1",
      "resolved": "https://registry.npmjs.org/@cspotcode/source-map-support/-/source-map-support-0.8.1.tgz",
      "integrity": "sha512-IchNf6dN4tHoMFIn/7OE8LWZ19Y6q/67Bmf6vnGREv8RSbBVb9LPJxEcnwrcwX6ixSvaiGoomAUvu4YSxXrVgw==",
      "dev": true,
      "requires": {
        "@jridgewell/trace-mapping": "0.3.9"
      },
      "dependencies": {
        "@jridgewell/trace-mapping": {
          "version": "0.3.9",
          "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.9.tgz",
          "integrity": "sha512-3Belt6tdc8bPgAtbcmdtNJlirVoTmEb5e2gC94PnkwEW9jI6CAHUeoG85tjWP5WquqfavoMtMwiG4P926ZKKuQ==",
          "dev": true,
          "requires": {
            "@jridgewell/resolve-uri": "^3.0.3",
            "@jridgewell/sourcemap-codec": "^1.4.10"
          }
        }
      }
    },
    "@csstools/postcss-cascade-layers": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-cascade-layers/-/postcss-cascade-layers-1.1.1.tgz",
      "integrity": "sha512-+KdYrpKC5TgomQr2DlZF4lDEpHcoxnj5IGddYYfBWJAKfj1JtuHUIqMa+E1pJJ+z3kvDViWMqyqPlG4Ja7amQA==",
      "dev": true,
      "requires": {
        "@csstools/selector-specificity": "^2.0.2",
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "@csstools/postcss-color-function": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-color-function/-/postcss-color-function-1.1.1.tgz",
      "integrity": "sha512-Bc0f62WmHdtRDjf5f3e2STwRAl89N2CLb+9iAwzrv4L2hncrbDwnQD9PCq0gtAt7pOI2leIV08HIBUd4jxD8cw==",
      "dev": true,
      "requires": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-font-format-keywords": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-font-format-keywords/-/postcss-font-format-keywords-1.0.1.tgz",
      "integrity": "sha512-ZgrlzuUAjXIOc2JueK0X5sZDjCtgimVp/O5CEqTcs5ShWBa6smhWYbS0x5cVc/+rycTDbjjzoP0KTDnUneZGOg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-hwb-function": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-hwb-function/-/postcss-hwb-function-1.0.2.tgz",
      "integrity": "sha512-YHdEru4o3Rsbjmu6vHy4UKOXZD+Rn2zmkAmLRfPet6+Jz4Ojw8cbWxe1n42VaXQhD3CQUXXTooIy8OkVbUcL+w==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-ic-unit": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-ic-unit/-/postcss-ic-unit-1.0.1.tgz",
      "integrity": "sha512-Ot1rcwRAaRHNKC9tAqoqNZhjdYBzKk1POgWfhN4uCOE47ebGcLRqXjKkApVDpjifL6u2/55ekkpnFcp+s/OZUw==",
      "dev": true,
      "requires": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-is-pseudo-class": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-is-pseudo-class/-/postcss-is-pseudo-class-2.0.7.tgz",
      "integrity": "sha512-7JPeVVZHd+jxYdULl87lvjgvWldYu+Bc62s9vD/ED6/QTGjy0jy0US/f6BG53sVMTBJ1lzKZFpYmofBN9eaRiA==",
      "dev": true,
      "requires": {
        "@csstools/selector-specificity": "^2.0.0",
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "@csstools/postcss-nested-calc": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-nested-calc/-/postcss-nested-calc-1.0.0.tgz",
      "integrity": "sha512-JCsQsw1wjYwv1bJmgjKSoZNvf7R6+wuHDAbi5f/7MbFhl2d/+v+TvBTU4BJH3G1X1H87dHl0mh6TfYogbT/dJQ==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-normalize-display-values": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-normalize-display-values/-/postcss-normalize-display-values-1.0.1.tgz",
      "integrity": "sha512-jcOanIbv55OFKQ3sYeFD/T0Ti7AMXc9nM1hZWu8m/2722gOTxFg7xYu4RDLJLeZmPUVQlGzo4jhzvTUq3x4ZUw==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-oklab-function": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-oklab-function/-/postcss-oklab-function-1.1.1.tgz",
      "integrity": "sha512-nJpJgsdA3dA9y5pgyb/UfEzE7W5Ka7u0CX0/HIMVBNWzWemdcTH3XwANECU6anWv/ao4vVNLTMxhiPNZsTK6iA==",
      "dev": true,
      "requires": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-progressive-custom-properties": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-progressive-custom-properties/-/postcss-progressive-custom-properties-1.3.0.tgz",
      "integrity": "sha512-ASA9W1aIy5ygskZYuWams4BzafD12ULvSypmaLJT2jvQ8G0M3I8PRQhC0h7mG0Z3LI05+agZjqSR9+K9yaQQjA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-stepped-value-functions": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-stepped-value-functions/-/postcss-stepped-value-functions-1.0.1.tgz",
      "integrity": "sha512-dz0LNoo3ijpTOQqEJLY8nyaapl6umbmDcgj4AD0lgVQ572b2eqA1iGZYTTWhrcrHztWDDRAX2DGYyw2VBjvCvQ==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-text-decoration-shorthand": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-text-decoration-shorthand/-/postcss-text-decoration-shorthand-1.0.0.tgz",
      "integrity": "sha512-c1XwKJ2eMIWrzQenN0XbcfzckOLLJiczqy+YvfGmzoVXd7pT9FfObiSEfzs84bpE/VqfpEuAZ9tCRbZkZxxbdw==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-trigonometric-functions": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-trigonometric-functions/-/postcss-trigonometric-functions-1.0.2.tgz",
      "integrity": "sha512-woKaLO///4bb+zZC2s80l+7cm07M7268MsyG3M0ActXXEFi6SuhvriQYcb58iiKGbjwwIU7n45iRLEHypB47Og==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "@csstools/postcss-unset-value": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/postcss-unset-value/-/postcss-unset-value-1.0.2.tgz",
      "integrity": "sha512-c8J4roPBILnelAsdLr4XOAR/GsTm0GJi4XpcfvoWk3U6KiTCqiFYc63KhRMQQX35jYMp4Ao8Ij9+IZRgMfJp1g==",
      "dev": true,
      "requires": {}
    },
    "@csstools/selector-specificity": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/@csstools/selector-specificity/-/selector-specificity-2.0.2.tgz",
      "integrity": "sha512-IkpVW/ehM1hWKln4fCA3NzJU8KwD+kIOvPZA4cqxoJHtE21CCzjyp+Kxbu0i5I4tBNOlXPL9mjwnWlL0VEG4Fg==",
      "dev": true,
      "requires": {}
    },
    "@discoveryjs/json-ext": {
      "version": "0.5.6",
      "dev": true
    },
    "@eslint/eslintrc": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/@eslint/eslintrc/-/eslintrc-1.3.2.tgz",
      "integrity": "sha512-AXYd23w1S/bv3fTs3Lz0vjiYemS08jWkI3hYyS9I1ry+0f+Yjs1wm+sU0BS8qDOPrBIkp4qHYC16I8uVtpLajQ==",
      "dev": true,
      "requires": {
        "ajv": "^6.12.4",
        "debug": "^4.3.2",
        "espree": "^9.4.0",
        "globals": "^13.15.0",
        "ignore": "^5.2.0",
        "import-fresh": "^3.2.1",
        "js-yaml": "^4.1.0",
        "minimatch": "^3.1.2",
        "strip-json-comments": "^3.1.1"
      },
      "dependencies": {
        "globals": {
          "version": "13.17.0",
          "resolved": "https://registry.npmjs.org/globals/-/globals-13.17.0.tgz",
          "integrity": "sha512-1C+6nQRb1GwGMKm2dH/E7enFAMxGTmGI7/dEdhy/DNelv85w9B72t3uc5frtMNXIbzrarJJ/lTCjcaZwbLJmyw==",
          "dev": true,
          "requires": {
            "type-fest": "^0.20.2"
          }
        },
        "minimatch": {
          "version": "3.1.2",
          "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
          "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
          "dev": true,
          "requires": {
            "brace-expansion": "^1.1.7"
          }
        },
        "type-fest": {
          "version": "0.20.2",
          "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
          "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
          "dev": true
        }
      }
    },
    "@floating-ui/core": {
      "version": "0.6.2",
      "resolved": "https://registry.npmjs.org/@floating-ui/core/-/core-0.6.2.tgz",
      "integrity": "sha512-jktYRmZwmau63adUG3GKOAVCofBXkk55S/zQ94XOorAHhwqFIOFAy1rSp2N0Wp6/tGbe9V3u/ExlGZypyY17rg=="
    },
    "@floating-ui/dom": {
      "version": "0.4.5",
      "resolved": "https://registry.npmjs.org/@floating-ui/dom/-/dom-0.4.5.tgz",
      "integrity": "sha512-b+prvQgJt8pieaKYMSJBXHxX/DYwdLsAWxKYqnO5dO2V4oo/TYBZJAUQCVNjTWWsrs6o4VDrNcP9+E70HAhJdw==",
      "requires": {
        "@floating-ui/core": "^0.6.2"
      }
    },
    "@gar/promisify": {
      "version": "1.1.2",
      "dev": true
    },
    "@humanwhocodes/config-array": {
      "version": "0.10.7",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/config-array/-/config-array-0.10.7.tgz",
      "integrity": "sha512-MDl6D6sBsaV452/QSdX+4CXIjZhIcI0PELsxUjk4U828yd58vk3bTIvk/6w5FY+4hIy9sLW0sfrV7K7Kc++j/w==",
      "dev": true,
      "requires": {
        "@humanwhocodes/object-schema": "^1.2.1",
        "debug": "^4.1.1",
        "minimatch": "^3.0.4"
      }
    },
    "@humanwhocodes/gitignore-to-minimatch": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/gitignore-to-minimatch/-/gitignore-to-minimatch-1.0.2.tgz",
      "integrity": "sha512-rSqmMJDdLFUsyxR6FMtD00nfQKKLFb1kv+qBbOVKqErvloEIJLo5bDTJTQNTYgeyp78JsA7u/NPi5jT1GR/MuA==",
      "dev": true
    },
    "@humanwhocodes/module-importer": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/module-importer/-/module-importer-1.0.1.tgz",
      "integrity": "sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==",
      "dev": true
    },
    "@humanwhocodes/object-schema": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@humanwhocodes/object-schema/-/object-schema-1.2.1.tgz",
      "integrity": "sha512-ZnQMnLV4e7hDlUvw8H+U8ASL02SS2Gn6+9Ac3wGGLIe7+je2AeAOxPY+izIPJDfFDb7eDjev0Us8MO1iFRN8hA==",
      "dev": true
    },
    "@jridgewell/gen-mapping": {
      "version": "0.1.1",
      "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.1.1.tgz",
      "integrity": "sha512-sQXCasFk+U8lWYEe66WxRDOE9PjVz4vSM51fTu3Hw+ClTpUSQb718772vH3pyS5pShp6lvQM7SxgIDXXXmOX7w==",
      "dev": true,
      "requires": {
        "@jridgewell/set-array": "^1.0.0",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "@jridgewell/resolve-uri": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/@jridgewell/resolve-uri/-/resolve-uri-3.1.0.tgz",
      "integrity": "sha512-F2msla3tad+Mfht5cJq7LSXcdudKTWCVYUgw6pLFOOHSTtZlj6SWNYAp+AhuqLmWdBO2X5hPrLcu8cVP8fy28w==",
      "dev": true
    },
    "@jridgewell/set-array": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/set-array/-/set-array-1.1.2.tgz",
      "integrity": "sha512-xnkseuNADM0gt2bs+BvhO0p78Mk762YnZdsuzFV018NoG1Sj1SCQvpSqa7XUaTam5vAGasABV9qXASMKnFMwMw==",
      "dev": true
    },
    "@jridgewell/source-map": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@jridgewell/source-map/-/source-map-0.3.2.tgz",
      "integrity": "sha512-m7O9o2uR8k2ObDysZYzdfhb08VuEml5oWGiosa1VdaPZ/A6QyPkAJuwN0Q1lhULOf6B7MtQmHENS743hWtCrgw==",
      "dev": true,
      "requires": {
        "@jridgewell/gen-mapping": "^0.3.0",
        "@jridgewell/trace-mapping": "^0.3.9"
      },
      "dependencies": {
        "@jridgewell/gen-mapping": {
          "version": "0.3.2",
          "resolved": "https://registry.npmjs.org/@jridgewell/gen-mapping/-/gen-mapping-0.3.2.tgz",
          "integrity": "sha512-mh65xKQAzI6iBcFzwv28KVWSmCkdRBWoOh+bYQGW3+6OZvbbN3TqMGo5hqYxQniRcH9F2VZIoJCm4pa3BPDK/A==",
          "dev": true,
          "requires": {
            "@jridgewell/set-array": "^1.0.1",
            "@jridgewell/sourcemap-codec": "^1.4.10",
            "@jridgewell/trace-mapping": "^0.3.9"
          }
        }
      }
    },
    "@jridgewell/sourcemap-codec": {
      "version": "1.4.14",
      "resolved": "https://registry.npmjs.org/@jridgewell/sourcemap-codec/-/sourcemap-codec-1.4.14.tgz",
      "integrity": "sha512-XPSJHWmi394fuUuzDnGz1wiKqWfo1yXecHQMRf2l6hztTO+nPru658AyDngaBe7isIxEkRsPR3FZh+s7iVa4Uw==",
      "dev": true
    },
    "@jridgewell/trace-mapping": {
      "version": "0.3.15",
      "resolved": "https://registry.npmjs.org/@jridgewell/trace-mapping/-/trace-mapping-0.3.15.tgz",
      "integrity": "sha512-oWZNOULl+UbhsgB51uuZzglikfIKSUBO/M9W2OfEjn7cmqoAiCgmv9lyACTUacZwBz0ITnJ2NqjU8Tx0DHL88g==",
      "dev": true,
      "requires": {
        "@jridgewell/resolve-uri": "^3.0.3",
        "@jridgewell/sourcemap-codec": "^1.4.10"
      }
    },
    "@nodelib/fs.scandir": {
      "version": "2.1.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.scandir/-/fs.scandir-2.1.5.tgz",
      "integrity": "sha512-vq24Bq3ym5HEQm2NKCr3yXDwjc7vTsEThRDnkp2DK9p1uqLR+DHurm/NOTo0KG7HYHU7eppKZj3MyqYuMBf62g==",
      "dev": true,
      "requires": {
        "@nodelib/fs.stat": "2.0.5",
        "run-parallel": "^1.1.9"
      }
    },
    "@nodelib/fs.stat": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.stat/-/fs.stat-2.0.5.tgz",
      "integrity": "sha512-RkhPPp2zrqDAQA/2jNhnztcPAlv64XdhIp7a7454A5ovI7Bukxgt7MX7udwAu3zg1DcpPU0rz3VV1SeaqvY4+A==",
      "dev": true
    },
    "@nodelib/fs.walk": {
      "version": "1.2.8",
      "resolved": "https://registry.npmjs.org/@nodelib/fs.walk/-/fs.walk-1.2.8.tgz",
      "integrity": "sha512-oGB+UxlgWcgQkgwo8GcEGwemoTFt3FIO9ababBmaGwXIoBKZ+GTy0pP185beGg7Llih/NSHSV2XAs1lnznocSg==",
      "dev": true,
      "requires": {
        "@nodelib/fs.scandir": "2.1.5",
        "fastq": "^1.6.0"
      }
    },
    "@npmcli/fs": {
      "version": "1.1.0",
      "dev": true,
      "requires": {
        "@gar/promisify": "^1.0.1",
        "semver": "^7.3.5"
      },
      "dependencies": {
        "lru-cache": {
          "version": "6.0.0",
          "dev": true,
          "requires": {
            "yallist": "^4.0.0"
          }
        },
        "semver": {
          "version": "7.3.5",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        },
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "@npmcli/move-file": {
      "version": "1.1.2",
      "dev": true,
      "requires": {
        "mkdirp": "^1.0.4",
        "rimraf": "^3.0.2"
      },
      "dependencies": {
        "mkdirp": {
          "version": "1.0.4",
          "dev": true
        },
        "rimraf": {
          "version": "3.0.2",
          "dev": true,
          "requires": {
            "glob": "^7.1.3"
          }
        }
      }
    },
    "@tootallnate/once": {
      "version": "1.1.2",
      "dev": true
    },
    "@trysound/sax": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/@trysound/sax/-/sax-0.2.0.tgz",
      "integrity": "sha512-L7z9BgrNEcYyUYtF+HaEfiS5ebkh9jXqbszz7pC0hRBPaatV0XjSD3+eHrpqFemQfgwiFF0QPIarnIihIDn7OA==",
      "dev": true
    },
    "@tsconfig/node10": {
      "version": "1.0.9",
      "resolved": "https://registry.npmjs.org/@tsconfig/node10/-/node10-1.0.9.tgz",
      "integrity": "sha512-jNsYVVxU8v5g43Erja32laIDHXeoNvFEpX33OK4d6hljo3jDhCBDhx5dhCCTMWUojscpAagGiRkBKxpdl9fxqA==",
      "dev": true
    },
    "@tsconfig/node12": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/@tsconfig/node12/-/node12-1.0.11.tgz",
      "integrity": "sha512-cqefuRsh12pWyGsIoBKJA9luFu3mRxCA+ORZvA4ktLSzIuCUtWVxGIuXigEwO5/ywWFMZ2QEGKWvkZG1zDMTag==",
      "dev": true
    },
    "@tsconfig/node14": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node14/-/node14-1.0.3.tgz",
      "integrity": "sha512-ysT8mhdixWK6Hw3i1V2AeRqZ5WfXg1G43mqoYlM2nc6388Fq5jcXyr5mRsqViLx/GJYdoL0bfXD8nmF+Zn/Iow==",
      "dev": true
    },
    "@tsconfig/node16": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/@tsconfig/node16/-/node16-1.0.3.tgz",
      "integrity": "sha512-yOlFc+7UtL/89t2ZhjPvvB/DeAr3r+Dq58IgzsFkOAvVC6NMJXmCGjbptdXdR9qsX7pKcTL+s87FtYREi2dEEQ==",
      "dev": true
    },
    "@types/eslint": {
      "version": "8.4.6",
      "resolved": "https://registry.npmjs.org/@types/eslint/-/eslint-8.4.6.tgz",
      "integrity": "sha512-/fqTbjxyFUaYNO7VcW5g+4npmqVACz1bB7RTHYuLj+PRjw9hrCwrUXVQFpChUS0JsyEFvMZ7U/PfmvWgxJhI9g==",
      "dev": true,
      "requires": {
        "@types/estree": "*",
        "@types/json-schema": "*"
      }
    },
    "@types/eslint-scope": {
      "version": "3.7.4",
      "resolved": "https://registry.npmjs.org/@types/eslint-scope/-/eslint-scope-3.7.4.tgz",
      "integrity": "sha512-9K4zoImiZc3HlIp6AVUDE4CWYx22a+lhSZMYNpbjW04+YF0KWj4pJXnEMjdnFTiQibFFmElcsasJXDbdI/EPhA==",
      "dev": true,
      "requires": {
        "@types/eslint": "*",
        "@types/estree": "*"
      }
    },
    "@types/estree": {
      "version": "0.0.51",
      "resolved": "https://registry.npmjs.org/@types/estree/-/estree-0.0.51.tgz",
      "integrity": "sha512-CuPgU6f3eT/XgKKPqKd/gLZV1Xmvf1a2R5POBOGQa6uv82xpls89HU5zKeVoyR8XzHd1RGNOlQlvUe3CFkjWNQ==",
      "dev": true
    },
    "@types/json-schema": {
      "version": "7.0.9",
      "dev": true
    },
    "@types/minimist": {
      "version": "1.2.0",
      "dev": true
    },
    "@types/mocha": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/@types/mocha/-/mocha-10.0.0.tgz",
      "integrity": "sha512-rADY+HtTOA52l9VZWtgQfn4p+UDVM2eDVkMZT1I6syp0YKxW2F9v+0pbRZLsvskhQv/vMb6ZfCay81GHbz5SHg==",
      "dev": true
    },
    "@types/node": {
      "version": "17.0.7",
      "dev": true
    },
    "@types/normalize-package-data": {
      "version": "2.4.0",
      "dev": true
    },
    "@types/parse-json": {
      "version": "4.0.0",
      "dev": true
    },
    "@ungap/promise-all-settled": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@ungap/promise-all-settled/-/promise-all-settled-1.1.2.tgz",
      "integrity": "sha512-sL/cEvJWAnClXw0wHk85/2L0G6Sj8UB0Ctc1TEMbKSsmpRosqhwj9gWgFRZSrBr2f9tiXISwNhCPmlfqUqyb9Q==",
      "dev": true
    },
    "@webassemblyjs/ast": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/helper-numbers": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1"
      }
    },
    "@webassemblyjs/floating-point-hex-parser": {
      "version": "1.11.1",
      "dev": true
    },
    "@webassemblyjs/helper-api-error": {
      "version": "1.11.1",
      "dev": true
    },
    "@webassemblyjs/helper-buffer": {
      "version": "1.11.1",
      "dev": true
    },
    "@webassemblyjs/helper-numbers": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/floating-point-hex-parser": "1.11.1",
        "@webassemblyjs/helper-api-error": "1.11.1",
        "@xtuc/long": "4.2.2"
      }
    },
    "@webassemblyjs/helper-wasm-bytecode": {
      "version": "1.11.1",
      "dev": true
    },
    "@webassemblyjs/helper-wasm-section": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1"
      }
    },
    "@webassemblyjs/ieee754": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@xtuc/ieee754": "^1.2.0"
      }
    },
    "@webassemblyjs/leb128": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@xtuc/long": "4.2.2"
      }
    },
    "@webassemblyjs/utf8": {
      "version": "1.11.1",
      "dev": true
    },
    "@webassemblyjs/wasm-edit": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/helper-wasm-section": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1",
        "@webassemblyjs/wasm-opt": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1",
        "@webassemblyjs/wast-printer": "1.11.1"
      }
    },
    "@webassemblyjs/wasm-gen": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/ieee754": "1.11.1",
        "@webassemblyjs/leb128": "1.11.1",
        "@webassemblyjs/utf8": "1.11.1"
      }
    },
    "@webassemblyjs/wasm-opt": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-buffer": "1.11.1",
        "@webassemblyjs/wasm-gen": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1"
      }
    },
    "@webassemblyjs/wasm-parser": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/helper-api-error": "1.11.1",
        "@webassemblyjs/helper-wasm-bytecode": "1.11.1",
        "@webassemblyjs/ieee754": "1.11.1",
        "@webassemblyjs/leb128": "1.11.1",
        "@webassemblyjs/utf8": "1.11.1"
      }
    },
    "@webassemblyjs/wast-printer": {
      "version": "1.11.1",
      "dev": true,
      "requires": {
        "@webassemblyjs/ast": "1.11.1",
        "@xtuc/long": "4.2.2"
      }
    },
    "@webpack-cli/configtest": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/configtest/-/configtest-1.2.0.tgz",
      "integrity": "sha512-4FB8Tj6xyVkyqjj1OaTqCjXYULB9FMkqQ8yGrZjRDrYh0nOE+7Lhs45WioWQQMV+ceFlE368Ukhe6xdvJM9Egg==",
      "dev": true,
      "requires": {}
    },
    "@webpack-cli/info": {
      "version": "1.5.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/info/-/info-1.5.0.tgz",
      "integrity": "sha512-e8tSXZpw2hPl2uMJY6fsMswaok5FdlGNRTktvFk2sD8RjH0hE2+XistawJx1vmKteh4NmGmNUrp+Tb2w+udPcQ==",
      "dev": true,
      "requires": {
        "envinfo": "^7.7.3"
      }
    },
    "@webpack-cli/serve": {
      "version": "1.7.0",
      "resolved": "https://registry.npmjs.org/@webpack-cli/serve/-/serve-1.7.0.tgz",
      "integrity": "sha512-oxnCNGj88fL+xzV+dacXs44HcDwf1ovs3AuEzvP7mqXw7fQntqIhQ1BRmynh4qEKQSSSRSWVyXRjmTbZIX9V2Q==",
      "dev": true,
      "requires": {}
    },
    "@xtuc/ieee754": {
      "version": "1.2.0",
      "dev": true
    },
    "@xtuc/long": {
      "version": "4.2.2",
      "dev": true
    },
    "abbrev": {
      "version": "1.1.1",
      "dev": true
    },
    "acorn": {
      "version": "8.8.0",
      "resolved": "https://registry.npmjs.org/acorn/-/acorn-8.8.0.tgz",
      "integrity": "sha512-QOxyigPVrpZ2GXT+PFyZTl6TtOFc5egxHIP9IlQ+RbupQuX4RkT/Bee4/kQuC02Xkzg84JcT7oLYtDIQxp+v7w==",
      "dev": true
    },
    "acorn-import-assertions": {
      "version": "1.8.0",
      "dev": true,
      "requires": {}
    },
    "acorn-jsx": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/acorn-jsx/-/acorn-jsx-5.3.2.tgz",
      "integrity": "sha512-rq9s+JNhf0IChjtDXxllJ7g41oZk5SlXtp0LHwyA5cejwn7vKmKp4pPri6YEePv2PU65sAsegbXtIinmDFDXgQ==",
      "dev": true,
      "requires": {}
    },
    "acorn-walk": {
      "version": "8.2.0",
      "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.2.0.tgz",
      "integrity": "sha512-k+iyHEuPgSw6SbuDpGQM+06HQUa04DZ3o+F6CSzXMvvI5KMvnaEqXe+YVe555R9nn6GPt404fos4wcgpw12SDA==",
      "dev": true
    },
    "agent-base": {
      "version": "6.0.2",
      "dev": true,
      "requires": {
        "debug": "4"
      }
    },
    "agentkeepalive": {
      "version": "4.2.0",
      "dev": true,
      "requires": {
        "debug": "^4.1.0",
        "depd": "^1.1.2",
        "humanize-ms": "^1.2.1"
      }
    },
    "aggregate-error": {
      "version": "3.1.0",
      "dev": true,
      "requires": {
        "clean-stack": "^2.0.0",
        "indent-string": "^4.0.0"
      }
    },
    "ajv": {
      "version": "6.12.6",
      "dev": true,
      "requires": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      }
    },
    "ajv-formats": {
      "version": "2.1.1",
      "dev": true,
      "requires": {
        "ajv": "^8.0.0"
      },
      "dependencies": {
        "ajv": {
          "version": "8.8.2",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.1",
            "json-schema-traverse": "^1.0.0",
            "require-from-string": "^2.0.2",
            "uri-js": "^4.2.2"
          }
        },
        "json-schema-traverse": {
          "version": "1.0.0",
          "dev": true
        }
      }
    },
    "ajv-keywords": {
      "version": "3.5.2",
      "dev": true,
      "requires": {}
    },
    "ansi-colors": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/ansi-colors/-/ansi-colors-4.1.1.tgz",
      "integrity": "sha512-JoX0apGbHaUJBNl6yF+p6JAFYZ666/hhCGKN5t9QFjbJQKUU/g8MNbFDbvfrgKXvI1QpZplPOnwIo99lX/AAmA==",
      "dev": true
    },
    "ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "dev": true
    },
    "ansi-styles": {
      "version": "3.2.1",
      "dev": true,
      "requires": {
        "color-convert": "^1.9.0"
      }
    },
    "ansis": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/ansis/-/ansis-1.4.0.tgz",
      "integrity": "sha512-jaJCg2/68pwinZeW86YBSNv0kNPr3PSog/IqflOVCbqCedSCvrDCBUW1y4V9gcEUDNxrGtVLAkMIivvpsq1VwA==",
      "dev": true
    },
    "anymatch": {
      "version": "3.1.2",
      "dev": true,
      "requires": {
        "normalize-path": "^3.0.0",
        "picomatch": "^2.0.4"
      }
    },
    "aproba": {
      "version": "1.2.0",
      "dev": true
    },
    "are-we-there-yet": {
      "version": "2.0.0",
      "dev": true,
      "requires": {
        "delegates": "^1.0.0",
        "readable-stream": "^3.6.0"
      }
    },
    "arg": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/arg/-/arg-4.1.3.tgz",
      "integrity": "sha512-58S9QDqG0Xx27YwPSt9fJxivjYl432YCwfDMfZ+71RAqUrZef7LrKQZ3LHLOwCS4FLNBplP533Zx895SeOCHvA==",
      "dev": true
    },
    "argparse": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/argparse/-/argparse-2.0.1.tgz",
      "integrity": "sha512-8+9WqebbFzpX9OR+Wa6O29asIogeRMzcGtAINdpMHHyAg10f05aSFVBbcEqGf/PXw1EjAZ+q2/bEBg3DvurK3Q==",
      "dev": true
    },
    "array-union": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/array-union/-/array-union-2.1.0.tgz",
      "integrity": "sha512-HGyxoOTYUyCM6stUe6EJgnd4EoewAI7zMdfqO+kGjnlZmBDz/cR5pf8r/cR4Wq60sL/p0IkcjUEEPwS3GFrIyw==",
      "dev": true
    },
    "arrify": {
      "version": "1.0.1",
      "dev": true
    },
    "asn1": {
      "version": "0.2.6",
      "dev": true,
      "requires": {
        "safer-buffer": "~2.1.0"
      }
    },
    "assert-plus": {
      "version": "1.0.0",
      "dev": true
    },
    "astral-regex": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/astral-regex/-/astral-regex-2.0.0.tgz",
      "integrity": "sha512-Z7tMw1ytTXt5jqMcOP+OQteU1VuNK9Y02uuJtKQ1Sv69jXQKKg5cibLwGJow8yzZP+eAc18EmLGPal0bp36rvQ==",
      "dev": true
    },
    "async-foreach": {
      "version": "0.1.3",
      "dev": true
    },
    "asynckit": {
      "version": "0.4.0",
      "dev": true
    },
    "autoprefixer": {
      "version": "10.4.12",
      "resolved": "https://registry.npmjs.org/autoprefixer/-/autoprefixer-10.4.12.tgz",
      "integrity": "sha512-WrCGV9/b97Pa+jtwf5UGaRjgQIg7OK3D06GnoYoZNcG1Xb8Gt3EfuKjlhh9i/VtT16g6PYjZ69jdJ2g8FxSC4Q==",
      "dev": true,
      "requires": {
        "browserslist": "^4.21.4",
        "caniuse-lite": "^1.0.30001407",
        "fraction.js": "^4.2.0",
        "normalize-range": "^0.1.2",
        "picocolors": "^1.0.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "aws-sign2": {
      "version": "0.7.0",
      "dev": true
    },
    "aws4": {
      "version": "1.11.0",
      "dev": true
    },
    "babel-loader": {
      "version": "8.2.5",
      "resolved": "https://registry.npmjs.org/babel-loader/-/babel-loader-8.2.5.tgz",
      "integrity": "sha512-OSiFfH89LrEMiWd4pLNqGz4CwJDtbs2ZVc+iGu2HrkRfPxId9F2anQj38IxWpmRfsUY0aBZYi1EFcd3mhtRMLQ==",
      "dev": true,
      "requires": {
        "find-cache-dir": "^3.3.1",
        "loader-utils": "^2.0.0",
        "make-dir": "^3.1.0",
        "schema-utils": "^2.6.5"
      }
    },
    "babel-plugin-dynamic-import-node": {
      "version": "2.3.3",
      "resolved": "https://registry.npmjs.org/babel-plugin-dynamic-import-node/-/babel-plugin-dynamic-import-node-2.3.3.tgz",
      "integrity": "sha512-jZVI+s9Zg3IqA/kdi0i6UDCybUI3aSBLnglhYbSSjKlV7yF1F/5LWv8MakQmvYpnbJDS6fcBL2KzHSxNCMtWSQ==",
      "dev": true,
      "requires": {
        "object.assign": "^4.1.0"
      }
    },
    "babel-plugin-polyfill-corejs2": {
      "version": "0.3.3",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs2/-/babel-plugin-polyfill-corejs2-0.3.3.tgz",
      "integrity": "sha512-8hOdmFYFSZhqg2C/JgLUQ+t52o5nirNwaWM2B9LWteozwIvM14VSwdsCAUET10qT+kmySAlseadmfeeSWFCy+Q==",
      "dev": true,
      "requires": {
        "@babel/compat-data": "^7.17.7",
        "@babel/helper-define-polyfill-provider": "^0.3.3",
        "semver": "^6.1.1"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "resolved": "https://registry.npmjs.org/semver/-/semver-6.3.0.tgz",
          "integrity": "sha512-b39TBaTSfV6yBrapU89p5fKekE2m/NwnDocOVruQFS1/veMgdzuPcnOM34M6CwxW8jH/lxEa5rBoDeUwu5HHTw==",
          "dev": true
        }
      }
    },
    "babel-plugin-polyfill-corejs3": {
      "version": "0.6.0",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-corejs3/-/babel-plugin-polyfill-corejs3-0.6.0.tgz",
      "integrity": "sha512-+eHqR6OPcBhJOGgsIar7xoAB1GcSwVUA3XjAd7HJNzOXT4wv6/H7KIdA/Nc60cvUlDbKApmqNvD1B1bzOt4nyA==",
      "dev": true,
      "requires": {
        "@babel/helper-define-polyfill-provider": "^0.3.3",
        "core-js-compat": "^3.25.1"
      }
    },
    "babel-plugin-polyfill-regenerator": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/babel-plugin-polyfill-regenerator/-/babel-plugin-polyfill-regenerator-0.4.1.tgz",
      "integrity": "sha512-NtQGmyQDXjQqQ+IzRkBVwEOz9lQ4zxAQZgoAYEtU9dJjnl1Oc98qnN7jcp+bE7O7aYzVpavXE3/VKXNzUbh7aw==",
      "dev": true,
      "requires": {
        "@babel/helper-define-polyfill-provider": "^0.3.3"
      }
    },
    "balanced-match": {
      "version": "1.0.0",
      "dev": true
    },
    "bcrypt-pbkdf": {
      "version": "1.0.2",
      "dev": true,
      "requires": {
        "tweetnacl": "^0.14.3"
      }
    },
    "big.js": {
      "version": "5.2.2",
      "dev": true
    },
    "binary-extensions": {
      "version": "2.2.0",
      "dev": true
    },
    "boolbase": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/boolbase/-/boolbase-1.0.0.tgz",
      "integrity": "sha512-JZOSA7Mo9sNGB8+UjSgzdLtokWAky1zbztM3WRLCbZ70/3cTANmQmOdR7y2g+J0e2WXywy1yS468tY+IruqEww==",
      "dev": true
    },
    "bourbon": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/bourbon/-/bourbon-7.2.0.tgz",
      "integrity": "sha512-Zx/lY/YzMkSyFC7yYPp9QcI2OCWnUHQdSrXvRtfnaUGT/edKNh44mVPYkP7QEyk6yQOLCJottsuTnidqKcpbNg=="
    },
    "brace-expansion": {
      "version": "1.1.11",
      "dev": true,
      "requires": {
        "balanced-match": "^1.0.0",
        "concat-map": "0.0.1"
      }
    },
    "braces": {
      "version": "3.0.2",
      "dev": true,
      "requires": {
        "fill-range": "^7.0.1"
      }
    },
    "browser-stdout": {
      "version": "1.3.1",
      "resolved": "https://registry.npmjs.org/browser-stdout/-/browser-stdout-1.3.1.tgz",
      "integrity": "sha512-qhAVI1+Av2X7qelOfAIYwXONood6XlZE/fXaBSmW/T5SzLAmCgzi+eiWE7fUvbHaeNBQH13UftjpXxsfLkMpgw==",
      "dev": true
    },
    "browserslist": {
      "version": "4.21.4",
      "resolved": "https://registry.npmjs.org/browserslist/-/browserslist-4.21.4.tgz",
      "integrity": "sha512-CBHJJdDmgjl3daYjN5Cp5kbTf1mUhZoS+beLklHIvkOWscs83YAhLlF3Wsh/lciQYAcbBJgTOD44VtG31ZM4Hw==",
      "dev": true,
      "requires": {
        "caniuse-lite": "^1.0.30001400",
        "electron-to-chromium": "^1.4.251",
        "node-releases": "^2.0.6",
        "update-browserslist-db": "^1.0.9"
      }
    },
    "buffer-from": {
      "version": "1.1.2",
      "dev": true
    },
    "call-bind": {
      "version": "1.0.2",
      "dev": true,
      "requires": {
        "function-bind": "^1.1.1",
        "get-intrinsic": "^1.0.2"
      }
    },
    "callsites": {
      "version": "3.1.0",
      "dev": true
    },
    "camelcase": {
      "version": "5.3.1",
      "dev": true
    },
    "camelcase-keys": {
      "version": "6.2.2",
      "dev": true,
      "requires": {
        "camelcase": "^5.3.1",
        "map-obj": "^4.0.0",
        "quick-lru": "^4.0.1"
      }
    },
    "caniuse-api": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/caniuse-api/-/caniuse-api-3.0.0.tgz",
      "integrity": "sha512-bsTwuIg/BZZK/vreVTYYbSWoe2F+71P7K5QGEX+pT250DZbfU1MQ5prOKpPR+LL6uWKK3KMwMCAS74QB3Um1uw==",
      "dev": true,
      "requires": {
        "browserslist": "^4.0.0",
        "caniuse-lite": "^1.0.0",
        "lodash.memoize": "^4.1.2",
        "lodash.uniq": "^4.5.0"
      }
    },
    "caniuse-lite": {
      "version": "1.0.30001418",
      "resolved": "https://registry.npmjs.org/caniuse-lite/-/caniuse-lite-1.0.30001418.tgz",
      "integrity": "sha512-oIs7+JL3K9JRQ3jPZjlH6qyYDp+nBTCais7hjh0s+fuBwufc7uZ7hPYMXrDOJhV360KGMTcczMRObk0/iMqZRg==",
      "dev": true
    },
    "caseless": {
      "version": "0.12.0",
      "dev": true
    },
    "chalk": {
      "version": "2.4.2",
      "dev": true,
      "requires": {
        "ansi-styles": "^3.2.1",
        "escape-string-regexp": "^1.0.5",
        "supports-color": "^5.3.0"
      },
      "dependencies": {
        "supports-color": {
          "version": "5.5.0",
          "dev": true,
          "requires": {
            "has-flag": "^3.0.0"
          }
        }
      }
    },
    "chokidar": {
      "version": "3.5.3",
      "resolved": "https://registry.npmjs.org/chokidar/-/chokidar-3.5.3.tgz",
      "integrity": "sha512-Dr3sfKRP6oTcjf2JmUmFJfeVMvXBdegxB0iVQ5eb2V10uFJUCAS8OByZdVAyVb8xXNz3GjjTgj9kLWsZTqE6kw==",
      "dev": true,
      "requires": {
        "anymatch": "~3.1.2",
        "braces": "~3.0.2",
        "fsevents": "~2.3.2",
        "glob-parent": "~5.1.2",
        "is-binary-path": "~2.1.0",
        "is-glob": "~4.0.1",
        "normalize-path": "~3.0.0",
        "readdirp": "~3.6.0"
      },
      "dependencies": {
        "glob-parent": {
          "version": "5.1.2",
          "dev": true,
          "requires": {
            "is-glob": "^4.0.1"
          }
        }
      }
    },
    "chrome-trace-event": {
      "version": "1.0.3",
      "dev": true
    },
    "clean-stack": {
      "version": "2.2.0",
      "dev": true
    },
    "cliui": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz",
      "integrity": "sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==",
      "dev": true,
      "requires": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.1",
        "wrap-ansi": "^7.0.0"
      }
    },
    "clone-deep": {
      "version": "4.0.1",
      "dev": true,
      "requires": {
        "is-plain-object": "^2.0.4",
        "kind-of": "^6.0.2",
        "shallow-clone": "^3.0.0"
      },
      "dependencies": {
        "is-plain-object": {
          "version": "2.0.4",
          "dev": true,
          "requires": {
            "isobject": "^3.0.1"
          }
        }
      }
    },
    "color-convert": {
      "version": "1.9.3",
      "dev": true,
      "requires": {
        "color-name": "1.1.3"
      }
    },
    "color-name": {
      "version": "1.1.3",
      "dev": true
    },
    "color-support": {
      "version": "1.1.3",
      "dev": true
    },
    "colord": {
      "version": "2.9.3",
      "resolved": "https://registry.npmjs.org/colord/-/colord-2.9.3.tgz",
      "integrity": "sha512-jeC1axXpnb0/2nn/Y1LPuLdgXBLH7aDcHu4KEKfqw3CUhX7ZpfBSlPKyqXE6btIgEzfWtrX3/tyBCaCvXvMkOw==",
      "dev": true
    },
    "colorette": {
      "version": "2.0.16",
      "dev": true
    },
    "combined-stream": {
      "version": "1.0.8",
      "dev": true,
      "requires": {
        "delayed-stream": "~1.0.0"
      }
    },
    "commander": {
      "version": "7.2.0",
      "dev": true
    },
    "commondir": {
      "version": "1.0.1",
      "dev": true
    },
    "concat-map": {
      "version": "0.0.1",
      "dev": true
    },
    "concurrently": {
      "version": "7.4.0",
      "resolved": "https://registry.npmjs.org/concurrently/-/concurrently-7.4.0.tgz",
      "integrity": "sha512-M6AfrueDt/GEna/Vg9BqQ+93yuvzkSKmoTixnwEJkH0LlcGrRC2eCmjeG1tLLHIYfpYJABokqSGyMcXjm96AFA==",
      "dev": true,
      "requires": {
        "chalk": "^4.1.0",
        "date-fns": "^2.29.1",
        "lodash": "^4.17.21",
        "rxjs": "^7.0.0",
        "shell-quote": "^1.7.3",
        "spawn-command": "^0.0.2-1",
        "supports-color": "^8.1.0",
        "tree-kill": "^1.2.2",
        "yargs": "^17.3.1"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "chalk": {
          "version": "4.1.2",
          "dev": true,
          "requires": {
            "ansi-styles": "^4.1.0",
            "supports-color": "^7.1.0"
          },
          "dependencies": {
            "supports-color": {
              "version": "7.2.0",
              "dev": true,
              "requires": {
                "has-flag": "^4.0.0"
              }
            }
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "dev": true
        },
        "has-flag": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "console-control-strings": {
      "version": "1.1.0",
      "dev": true
    },
    "convert-source-map": {
      "version": "1.8.0",
      "dev": true,
      "requires": {
        "safe-buffer": "~5.1.1"
      }
    },
    "copy-webpack-plugin": {
      "version": "11.0.0",
      "resolved": "https://registry.npmjs.org/copy-webpack-plugin/-/copy-webpack-plugin-11.0.0.tgz",
      "integrity": "sha512-fX2MWpamkW0hZxMEg0+mYnA40LTosOSa5TqZ9GYIBzyJa9C3QUaMPSE2xAi/buNr8u89SfD9wHSQVBzrRa/SOQ==",
      "dev": true,
      "requires": {
        "fast-glob": "^3.2.11",
        "glob-parent": "^6.0.1",
        "globby": "^13.1.1",
        "normalize-path": "^3.0.0",
        "schema-utils": "^4.0.0",
        "serialize-javascript": "^6.0.0"
      },
      "dependencies": {
        "ajv": {
          "version": "8.11.0",
          "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.11.0.tgz",
          "integrity": "sha512-wGgprdCvMalC0BztXvitD2hC04YffAvtsUn93JbGXYLAtCUO4xd17mCCZQxUOItiBwZvJScWo8NIvQMQ71rdpg==",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.1",
            "json-schema-traverse": "^1.0.0",
            "require-from-string": "^2.0.2",
            "uri-js": "^4.2.2"
          }
        },
        "ajv-keywords": {
          "version": "5.1.0",
          "resolved": "https://registry.npmjs.org/ajv-keywords/-/ajv-keywords-5.1.0.tgz",
          "integrity": "sha512-YCS/JNFAUyr5vAuhk1DWm1CBxRHW9LbJ2ozWeemrIqpbsqKjHVxYPyi5GC0rjZIT5JxJ3virVTS8wk4i/Z+krw==",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.3"
          }
        },
        "json-schema-traverse": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
          "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
          "dev": true
        },
        "schema-utils": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/schema-utils/-/schema-utils-4.0.0.tgz",
          "integrity": "sha512-1edyXKgh6XnJsJSQ8mKWXnN/BVaIbFMLpouRUrXgVq7WYne5kw3MW7UPhO44uRXQSIpTSXoJbmrR2X0w9kUTyg==",
          "dev": true,
          "requires": {
            "@types/json-schema": "^7.0.9",
            "ajv": "^8.8.0",
            "ajv-formats": "^2.1.1",
            "ajv-keywords": "^5.0.0"
          }
        }
      }
    },
    "core-js": {
      "version": "3.25.5",
      "resolved": "https://registry.npmjs.org/core-js/-/core-js-3.25.5.tgz",
      "integrity": "sha512-nbm6eZSjm+ZuBQxCUPQKQCoUEfFOXjUZ8dTTyikyKaWrTYmAVbykQfwsKE5dBK88u3QCkCrzsx/PPlKfhsvgpw==",
      "dev": true
    },
    "core-js-compat": {
      "version": "3.25.5",
      "resolved": "https://registry.npmjs.org/core-js-compat/-/core-js-compat-3.25.5.tgz",
      "integrity": "sha512-ovcyhs2DEBUIE0MGEKHP4olCUW/XYte3Vroyxuh38rD1wAO4dHohsovUC4eAOuzFxE6b+RXvBU3UZ9o0YhUTkA==",
      "dev": true,
      "requires": {
        "browserslist": "^4.21.4"
      }
    },
    "core-util-is": {
      "version": "1.0.2",
      "dev": true
    },
    "cosmiconfig": {
      "version": "7.0.1",
      "dev": true,
      "requires": {
        "@types/parse-json": "^4.0.0",
        "import-fresh": "^3.2.1",
        "parse-json": "^5.0.0",
        "path-type": "^4.0.0",
        "yaml": "^1.10.0"
      }
    },
    "create-require": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/create-require/-/create-require-1.1.1.tgz",
      "integrity": "sha512-dcKFX3jn0MpIaXjisoRvexIJVEKzaq7z2rZKxf+MSr9TkdmHmsU4m2lcLojrj/FHl8mk5VxMmYA+ftRkP/3oKQ==",
      "dev": true
    },
    "cross-spawn": {
      "version": "7.0.3",
      "dev": true,
      "requires": {
        "path-key": "^3.1.0",
        "shebang-command": "^2.0.0",
        "which": "^2.0.1"
      }
    },
    "css-blank-pseudo": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/css-blank-pseudo/-/css-blank-pseudo-3.0.3.tgz",
      "integrity": "sha512-VS90XWtsHGqoM0t4KpH053c4ehxZ2E6HtGI7x68YFV0pTo/QmkV/YFA+NnlvK8guxZVNWGQhVNJGC39Q8XF4OQ==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.9"
      }
    },
    "css-declaration-sorter": {
      "version": "6.3.1",
      "resolved": "https://registry.npmjs.org/css-declaration-sorter/-/css-declaration-sorter-6.3.1.tgz",
      "integrity": "sha512-fBffmak0bPAnyqc/HO8C3n2sHrp9wcqQz6ES9koRF2/mLOVAx9zIQ3Y7R29sYCteTPqMCwns4WYQoCX91Xl3+w==",
      "dev": true,
      "requires": {}
    },
    "css-functions-list": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/css-functions-list/-/css-functions-list-3.1.0.tgz",
      "integrity": "sha512-/9lCvYZaUbBGvYUgYGFJ4dcYiyqdhSjG7IPVluoV8A1ILjkF7ilmhp1OGUz8n+nmBcu0RNrQAzgD8B6FJbrt2w==",
      "dev": true
    },
    "css-has-pseudo": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/css-has-pseudo/-/css-has-pseudo-3.0.4.tgz",
      "integrity": "sha512-Vse0xpR1K9MNlp2j5w1pgWIJtm1a8qS0JwS9goFYcImjlHEmywP9VUF05aGBXzGpDJF86QXk4L0ypBmwPhGArw==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.9"
      }
    },
    "css-loader": {
      "version": "6.7.1",
      "resolved": "https://registry.npmjs.org/css-loader/-/css-loader-6.7.1.tgz",
      "integrity": "sha512-yB5CNFa14MbPJcomwNh3wLThtkZgcNyI2bNMRt8iE5Z8Vwl7f8vQXFAzn2HDOJvtDq2NTZBUGMSUNNyrv3/+cw==",
      "dev": true,
      "requires": {
        "icss-utils": "^5.1.0",
        "postcss": "^8.4.7",
        "postcss-modules-extract-imports": "^3.0.0",
        "postcss-modules-local-by-default": "^4.0.0",
        "postcss-modules-scope": "^3.0.0",
        "postcss-modules-values": "^4.0.0",
        "postcss-value-parser": "^4.2.0",
        "semver": "^7.3.5"
      },
      "dependencies": {
        "semver": {
          "version": "7.3.5",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        }
      }
    },
    "css-prefers-color-scheme": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/css-prefers-color-scheme/-/css-prefers-color-scheme-6.0.3.tgz",
      "integrity": "sha512-4BqMbZksRkJQx2zAjrokiGMd07RqOa2IxIrrN10lyBe9xhn9DEvjUK79J6jkeiv9D9hQFXKb6g1jwU62jziJZA==",
      "dev": true,
      "requires": {}
    },
    "css-select": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/css-select/-/css-select-4.3.0.tgz",
      "integrity": "sha512-wPpOYtnsVontu2mODhA19JrqWxNsfdatRKd64kmpRbQgh1KtItko5sTnEpPdpSaJszTOhEMlF/RPz28qj4HqhQ==",
      "dev": true,
      "requires": {
        "boolbase": "^1.0.0",
        "css-what": "^6.0.1",
        "domhandler": "^4.3.1",
        "domutils": "^2.8.0",
        "nth-check": "^2.0.1"
      }
    },
    "css-tree": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/css-tree/-/css-tree-1.1.3.tgz",
      "integrity": "sha512-tRpdppF7TRazZrjJ6v3stzv93qxRcSsFmW6cX0Zm2NVKpxE1WV1HblnghVv9TreireHkqI/VDEsfolRF1p6y7Q==",
      "dev": true,
      "requires": {
        "mdn-data": "2.0.14",
        "source-map": "^0.6.1"
      },
      "dependencies": {
        "source-map": {
          "version": "0.6.1",
          "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
          "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
          "dev": true
        }
      }
    },
    "css-what": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/css-what/-/css-what-6.1.0.tgz",
      "integrity": "sha512-HTUrgRJ7r4dsZKU6GjmpfRK1O76h97Z8MfS1G0FozR+oF2kG6Vfe8JE6zwrkbxigziPHinCJ+gCPjA9EaBDtRw==",
      "dev": true
    },
    "cssdb": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/cssdb/-/cssdb-7.0.1.tgz",
      "integrity": "sha512-pT3nzyGM78poCKLAEy2zWIVX2hikq6dIrjuZzLV98MumBg+xMTNYfHx7paUlfiRTgg91O/vR889CIf+qiv79Rw==",
      "dev": true
    },
    "cssesc": {
      "version": "3.0.0",
      "dev": true
    },
    "cssnano": {
      "version": "5.1.13",
      "resolved": "https://registry.npmjs.org/cssnano/-/cssnano-5.1.13.tgz",
      "integrity": "sha512-S2SL2ekdEz6w6a2epXn4CmMKU4K3KpcyXLKfAYc9UQQqJRkD/2eLUG0vJ3Db/9OvO5GuAdgXw3pFbR6abqghDQ==",
      "dev": true,
      "requires": {
        "cssnano-preset-default": "^5.2.12",
        "lilconfig": "^2.0.3",
        "yaml": "^1.10.2"
      }
    },
    "cssnano-preset-default": {
      "version": "5.2.12",
      "resolved": "https://registry.npmjs.org/cssnano-preset-default/-/cssnano-preset-default-5.2.12.tgz",
      "integrity": "sha512-OyCBTZi+PXgylz9HAA5kHyoYhfGcYdwFmyaJzWnzxuGRtnMw/kR6ilW9XzlzlRAtB6PLT/r+prYgkef7hngFew==",
      "dev": true,
      "requires": {
        "css-declaration-sorter": "^6.3.0",
        "cssnano-utils": "^3.1.0",
        "postcss-calc": "^8.2.3",
        "postcss-colormin": "^5.3.0",
        "postcss-convert-values": "^5.1.2",
        "postcss-discard-comments": "^5.1.2",
        "postcss-discard-duplicates": "^5.1.0",
        "postcss-discard-empty": "^5.1.1",
        "postcss-discard-overridden": "^5.1.0",
        "postcss-merge-longhand": "^5.1.6",
        "postcss-merge-rules": "^5.1.2",
        "postcss-minify-font-values": "^5.1.0",
        "postcss-minify-gradients": "^5.1.1",
        "postcss-minify-params": "^5.1.3",
        "postcss-minify-selectors": "^5.2.1",
        "postcss-normalize-charset": "^5.1.0",
        "postcss-normalize-display-values": "^5.1.0",
        "postcss-normalize-positions": "^5.1.1",
        "postcss-normalize-repeat-style": "^5.1.1",
        "postcss-normalize-string": "^5.1.0",
        "postcss-normalize-timing-functions": "^5.1.0",
        "postcss-normalize-unicode": "^5.1.0",
        "postcss-normalize-url": "^5.1.0",
        "postcss-normalize-whitespace": "^5.1.1",
        "postcss-ordered-values": "^5.1.3",
        "postcss-reduce-initial": "^5.1.0",
        "postcss-reduce-transforms": "^5.1.0",
        "postcss-svgo": "^5.1.0",
        "postcss-unique-selectors": "^5.1.1"
      }
    },
    "cssnano-utils": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/cssnano-utils/-/cssnano-utils-3.1.0.tgz",
      "integrity": "sha512-JQNR19/YZhz4psLX/rQ9M83e3z2Wf/HdJbryzte4a3NSuafyp9w/I4U+hx5C2S9g41qlstH7DEWnZaaj83OuEA==",
      "dev": true,
      "requires": {}
    },
    "csso": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/csso/-/csso-4.2.0.tgz",
      "integrity": "sha512-wvlcdIbf6pwKEk7vHj8/Bkc0B4ylXZruLvOgs9doS5eOsOpuodOV2zJChSpkp+pRpYQLQMeF04nr3Z68Sta9jA==",
      "dev": true,
      "requires": {
        "css-tree": "^1.1.2"
      }
    },
    "dashdash": {
      "version": "1.14.1",
      "dev": true,
      "requires": {
        "assert-plus": "^1.0.0"
      }
    },
    "date-fns": {
      "version": "2.29.3",
      "resolved": "https://registry.npmjs.org/date-fns/-/date-fns-2.29.3.tgz",
      "integrity": "sha512-dDCnyH2WnnKusqvZZ6+jA1O51Ibt8ZMRNkDZdyAyK4YfbDwa/cEmuztzG5pk6hqlp9aSBPYcjOlktquahGwGeA==",
      "dev": true
    },
    "debug": {
      "version": "4.3.4",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.3.4.tgz",
      "integrity": "sha512-PRWFHuSU3eDtQJPvnNY7Jcket1j0t5OuOsFzPPzsekD52Zl8qUfFIPEiswXqIvHWGVHOgX+7G/vCNNhehwxfkQ==",
      "dev": true,
      "requires": {
        "ms": "2.1.2"
      }
    },
    "decamelize": {
      "version": "1.2.0",
      "dev": true
    },
    "decamelize-keys": {
      "version": "1.1.0",
      "dev": true,
      "requires": {
        "decamelize": "^1.1.0",
        "map-obj": "^1.0.0"
      },
      "dependencies": {
        "map-obj": {
          "version": "1.0.1",
          "dev": true
        }
      }
    },
    "deep-is": {
      "version": "0.1.4",
      "dev": true
    },
    "define-properties": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/define-properties/-/define-properties-1.1.4.tgz",
      "integrity": "sha512-uckOqKcfaVvtBdsVkdPv3XjveQJsNQqmhXgRi8uhvWWuPYZCNlzT8qAyblUgNoXdHdjMTzAqeGjAoli8f+bzPA==",
      "dev": true,
      "requires": {
        "has-property-descriptors": "^1.0.0",
        "object-keys": "^1.1.1"
      }
    },
    "delayed-stream": {
      "version": "1.0.0",
      "dev": true
    },
    "delegates": {
      "version": "1.0.0",
      "dev": true
    },
    "depd": {
      "version": "1.1.2",
      "dev": true
    },
    "diff": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/diff/-/diff-5.0.0.tgz",
      "integrity": "sha512-/VTCrvm5Z0JGty/BWHljh+BAiw3IK+2j87NGMu8Nwc/f48WoDAC395uomO9ZD117ZOBaHmkX1oyLvkVM/aIT3w==",
      "dev": true
    },
    "dir-glob": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/dir-glob/-/dir-glob-3.0.1.tgz",
      "integrity": "sha512-WkrWp9GR4KXfKGYzOLmTuGVi1UWFfws377n9cc55/tb6DuqyF6pcQ5AbiHEshaDpY9v6oaSr2XCDidGmMwdzIA==",
      "dev": true,
      "requires": {
        "path-type": "^4.0.0"
      }
    },
    "doctrine": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "esutils": "^2.0.2"
      }
    },
    "dom-serializer": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/dom-serializer/-/dom-serializer-1.4.1.tgz",
      "integrity": "sha512-VHwB3KfrcOOkelEG2ZOfxqLZdfkil8PtJi4P8N2MMXucZq2yLp75ClViUlOVwyoHEDjYU433Aq+5zWP61+RGag==",
      "dev": true,
      "requires": {
        "domelementtype": "^2.0.1",
        "domhandler": "^4.2.0",
        "entities": "^2.0.0"
      }
    },
    "domelementtype": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/domelementtype/-/domelementtype-2.3.0.tgz",
      "integrity": "sha512-OLETBj6w0OsagBwdXnPdN0cnMfF9opN69co+7ZrbfPGrdpPVNBUj02spi6B1N7wChLQiPn4CSH/zJvXw56gmHw==",
      "dev": true
    },
    "domhandler": {
      "version": "4.3.1",
      "resolved": "https://registry.npmjs.org/domhandler/-/domhandler-4.3.1.tgz",
      "integrity": "sha512-GrwoxYN+uWlzO8uhUXRl0P+kHE4GtVPfYzVLcUxPL7KNdHKj66vvlhiweIHqYYXWlw+T8iLMp42Lm67ghw4WMQ==",
      "dev": true,
      "requires": {
        "domelementtype": "^2.2.0"
      }
    },
    "domutils": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/domutils/-/domutils-2.8.0.tgz",
      "integrity": "sha512-w96Cjofp72M5IIhpjgobBimYEfoPjx1Vx0BSX9P30WBdZW2WIKU0T1Bd0kz2eNZ9ikjKgHbEyKx8BB6H1L3h3A==",
      "dev": true,
      "requires": {
        "dom-serializer": "^1.0.1",
        "domelementtype": "^2.2.0",
        "domhandler": "^4.2.0"
      }
    },
    "ecc-jsbn": {
      "version": "0.1.2",
      "dev": true,
      "requires": {
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "electron-to-chromium": {
      "version": "1.4.275",
      "resolved": "https://registry.npmjs.org/electron-to-chromium/-/electron-to-chromium-1.4.275.tgz",
      "integrity": "sha512-aJeQQ+Hl9Jyyzv4chBqYJwmVRY46N5i2BEX5Cuyk/5gFCUZ5F3i7Hnba6snZftWla7Gglwc5pIgcd+E7cW+rPg==",
      "dev": true
    },
    "emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "dev": true
    },
    "emojis-list": {
      "version": "3.0.0",
      "dev": true
    },
    "encoding": {
      "version": "0.1.13",
      "dev": true,
      "optional": true,
      "requires": {
        "iconv-lite": "^0.6.2"
      }
    },
    "enhanced-resolve": {
      "version": "5.10.0",
      "resolved": "https://registry.npmjs.org/enhanced-resolve/-/enhanced-resolve-5.10.0.tgz",
      "integrity": "sha512-T0yTFjdpldGY8PmuXXR0PyQ1ufZpEGiHVrp7zHKB7jdR4qlmZHhONVM5AQOAWXuF/w3dnHbEQVrNptJgt7F+cQ==",
      "dev": true,
      "requires": {
        "graceful-fs": "^4.2.4",
        "tapable": "^2.2.0"
      }
    },
    "entities": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/entities/-/entities-2.2.0.tgz",
      "integrity": "sha512-p92if5Nz619I0w+akJrLZH0MX0Pb5DX39XOwQTtXSdQQOaYH03S1uIQp4mhOZtAXrxq4ViO67YTiLBo2638o9A==",
      "dev": true
    },
    "env-paths": {
      "version": "2.2.1",
      "dev": true
    },
    "envinfo": {
      "version": "7.8.1",
      "resolved": "https://registry.npmjs.org/envinfo/-/envinfo-7.8.1.tgz",
      "integrity": "sha512-/o+BXHmB7ocbHEAs6F2EnG0ogybVVUdkRunTT2glZU9XAaGmhqskrvKwqXuDfNjEO0LZKWdejEEpnq8aM0tOaw==",
      "dev": true
    },
    "err-code": {
      "version": "2.0.3",
      "dev": true
    },
    "error-ex": {
      "version": "1.3.2",
      "dev": true,
      "requires": {
        "is-arrayish": "^0.2.1"
      }
    },
    "es-module-lexer": {
      "version": "0.9.3",
      "dev": true
    },
    "escalade": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.1.1.tgz",
      "integrity": "sha512-k0er2gUkLf8O0zKJiAhmkTnJlTvINGv7ygDNPbeIsX/TJjGJZHuh9B2UxbsaEkmlEo9MfhrSzmhIlhRlI2GXnw==",
      "dev": true
    },
    "escape-string-regexp": {
      "version": "1.0.5",
      "dev": true
    },
    "eslint": {
      "version": "8.24.0",
      "resolved": "https://registry.npmjs.org/eslint/-/eslint-8.24.0.tgz",
      "integrity": "sha512-dWFaPhGhTAiPcCgm3f6LI2MBWbogMnTJzFBbhXVRQDJPkr9pGZvVjlVfXd+vyDcWPA2Ic9L2AXPIQM0+vk/cSQ==",
      "dev": true,
      "requires": {
        "@eslint/eslintrc": "^1.3.2",
        "@humanwhocodes/config-array": "^0.10.5",
        "@humanwhocodes/gitignore-to-minimatch": "^1.0.2",
        "@humanwhocodes/module-importer": "^1.0.1",
        "ajv": "^6.10.0",
        "chalk": "^4.0.0",
        "cross-spawn": "^7.0.2",
        "debug": "^4.3.2",
        "doctrine": "^3.0.0",
        "escape-string-regexp": "^4.0.0",
        "eslint-scope": "^7.1.1",
        "eslint-utils": "^3.0.0",
        "eslint-visitor-keys": "^3.3.0",
        "espree": "^9.4.0",
        "esquery": "^1.4.0",
        "esutils": "^2.0.2",
        "fast-deep-equal": "^3.1.3",
        "file-entry-cache": "^6.0.1",
        "find-up": "^5.0.0",
        "glob-parent": "^6.0.1",
        "globals": "^13.15.0",
        "globby": "^11.1.0",
        "grapheme-splitter": "^1.0.4",
        "ignore": "^5.2.0",
        "import-fresh": "^3.0.0",
        "imurmurhash": "^0.1.4",
        "is-glob": "^4.0.0",
        "js-sdsl": "^4.1.4",
        "js-yaml": "^4.1.0",
        "json-stable-stringify-without-jsonify": "^1.0.1",
        "levn": "^0.4.1",
        "lodash.merge": "^4.6.2",
        "minimatch": "^3.1.2",
        "natural-compare": "^1.4.0",
        "optionator": "^0.9.1",
        "regexpp": "^3.2.0",
        "strip-ansi": "^6.0.1",
        "strip-json-comments": "^3.1.0",
        "text-table": "^0.2.0"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "chalk": {
          "version": "4.1.2",
          "dev": true,
          "requires": {
            "ansi-styles": "^4.1.0",
            "supports-color": "^7.1.0"
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "dev": true
        },
        "escape-string-regexp": {
          "version": "4.0.0",
          "dev": true
        },
        "find-up": {
          "version": "5.0.0",
          "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
          "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
          "dev": true,
          "requires": {
            "locate-path": "^6.0.0",
            "path-exists": "^4.0.0"
          }
        },
        "globals": {
          "version": "13.17.0",
          "resolved": "https://registry.npmjs.org/globals/-/globals-13.17.0.tgz",
          "integrity": "sha512-1C+6nQRb1GwGMKm2dH/E7enFAMxGTmGI7/dEdhy/DNelv85w9B72t3uc5frtMNXIbzrarJJ/lTCjcaZwbLJmyw==",
          "dev": true,
          "requires": {
            "type-fest": "^0.20.2"
          }
        },
        "globby": {
          "version": "11.1.0",
          "resolved": "https://registry.npmjs.org/globby/-/globby-11.1.0.tgz",
          "integrity": "sha512-jhIXaOzy1sb8IyocaruWSn1TjmnBVs8Ayhcy83rmxNJ8q2uWKCAj3CnJY+KpGSXCueAPc0i05kVvVKtP1t9S3g==",
          "dev": true,
          "requires": {
            "array-union": "^2.1.0",
            "dir-glob": "^3.0.1",
            "fast-glob": "^3.2.9",
            "ignore": "^5.2.0",
            "merge2": "^1.4.1",
            "slash": "^3.0.0"
          }
        },
        "has-flag": {
          "version": "4.0.0",
          "dev": true
        },
        "locate-path": {
          "version": "6.0.0",
          "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
          "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
          "dev": true,
          "requires": {
            "p-locate": "^5.0.0"
          }
        },
        "minimatch": {
          "version": "3.1.2",
          "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.2.tgz",
          "integrity": "sha512-J7p63hRiAjw1NDEww1W7i37+ByIrOWO5XQQAzZ3VOcL0PNybwpfmV/N05zFAzwQ9USyEcX6t3UO+K5aqBQOIHw==",
          "dev": true,
          "requires": {
            "brace-expansion": "^1.1.7"
          }
        },
        "p-limit": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
          "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
          "dev": true,
          "requires": {
            "yocto-queue": "^0.1.0"
          }
        },
        "p-locate": {
          "version": "5.0.0",
          "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
          "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
          "dev": true,
          "requires": {
            "p-limit": "^3.0.2"
          }
        },
        "slash": {
          "version": "3.0.0",
          "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
          "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
          "dev": true
        },
        "supports-color": {
          "version": "7.2.0",
          "dev": true,
          "requires": {
            "has-flag": "^4.0.0"
          }
        },
        "type-fest": {
          "version": "0.20.2",
          "resolved": "https://registry.npmjs.org/type-fest/-/type-fest-0.20.2.tgz",
          "integrity": "sha512-Ne+eE4r0/iWnpAxD852z3A+N0Bt5RN//NjJwRd2VFHEmrywxf5vsZlh4R6lixl6B+wz/8d+maTSAkN1FIkI3LQ==",
          "dev": true
        }
      }
    },
    "eslint-config-google": {
      "version": "0.14.0",
      "dev": true,
      "requires": {}
    },
    "eslint-scope": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/eslint-scope/-/eslint-scope-7.1.1.tgz",
      "integrity": "sha512-QKQM/UXpIiHcLqJ5AOyIW7XZmzjkzQXYE54n1++wb0u9V/abW3l9uQnxX8Z5Xd18xyKIMTUAyQ0k1e8pz6LUrw==",
      "dev": true,
      "requires": {
        "esrecurse": "^4.3.0",
        "estraverse": "^5.2.0"
      }
    },
    "eslint-utils": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "eslint-visitor-keys": "^2.0.0"
      },
      "dependencies": {
        "eslint-visitor-keys": {
          "version": "2.1.0",
          "dev": true
        }
      }
    },
    "eslint-visitor-keys": {
      "version": "3.3.0",
      "resolved": "https://registry.npmjs.org/eslint-visitor-keys/-/eslint-visitor-keys-3.3.0.tgz",
      "integrity": "sha512-mQ+suqKJVyeuwGYHAdjMFqjCyfl8+Ldnxuyp3ldiMBFKkvytrXUZWaiPCEav8qDHKty44bD+qV1IP4T+w+xXRA==",
      "dev": true
    },
    "espree": {
      "version": "9.4.0",
      "resolved": "https://registry.npmjs.org/espree/-/espree-9.4.0.tgz",
      "integrity": "sha512-DQmnRpLj7f6TgN/NYb0MTzJXL+vJF9h3pHy4JhCIs3zwcgez8xmGg3sXHcEO97BrmO2OSvCwMdfdlyl+E9KjOw==",
      "dev": true,
      "requires": {
        "acorn": "^8.8.0",
        "acorn-jsx": "^5.3.2",
        "eslint-visitor-keys": "^3.3.0"
      }
    },
    "esquery": {
      "version": "1.4.0",
      "dev": true,
      "requires": {
        "estraverse": "^5.1.0"
      }
    },
    "esrecurse": {
      "version": "4.3.0",
      "dev": true,
      "requires": {
        "estraverse": "^5.2.0"
      }
    },
    "estraverse": {
      "version": "5.3.0",
      "dev": true
    },
    "esutils": {
      "version": "2.0.3",
      "dev": true
    },
    "events": {
      "version": "3.3.0",
      "dev": true
    },
    "extend": {
      "version": "3.0.2",
      "dev": true
    },
    "extsprintf": {
      "version": "1.3.0",
      "dev": true
    },
    "fast-deep-equal": {
      "version": "3.1.3",
      "dev": true
    },
    "fast-glob": {
      "version": "3.2.12",
      "resolved": "https://registry.npmjs.org/fast-glob/-/fast-glob-3.2.12.tgz",
      "integrity": "sha512-DVj4CQIYYow0BlaelwK1pHl5n5cRSJfM60UA0zK891sVInoPri2Ekj7+e1CT3/3qxXenpI+nBBmQAcJPJgaj4w==",
      "dev": true,
      "requires": {
        "@nodelib/fs.stat": "^2.0.2",
        "@nodelib/fs.walk": "^1.2.3",
        "glob-parent": "^5.1.2",
        "merge2": "^1.3.0",
        "micromatch": "^4.0.4"
      },
      "dependencies": {
        "glob-parent": {
          "version": "5.1.2",
          "resolved": "https://registry.npmjs.org/glob-parent/-/glob-parent-5.1.2.tgz",
          "integrity": "sha512-AOIgSQCepiJYwP3ARnGx+5VnTu2HBYdzbGP45eLw1vr3zB3vZLeyed1sC9hnbcOc9/SrMyM5RPQrkGz4aS9Zow==",
          "dev": true,
          "requires": {
            "is-glob": "^4.0.1"
          }
        }
      }
    },
    "fast-json-stable-stringify": {
      "version": "2.1.0",
      "dev": true
    },
    "fast-levenshtein": {
      "version": "2.0.6",
      "dev": true
    },
    "fastest-levenshtein": {
      "version": "1.0.16",
      "resolved": "https://registry.npmjs.org/fastest-levenshtein/-/fastest-levenshtein-1.0.16.tgz",
      "integrity": "sha512-eRnCtTTtGZFpQCwhJiUOuxPQWRXVKYDn0b2PeHfXL6/Zi53SLAzAHfVhVWK2AryC/WH05kGfxhFIPvTF0SXQzg==",
      "dev": true
    },
    "fastq": {
      "version": "1.13.0",
      "resolved": "https://registry.npmjs.org/fastq/-/fastq-1.13.0.tgz",
      "integrity": "sha512-YpkpUnK8od0o1hmeSc7UUs/eB/vIPWJYjKck2QKIzAf71Vm1AAQ3EbuZB3g2JIy+pg+ERD0vqI79KyZiB2e2Nw==",
      "dev": true,
      "requires": {
        "reusify": "^1.0.4"
      }
    },
    "file-entry-cache": {
      "version": "6.0.1",
      "dev": true,
      "requires": {
        "flat-cache": "^3.0.4"
      }
    },
    "fill-range": {
      "version": "7.0.1",
      "dev": true,
      "requires": {
        "to-regex-range": "^5.0.1"
      }
    },
    "find-cache-dir": {
      "version": "3.3.2",
      "dev": true,
      "requires": {
        "commondir": "^1.0.1",
        "make-dir": "^3.0.2",
        "pkg-dir": "^4.1.0"
      }
    },
    "find-up": {
      "version": "4.1.0",
      "dev": true,
      "requires": {
        "locate-path": "^5.0.0",
        "path-exists": "^4.0.0"
      }
    },
    "flat": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/flat/-/flat-5.0.2.tgz",
      "integrity": "sha512-b6suED+5/3rTpUBdG1gupIl8MPFCAMA0QXwmljLhvCUKcUvdE4gWky9zpuGCcXHOsz4J9wPGNWq6OKpmIzz3hQ==",
      "dev": true
    },
    "flat-cache": {
      "version": "3.0.4",
      "dev": true,
      "requires": {
        "flatted": "^3.1.0",
        "rimraf": "^3.0.2"
      }
    },
    "flatted": {
      "version": "3.2.4",
      "dev": true
    },
    "forever-agent": {
      "version": "0.6.1",
      "dev": true
    },
    "form-data": {
      "version": "2.3.3",
      "dev": true,
      "requires": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.6",
        "mime-types": "^2.1.12"
      }
    },
    "foundation-sites": {
      "version": "6.7.4",
      "resolved": "https://registry.npmjs.org/foundation-sites/-/foundation-sites-6.7.4.tgz",
      "integrity": "sha512-2QPaZJ0Od0DyklhQyKC3zPbr8AAUXSkr1scZJrQTgj/KTLresuCgUBfi7ft32NlOWhuqVXisjOgTE8N5EPS3cg==",
      "requires": {}
    },
    "fraction.js": {
      "version": "4.2.0",
      "resolved": "https://registry.npmjs.org/fraction.js/-/fraction.js-4.2.0.tgz",
      "integrity": "sha512-MhLuK+2gUcnZe8ZHlaaINnQLl0xRIGRfcGk2yl8xoQAfHrSsL3rYu6FCmBdkdbhc9EPlwyGHewaRsvwRMJtAlA==",
      "dev": true
    },
    "fs-minipass": {
      "version": "2.1.0",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0"
      }
    },
    "fs.realpath": {
      "version": "1.0.0",
      "dev": true
    },
    "fsevents": {
      "version": "2.3.2",
      "dev": true,
      "optional": true
    },
    "function-bind": {
      "version": "1.1.1",
      "dev": true
    },
    "gauge": {
      "version": "4.0.0",
      "dev": true,
      "requires": {
        "ansi-regex": "^5.0.1",
        "aproba": "^1.0.3 || ^2.0.0",
        "color-support": "^1.1.2",
        "console-control-strings": "^1.0.0",
        "has-unicode": "^2.0.1",
        "signal-exit": "^3.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "wide-align": "^1.1.2"
      }
    },
    "gaze": {
      "version": "1.1.3",
      "dev": true,
      "requires": {
        "globule": "^1.0.0"
      }
    },
    "gensync": {
      "version": "1.0.0-beta.2",
      "dev": true
    },
    "get-caller-file": {
      "version": "2.0.5",
      "dev": true
    },
    "get-intrinsic": {
      "version": "1.1.3",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.1.3.tgz",
      "integrity": "sha512-QJVz1Tj7MS099PevUG5jvnt9tSkXN8K14dxQlikJuPt4uD9hHAHjLyLBiLR5zELelBdD9QNRAXZzsJx0WaDL9A==",
      "dev": true,
      "requires": {
        "function-bind": "^1.1.1",
        "has": "^1.0.3",
        "has-symbols": "^1.0.3"
      }
    },
    "getpass": {
      "version": "0.1.7",
      "dev": true,
      "requires": {
        "assert-plus": "^1.0.0"
      }
    },
    "glob": {
      "version": "7.2.0",
      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.0.tgz",
      "integrity": "sha512-lmLf6gtyrPq8tTjSmrO94wBeQbFR3HbLHbuyD69wuyQkImp2hWqMGB47OX65FBkPffO641IP9jWa1z4ivqG26Q==",
      "dev": true,
      "requires": {
        "fs.realpath": "^1.0.0",
        "inflight": "^1.0.4",
        "inherits": "2",
        "minimatch": "^3.0.4",
        "once": "^1.3.0",
        "path-is-absolute": "^1.0.0"
      }
    },
    "glob-parent": {
      "version": "6.0.2",
      "dev": true,
      "requires": {
        "is-glob": "^4.0.3"
      }
    },
    "glob-to-regexp": {
      "version": "0.4.1",
      "resolved": "https://registry.npmjs.org/glob-to-regexp/-/glob-to-regexp-0.4.1.tgz",
      "integrity": "sha512-lkX1HJXwyMcprw/5YUZc2s7DrpAiHB21/V+E1rHUrVNokkvB6bqMzT0VfV6/86ZNabt1k14YOIaT7nDvOX3Iiw==",
      "dev": true
    },
    "global-modules": {
      "version": "2.0.0",
      "dev": true,
      "requires": {
        "global-prefix": "^3.0.0"
      }
    },
    "global-prefix": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "ini": "^1.3.5",
        "kind-of": "^6.0.2",
        "which": "^1.3.1"
      },
      "dependencies": {
        "which": {
          "version": "1.3.1",
          "dev": true,
          "requires": {
            "isexe": "^2.0.0"
          }
        }
      }
    },
    "globals": {
      "version": "11.12.0",
      "resolved": "https://registry.npmjs.org/globals/-/globals-11.12.0.tgz",
      "integrity": "sha512-WOBp/EEGUiIsJSp7wcv/y6MO+lV9UoncWqxuFfm8eBwzWNgyfBd6Gz+IeKQ9jCmyhoH99g15M3T+QaVHFjizVA==",
      "dev": true
    },
    "globby": {
      "version": "13.1.2",
      "resolved": "https://registry.npmjs.org/globby/-/globby-13.1.2.tgz",
      "integrity": "sha512-LKSDZXToac40u8Q1PQtZihbNdTYSNMuWe+K5l+oa6KgDzSvVrHXlJy40hUP522RjAIoNLJYBJi7ow+rbFpIhHQ==",
      "dev": true,
      "requires": {
        "dir-glob": "^3.0.1",
        "fast-glob": "^3.2.11",
        "ignore": "^5.2.0",
        "merge2": "^1.4.1",
        "slash": "^4.0.0"
      }
    },
    "globjoin": {
      "version": "0.1.4",
      "dev": true
    },
    "globule": {
      "version": "1.3.3",
      "dev": true,
      "requires": {
        "glob": "~7.1.1",
        "lodash": "~4.17.10",
        "minimatch": "~3.0.2"
      },
      "dependencies": {
        "glob": {
          "version": "7.1.7",
          "resolved": "https://registry.npmjs.org/glob/-/glob-7.1.7.tgz",
          "integrity": "sha512-OvD9ENzPLbegENnYP5UUfJIirTg4+XwMWGaQfQTY0JenxNvvIKP3U3/tAQSPIu/lHxXYSZmpXlUHeqAIdKzBLQ==",
          "dev": true,
          "requires": {
            "fs.realpath": "^1.0.0",
            "inflight": "^1.0.4",
            "inherits": "2",
            "minimatch": "^3.0.4",
            "once": "^1.3.0",
            "path-is-absolute": "^1.0.0"
          }
        }
      }
    },
    "graceful-fs": {
      "version": "4.2.10",
      "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.10.tgz",
      "integrity": "sha512-9ByhssR2fPVsNZj478qUUbKfmL0+t5BDVyjShtyZZLiK7ZDAArFFfopyOTj0M05wE2tJPisA4iTnnXl2YoPvOA==",
      "dev": true
    },
    "grapheme-splitter": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/grapheme-splitter/-/grapheme-splitter-1.0.4.tgz",
      "integrity": "sha512-bzh50DW9kTPM00T8y4o8vQg89Di9oLJVLW/KaOGIXJWP/iqCN6WKYkbNOF04vFLJhwcpYUh9ydh/+5vpOqV4YQ==",
      "dev": true
    },
    "gsap": {
      "version": "3.11.3",
      "resolved": "https://registry.npmjs.org/gsap/-/gsap-3.11.3.tgz",
      "integrity": "sha512-xc/iIJy+LWiMbRa4IdMtdnnKa/7PXEK6NNzV71gdOYUVeTZN7UWnLU0fB7Hi1iwiz4ZZoYkBZPPYGg+2+zzFHA=="
    },
    "har-schema": {
      "version": "2.0.0",
      "dev": true
    },
    "har-validator": {
      "version": "5.1.5",
      "dev": true,
      "requires": {
        "ajv": "^6.12.3",
        "har-schema": "^2.0.0"
      }
    },
    "hard-rejection": {
      "version": "2.1.0",
      "dev": true
    },
    "has": {
      "version": "1.0.3",
      "dev": true,
      "requires": {
        "function-bind": "^1.1.1"
      }
    },
    "has-flag": {
      "version": "3.0.0",
      "dev": true
    },
    "has-property-descriptors": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/has-property-descriptors/-/has-property-descriptors-1.0.0.tgz",
      "integrity": "sha512-62DVLZGoiEBDHQyqG4w9xCuZ7eJEwNmJRWw2VY84Oedb7WFcA27fiEVe8oUQx9hAUJ4ekurquucTGwsyO1XGdQ==",
      "dev": true,
      "requires": {
        "get-intrinsic": "^1.1.1"
      }
    },
    "has-symbols": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.0.3.tgz",
      "integrity": "sha512-l3LCuF6MgDNwTDKkdYGEihYjt5pRPbEg46rtlmnSPlUbgmB8LOIrKJbYYFBSbnPaJexMKtiPO8hmeRjRz2Td+A==",
      "dev": true
    },
    "has-unicode": {
      "version": "2.0.1",
      "dev": true
    },
    "he": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/he/-/he-1.2.0.tgz",
      "integrity": "sha512-F/1DnUGPopORZi0ni+CvrCgHQ5FyEAHRLSApuYWMmrbSwoN2Mn/7k+Gl38gJnR7yyDZk6WLXwiGod1JOWNDKGw==",
      "dev": true
    },
    "hosted-git-info": {
      "version": "2.8.9",
      "resolved": "https://registry.npmjs.org/hosted-git-info/-/hosted-git-info-2.8.9.tgz",
      "integrity": "sha512-mxIDAb9Lsm6DoOJ7xH+5+X4y1LU/4Hi50L9C5sIswK3JzULS4bwk1FvjdBgvYR4bzT4tuUQiC15FE2f5HbLvYw==",
      "dev": true
    },
    "html-tags": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/html-tags/-/html-tags-3.2.0.tgz",
      "integrity": "sha512-vy7ClnArOZwCnqZgvv+ddgHgJiAFXe3Ge9ML5/mBctVJoUoYPCdxVucOywjDARn6CVoh3dRSFdPHy2sX80L0Wg==",
      "dev": true
    },
    "http-cache-semantics": {
      "version": "4.1.0",
      "dev": true
    },
    "http-proxy-agent": {
      "version": "4.0.1",
      "dev": true,
      "requires": {
        "@tootallnate/once": "1",
        "agent-base": "6",
        "debug": "4"
      }
    },
    "http-signature": {
      "version": "1.2.0",
      "dev": true,
      "requires": {
        "assert-plus": "^1.0.0",
        "jsprim": "^1.2.2",
        "sshpk": "^1.7.0"
      }
    },
    "https-proxy-agent": {
      "version": "5.0.0",
      "dev": true,
      "requires": {
        "agent-base": "6",
        "debug": "4"
      }
    },
    "humanize-ms": {
      "version": "1.2.1",
      "dev": true,
      "requires": {
        "ms": "^2.0.0"
      }
    },
    "iconv-lite": {
      "version": "0.6.3",
      "dev": true,
      "optional": true,
      "requires": {
        "safer-buffer": ">= 2.1.2 < 3.0.0"
      }
    },
    "icss-utils": {
      "version": "5.1.0",
      "dev": true,
      "requires": {}
    },
    "ignore": {
      "version": "5.2.0",
      "resolved": "https://registry.npmjs.org/ignore/-/ignore-5.2.0.tgz",
      "integrity": "sha512-CmxgYGiEPCLhfLnpPp1MoRmifwEIOgjcHXxOBjv7mY96c+eWScsOP9c112ZyLdWHi0FxHjI+4uVhKYp/gcdRmQ==",
      "dev": true
    },
    "immutable": {
      "version": "4.0.0",
      "dev": true
    },
    "import-fresh": {
      "version": "3.3.0",
      "dev": true,
      "requires": {
        "parent-module": "^1.0.0",
        "resolve-from": "^4.0.0"
      }
    },
    "import-lazy": {
      "version": "4.0.0",
      "dev": true
    },
    "import-local": {
      "version": "3.0.3",
      "dev": true,
      "requires": {
        "pkg-dir": "^4.2.0",
        "resolve-cwd": "^3.0.0"
      }
    },
    "imurmurhash": {
      "version": "0.1.4",
      "dev": true
    },
    "indent-string": {
      "version": "4.0.0",
      "dev": true
    },
    "infer-owner": {
      "version": "1.0.4",
      "dev": true
    },
    "inflight": {
      "version": "1.0.6",
      "dev": true,
      "requires": {
        "once": "^1.3.0",
        "wrappy": "1"
      }
    },
    "inherits": {
      "version": "2.0.4",
      "dev": true
    },
    "ini": {
      "version": "1.3.8",
      "dev": true
    },
    "interpret": {
      "version": "2.2.0",
      "dev": true
    },
    "ip": {
      "version": "1.1.5",
      "dev": true
    },
    "is-arrayish": {
      "version": "0.2.1",
      "dev": true
    },
    "is-binary-path": {
      "version": "2.1.0",
      "dev": true,
      "requires": {
        "binary-extensions": "^2.0.0"
      }
    },
    "is-core-module": {
      "version": "2.10.0",
      "resolved": "https://registry.npmjs.org/is-core-module/-/is-core-module-2.10.0.tgz",
      "integrity": "sha512-Erxj2n/LDAZ7H8WNJXd9tw38GYM3dv8rk8Zcs+jJuxYTW7sozH+SS8NtrSjVL1/vpLvWi1hxy96IzjJ3EHTJJg==",
      "dev": true,
      "requires": {
        "has": "^1.0.3"
      }
    },
    "is-extglob": {
      "version": "2.1.1",
      "dev": true
    },
    "is-glob": {
      "version": "4.0.3",
      "resolved": "https://registry.npmjs.org/is-glob/-/is-glob-4.0.3.tgz",
      "integrity": "sha512-xelSayHH36ZgE7ZWhli7pW34hNbNl8Ojv5KVmkJD4hBdD3th8Tfk9vYasLM+mXWOZhFkgZfxhLSnrwRr4elSSg==",
      "dev": true,
      "requires": {
        "is-extglob": "^2.1.1"
      }
    },
    "is-lambda": {
      "version": "1.0.1",
      "dev": true
    },
    "is-number": {
      "version": "7.0.0",
      "dev": true
    },
    "is-plain-obj": {
      "version": "1.1.0",
      "dev": true
    },
    "is-plain-object": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/is-plain-object/-/is-plain-object-5.0.0.tgz",
      "integrity": "sha512-VRSzKkbMm5jMDoKLbltAkFQ5Qr7VDiTFGXxYFXXowVj387GeGNOCsOH6Msy00SGZ3Fp84b1Naa1psqgcCIEP5Q==",
      "dev": true
    },
    "is-typedarray": {
      "version": "1.0.0",
      "dev": true
    },
    "is-unicode-supported": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/is-unicode-supported/-/is-unicode-supported-0.1.0.tgz",
      "integrity": "sha512-knxG2q4UC3u8stRGyAVJCOdxFmv5DZiRcdlIaAQXAbSfJya+OhopNotLQrstBhququ4ZpuKbDc/8S6mgXgPFPw==",
      "dev": true
    },
    "isarray": {
      "version": "1.0.0",
      "dev": true
    },
    "isexe": {
      "version": "2.0.0",
      "dev": true
    },
    "isobject": {
      "version": "3.0.1",
      "dev": true
    },
    "isstream": {
      "version": "0.1.2",
      "dev": true
    },
    "jest-worker": {
      "version": "27.4.5",
      "dev": true,
      "requires": {
        "@types/node": "*",
        "merge-stream": "^2.0.0",
        "supports-color": "^8.0.0"
      }
    },
    "jquery": {
      "version": "3.6.1",
      "resolved": "https://registry.npmjs.org/jquery/-/jquery-3.6.1.tgz",
      "integrity": "sha512-opJeO4nCucVnsjiXOE+/PcCgYw9Gwpvs/a6B1LL/lQhwWwpbVEVYDZ1FokFr8PRc7ghYlrFPuyHuiiDNTQxmcw=="
    },
    "js-base64": {
      "version": "2.6.4",
      "resolved": "https://registry.npmjs.org/js-base64/-/js-base64-2.6.4.tgz",
      "integrity": "sha512-pZe//GGmwJndub7ZghVHz7vjb2LgC1m8B07Au3eYqeqv9emhESByMXxaEgkUkEqJe87oBbSniGYoQNIBklc7IQ==",
      "dev": true
    },
    "js-sdsl": {
      "version": "4.1.5",
      "resolved": "https://registry.npmjs.org/js-sdsl/-/js-sdsl-4.1.5.tgz",
      "integrity": "sha512-08bOAKweV2NUC1wqTtf3qZlnpOX/R2DU9ikpjOHs0H+ibQv3zpncVQg6um4uYtRtrwIX8M4Nh3ytK4HGlYAq7Q==",
      "dev": true
    },
    "js-tokens": {
      "version": "4.0.0",
      "dev": true
    },
    "js-yaml": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/js-yaml/-/js-yaml-4.1.0.tgz",
      "integrity": "sha512-wpxZs9NoxZaJESJGIZTyDEaYpl0FKSA+FB9aJiyemKhMwkxQg63h4T1KJgUGHpTqPDNRcmmYLugrRjJlBtWvRA==",
      "dev": true,
      "requires": {
        "argparse": "^2.0.1"
      }
    },
    "jsbn": {
      "version": "0.1.1",
      "dev": true
    },
    "jsesc": {
      "version": "2.5.2",
      "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-2.5.2.tgz",
      "integrity": "sha512-OYu7XEzjkCQ3C5Ps3QIZsQfNpqoJyZZA99wd9aWd05NCtC5pWOkShK2mkL6HXQR6/Cy2lbNdPlZBpuQHXE63gA==",
      "dev": true
    },
    "json-parse-even-better-errors": {
      "version": "2.3.1",
      "dev": true
    },
    "json-schema": {
      "version": "0.4.0",
      "dev": true
    },
    "json-schema-traverse": {
      "version": "0.4.1",
      "dev": true
    },
    "json-stable-stringify-without-jsonify": {
      "version": "1.0.1",
      "dev": true
    },
    "json-stringify-safe": {
      "version": "5.0.1",
      "dev": true
    },
    "json5": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.1.tgz",
      "integrity": "sha512-1hqLFMSrGHRHxav9q9gNjJ5EXznIxGVO09xQRrwplcS8qs28pZ8s8hupZAmqDwZUmVZ2Qb2jnyPOWcDH8m8dlA==",
      "dev": true
    },
    "jsprim": {
      "version": "1.4.2",
      "dev": true,
      "requires": {
        "assert-plus": "1.0.0",
        "extsprintf": "1.3.0",
        "json-schema": "0.4.0",
        "verror": "1.10.0"
      }
    },
    "kind-of": {
      "version": "6.0.3",
      "dev": true
    },
    "klona": {
      "version": "2.0.4",
      "dev": true
    },
    "known-css-properties": {
      "version": "0.25.0",
      "resolved": "https://registry.npmjs.org/known-css-properties/-/known-css-properties-0.25.0.tgz",
      "integrity": "sha512-b0/9J1O9Jcyik1GC6KC42hJ41jKwdO/Mq8Mdo5sYN+IuRTXs2YFHZC3kZSx6ueusqa95x3wLYe/ytKjbAfGixA==",
      "dev": true
    },
    "levn": {
      "version": "0.4.1",
      "dev": true,
      "requires": {
        "prelude-ls": "^1.2.1",
        "type-check": "~0.4.0"
      }
    },
    "lilconfig": {
      "version": "2.0.4",
      "dev": true
    },
    "lines-and-columns": {
      "version": "1.1.6",
      "dev": true
    },
    "loader-runner": {
      "version": "4.2.0",
      "dev": true
    },
    "loader-utils": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/loader-utils/-/loader-utils-2.0.2.tgz",
      "integrity": "sha512-TM57VeHptv569d/GKh6TAYdzKblwDNiumOdkFnejjD0XwTH87K90w3O7AiJRqdQoXygvi1VQTJTLGhJl7WqA7A==",
      "dev": true,
      "requires": {
        "big.js": "^5.2.2",
        "emojis-list": "^3.0.0",
        "json5": "^2.1.2"
      }
    },
    "locate-path": {
      "version": "5.0.0",
      "dev": true,
      "requires": {
        "p-locate": "^4.1.0"
      }
    },
    "lodash": {
      "version": "4.17.21",
      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz",
      "integrity": "sha512-v2kDEe57lecTulaDIuNTPy3Ry4gLGJ6Z1O3vE1krgXZNrsQ+LFTGHVxVjcXPs17LhbZVGedAJv8XZ1tvj5FvSg==",
      "dev": true
    },
    "lodash.debounce": {
      "version": "4.0.8",
      "dev": true
    },
    "lodash.memoize": {
      "version": "4.1.2",
      "resolved": "https://registry.npmjs.org/lodash.memoize/-/lodash.memoize-4.1.2.tgz",
      "integrity": "sha512-t7j+NzmgnQzTAYXcsHYLgimltOV1MXHtlOWf6GjL9Kj8GK5FInw5JotxvbOs+IvV1/Dzo04/fCGfLVs7aXb4Ag==",
      "dev": true
    },
    "lodash.merge": {
      "version": "4.6.2",
      "dev": true
    },
    "lodash.truncate": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/lodash.truncate/-/lodash.truncate-4.4.2.tgz",
      "integrity": "sha512-jttmRe7bRse52OsWIMDLaXxWqRAmtIUccAQ3garviCqJjafXOfNMO0yMfNpdD6zbGaTU0P5Nz7e7gAT6cKmJRw==",
      "dev": true
    },
    "lodash.uniq": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/lodash.uniq/-/lodash.uniq-4.5.0.tgz",
      "integrity": "sha512-xfBaXQd9ryd9dlSDvnvI0lvxfLJlYAZzXomUYzLKtUeOQvOP5piqAWuGtrhWeqaXK9hhoM/iyJc5AV+XfsX3HQ==",
      "dev": true
    },
    "log-symbols": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/log-symbols/-/log-symbols-4.1.0.tgz",
      "integrity": "sha512-8XPvpAA8uyhfteu8pIvQxpJZ7SYYdpUivZpGy6sFsBuKRY/7rQGavedeB8aK+Zkyq6upMFVL/9AW6vOYzfRyLg==",
      "dev": true,
      "requires": {
        "chalk": "^4.1.0",
        "is-unicode-supported": "^0.1.0"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
          "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "chalk": {
          "version": "4.1.2",
          "resolved": "https://registry.npmjs.org/chalk/-/chalk-4.1.2.tgz",
          "integrity": "sha512-oKnbhFyRIXpUuez8iBMmyEa4nbj4IOQyuhc/wy9kY7/WVPcwIO9VA668Pu8RkO7+0G76SLROeyw9CpQ061i4mA==",
          "dev": true,
          "requires": {
            "ansi-styles": "^4.1.0",
            "supports-color": "^7.1.0"
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
          "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
          "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
          "dev": true
        },
        "has-flag": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
          "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
          "dev": true
        },
        "supports-color": {
          "version": "7.2.0",
          "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
          "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
          "dev": true,
          "requires": {
            "has-flag": "^4.0.0"
          }
        }
      }
    },
    "lru-cache": {
      "version": "6.0.0",
      "dev": true,
      "requires": {
        "yallist": "^4.0.0"
      }
    },
    "make-dir": {
      "version": "3.1.0",
      "dev": true,
      "requires": {
        "semver": "^6.0.0"
      },
      "dependencies": {
        "semver": {
          "version": "6.3.0",
          "dev": true
        }
      }
    },
    "make-error": {
      "version": "1.3.6",
      "resolved": "https://registry.npmjs.org/make-error/-/make-error-1.3.6.tgz",
      "integrity": "sha512-s8UhlNe7vPKomQhC1qFelMokr/Sc3AgNbso3n74mVPA5LTZwkB9NlXf4XPamLxJE8h0gh73rM94xvwRT2CVInw==",
      "dev": true
    },
    "make-fetch-happen": {
      "version": "9.1.0",
      "dev": true,
      "requires": {
        "agentkeepalive": "^4.1.3",
        "cacache": "^15.2.0",
        "http-cache-semantics": "^4.1.0",
        "http-proxy-agent": "^4.0.1",
        "https-proxy-agent": "^5.0.0",
        "is-lambda": "^1.0.1",
        "lru-cache": "^6.0.0",
        "minipass": "^3.1.3",
        "minipass-collect": "^1.0.2",
        "minipass-fetch": "^1.3.2",
        "minipass-flush": "^1.0.5",
        "minipass-pipeline": "^1.2.4",
        "negotiator": "^0.6.2",
        "promise-retry": "^2.0.1",
        "socks-proxy-agent": "^6.0.0",
        "ssri": "^8.0.0"
      },
      "dependencies": {
        "cacache": {
          "version": "15.3.0",
          "dev": true,
          "requires": {
            "@npmcli/fs": "^1.0.0",
            "@npmcli/move-file": "^1.0.1",
            "chownr": "^2.0.0",
            "fs-minipass": "^2.0.0",
            "glob": "^7.1.4",
            "infer-owner": "^1.0.4",
            "lru-cache": "^6.0.0",
            "minipass": "^3.1.1",
            "minipass-collect": "^1.0.2",
            "minipass-flush": "^1.0.5",
            "minipass-pipeline": "^1.2.2",
            "mkdirp": "^1.0.3",
            "p-map": "^4.0.0",
            "promise-inflight": "^1.0.1",
            "rimraf": "^3.0.2",
            "ssri": "^8.0.1",
            "tar": "^6.0.2",
            "unique-filename": "^1.1.1"
          }
        },
        "chownr": {
          "version": "2.0.0",
          "dev": true
        },
        "lru-cache": {
          "version": "6.0.0",
          "dev": true,
          "requires": {
            "yallist": "^4.0.0"
          }
        },
        "mkdirp": {
          "version": "1.0.4",
          "dev": true
        },
        "rimraf": {
          "version": "3.0.2",
          "dev": true,
          "requires": {
            "glob": "^7.1.3"
          }
        },
        "ssri": {
          "version": "8.0.1",
          "dev": true,
          "requires": {
            "minipass": "^3.1.1"
          }
        },
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "map-obj": {
      "version": "4.1.0",
      "dev": true
    },
    "mathml-tag-names": {
      "version": "2.1.3",
      "dev": true
    },
    "mdn-data": {
      "version": "2.0.14",
      "resolved": "https://registry.npmjs.org/mdn-data/-/mdn-data-2.0.14.tgz",
      "integrity": "sha512-dn6wd0uw5GsdswPFfsgMp5NSB0/aDe6fK94YJV/AJDYXL6HVLWBsxeq7js7Ad+mU2K9LAlwpk6kN2D5mwCPVow==",
      "dev": true
    },
    "meow": {
      "version": "9.0.0",
      "dev": true,
      "requires": {
        "@types/minimist": "^1.2.0",
        "camelcase-keys": "^6.2.2",
        "decamelize": "^1.2.0",
        "decamelize-keys": "^1.1.0",
        "hard-rejection": "^2.1.0",
        "minimist-options": "4.1.0",
        "normalize-package-data": "^3.0.0",
        "read-pkg-up": "^7.0.1",
        "redent": "^3.0.0",
        "trim-newlines": "^3.0.0",
        "type-fest": "^0.18.0",
        "yargs-parser": "^20.2.3"
      },
      "dependencies": {
        "hosted-git-info": {
          "version": "4.0.2",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        },
        "normalize-package-data": {
          "version": "3.0.3",
          "dev": true,
          "requires": {
            "hosted-git-info": "^4.0.1",
            "is-core-module": "^2.5.0",
            "semver": "^7.3.4",
            "validate-npm-package-license": "^3.0.1"
          }
        },
        "semver": {
          "version": "7.3.5",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        },
        "type-fest": {
          "version": "0.18.1",
          "dev": true
        }
      }
    },
    "merge-stream": {
      "version": "2.0.0",
      "dev": true
    },
    "merge2": {
      "version": "1.4.1",
      "resolved": "https://registry.npmjs.org/merge2/-/merge2-1.4.1.tgz",
      "integrity": "sha512-8q7VEgMJW4J8tcfVPy8g09NcQwZdbwFEqhe/WZkoIzjn/3TGDwtOCYtXGxA3O8tPzpczCCDgv+P2P5y00ZJOOg==",
      "dev": true
    },
    "micromatch": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/micromatch/-/micromatch-4.0.5.tgz",
      "integrity": "sha512-DMy+ERcEW2q8Z2Po+WNXuw3c5YaUSFjAO5GsJqfEl7UjvtIuFKO6ZrKvcItdy98dwFI2N1tg3zNIdKaQT+aNdA==",
      "dev": true,
      "requires": {
        "braces": "^3.0.2",
        "picomatch": "^2.3.1"
      }
    },
    "mime-db": {
      "version": "1.51.0",
      "dev": true
    },
    "mime-types": {
      "version": "2.1.34",
      "dev": true,
      "requires": {
        "mime-db": "1.51.0"
      }
    },
    "min-indent": {
      "version": "1.0.1",
      "dev": true
    },
    "mini-css-extract-plugin": {
      "version": "2.6.1",
      "resolved": "https://registry.npmjs.org/mini-css-extract-plugin/-/mini-css-extract-plugin-2.6.1.tgz",
      "integrity": "sha512-wd+SD57/K6DiV7jIR34P+s3uckTRuQvx0tKPcvjFlrEylk6P4mQ2KSWk1hblj1Kxaqok7LogKOieygXqBczNlg==",
      "dev": true,
      "requires": {
        "schema-utils": "^4.0.0"
      },
      "dependencies": {
        "ajv": {
          "version": "8.8.2",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.1",
            "json-schema-traverse": "^1.0.0",
            "require-from-string": "^2.0.2",
            "uri-js": "^4.2.2"
          }
        },
        "ajv-keywords": {
          "version": "5.1.0",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.3"
          }
        },
        "json-schema-traverse": {
          "version": "1.0.0",
          "dev": true
        },
        "schema-utils": {
          "version": "4.0.0",
          "dev": true,
          "requires": {
            "@types/json-schema": "^7.0.9",
            "ajv": "^8.8.0",
            "ajv-formats": "^2.1.1",
            "ajv-keywords": "^5.0.0"
          }
        }
      }
    },
    "minimatch": {
      "version": "3.0.4",
      "dev": true,
      "requires": {
        "brace-expansion": "^1.1.7"
      }
    },
    "minimist-options": {
      "version": "4.1.0",
      "dev": true,
      "requires": {
        "arrify": "^1.0.1",
        "is-plain-obj": "^1.1.0",
        "kind-of": "^6.0.3"
      }
    },
    "minipass": {
      "version": "3.1.6",
      "dev": true,
      "requires": {
        "yallist": "^4.0.0"
      },
      "dependencies": {
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "minipass-collect": {
      "version": "1.0.2",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0"
      }
    },
    "minipass-fetch": {
      "version": "1.4.1",
      "dev": true,
      "requires": {
        "encoding": "^0.1.12",
        "minipass": "^3.1.0",
        "minipass-sized": "^1.0.3",
        "minizlib": "^2.0.0"
      }
    },
    "minipass-flush": {
      "version": "1.0.5",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0"
      }
    },
    "minipass-pipeline": {
      "version": "1.2.4",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0"
      }
    },
    "minipass-sized": {
      "version": "1.0.3",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0"
      }
    },
    "minizlib": {
      "version": "2.1.2",
      "dev": true,
      "requires": {
        "minipass": "^3.0.0",
        "yallist": "^4.0.0"
      },
      "dependencies": {
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "mocha": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/mocha/-/mocha-10.0.0.tgz",
      "integrity": "sha512-0Wl+elVUD43Y0BqPZBzZt8Tnkw9CMUdNYnUsTfOM1vuhJVZL+kiesFYsqwBkEEuEixaiPe5ZQdqDgX2jddhmoA==",
      "dev": true,
      "requires": {
        "@ungap/promise-all-settled": "1.1.2",
        "ansi-colors": "4.1.1",
        "browser-stdout": "1.3.1",
        "chokidar": "3.5.3",
        "debug": "4.3.4",
        "diff": "5.0.0",
        "escape-string-regexp": "4.0.0",
        "find-up": "5.0.0",
        "glob": "7.2.0",
        "he": "1.2.0",
        "js-yaml": "4.1.0",
        "log-symbols": "4.1.0",
        "minimatch": "5.0.1",
        "ms": "2.1.3",
        "nanoid": "3.3.3",
        "serialize-javascript": "6.0.0",
        "strip-json-comments": "3.1.1",
        "supports-color": "8.1.1",
        "workerpool": "6.2.1",
        "yargs": "16.2.0",
        "yargs-parser": "20.2.4",
        "yargs-unparser": "2.0.0"
      },
      "dependencies": {
        "brace-expansion": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-2.0.1.tgz",
          "integrity": "sha512-XnAIvQ8eM+kC6aULx6wuQiwVsnzsi9d3WxzV3FpWTGA19F621kwdbsAcFKXgKUHZWsy+mY6iL1sHTxWEFCytDA==",
          "dev": true,
          "requires": {
            "balanced-match": "^1.0.0"
          }
        },
        "cliui": {
          "version": "7.0.4",
          "resolved": "https://registry.npmjs.org/cliui/-/cliui-7.0.4.tgz",
          "integrity": "sha512-OcRE68cOsVMXp1Yvonl/fzkQOyjLSu/8bhPDfQt0e0/Eb283TKP20Fs2MqoPsr9SwA595rRCA+QMzYc9nBP+JQ==",
          "dev": true,
          "requires": {
            "string-width": "^4.2.0",
            "strip-ansi": "^6.0.0",
            "wrap-ansi": "^7.0.0"
          }
        },
        "escape-string-regexp": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/escape-string-regexp/-/escape-string-regexp-4.0.0.tgz",
          "integrity": "sha512-TtpcNJ3XAzx3Gq8sWRzJaVajRs0uVxA2YAkdb1jm2YkPz4G6egUFAyA3n5vtEIZefPk5Wa4UXbKuS5fKkJWdgA==",
          "dev": true
        },
        "find-up": {
          "version": "5.0.0",
          "resolved": "https://registry.npmjs.org/find-up/-/find-up-5.0.0.tgz",
          "integrity": "sha512-78/PXT1wlLLDgTzDs7sjq9hzz0vXD+zn+7wypEe4fXQxCmdmqfGsEPQxmiCSQI3ajFV91bVSsvNtrJRiW6nGng==",
          "dev": true,
          "requires": {
            "locate-path": "^6.0.0",
            "path-exists": "^4.0.0"
          }
        },
        "locate-path": {
          "version": "6.0.0",
          "resolved": "https://registry.npmjs.org/locate-path/-/locate-path-6.0.0.tgz",
          "integrity": "sha512-iPZK6eYjbxRu3uB4/WZ3EsEIMJFMqAoopl3R+zuq0UjcAm/MO6KCweDgPfP3elTztoKP3KtnVHxTn2NHBSDVUw==",
          "dev": true,
          "requires": {
            "p-locate": "^5.0.0"
          }
        },
        "minimatch": {
          "version": "5.0.1",
          "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-5.0.1.tgz",
          "integrity": "sha512-nLDxIFRyhDblz3qMuq+SoRZED4+miJ/G+tdDrjkkkRnjAsBexeGpgjLEQ0blJy7rHhR2b93rhQY4SvyWu9v03g==",
          "dev": true,
          "requires": {
            "brace-expansion": "^2.0.1"
          }
        },
        "ms": {
          "version": "2.1.3",
          "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
          "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
          "dev": true
        },
        "nanoid": {
          "version": "3.3.3",
          "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.3.tgz",
          "integrity": "sha512-p1sjXuopFs0xg+fPASzQ28agW1oHD7xDsd9Xkf3T15H3c/cifrFHVwrh74PdoklAPi+i7MdRsE47vm2r6JoB+w==",
          "dev": true
        },
        "p-limit": {
          "version": "3.1.0",
          "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
          "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
          "dev": true,
          "requires": {
            "yocto-queue": "^0.1.0"
          }
        },
        "p-locate": {
          "version": "5.0.0",
          "resolved": "https://registry.npmjs.org/p-locate/-/p-locate-5.0.0.tgz",
          "integrity": "sha512-LaNjtRWUBY++zB5nE/NwcaoMylSPk+S+ZHNB1TzdbMJMny6dynpAGt7X/tl/QYq3TIeE6nxHppbo2LGymrG5Pw==",
          "dev": true,
          "requires": {
            "p-limit": "^3.0.2"
          }
        },
        "yargs": {
          "version": "16.2.0",
          "resolved": "https://registry.npmjs.org/yargs/-/yargs-16.2.0.tgz",
          "integrity": "sha512-D1mvvtDG0L5ft/jGWkLpG1+m0eQxOfaBvTNELraWj22wSVUMWxZUvYgJYcKh6jGGIkJFhH4IZPQhR4TKpc8mBw==",
          "dev": true,
          "requires": {
            "cliui": "^7.0.2",
            "escalade": "^3.1.1",
            "get-caller-file": "^2.0.5",
            "require-directory": "^2.1.1",
            "string-width": "^4.2.0",
            "y18n": "^5.0.5",
            "yargs-parser": "^20.2.2"
          }
        },
        "yargs-parser": {
          "version": "20.2.4",
          "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-20.2.4.tgz",
          "integrity": "sha512-WOkpgNhPTlE73h4VFAFsOnomJVaovO8VqLDzy5saChRBFQFBoMYirowyW+Q9HB4HFF4Z7VZTiG3iSzJJA29yRA==",
          "dev": true
        }
      }
    },
    "motion-ui": {
      "version": "2.0.3",
      "resolved": "https://registry.npmjs.org/motion-ui/-/motion-ui-2.0.3.tgz",
      "integrity": "sha512-f9xzh/hbZTUYjk4M7y1aDcsiPTfqUbuvCv/+If05TSIBEJMu3hGBU+YSe9csQPP7WBBHXxjossEygM/TJo2enw==",
      "peer": true,
      "requires": {}
    },
    "ms": {
      "version": "2.1.2",
      "dev": true
    },
    "nan": {
      "version": "2.14.1",
      "dev": true
    },
    "nanoid": {
      "version": "3.3.4",
      "resolved": "https://registry.npmjs.org/nanoid/-/nanoid-3.3.4.tgz",
      "integrity": "sha512-MqBkQh/OHTS2egovRtLk45wEyNXwF+cokD+1YPf9u5VfJiRdAiRwB2froX5Co9Rh20xs4siNPm8naNotSD6RBw==",
      "dev": true
    },
    "natural-compare": {
      "version": "1.4.0",
      "dev": true
    },
    "negotiator": {
      "version": "0.6.2",
      "dev": true
    },
    "neo-async": {
      "version": "2.6.2",
      "dev": true
    },
    "node-gyp": {
      "version": "8.4.1",
      "dev": true,
      "requires": {
        "env-paths": "^2.2.0",
        "glob": "^7.1.4",
        "graceful-fs": "^4.2.6",
        "make-fetch-happen": "^9.1.0",
        "nopt": "^5.0.0",
        "npmlog": "^6.0.0",
        "rimraf": "^3.0.2",
        "semver": "^7.3.5",
        "tar": "^6.1.2",
        "which": "^2.0.2"
      },
      "dependencies": {
        "lru-cache": {
          "version": "6.0.0",
          "dev": true,
          "requires": {
            "yallist": "^4.0.0"
          }
        },
        "npmlog": {
          "version": "6.0.0",
          "dev": true,
          "requires": {
            "are-we-there-yet": "^2.0.0",
            "console-control-strings": "^1.1.0",
            "gauge": "^4.0.0",
            "set-blocking": "^2.0.0"
          }
        },
        "rimraf": {
          "version": "3.0.2",
          "dev": true,
          "requires": {
            "glob": "^7.1.3"
          }
        },
        "semver": {
          "version": "7.3.5",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        },
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "node-releases": {
      "version": "2.0.6",
      "resolved": "https://registry.npmjs.org/node-releases/-/node-releases-2.0.6.tgz",
      "integrity": "sha512-PiVXnNuFm5+iYkLBNeq5211hvO38y63T0i2KKh2KnUs3RpzJ+JtODFjkD8yjLwnDkTYF1eKXheUwdssR+NRZdg==",
      "dev": true
    },
    "node-sass": {
      "version": "7.0.3",
      "resolved": "https://registry.npmjs.org/node-sass/-/node-sass-7.0.3.tgz",
      "integrity": "sha512-8MIlsY/4dXUkJDYht9pIWBhMil3uHmE8b/AdJPjmFn1nBx9X9BASzfzmsCy0uCCb8eqI3SYYzVPDswWqSx7gjw==",
      "dev": true,
      "requires": {
        "async-foreach": "^0.1.3",
        "chalk": "^4.1.2",
        "cross-spawn": "^7.0.3",
        "gaze": "^1.0.0",
        "get-stdin": "^4.0.1",
        "glob": "^7.0.3",
        "lodash": "^4.17.15",
        "meow": "^9.0.0",
        "nan": "^2.13.2",
        "node-gyp": "^8.4.1",
        "npmlog": "^5.0.0",
        "request": "^2.88.0",
        "sass-graph": "^4.0.1",
        "stdout-stream": "^1.4.0",
        "true-case-path": "^1.0.2"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "chalk": {
          "version": "4.1.2",
          "dev": true,
          "requires": {
            "ansi-styles": "^4.1.0",
            "supports-color": "^7.1.0"
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "dev": true
        },
        "get-stdin": {
          "version": "4.0.1",
          "dev": true
        },
        "has-flag": {
          "version": "4.0.0",
          "dev": true
        },
        "supports-color": {
          "version": "7.2.0",
          "dev": true,
          "requires": {
            "has-flag": "^4.0.0"
          }
        }
      }
    },
    "nopt": {
      "version": "5.0.0",
      "dev": true,
      "requires": {
        "abbrev": "1"
      }
    },
    "normalize-package-data": {
      "version": "2.5.0",
      "dev": true,
      "requires": {
        "hosted-git-info": "^2.1.4",
        "resolve": "^1.10.0",
        "semver": "2 || 3 || 4 || 5",
        "validate-npm-package-license": "^3.0.1"
      }
    },
    "normalize-path": {
      "version": "3.0.0",
      "dev": true
    },
    "normalize-range": {
      "version": "0.1.2",
      "dev": true
    },
    "normalize-scss": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/normalize-scss/-/normalize-scss-7.0.1.tgz",
      "integrity": "sha512-qj16bWnYs+9/ac29IgGjySg4R5qQTp1lXfm7ApFOZNVBYFY8RZ3f8+XQNDDLHeDtI3Ba7Jj4+LuPgz9v/fne2A=="
    },
    "normalize-url": {
      "version": "6.1.0",
      "resolved": "https://registry.npmjs.org/normalize-url/-/normalize-url-6.1.0.tgz",
      "integrity": "sha512-DlL+XwOy3NxAQ8xuC0okPgK46iuVNAK01YN7RueYBqqFeGsBjV9XmCAzAdgt+667bCl5kPh9EqKKDwnaPG1I7A==",
      "dev": true
    },
    "normalize.css": {
      "version": "8.0.1",
      "dev": true
    },
    "npmlog": {
      "version": "5.0.1",
      "dev": true,
      "requires": {
        "are-we-there-yet": "^2.0.0",
        "console-control-strings": "^1.1.0",
        "gauge": "^3.0.0",
        "set-blocking": "^2.0.0"
      },
      "dependencies": {
        "gauge": {
          "version": "3.0.2",
          "dev": true,
          "requires": {
            "aproba": "^1.0.3 || ^2.0.0",
            "color-support": "^1.1.2",
            "console-control-strings": "^1.0.0",
            "has-unicode": "^2.0.1",
            "object-assign": "^4.1.1",
            "signal-exit": "^3.0.0",
            "string-width": "^4.2.3",
            "strip-ansi": "^6.0.1",
            "wide-align": "^1.1.2"
          }
        }
      }
    },
    "nth-check": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/nth-check/-/nth-check-2.1.1.tgz",
      "integrity": "sha512-lqjrjmaOoAnWfMmBPL+XNnynZh2+swxiX3WUE0s4yEHI6m+AwrK2UZOimIRl3X/4QctVqS8AiZjFqyOGrMXb/w==",
      "dev": true,
      "requires": {
        "boolbase": "^1.0.0"
      }
    },
    "oauth-sign": {
      "version": "0.9.0",
      "dev": true
    },
    "object-assign": {
      "version": "4.1.1",
      "dev": true
    },
    "object-keys": {
      "version": "1.1.1",
      "dev": true
    },
    "object.assign": {
      "version": "4.1.4",
      "resolved": "https://registry.npmjs.org/object.assign/-/object.assign-4.1.4.tgz",
      "integrity": "sha512-1mxKf0e58bvyjSCtKYY4sRe9itRk3PJpquJOjeIkz885CczcI4IvJJDLPS72oowuSh+pBxUFROpX+TU++hxhZQ==",
      "dev": true,
      "requires": {
        "call-bind": "^1.0.2",
        "define-properties": "^1.1.4",
        "has-symbols": "^1.0.3",
        "object-keys": "^1.1.1"
      }
    },
    "once": {
      "version": "1.4.0",
      "dev": true,
      "requires": {
        "wrappy": "1"
      }
    },
    "optionator": {
      "version": "0.9.1",
      "dev": true,
      "requires": {
        "deep-is": "^0.1.3",
        "fast-levenshtein": "^2.0.6",
        "levn": "^0.4.1",
        "prelude-ls": "^1.2.1",
        "type-check": "^0.4.0",
        "word-wrap": "^1.2.3"
      }
    },
    "p-limit": {
      "version": "2.3.0",
      "dev": true,
      "requires": {
        "p-try": "^2.0.0"
      }
    },
    "p-locate": {
      "version": "4.1.0",
      "dev": true,
      "requires": {
        "p-limit": "^2.2.0"
      }
    },
    "p-map": {
      "version": "4.0.0",
      "dev": true,
      "requires": {
        "aggregate-error": "^3.0.0"
      }
    },
    "p-try": {
      "version": "2.2.0",
      "dev": true
    },
    "parent-module": {
      "version": "1.0.1",
      "dev": true,
      "requires": {
        "callsites": "^3.0.0"
      }
    },
    "parse-json": {
      "version": "5.2.0",
      "dev": true,
      "requires": {
        "@babel/code-frame": "^7.0.0",
        "error-ex": "^1.3.1",
        "json-parse-even-better-errors": "^2.3.0",
        "lines-and-columns": "^1.1.6"
      }
    },
    "path-exists": {
      "version": "4.0.0",
      "dev": true
    },
    "path-is-absolute": {
      "version": "1.0.1",
      "dev": true
    },
    "path-key": {
      "version": "3.1.1",
      "dev": true
    },
    "path-parse": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/path-parse/-/path-parse-1.0.7.tgz",
      "integrity": "sha512-LDJzPVEEEPR+y48z93A0Ed0yXb8pAByGWo/k5YYdYgpY2/2EsOsksJrq7lOHxryrVOn1ejG6oAp8ahvOIQD8sw==",
      "dev": true
    },
    "path-type": {
      "version": "4.0.0",
      "dev": true
    },
    "performance-now": {
      "version": "2.1.0",
      "dev": true
    },
    "picocolors": {
      "version": "1.0.0",
      "dev": true
    },
    "picomatch": {
      "version": "2.3.1",
      "resolved": "https://registry.npmjs.org/picomatch/-/picomatch-2.3.1.tgz",
      "integrity": "sha512-JU3teHTNjmE2VCGFzuY8EXzCDVwEqB2a8fsIvwaStHhAWJEeVd1o1QD80CU6+ZdEXXSLbSsuLwJjkCBWqRQUVA==",
      "dev": true
    },
    "pify": {
      "version": "2.3.0",
      "dev": true
    },
    "pkg-dir": {
      "version": "4.2.0",
      "dev": true,
      "requires": {
        "find-up": "^4.0.0"
      }
    },
    "postcss": {
      "version": "8.4.17",
      "resolved": "https://registry.npmjs.org/postcss/-/postcss-8.4.17.tgz",
      "integrity": "sha512-UNxNOLQydcOFi41yHNMcKRZ39NeXlr8AxGuZJsdub8vIb12fHzcq37DTU/QtbI6WLxNg2gF9Z+8qtRwTj1UI1Q==",
      "dev": true,
      "requires": {
        "nanoid": "^3.3.4",
        "picocolors": "^1.0.0",
        "source-map-js": "^1.0.2"
      }
    },
    "postcss-attribute-case-insensitive": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/postcss-attribute-case-insensitive/-/postcss-attribute-case-insensitive-5.0.2.tgz",
      "integrity": "sha512-XIidXV8fDr0kKt28vqki84fRK8VW8eTuIa4PChv2MqKuT6C9UjmSKzen6KaWhWEoYvwxFCa7n/tC1SZ3tyq4SQ==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "postcss-calc": {
      "version": "8.2.4",
      "resolved": "https://registry.npmjs.org/postcss-calc/-/postcss-calc-8.2.4.tgz",
      "integrity": "sha512-SmWMSJmB8MRnnULldx0lQIyhSNvuDl9HfrZkaqqE/WHAhToYsAvDq+yAsA/kIyINDszOp3Rh0GFoNuH5Ypsm3Q==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.9",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-clamp": {
      "version": "4.1.0",
      "resolved": "https://registry.npmjs.org/postcss-clamp/-/postcss-clamp-4.1.0.tgz",
      "integrity": "sha512-ry4b1Llo/9zz+PKC+030KUnPITTJAHeOwjfAyyB60eT0AorGLdzp52s31OsPRHRf8NchkgFoG2y6fCfn1IV1Ow==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-color-functional-notation": {
      "version": "4.2.4",
      "resolved": "https://registry.npmjs.org/postcss-color-functional-notation/-/postcss-color-functional-notation-4.2.4.tgz",
      "integrity": "sha512-2yrTAUZUab9s6CpxkxC4rVgFEVaR6/2Pipvi6qcgvnYiVqZcbDHEoBDhrXzyb7Efh2CCfHQNtcqWcIruDTIUeg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-color-hex-alpha": {
      "version": "8.0.4",
      "resolved": "https://registry.npmjs.org/postcss-color-hex-alpha/-/postcss-color-hex-alpha-8.0.4.tgz",
      "integrity": "sha512-nLo2DCRC9eE4w2JmuKgVA3fGL3d01kGq752pVALF68qpGLmx2Qrk91QTKkdUqqp45T1K1XV8IhQpcu1hoAQflQ==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-color-rebeccapurple": {
      "version": "7.1.1",
      "resolved": "https://registry.npmjs.org/postcss-color-rebeccapurple/-/postcss-color-rebeccapurple-7.1.1.tgz",
      "integrity": "sha512-pGxkuVEInwLHgkNxUc4sdg4g3py7zUeCQ9sMfwyHAT+Ezk8a4OaaVZ8lIY5+oNqA/BXXgLyXv0+5wHP68R79hg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-colormin": {
      "version": "5.3.0",
      "resolved": "https://registry.npmjs.org/postcss-colormin/-/postcss-colormin-5.3.0.tgz",
      "integrity": "sha512-WdDO4gOFG2Z8n4P8TWBpshnL3JpmNmJwdnfP2gbk2qBA8PWwOYcmjmI/t3CmMeL72a7Hkd+x/Mg9O2/0rD54Pg==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0",
        "colord": "^2.9.1",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-convert-values": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-convert-values/-/postcss-convert-values-5.1.2.tgz",
      "integrity": "sha512-c6Hzc4GAv95B7suy4udszX9Zy4ETyMCgFPUDtWjdFTKH1SE9eFY/jEpHSwTH1QPuwxHpWslhckUQWbNRM4ho5g==",
      "dev": true,
      "requires": {
        "browserslist": "^4.20.3",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-css-variables": {
      "version": "0.18.0",
      "dev": true,
      "requires": {
        "balanced-match": "^1.0.0",
        "escape-string-regexp": "^1.0.3",
        "extend": "^3.0.1"
      }
    },
    "postcss-custom-media": {
      "version": "8.0.2",
      "resolved": "https://registry.npmjs.org/postcss-custom-media/-/postcss-custom-media-8.0.2.tgz",
      "integrity": "sha512-7yi25vDAoHAkbhAzX9dHx2yc6ntS4jQvejrNcC+csQJAXjj15e7VcWfMgLqBNAbOvqi5uIa9huOVwdHbf+sKqg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-custom-properties": {
      "version": "12.1.9",
      "resolved": "https://registry.npmjs.org/postcss-custom-properties/-/postcss-custom-properties-12.1.9.tgz",
      "integrity": "sha512-/E7PRvK8DAVljBbeWrcEQJPG72jaImxF3vvCNFwv9cC8CzigVoNIpeyfnJzphnN3Fd8/auBf5wvkw6W9MfmTyg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-custom-selectors": {
      "version": "6.0.3",
      "resolved": "https://registry.npmjs.org/postcss-custom-selectors/-/postcss-custom-selectors-6.0.3.tgz",
      "integrity": "sha512-fgVkmyiWDwmD3JbpCmB45SvvlCD6z9CG6Ie6Iere22W5aHea6oWa7EM2bpnv2Fj3I94L3VbtvX9KqwSi5aFzSg==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.4"
      }
    },
    "postcss-dir-pseudo-class": {
      "version": "6.0.5",
      "resolved": "https://registry.npmjs.org/postcss-dir-pseudo-class/-/postcss-dir-pseudo-class-6.0.5.tgz",
      "integrity": "sha512-eqn4m70P031PF7ZQIvSgy9RSJ5uI2171O/OO/zcRNYpJbvaeKFUlar1aJ7rmgiQtbm0FSPsRewjpdS0Oew7MPA==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "postcss-discard-comments": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-discard-comments/-/postcss-discard-comments-5.1.2.tgz",
      "integrity": "sha512-+L8208OVbHVF2UQf1iDmRcbdjJkuBF6IS29yBDSiWUIzpYaAhtNl6JYnYm12FnkeCwQqF5LeklOu6rAqgfBZqQ==",
      "dev": true,
      "requires": {}
    },
    "postcss-discard-duplicates": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-discard-duplicates/-/postcss-discard-duplicates-5.1.0.tgz",
      "integrity": "sha512-zmX3IoSI2aoenxHV6C7plngHWWhUOV3sP1T8y2ifzxzbtnuhk1EdPwm0S1bIUNaJ2eNbWeGLEwzw8huPD67aQw==",
      "dev": true,
      "requires": {}
    },
    "postcss-discard-empty": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-discard-empty/-/postcss-discard-empty-5.1.1.tgz",
      "integrity": "sha512-zPz4WljiSuLWsI0ir4Mcnr4qQQ5e1Ukc3i7UfE2XcrwKK2LIPIqE5jxMRxO6GbI3cv//ztXDsXwEWT3BHOGh3A==",
      "dev": true,
      "requires": {}
    },
    "postcss-discard-overridden": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-discard-overridden/-/postcss-discard-overridden-5.1.0.tgz",
      "integrity": "sha512-21nOL7RqWR1kasIVdKs8HNqQJhFxLsyRfAnUDm4Fe4t4mCWL9OJiHvlHPjcd8zc5Myu89b/7wZDnOSjFgeWRtw==",
      "dev": true,
      "requires": {}
    },
    "postcss-double-position-gradients": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/postcss-double-position-gradients/-/postcss-double-position-gradients-3.1.2.tgz",
      "integrity": "sha512-GX+FuE/uBR6eskOK+4vkXgT6pDkexLokPaz/AbJna9s5Kzp/yl488pKPjhy0obB475ovfT1Wv8ho7U/cHNaRgQ==",
      "dev": true,
      "requires": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-env-function": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/postcss-env-function/-/postcss-env-function-4.0.6.tgz",
      "integrity": "sha512-kpA6FsLra+NqcFnL81TnsU+Z7orGtDTxcOhl6pwXeEq1yFPpRMkCDpHhrz8CFQDr/Wfm0jLiNQ1OsGGPjlqPwA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-flexbugs-fixes": {
      "version": "5.0.2",
      "dev": true,
      "requires": {}
    },
    "postcss-focus-visible": {
      "version": "6.0.4",
      "resolved": "https://registry.npmjs.org/postcss-focus-visible/-/postcss-focus-visible-6.0.4.tgz",
      "integrity": "sha512-QcKuUU/dgNsstIK6HELFRT5Y3lbrMLEOwG+A4s5cA+fx3A3y/JTq3X9LaOj3OC3ALH0XqyrgQIgey/MIZ8Wczw==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.9"
      }
    },
    "postcss-focus-within": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/postcss-focus-within/-/postcss-focus-within-5.0.4.tgz",
      "integrity": "sha512-vvjDN++C0mu8jz4af5d52CB184ogg/sSxAFS+oUJQq2SuCe7T5U2iIsVJtsCp2d6R4j0jr5+q3rPkBVZkXD9fQ==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.9"
      }
    },
    "postcss-font-variant": {
      "version": "5.0.0",
      "dev": true,
      "requires": {}
    },
    "postcss-gap-properties": {
      "version": "3.0.5",
      "resolved": "https://registry.npmjs.org/postcss-gap-properties/-/postcss-gap-properties-3.0.5.tgz",
      "integrity": "sha512-IuE6gKSdoUNcvkGIqdtjtcMtZIFyXZhmFd5RUlg97iVEvp1BZKV5ngsAjCjrVy+14uhGBQl9tzmi1Qwq4kqVOg==",
      "dev": true,
      "requires": {}
    },
    "postcss-image-set-function": {
      "version": "4.0.7",
      "resolved": "https://registry.npmjs.org/postcss-image-set-function/-/postcss-image-set-function-4.0.7.tgz",
      "integrity": "sha512-9T2r9rsvYzm5ndsBE8WgtrMlIT7VbtTfE7b3BQnudUqnBcBo7L758oc+o+pdj/dUV0l5wjwSdjeOH2DZtfv8qw==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-import": {
      "version": "14.1.0",
      "resolved": "https://registry.npmjs.org/postcss-import/-/postcss-import-14.1.0.tgz",
      "integrity": "sha512-flwI+Vgm4SElObFVPpTIT7SU7R3qk2L7PyduMcokiaVKuWv9d/U+Gm/QAd8NDLuykTWTkcrjOeD2Pp1rMeBTGw==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.0.0",
        "read-cache": "^1.0.0",
        "resolve": "^1.1.7"
      }
    },
    "postcss-initial": {
      "version": "4.0.1",
      "dev": true,
      "requires": {}
    },
    "postcss-lab-function": {
      "version": "4.2.1",
      "resolved": "https://registry.npmjs.org/postcss-lab-function/-/postcss-lab-function-4.2.1.tgz",
      "integrity": "sha512-xuXll4isR03CrQsmxyz92LJB2xX9n+pZJ5jE9JgcnmsCammLyKdlzrBin+25dy6wIjfhJpKBAN80gsTlCgRk2w==",
      "dev": true,
      "requires": {
        "@csstools/postcss-progressive-custom-properties": "^1.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-loader": {
      "version": "6.2.1",
      "dev": true,
      "requires": {
        "cosmiconfig": "^7.0.0",
        "klona": "^2.0.5",
        "semver": "^7.3.5"
      },
      "dependencies": {
        "klona": {
          "version": "2.0.5",
          "dev": true
        },
        "semver": {
          "version": "7.3.5",
          "dev": true,
          "requires": {
            "lru-cache": "^6.0.0"
          }
        }
      }
    },
    "postcss-logical": {
      "version": "5.0.4",
      "resolved": "https://registry.npmjs.org/postcss-logical/-/postcss-logical-5.0.4.tgz",
      "integrity": "sha512-RHXxplCeLh9VjinvMrZONq7im4wjWGlRJAqmAVLXyZaXwfDWP73/oq4NdIp+OZwhQUMj0zjqDfM5Fj7qby+B4g==",
      "dev": true,
      "requires": {}
    },
    "postcss-media-minmax": {
      "version": "5.0.0",
      "dev": true,
      "requires": {}
    },
    "postcss-media-query-parser": {
      "version": "0.2.3",
      "dev": true
    },
    "postcss-merge-longhand": {
      "version": "5.1.6",
      "resolved": "https://registry.npmjs.org/postcss-merge-longhand/-/postcss-merge-longhand-5.1.6.tgz",
      "integrity": "sha512-6C/UGF/3T5OE2CEbOuX7iNO63dnvqhGZeUnKkDeifebY0XqkkvrctYSZurpNE902LDf2yKwwPFgotnfSoPhQiw==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0",
        "stylehacks": "^5.1.0"
      }
    },
    "postcss-merge-rules": {
      "version": "5.1.2",
      "resolved": "https://registry.npmjs.org/postcss-merge-rules/-/postcss-merge-rules-5.1.2.tgz",
      "integrity": "sha512-zKMUlnw+zYCWoPN6yhPjtcEdlJaMUZ0WyVcxTAmw3lkkN/NDMRkOkiuctQEoWAOvH7twaxUUdvBWl0d4+hifRQ==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0",
        "cssnano-utils": "^3.1.0",
        "postcss-selector-parser": "^6.0.5"
      }
    },
    "postcss-minify-font-values": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-minify-font-values/-/postcss-minify-font-values-5.1.0.tgz",
      "integrity": "sha512-el3mYTgx13ZAPPirSVsHqFzl+BBBDrXvbySvPGFnQcTI4iNslrPaFq4muTkLZmKlGk4gyFAYUBMH30+HurREyA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-minify-gradients": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-minify-gradients/-/postcss-minify-gradients-5.1.1.tgz",
      "integrity": "sha512-VGvXMTpCEo4qHTNSa9A0a3D+dxGFZCYwR6Jokk+/3oB6flu2/PnPXAh2x7x52EkY5xlIHLm+Le8tJxe/7TNhzw==",
      "dev": true,
      "requires": {
        "colord": "^2.9.1",
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-minify-params": {
      "version": "5.1.3",
      "resolved": "https://registry.npmjs.org/postcss-minify-params/-/postcss-minify-params-5.1.3.tgz",
      "integrity": "sha512-bkzpWcjykkqIujNL+EVEPOlLYi/eZ050oImVtHU7b4lFS82jPnsCb44gvC6pxaNt38Els3jWYDHTjHKf0koTgg==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-minify-selectors": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/postcss-minify-selectors/-/postcss-minify-selectors-5.2.1.tgz",
      "integrity": "sha512-nPJu7OjZJTsVUmPdm2TcaiohIwxP+v8ha9NehQ2ye9szv4orirRU3SDdtUmKH+10nzn0bAyOXZ0UEr7OpvLehg==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.5"
      }
    },
    "postcss-modules-extract-imports": {
      "version": "3.0.0",
      "dev": true,
      "requires": {}
    },
    "postcss-modules-local-by-default": {
      "version": "4.0.0",
      "dev": true,
      "requires": {
        "icss-utils": "^5.0.0",
        "postcss-selector-parser": "^6.0.2",
        "postcss-value-parser": "^4.1.0"
      }
    },
    "postcss-modules-scope": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.4"
      }
    },
    "postcss-modules-values": {
      "version": "4.0.0",
      "dev": true,
      "requires": {
        "icss-utils": "^5.0.0"
      }
    },
    "postcss-nested": {
      "version": "5.0.6",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.6"
      }
    },
    "postcss-nesting": {
      "version": "10.2.0",
      "resolved": "https://registry.npmjs.org/postcss-nesting/-/postcss-nesting-10.2.0.tgz",
      "integrity": "sha512-EwMkYchxiDiKUhlJGzWsD9b2zvq/r2SSubcRrgP+jujMXFzqvANLt16lJANC+5uZ6hjI7lpRmI6O8JIl+8l1KA==",
      "dev": true,
      "requires": {
        "@csstools/selector-specificity": "^2.0.0",
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "postcss-normalize-charset": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-charset/-/postcss-normalize-charset-5.1.0.tgz",
      "integrity": "sha512-mSgUJ+pd/ldRGVx26p2wz9dNZ7ji6Pn8VWBajMXFf8jk7vUoSrZ2lt/wZR7DtlZYKesmZI680qjr2CeFF2fbUg==",
      "dev": true,
      "requires": {}
    },
    "postcss-normalize-display-values": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-display-values/-/postcss-normalize-display-values-5.1.0.tgz",
      "integrity": "sha512-WP4KIM4o2dazQXWmFaqMmcvsKmhdINFblgSeRgn8BJ6vxaMyaJkwAzpPpuvSIoG/rmX3M+IrRZEz2H0glrQNEA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-positions": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-positions/-/postcss-normalize-positions-5.1.1.tgz",
      "integrity": "sha512-6UpCb0G4eofTCQLFVuI3EVNZzBNPiIKcA1AKVka+31fTVySphr3VUgAIULBhxZkKgwLImhzMR2Bw1ORK+37INg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-repeat-style": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-repeat-style/-/postcss-normalize-repeat-style-5.1.1.tgz",
      "integrity": "sha512-mFpLspGWkQtBcWIRFLmewo8aC3ImN2i/J3v8YCFUwDnPu3Xz4rLohDO26lGjwNsQxB3YF0KKRwspGzE2JEuS0g==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-string": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-string/-/postcss-normalize-string-5.1.0.tgz",
      "integrity": "sha512-oYiIJOf4T9T1N4i+abeIc7Vgm/xPCGih4bZz5Nm0/ARVJ7K6xrDlLwvwqOydvyL3RHNf8qZk6vo3aatiw/go3w==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-timing-functions": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-timing-functions/-/postcss-normalize-timing-functions-5.1.0.tgz",
      "integrity": "sha512-DOEkzJ4SAXv5xkHl0Wa9cZLF3WCBhF3o1SKVxKQAa+0pYKlueTpCgvkFAHfk+Y64ezX9+nITGrDZeVGgITJXjg==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-unicode": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-unicode/-/postcss-normalize-unicode-5.1.0.tgz",
      "integrity": "sha512-J6M3MizAAZ2dOdSjy2caayJLQT8E8K9XjLce8AUQMwOrCvjCHv24aLC/Lps1R1ylOfol5VIDMaM/Lo9NGlk1SQ==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-url": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-normalize-url/-/postcss-normalize-url-5.1.0.tgz",
      "integrity": "sha512-5upGeDO+PVthOxSmds43ZeMeZfKH+/DKgGRD7TElkkyS46JXAUhMzIKiCa7BabPeIy3AQcTkXwVVN7DbqsiCew==",
      "dev": true,
      "requires": {
        "normalize-url": "^6.0.1",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-normalize-whitespace": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-normalize-whitespace/-/postcss-normalize-whitespace-5.1.1.tgz",
      "integrity": "sha512-83ZJ4t3NUDETIHTa3uEg6asWjSBYL5EdkVB0sDncx9ERzOKBVJIUeDO9RyA9Zwtig8El1d79HBp0JEi8wvGQnA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-opacity-percentage": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/postcss-opacity-percentage/-/postcss-opacity-percentage-1.1.2.tgz",
      "integrity": "sha512-lyUfF7miG+yewZ8EAk9XUBIlrHyUE6fijnesuz+Mj5zrIHIEw6KcIZSOk/elVMqzLvREmXB83Zi/5QpNRYd47w==",
      "dev": true
    },
    "postcss-ordered-values": {
      "version": "5.1.3",
      "resolved": "https://registry.npmjs.org/postcss-ordered-values/-/postcss-ordered-values-5.1.3.tgz",
      "integrity": "sha512-9UO79VUhPwEkzbb3RNpqqghc6lcYej1aveQteWY+4POIwlqkYE21HKWaLDF6lWNuqCobEAyTovVhtI32Rbv2RQ==",
      "dev": true,
      "requires": {
        "cssnano-utils": "^3.1.0",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-overflow-shorthand": {
      "version": "3.0.4",
      "resolved": "https://registry.npmjs.org/postcss-overflow-shorthand/-/postcss-overflow-shorthand-3.0.4.tgz",
      "integrity": "sha512-otYl/ylHK8Y9bcBnPLo3foYFLL6a6Ak+3EQBPOTR7luMYCOsiVTUk1iLvNf6tVPNGXcoL9Hoz37kpfriRIFb4A==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-page-break": {
      "version": "3.0.4",
      "dev": true,
      "requires": {}
    },
    "postcss-place": {
      "version": "7.0.5",
      "resolved": "https://registry.npmjs.org/postcss-place/-/postcss-place-7.0.5.tgz",
      "integrity": "sha512-wR8igaZROA6Z4pv0d+bvVrvGY4GVHihBCBQieXFY3kuSuMyOmEnnfFzHl/tQuqHZkfkIVBEbDvYcFfHmpSet9g==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-preset-env": {
      "version": "7.8.2",
      "resolved": "https://registry.npmjs.org/postcss-preset-env/-/postcss-preset-env-7.8.2.tgz",
      "integrity": "sha512-rSMUEaOCnovKnwc5LvBDHUDzpGP+nrUeWZGWt9M72fBvckCi45JmnJigUr4QG4zZeOHmOCNCZnd2LKDvP++ZuQ==",
      "dev": true,
      "requires": {
        "@csstools/postcss-cascade-layers": "^1.1.0",
        "@csstools/postcss-color-function": "^1.1.1",
        "@csstools/postcss-font-format-keywords": "^1.0.1",
        "@csstools/postcss-hwb-function": "^1.0.2",
        "@csstools/postcss-ic-unit": "^1.0.1",
        "@csstools/postcss-is-pseudo-class": "^2.0.7",
        "@csstools/postcss-nested-calc": "^1.0.0",
        "@csstools/postcss-normalize-display-values": "^1.0.1",
        "@csstools/postcss-oklab-function": "^1.1.1",
        "@csstools/postcss-progressive-custom-properties": "^1.3.0",
        "@csstools/postcss-stepped-value-functions": "^1.0.1",
        "@csstools/postcss-text-decoration-shorthand": "^1.0.0",
        "@csstools/postcss-trigonometric-functions": "^1.0.2",
        "@csstools/postcss-unset-value": "^1.0.2",
        "autoprefixer": "^10.4.11",
        "browserslist": "^4.21.3",
        "css-blank-pseudo": "^3.0.3",
        "css-has-pseudo": "^3.0.4",
        "css-prefers-color-scheme": "^6.0.3",
        "cssdb": "^7.0.1",
        "postcss-attribute-case-insensitive": "^5.0.2",
        "postcss-clamp": "^4.1.0",
        "postcss-color-functional-notation": "^4.2.4",
        "postcss-color-hex-alpha": "^8.0.4",
        "postcss-color-rebeccapurple": "^7.1.1",
        "postcss-custom-media": "^8.0.2",
        "postcss-custom-properties": "^12.1.9",
        "postcss-custom-selectors": "^6.0.3",
        "postcss-dir-pseudo-class": "^6.0.5",
        "postcss-double-position-gradients": "^3.1.2",
        "postcss-env-function": "^4.0.6",
        "postcss-focus-visible": "^6.0.4",
        "postcss-focus-within": "^5.0.4",
        "postcss-font-variant": "^5.0.0",
        "postcss-gap-properties": "^3.0.5",
        "postcss-image-set-function": "^4.0.7",
        "postcss-initial": "^4.0.1",
        "postcss-lab-function": "^4.2.1",
        "postcss-logical": "^5.0.4",
        "postcss-media-minmax": "^5.0.0",
        "postcss-nesting": "^10.2.0",
        "postcss-opacity-percentage": "^1.1.2",
        "postcss-overflow-shorthand": "^3.0.4",
        "postcss-page-break": "^3.0.4",
        "postcss-place": "^7.0.5",
        "postcss-pseudo-class-any-link": "^7.1.6",
        "postcss-replace-overflow-wrap": "^4.0.0",
        "postcss-selector-not": "^6.0.1",
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-pseudo-class-any-link": {
      "version": "7.1.6",
      "resolved": "https://registry.npmjs.org/postcss-pseudo-class-any-link/-/postcss-pseudo-class-any-link-7.1.6.tgz",
      "integrity": "sha512-9sCtZkO6f/5ML9WcTLcIyV1yz9D1rf0tWc+ulKcvV30s0iZKS/ONyETvoWsr6vnrmW+X+KmuK3gV/w5EWnT37w==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "postcss-reduce-initial": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-reduce-initial/-/postcss-reduce-initial-5.1.0.tgz",
      "integrity": "sha512-5OgTUviz0aeH6MtBjHfbr57tml13PuedK/Ecg8szzd4XRMbYxH4572JFG067z+FqBIf6Zp/d+0581glkvvWMFw==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "caniuse-api": "^3.0.0"
      }
    },
    "postcss-reduce-transforms": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-reduce-transforms/-/postcss-reduce-transforms-5.1.0.tgz",
      "integrity": "sha512-2fbdbmgir5AvpW9RLtdONx1QoYG2/EtqpNQbFASDlixBbAYuTcJ0dECwlqNqH7VbaUnEnh8SrxOe2sRIn24XyQ==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0"
      }
    },
    "postcss-replace-overflow-wrap": {
      "version": "4.0.0",
      "dev": true,
      "requires": {}
    },
    "postcss-resolve-nested-selector": {
      "version": "0.1.1",
      "dev": true
    },
    "postcss-safe-parser": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/postcss-safe-parser/-/postcss-safe-parser-6.0.0.tgz",
      "integrity": "sha512-FARHN8pwH+WiS2OPCxJI8FuRJpTVnn6ZNFiqAM2aeW2LwTHWWmWgIyKC6cUo0L8aeKiF/14MNvnpls6R2PBeMQ==",
      "dev": true,
      "requires": {}
    },
    "postcss-scss": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/postcss-scss/-/postcss-scss-4.0.5.tgz",
      "integrity": "sha512-F7xpB6TrXyqUh3GKdyB4Gkp3QL3DDW1+uI+gxx/oJnUt/qXI4trj5OGlp9rOKdoABGULuqtqeG+3HEVQk4DjmA==",
      "dev": true,
      "requires": {}
    },
    "postcss-selector-not": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/postcss-selector-not/-/postcss-selector-not-6.0.1.tgz",
      "integrity": "sha512-1i9affjAe9xu/y9uqWH+tD4r6/hDaXJruk8xn2x1vzxC2U3J3LKO3zJW4CyxlNhA56pADJ/djpEwpH1RClI2rQ==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.10"
      }
    },
    "postcss-selector-parser": {
      "version": "6.0.10",
      "resolved": "https://registry.npmjs.org/postcss-selector-parser/-/postcss-selector-parser-6.0.10.tgz",
      "integrity": "sha512-IQ7TZdoaqbT+LCpShg46jnZVlhWD2w6iQYAcYXfHARZ7X1t/UGhhceQDs5X0cGqKvYlHNOuv7Oa1xmb0oQuA3w==",
      "dev": true,
      "requires": {
        "cssesc": "^3.0.0",
        "util-deprecate": "^1.0.2"
      }
    },
    "postcss-sorting": {
      "version": "7.0.1",
      "resolved": "https://registry.npmjs.org/postcss-sorting/-/postcss-sorting-7.0.1.tgz",
      "integrity": "sha512-iLBFYz6VRYyLJEJsBJ8M3TCqNcckVzz4wFounSc5Oez35ogE/X+aoC5fFu103Ot7NyvjU3/xqIXn93Gp3kJk4g==",
      "dev": true,
      "requires": {}
    },
    "postcss-svgo": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/postcss-svgo/-/postcss-svgo-5.1.0.tgz",
      "integrity": "sha512-D75KsH1zm5ZrHyxPakAxJWtkyXew5qwS70v56exwvw542d9CRtTo78K0WeFxZB4G7JXKKMbEZtZayTGdIky/eA==",
      "dev": true,
      "requires": {
        "postcss-value-parser": "^4.2.0",
        "svgo": "^2.7.0"
      }
    },
    "postcss-unique-selectors": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/postcss-unique-selectors/-/postcss-unique-selectors-5.1.1.tgz",
      "integrity": "sha512-5JiODlELrz8L2HwxfPnhOWZYWDxVHWL83ufOv84NrcgipI7TaeRsatAhK4Tr2/ZiYldpK/wBvw5BD3qfaK96GA==",
      "dev": true,
      "requires": {
        "postcss-selector-parser": "^6.0.5"
      }
    },
    "postcss-value-parser": {
      "version": "4.2.0"
    },
    "prelude-ls": {
      "version": "1.2.1",
      "dev": true
    },
    "process-nextick-args": {
      "version": "2.0.1",
      "dev": true
    },
    "promise-inflight": {
      "version": "1.0.1",
      "dev": true
    },
    "promise-retry": {
      "version": "2.0.1",
      "dev": true,
      "requires": {
        "err-code": "^2.0.2",
        "retry": "^0.12.0"
      }
    },
    "psl": {
      "version": "1.8.0",
      "dev": true
    },
    "punycode": {
      "version": "2.1.1",
      "dev": true
    },
    "qs": {
      "version": "6.5.2",
      "dev": true
    },
    "queue-microtask": {
      "version": "1.2.3",
      "resolved": "https://registry.npmjs.org/queue-microtask/-/queue-microtask-1.2.3.tgz",
      "integrity": "sha512-NuaNSa6flKT5JaSYQzJok04JzTL1CA6aGhv5rfLW3PgqA+M2ChpZQnAC8h8i4ZFkBS8X5RqkDBHA7r4hej3K9A==",
      "dev": true
    },
    "quick-lru": {
      "version": "4.0.1",
      "dev": true
    },
    "randombytes": {
      "version": "2.1.0",
      "dev": true,
      "requires": {
        "safe-buffer": "^5.1.0"
      }
    },
    "read-cache": {
      "version": "1.0.0",
      "dev": true,
      "requires": {
        "pify": "^2.3.0"
      }
    },
    "read-pkg-up": {
      "version": "7.0.1",
      "dev": true,
      "requires": {
        "find-up": "^4.1.0",
        "read-pkg": "^5.2.0",
        "type-fest": "^0.8.1"
      },
      "dependencies": {
        "find-up": {
          "version": "4.1.0",
          "dev": true,
          "requires": {
            "locate-path": "^5.0.0",
            "path-exists": "^4.0.0"
          }
        },
        "locate-path": {
          "version": "5.0.0",
          "dev": true,
          "requires": {
            "p-locate": "^4.1.0"
          }
        },
        "p-locate": {
          "version": "4.1.0",
          "dev": true,
          "requires": {
            "p-limit": "^2.2.0"
          }
        },
        "parse-json": {
          "version": "5.1.0",
          "dev": true,
          "requires": {
            "@babel/code-frame": "^7.0.0",
            "error-ex": "^1.3.1",
            "json-parse-even-better-errors": "^2.3.0",
            "lines-and-columns": "^1.1.6"
          }
        },
        "path-exists": {
          "version": "4.0.0",
          "dev": true
        },
        "read-pkg": {
          "version": "5.2.0",
          "dev": true,
          "requires": {
            "@types/normalize-package-data": "^2.4.0",
            "normalize-package-data": "^2.5.0",
            "parse-json": "^5.0.0",
            "type-fest": "^0.6.0"
          },
          "dependencies": {
            "type-fest": {
              "version": "0.6.0",
              "dev": true
            }
          }
        }
      }
    },
    "readable-stream": {
      "version": "3.6.0",
      "dev": true,
      "requires": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      }
    },
    "readdirp": {
      "version": "3.6.0",
      "dev": true,
      "requires": {
        "picomatch": "^2.2.1"
      }
    },
    "rechoir": {
      "version": "0.7.1",
      "dev": true,
      "requires": {
        "resolve": "^1.9.0"
      }
    },
    "redent": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "indent-string": "^4.0.0",
        "strip-indent": "^3.0.0"
      }
    },
    "regenerate": {
      "version": "1.4.2",
      "dev": true
    },
    "regenerate-unicode-properties": {
      "version": "10.1.0",
      "resolved": "https://registry.npmjs.org/regenerate-unicode-properties/-/regenerate-unicode-properties-10.1.0.tgz",
      "integrity": "sha512-d1VudCLoIGitcU/hEg2QqvyGZQmdC0Lf8BqdOMXGFSvJP4bNV1+XqbPQeHHLD51Jh4QJJ225dlIFvY4Ly6MXmQ==",
      "dev": true,
      "requires": {
        "regenerate": "^1.4.2"
      }
    },
    "regenerator-runtime": {
      "version": "0.13.9",
      "resolved": "https://registry.npmjs.org/regenerator-runtime/-/regenerator-runtime-0.13.9.tgz",
      "integrity": "sha512-p3VT+cOEgxFsRRA9X4lkI1E+k2/CtnKtU4gcxyaCUreilL/vqI6CdZ3wxVUx3UOUg+gnUOQQcRI7BmSI656MYA==",
      "dev": true
    },
    "regenerator-transform": {
      "version": "0.15.0",
      "resolved": "https://registry.npmjs.org/regenerator-transform/-/regenerator-transform-0.15.0.tgz",
      "integrity": "sha512-LsrGtPmbYg19bcPHwdtmXwbW+TqNvtY4riE3P83foeHRroMbH6/2ddFBfab3t7kbzc7v7p4wbkIecHImqt0QNg==",
      "dev": true,
      "requires": {
        "@babel/runtime": "^7.8.4"
      }
    },
    "regexpp": {
      "version": "3.2.0",
      "dev": true
    },
    "regexpu-core": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/regexpu-core/-/regexpu-core-5.2.1.tgz",
      "integrity": "sha512-HrnlNtpvqP1Xkb28tMhBUO2EbyUHdQlsnlAhzWcwHy8WJR53UWr7/MAvqrsQKMbV4qdpv03oTMG8iIhfsPFktQ==",
      "dev": true,
      "requires": {
        "regenerate": "^1.4.2",
        "regenerate-unicode-properties": "^10.1.0",
        "regjsgen": "^0.7.1",
        "regjsparser": "^0.9.1",
        "unicode-match-property-ecmascript": "^2.0.0",
        "unicode-match-property-value-ecmascript": "^2.0.0"
      }
    },
    "regjsgen": {
      "version": "0.7.1",
      "resolved": "https://registry.npmjs.org/regjsgen/-/regjsgen-0.7.1.tgz",
      "integrity": "sha512-RAt+8H2ZEzHeYWxZ3H2z6tF18zyyOnlcdaafLrm21Bguj7uZy6ULibiAFdXEtKQY4Sy7wDTwDiOazasMLc4KPA==",
      "dev": true
    },
    "regjsparser": {
      "version": "0.9.1",
      "resolved": "https://registry.npmjs.org/regjsparser/-/regjsparser-0.9.1.tgz",
      "integrity": "sha512-dQUtn90WanSNl+7mQKcXAgZxvUe7Z0SqXlgzv0za4LwiUhyzBC58yQO3liFoUgu8GiJVInAhJjkj1N0EtQ5nkQ==",
      "dev": true,
      "requires": {
        "jsesc": "~0.5.0"
      },
      "dependencies": {
        "jsesc": {
          "version": "0.5.0",
          "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-0.5.0.tgz",
          "integrity": "sha512-uZz5UnB7u4T9LvwmFqXii7pZSouaRPorGs5who1Ip7VO0wxanFvBL7GkM6dTHlgX+jhBApRetaWpnDabOeTcnA==",
          "dev": true
        }
      }
    },
    "request": {
      "version": "2.88.2",
      "dev": true,
      "requires": {
        "aws-sign2": "~0.7.0",
        "aws4": "^1.8.0",
        "caseless": "~0.12.0",
        "combined-stream": "~1.0.6",
        "extend": "~3.0.2",
        "forever-agent": "~0.6.1",
        "form-data": "~2.3.2",
        "har-validator": "~5.1.3",
        "http-signature": "~1.2.0",
        "is-typedarray": "~1.0.0",
        "isstream": "~0.1.2",
        "json-stringify-safe": "~5.0.1",
        "mime-types": "~2.1.19",
        "oauth-sign": "~0.9.0",
        "performance-now": "^2.1.0",
        "qs": "~6.5.2",
        "safe-buffer": "^5.1.2",
        "tough-cookie": "~2.5.0",
        "tunnel-agent": "^0.6.0",
        "uuid": "^3.3.2"
      }
    },
    "require-directory": {
      "version": "2.1.1",
      "dev": true
    },
    "require-from-string": {
      "version": "2.0.2",
      "dev": true
    },
    "resolve": {
      "version": "1.21.0",
      "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.21.0.tgz",
      "integrity": "sha512-3wCbTpk5WJlyE4mSOtDLhqQmGFi0/TD9VPwmiolnk8U0wRgMEktqCXd3vy5buTO3tljvalNvKrjHEfrd2WpEKA==",
      "dev": true,
      "requires": {
        "is-core-module": "^2.8.0",
        "path-parse": "^1.0.7",
        "supports-preserve-symlinks-flag": "^1.0.0"
      }
    },
    "resolve-cwd": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "resolve-from": "^5.0.0"
      },
      "dependencies": {
        "resolve-from": {
          "version": "5.0.0",
          "dev": true
        }
      }
    },
    "resolve-from": {
      "version": "4.0.0",
      "dev": true
    },
    "retry": {
      "version": "0.12.0",
      "dev": true
    },
    "reusify": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/reusify/-/reusify-1.0.4.tgz",
      "integrity": "sha512-U9nH88a3fc/ekCF1l0/UP1IosiuIjyTh7hBvXVMHYgVcfGvt897Xguj2UOLDeI5BG2m7/uwyaLVT6fbtCwTyzw==",
      "dev": true
    },
    "rfs": {
      "version": "9.0.6",
      "resolved": "https://registry.npmjs.org/rfs/-/rfs-9.0.6.tgz",
      "integrity": "sha512-KQ0EGVP4l3B3ynUZ1UNX3UoRAeswiX+ljGRcT+MoJKXRwXSUFpVZIPsqurH9pmY/AOGBFq7KKBq9fhRCkkg+SQ==",
      "requires": {
        "postcss-value-parser": "^4.1.0"
      }
    },
    "rimraf": {
      "version": "3.0.2",
      "dev": true,
      "requires": {
        "glob": "^7.1.3"
      }
    },
    "run-parallel": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/run-parallel/-/run-parallel-1.2.0.tgz",
      "integrity": "sha512-5l4VyZR86LZ/lDxZTR6jqL8AFE2S0IFLMP26AbjsLVADxHdhB/c0GUsH+y39UfCi3dzz8OlQuPmnaJOMoDHQBA==",
      "dev": true,
      "requires": {
        "queue-microtask": "^1.2.2"
      }
    },
    "rxjs": {
      "version": "7.5.7",
      "resolved": "https://registry.npmjs.org/rxjs/-/rxjs-7.5.7.tgz",
      "integrity": "sha512-z9MzKh/UcOqB3i20H6rtrlaE/CgjLOvheWK/9ILrbhROGTweAi1BaFsTT9FbwZi5Trr1qNRs+MXkhmR06awzQA==",
      "dev": true,
      "requires": {
        "tslib": "^2.1.0"
      }
    },
    "safe-buffer": {
      "version": "5.1.2",
      "dev": true
    },
    "safer-buffer": {
      "version": "2.1.2",
      "dev": true
    },
    "sass": {
      "version": "1.55.0",
      "resolved": "https://registry.npmjs.org/sass/-/sass-1.55.0.tgz",
      "integrity": "sha512-Pk+PMy7OGLs9WaxZGJMn7S96dvlyVBwwtToX895WmCpAOr5YiJYEUJfiJidMuKb613z2xNWcXCHEuOvjZbqC6A==",
      "dev": true,
      "requires": {
        "chokidar": ">=3.0.0 <4.0.0",
        "immutable": "^4.0.0",
        "source-map-js": ">=0.6.2 <2.0.0"
      }
    },
    "sass-graph": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/sass-graph/-/sass-graph-4.0.1.tgz",
      "integrity": "sha512-5YCfmGBmxoIRYHnKK2AKzrAkCoQ8ozO+iumT8K4tXJXRVCPf+7s1/9KxTSW3Rbvf+7Y7b4FR3mWyLnQr3PHocA==",
      "dev": true,
      "requires": {
        "glob": "^7.0.0",
        "lodash": "^4.17.11",
        "scss-tokenizer": "^0.4.3",
        "yargs": "^17.2.1"
      }
    },
    "sass-loader": {
      "version": "12.6.0",
      "resolved": "https://registry.npmjs.org/sass-loader/-/sass-loader-12.6.0.tgz",
      "integrity": "sha512-oLTaH0YCtX4cfnJZxKSLAyglED0naiYfNG1iXfU5w1LNZ+ukoA5DtyDIN5zmKVZwYNJP4KRc5Y3hkWga+7tYfA==",
      "dev": true,
      "requires": {
        "klona": "^2.0.4",
        "neo-async": "^2.6.2"
      }
    },
    "schema-utils": {
      "version": "2.7.1",
      "dev": true,
      "requires": {
        "@types/json-schema": "^7.0.5",
        "ajv": "^6.12.4",
        "ajv-keywords": "^3.5.2"
      }
    },
    "scss-tokenizer": {
      "version": "0.4.3",
      "resolved": "https://registry.npmjs.org/scss-tokenizer/-/scss-tokenizer-0.4.3.tgz",
      "integrity": "sha512-raKLgf1LI5QMQnG+RxHz6oK0sL3x3I4FN2UDLqgLOGO8hodECNnNh5BXn7fAyBxrA8zVzdQizQ6XjNJQ+uBwMw==",
      "dev": true,
      "requires": {
        "js-base64": "^2.4.9",
        "source-map": "^0.7.3"
      }
    },
    "semver": {
      "version": "5.7.1",
      "dev": true
    },
    "serialize-javascript": {
      "version": "6.0.0",
      "dev": true,
      "requires": {
        "randombytes": "^2.1.0"
      }
    },
    "set-blocking": {
      "version": "2.0.0",
      "dev": true
    },
    "shallow-clone": {
      "version": "3.0.1",
      "dev": true,
      "requires": {
        "kind-of": "^6.0.2"
      }
    },
    "shebang-command": {
      "version": "2.0.0",
      "dev": true,
      "requires": {
        "shebang-regex": "^3.0.0"
      }
    },
    "shebang-regex": {
      "version": "3.0.0",
      "dev": true
    },
    "shell-quote": {
      "version": "1.7.3",
      "resolved": "https://registry.npmjs.org/shell-quote/-/shell-quote-1.7.3.tgz",
      "integrity": "sha512-Vpfqwm4EnqGdlsBFNmHhxhElJYrdfcxPThu+ryKS5J8L/fhAwLazFZtq+S+TWZ9ANj2piSQLGj6NQg+lKPmxrw==",
      "dev": true
    },
    "shopify-frontend-api": {
      "version": "git+ssh://git@github.com/ohmybrew/Shopify-Frontend-Helper.git#b2c85a057de1c9ba84b5e38ed8de22bd017a8510",
      "from": "shopify-frontend-api@github:ohmybrew/Shopify-Frontend-Helper"
    },
    "signal-exit": {
      "version": "3.0.7",
      "resolved": "https://registry.npmjs.org/signal-exit/-/signal-exit-3.0.7.tgz",
      "integrity": "sha512-wnD2ZE+l+SPC/uoS0vXeE9L1+0wuaMqKlfz9AMUo38JsyLSBWSFcHR1Rri62LZc12vLr1gb3jl7iwQhgwpAbGQ==",
      "dev": true
    },
    "slash": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/slash/-/slash-4.0.0.tgz",
      "integrity": "sha512-3dOsAHXXUkQTpOYcoAxLIorMTp4gIQr5IW3iVb7A7lFIp0VHhnynm9izx6TssdrIcVIESAlVjtnO2K8bg+Coew==",
      "dev": true
    },
    "slice-ansi": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/slice-ansi/-/slice-ansi-4.0.0.tgz",
      "integrity": "sha512-qMCMfhY040cVHT43K9BFygqYbUPFZKHOg7K73mtTWJRb8pyP3fzf4Ixd5SzdEJQ6MRUg/WBnOLxghZtKKurENQ==",
      "dev": true,
      "requires": {
        "ansi-styles": "^4.0.0",
        "astral-regex": "^2.0.0",
        "is-fullwidth-code-point": "^3.0.0"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
          "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
          "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
          "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
          "dev": true
        },
        "is-fullwidth-code-point": {
          "version": "3.0.0",
          "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
          "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
          "dev": true
        }
      }
    },
    "slick-carousel": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/slick-carousel/-/slick-carousel-1.8.1.tgz",
      "integrity": "sha512-XB9Ftrf2EEKfzoQXt3Nitrt/IPbT+f1fgqBdoxO3W/+JYvtEOW6EgxnWfr9GH6nmULv7Y2tPmEX3koxThVmebA==",
      "requires": {}
    },
    "smart-buffer": {
      "version": "4.2.0",
      "dev": true
    },
    "socks": {
      "version": "2.6.1",
      "dev": true,
      "requires": {
        "ip": "^1.1.5",
        "smart-buffer": "^4.1.0"
      }
    },
    "socks-proxy-agent": {
      "version": "6.1.1",
      "dev": true,
      "requires": {
        "agent-base": "^6.0.2",
        "debug": "^4.3.1",
        "socks": "^2.6.1"
      }
    },
    "source-map": {
      "version": "0.7.4",
      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.7.4.tgz",
      "integrity": "sha512-l3BikUxvPOcn5E74dZiq5BGsTb5yEwhaTSzccU6t4sDOH8NWJCstKO5QT2CvtFoK6F0saL7p9xHAqHOlCPJygA==",
      "dev": true
    },
    "source-map-js": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/source-map-js/-/source-map-js-1.0.2.tgz",
      "integrity": "sha512-R0XvVJ9WusLiqTCEiGCmICCMplcCkIwwR11mOSD9CR5u+IXYdiseeEuXCVAjS54zqwkLcPNnmU4OeJ6tUrWhDw==",
      "dev": true
    },
    "source-map-support": {
      "version": "0.5.21",
      "dev": true,
      "requires": {
        "buffer-from": "^1.0.0",
        "source-map": "^0.6.0"
      },
      "dependencies": {
        "source-map": {
          "version": "0.6.1",
          "dev": true
        }
      }
    },
    "spawn-command": {
      "version": "0.0.2-1",
      "dev": true
    },
    "spdx-correct": {
      "version": "3.1.1",
      "dev": true,
      "requires": {
        "spdx-expression-parse": "^3.0.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "spdx-exceptions": {
      "version": "2.3.0",
      "dev": true
    },
    "spdx-expression-parse": {
      "version": "3.0.1",
      "dev": true,
      "requires": {
        "spdx-exceptions": "^2.1.0",
        "spdx-license-ids": "^3.0.0"
      }
    },
    "spdx-license-ids": {
      "version": "3.0.6",
      "dev": true
    },
    "sshpk": {
      "version": "1.16.1",
      "dev": true,
      "requires": {
        "asn1": "~0.2.3",
        "assert-plus": "^1.0.0",
        "bcrypt-pbkdf": "^1.0.0",
        "dashdash": "^1.12.0",
        "ecc-jsbn": "~0.1.1",
        "getpass": "^0.1.1",
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.0.2",
        "tweetnacl": "~0.14.0"
      }
    },
    "stable": {
      "version": "0.1.8",
      "resolved": "https://registry.npmjs.org/stable/-/stable-0.1.8.tgz",
      "integrity": "sha512-ji9qxRnOVfcuLDySj9qzhGSEFVobyt1kIOSkj1qZzYLzq7Tos/oUUWvotUPQLlrsidqsK6tBH89Bc9kL5zHA6w==",
      "dev": true
    },
    "stdout-stream": {
      "version": "1.4.1",
      "dev": true,
      "requires": {
        "readable-stream": "^2.0.1"
      },
      "dependencies": {
        "readable-stream": {
          "version": "2.3.7",
          "dev": true,
          "requires": {
            "core-util-is": "~1.0.0",
            "inherits": "~2.0.3",
            "isarray": "~1.0.0",
            "process-nextick-args": "~2.0.0",
            "safe-buffer": "~5.1.1",
            "string_decoder": "~1.1.1",
            "util-deprecate": "~1.0.1"
          }
        },
        "string_decoder": {
          "version": "1.1.1",
          "dev": true,
          "requires": {
            "safe-buffer": "~5.1.0"
          }
        }
      }
    },
    "string_decoder": {
      "version": "1.3.0",
      "dev": true,
      "requires": {
        "safe-buffer": "~5.2.0"
      },
      "dependencies": {
        "safe-buffer": {
          "version": "5.2.1",
          "dev": true
        }
      }
    },
    "string-replace-loader": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/string-replace-loader/-/string-replace-loader-3.1.0.tgz",
      "integrity": "sha512-5AOMUZeX5HE/ylKDnEa/KKBqvlnFmRZudSOjVJHxhoJg9QYTwl1rECx7SLR8BBH7tfxb4Rp7EM2XVfQFxIhsbQ==",
      "dev": true,
      "requires": {
        "loader-utils": "^2.0.0",
        "schema-utils": "^3.0.0"
      },
      "dependencies": {
        "schema-utils": {
          "version": "3.1.1",
          "dev": true,
          "requires": {
            "@types/json-schema": "^7.0.8",
            "ajv": "^6.12.5",
            "ajv-keywords": "^3.5.2"
          }
        }
      }
    },
    "string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "dev": true,
      "requires": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "dependencies": {
        "is-fullwidth-code-point": {
          "version": "3.0.0",
          "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
          "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
          "dev": true
        }
      }
    },
    "strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "dev": true,
      "requires": {
        "ansi-regex": "^5.0.1"
      }
    },
    "strip-indent": {
      "version": "3.0.0",
      "dev": true,
      "requires": {
        "min-indent": "^1.0.0"
      }
    },
    "strip-json-comments": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
      "dev": true
    },
    "style-loader": {
      "version": "3.3.1",
      "dev": true,
      "requires": {}
    },
    "style-search": {
      "version": "0.1.0",
      "dev": true
    },
    "stylehacks": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/stylehacks/-/stylehacks-5.1.0.tgz",
      "integrity": "sha512-SzLmvHQTrIWfSgljkQCw2++C9+Ne91d/6Sp92I8c5uHTcy/PgeHamwITIbBW9wnFTY/3ZfSXR9HIL6Ikqmcu6Q==",
      "dev": true,
      "requires": {
        "browserslist": "^4.16.6",
        "postcss-selector-parser": "^6.0.4"
      }
    },
    "stylelint": {
      "version": "14.14.0",
      "resolved": "https://registry.npmjs.org/stylelint/-/stylelint-14.14.0.tgz",
      "integrity": "sha512-yUI+4xXfPHVnueYddSQ/e1GuEA/2wVhWQbGj16AmWLtQJtn28lVxfS4b0CsWyVRPgd3Auzi0NXOthIEUhtQmmA==",
      "dev": true,
      "requires": {
        "@csstools/selector-specificity": "^2.0.2",
        "balanced-match": "^2.0.0",
        "colord": "^2.9.3",
        "cosmiconfig": "^7.0.1",
        "css-functions-list": "^3.1.0",
        "debug": "^4.3.4",
        "fast-glob": "^3.2.12",
        "fastest-levenshtein": "^1.0.16",
        "file-entry-cache": "^6.0.1",
        "global-modules": "^2.0.0",
        "globby": "^11.1.0",
        "globjoin": "^0.1.4",
        "html-tags": "^3.2.0",
        "ignore": "^5.2.0",
        "import-lazy": "^4.0.0",
        "imurmurhash": "^0.1.4",
        "is-plain-object": "^5.0.0",
        "known-css-properties": "^0.25.0",
        "mathml-tag-names": "^2.1.3",
        "meow": "^9.0.0",
        "micromatch": "^4.0.5",
        "normalize-path": "^3.0.0",
        "picocolors": "^1.0.0",
        "postcss": "^8.4.17",
        "postcss-media-query-parser": "^0.2.3",
        "postcss-resolve-nested-selector": "^0.1.1",
        "postcss-safe-parser": "^6.0.0",
        "postcss-selector-parser": "^6.0.10",
        "postcss-value-parser": "^4.2.0",
        "resolve-from": "^5.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1",
        "style-search": "^0.1.0",
        "supports-hyperlinks": "^2.3.0",
        "svg-tags": "^1.0.0",
        "table": "^6.8.0",
        "v8-compile-cache": "^2.3.0",
        "write-file-atomic": "^4.0.2"
      },
      "dependencies": {
        "balanced-match": {
          "version": "2.0.0",
          "dev": true
        },
        "globby": {
          "version": "11.1.0",
          "resolved": "https://registry.npmjs.org/globby/-/globby-11.1.0.tgz",
          "integrity": "sha512-jhIXaOzy1sb8IyocaruWSn1TjmnBVs8Ayhcy83rmxNJ8q2uWKCAj3CnJY+KpGSXCueAPc0i05kVvVKtP1t9S3g==",
          "dev": true,
          "requires": {
            "array-union": "^2.1.0",
            "dir-glob": "^3.0.1",
            "fast-glob": "^3.2.9",
            "ignore": "^5.2.0",
            "merge2": "^1.4.1",
            "slash": "^3.0.0"
          }
        },
        "resolve-from": {
          "version": "5.0.0",
          "dev": true
        },
        "slash": {
          "version": "3.0.0",
          "resolved": "https://registry.npmjs.org/slash/-/slash-3.0.0.tgz",
          "integrity": "sha512-g9Q1haeby36OSStwb4ntCGGGaKsaVSjQ68fBxoQcutl5fS1vuY18H3wSt3jFyFtrkx+Kz0V1G85A4MyAdDMi2Q==",
          "dev": true
        }
      }
    },
    "stylelint-config-recommended": {
      "version": "9.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-config-recommended/-/stylelint-config-recommended-9.0.0.tgz",
      "integrity": "sha512-9YQSrJq4NvvRuTbzDsWX3rrFOzOlYBmZP+o513BJN/yfEmGSr0AxdvrWs0P/ilSpVV/wisamAHu5XSk8Rcf4CQ==",
      "dev": true,
      "requires": {}
    },
    "stylelint-config-standard": {
      "version": "29.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-config-standard/-/stylelint-config-standard-29.0.0.tgz",
      "integrity": "sha512-uy8tZLbfq6ZrXy4JKu3W+7lYLgRQBxYTUUB88vPgQ+ZzAxdrvcaSUW9hOMNLYBnwH+9Kkj19M2DHdZ4gKwI7tg==",
      "dev": true,
      "requires": {
        "stylelint-config-recommended": "^9.0.0"
      }
    },
    "stylelint-order": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/stylelint-order/-/stylelint-order-5.0.0.tgz",
      "integrity": "sha512-OWQ7pmicXufDw5BlRqzdz3fkGKJPgLyDwD1rFY3AIEfIH/LQY38Vu/85v8/up0I+VPiuGRwbc2Hg3zLAsJaiyw==",
      "dev": true,
      "requires": {
        "postcss": "^8.3.11",
        "postcss-sorting": "^7.0.1"
      }
    },
    "stylelint-scss": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/stylelint-scss/-/stylelint-scss-4.3.0.tgz",
      "integrity": "sha512-GvSaKCA3tipzZHoz+nNO7S02ZqOsdBzMiCx9poSmLlb3tdJlGddEX/8QzCOD8O7GQan9bjsvLMsO5xiw6IhhIQ==",
      "dev": true,
      "requires": {
        "lodash": "^4.17.21",
        "postcss-media-query-parser": "^0.2.3",
        "postcss-resolve-nested-selector": "^0.1.1",
        "postcss-selector-parser": "^6.0.6",
        "postcss-value-parser": "^4.1.0"
      }
    },
    "supports-color": {
      "version": "8.1.1",
      "dev": true,
      "requires": {
        "has-flag": "^4.0.0"
      },
      "dependencies": {
        "has-flag": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "supports-hyperlinks": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/supports-hyperlinks/-/supports-hyperlinks-2.3.0.tgz",
      "integrity": "sha512-RpsAZlpWcDwOPQA22aCH4J0t7L8JmAvsCxfOSEwm7cQs3LshN36QaTkwd70DnBOXDWGssw2eUoc8CaRWT0XunA==",
      "dev": true,
      "requires": {
        "has-flag": "^4.0.0",
        "supports-color": "^7.0.0"
      },
      "dependencies": {
        "has-flag": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/has-flag/-/has-flag-4.0.0.tgz",
          "integrity": "sha512-EykJT/Q1KjTWctppgIAgfSO0tKVuZUjhgMr17kqTumMl6Afv3EISleU7qZUzoXDFTAHTDC4NOoG/ZxU3EvlMPQ==",
          "dev": true
        },
        "supports-color": {
          "version": "7.2.0",
          "resolved": "https://registry.npmjs.org/supports-color/-/supports-color-7.2.0.tgz",
          "integrity": "sha512-qpCAvRl9stuOHveKsn7HncJRvv501qIacKzQlO/+Lwxc9+0q2wLyv4Dfvt80/DPn2pqOBsJdDiogXGR9+OvwRw==",
          "dev": true,
          "requires": {
            "has-flag": "^4.0.0"
          }
        }
      }
    },
    "supports-preserve-symlinks-flag": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/supports-preserve-symlinks-flag/-/supports-preserve-symlinks-flag-1.0.0.tgz",
      "integrity": "sha512-ot0WnXS9fgdkgIcePe6RHNk1WA8+muPa6cSjeR3V8K27q9BB1rTE3R1p7Hv0z1ZyAc8s6Vvv8DIyWf681MAt0w==",
      "dev": true
    },
    "svg-tags": {
      "version": "1.0.0",
      "dev": true
    },
    "svgo": {
      "version": "2.8.0",
      "resolved": "https://registry.npmjs.org/svgo/-/svgo-2.8.0.tgz",
      "integrity": "sha512-+N/Q9kV1+F+UeWYoSiULYo4xYSDQlTgb+ayMobAXPwMnLvop7oxKMo9OzIrX5x3eS4L4f2UHhc9axXwY8DpChg==",
      "dev": true,
      "requires": {
        "@trysound/sax": "0.2.0",
        "commander": "^7.2.0",
        "css-select": "^4.1.3",
        "css-tree": "^1.1.3",
        "csso": "^4.2.0",
        "picocolors": "^1.0.0",
        "stable": "^0.1.8"
      }
    },
    "table": {
      "version": "6.8.0",
      "resolved": "https://registry.npmjs.org/table/-/table-6.8.0.tgz",
      "integrity": "sha512-s/fitrbVeEyHKFa7mFdkuQMWlH1Wgw/yEXMt5xACT4ZpzWFluehAxRtUUQKPuWhaLAWhFcVx6w3oC8VKaUfPGA==",
      "dev": true,
      "requires": {
        "ajv": "^8.0.1",
        "lodash.truncate": "^4.4.2",
        "slice-ansi": "^4.0.0",
        "string-width": "^4.2.3",
        "strip-ansi": "^6.0.1"
      },
      "dependencies": {
        "ajv": {
          "version": "8.11.0",
          "resolved": "https://registry.npmjs.org/ajv/-/ajv-8.11.0.tgz",
          "integrity": "sha512-wGgprdCvMalC0BztXvitD2hC04YffAvtsUn93JbGXYLAtCUO4xd17mCCZQxUOItiBwZvJScWo8NIvQMQ71rdpg==",
          "dev": true,
          "requires": {
            "fast-deep-equal": "^3.1.1",
            "json-schema-traverse": "^1.0.0",
            "require-from-string": "^2.0.2",
            "uri-js": "^4.2.2"
          }
        },
        "json-schema-traverse": {
          "version": "1.0.0",
          "resolved": "https://registry.npmjs.org/json-schema-traverse/-/json-schema-traverse-1.0.0.tgz",
          "integrity": "sha512-NM8/P9n3XjXhIZn1lLhkFaACTOURQXjWhV4BA/RnOv8xvgqtqpAX9IO4mRQxSx1Rlo4tqzeqb0sOlruaOy3dug==",
          "dev": true
        }
      }
    },
    "tapable": {
      "version": "2.2.1",
      "resolved": "https://registry.npmjs.org/tapable/-/tapable-2.2.1.tgz",
      "integrity": "sha512-GNzQvQTOIP6RyTfE2Qxb8ZVlNmw0n88vp1szwWRimP02mnTsx3Wtn5qRdqY9w2XduFNUgvOwhNnQsjwCp+kqaQ==",
      "dev": true
    },
    "tar": {
      "version": "6.1.11",
      "dev": true,
      "requires": {
        "chownr": "^2.0.0",
        "fs-minipass": "^2.0.0",
        "minipass": "^3.0.0",
        "minizlib": "^2.1.1",
        "mkdirp": "^1.0.3",
        "yallist": "^4.0.0"
      },
      "dependencies": {
        "chownr": {
          "version": "2.0.0",
          "dev": true
        },
        "mkdirp": {
          "version": "1.0.4",
          "dev": true
        },
        "yallist": {
          "version": "4.0.0",
          "dev": true
        }
      }
    },
    "terser": {
      "version": "5.15.1",
      "resolved": "https://registry.npmjs.org/terser/-/terser-5.15.1.tgz",
      "integrity": "sha512-K1faMUvpm/FBxjBXud0LWVAGxmvoPbZbfTCYbSgaaYQaIXI3/TdI7a7ZGA73Zrou6Q8Zmz3oeUTsp/dj+ag2Xw==",
      "dev": true,
      "requires": {
        "@jridgewell/source-map": "^0.3.2",
        "acorn": "^8.5.0",
        "commander": "^2.20.0",
        "source-map-support": "~0.5.20"
      },
      "dependencies": {
        "commander": {
          "version": "2.20.3",
          "dev": true
        }
      }
    },
    "terser-webpack-plugin": {
      "version": "5.3.0",
      "dev": true,
      "requires": {
        "jest-worker": "^27.4.1",
        "schema-utils": "^3.1.1",
        "serialize-javascript": "^6.0.0",
        "source-map": "^0.6.1",
        "terser": "^5.7.2"
      },
      "dependencies": {
        "schema-utils": {
          "version": "3.1.1",
          "dev": true,
          "requires": {
            "@types/json-schema": "^7.0.8",
            "ajv": "^6.12.5",
            "ajv-keywords": "^3.5.2"
          }
        },
        "source-map": {
          "version": "0.6.1",
          "dev": true
        }
      }
    },
    "text-table": {
      "version": "0.2.0",
      "dev": true
    },
    "to-fast-properties": {
      "version": "2.0.0",
      "dev": true
    },
    "to-regex-range": {
      "version": "5.0.1",
      "dev": true,
      "requires": {
        "is-number": "^7.0.0"
      }
    },
    "tough-cookie": {
      "version": "2.5.0",
      "dev": true,
      "requires": {
        "psl": "^1.1.28",
        "punycode": "^2.1.1"
      }
    },
    "tree-kill": {
      "version": "1.2.2",
      "dev": true
    },
    "trim-newlines": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/trim-newlines/-/trim-newlines-3.0.1.tgz",
      "integrity": "sha512-c1PTsA3tYrIsLGkJkzHF+w9F2EyxfXGo4UyJc4pFL++FMjnq0HJS69T3M7d//gKrFKwy429bouPescbjecU+Zw==",
      "dev": true
    },
    "true-case-path": {
      "version": "1.0.3",
      "dev": true,
      "requires": {
        "glob": "^7.1.2"
      }
    },
    "ts-node": {
      "version": "10.9.1",
      "resolved": "https://registry.npmjs.org/ts-node/-/ts-node-10.9.1.tgz",
      "integrity": "sha512-NtVysVPkxxrwFGUUxGYhfux8k78pQB3JqYBXlLRZgdGUqTO5wU/UyHop5p70iEbGhB7q5KmiZiU0Y3KlJrScEw==",
      "dev": true,
      "requires": {
        "@cspotcode/source-map-support": "^0.8.0",
        "@tsconfig/node10": "^1.0.7",
        "@tsconfig/node12": "^1.0.7",
        "@tsconfig/node14": "^1.0.0",
        "@tsconfig/node16": "^1.0.2",
        "acorn": "^8.4.1",
        "acorn-walk": "^8.1.1",
        "arg": "^4.1.0",
        "create-require": "^1.1.0",
        "diff": "^4.0.1",
        "make-error": "^1.1.1",
        "v8-compile-cache-lib": "^3.0.1",
        "yn": "3.1.1"
      },
      "dependencies": {
        "diff": {
          "version": "4.0.2",
          "resolved": "https://registry.npmjs.org/diff/-/diff-4.0.2.tgz",
          "integrity": "sha512-58lmxKSA4BNyLz+HHMUzlOEpg09FV+ev6ZMe3vJihgdxzgcwZ8VoEEPmALCZG9LmqfVoNMMKpttIYTVG6uDY7A==",
          "dev": true
        }
      }
    },
    "tslib": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.4.0.tgz",
      "integrity": "sha512-d6xOpEDfsi2CZVlPQzGeux8XMwLT9hssAsaPYExaQMuYskwb+x1x7J371tWlbBdWHroy99KnVB6qIkUbs5X3UQ==",
      "dev": true
    },
    "tunnel-agent": {
      "version": "0.6.0",
      "dev": true,
      "requires": {
        "safe-buffer": "^5.0.1"
      }
    },
    "tweetnacl": {
      "version": "0.14.5",
      "dev": true
    },
    "type-check": {
      "version": "0.4.0",
      "dev": true,
      "requires": {
        "prelude-ls": "^1.2.1"
      }
    },
    "type-fest": {
      "version": "0.8.1",
      "dev": true
    },
    "typescript": {
      "version": "4.8.4",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-4.8.4.tgz",
      "integrity": "sha512-QCh+85mCy+h0IGff8r5XWzOVSbBO+KfeYrMQh7NJ58QujwcE22u+NUSmUxqF+un70P9GXKxa2HCNiTTMJknyjQ==",
      "dev": true
    },
    "unicode-canonical-property-names-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-canonical-property-names-ecmascript/-/unicode-canonical-property-names-ecmascript-2.0.0.tgz",
      "integrity": "sha512-yY5PpDlfVIU5+y/BSCxAJRBIS1Zc2dDG3Ujq+sR0U+JjUevW2JhocOF+soROYDSaAezOzOKuyyixhD6mBknSmQ==",
      "dev": true
    },
    "unicode-match-property-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-match-property-ecmascript/-/unicode-match-property-ecmascript-2.0.0.tgz",
      "integrity": "sha512-5kaZCrbp5mmbz5ulBkDkbY0SsPOjKqVS35VpL9ulMPfSl0J0Xsm+9Evphv9CoIZFwre7aJoa94AY6seMKGVN5Q==",
      "dev": true,
      "requires": {
        "unicode-canonical-property-names-ecmascript": "^2.0.0",
        "unicode-property-aliases-ecmascript": "^2.0.0"
      }
    },
    "unicode-match-property-value-ecmascript": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/unicode-match-property-value-ecmascript/-/unicode-match-property-value-ecmascript-2.0.0.tgz",
      "integrity": "sha512-7Yhkc0Ye+t4PNYzOGKedDhXbYIBe1XEQYQxOPyhcXNMJ0WCABqqj6ckydd6pWRZTHV4GuCPKdBAUiMc60tsKVw==",
      "dev": true
    },
    "unicode-property-aliases-ecmascript": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/unicode-property-aliases-ecmascript/-/unicode-property-aliases-ecmascript-2.1.0.tgz",
      "integrity": "sha512-6t3foTQI9qne+OZoVQB/8x8rk2k1eVy1gRXhV3oFQ5T6R1dqQ1xtin3XqSlx3+ATBkliTaR/hHyJBm+LVPNM8w==",
      "dev": true
    },
    "unique-filename": {
      "version": "1.1.1",
      "dev": true,
      "requires": {
        "unique-slug": "^2.0.0"
      }
    },
    "unique-slug": {
      "version": "2.0.2",
      "dev": true,
      "requires": {
        "imurmurhash": "^0.1.4"
      }
    },
    "update-browserslist-db": {
      "version": "1.0.10",
      "resolved": "https://registry.npmjs.org/update-browserslist-db/-/update-browserslist-db-1.0.10.tgz",
      "integrity": "sha512-OztqDenkfFkbSG+tRxBeAnCVPckDBcvibKd35yDONx6OU8N7sqgwc7rCbkJ/WcYtVRZ4ba68d6byhC21GFh7sQ==",
      "dev": true,
      "requires": {
        "escalade": "^3.1.1",
        "picocolors": "^1.0.0"
      }
    },
    "uri-js": {
      "version": "4.4.0",
      "dev": true,
      "requires": {
        "punycode": "^2.1.0"
      }
    },
    "util-deprecate": {
      "version": "1.0.2",
      "dev": true
    },
    "uuid": {
      "version": "3.4.0",
      "dev": true
    },
    "v8-compile-cache": {
      "version": "2.3.0",
      "dev": true
    },
    "v8-compile-cache-lib": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/v8-compile-cache-lib/-/v8-compile-cache-lib-3.0.1.tgz",
      "integrity": "sha512-wa7YjyUGfNZngI/vtK0UHAN+lgDCxBPCylVXGp0zu59Fz5aiGtNXaq3DhIov063MorB+VfufLh3JlF2KdTK3xg==",
      "dev": true
    },
    "validate-npm-package-license": {
      "version": "3.0.4",
      "dev": true,
      "requires": {
        "spdx-correct": "^3.0.0",
        "spdx-expression-parse": "^3.0.0"
      }
    },
    "verror": {
      "version": "1.10.0",
      "dev": true,
      "requires": {
        "assert-plus": "^1.0.0",
        "core-util-is": "1.0.2",
        "extsprintf": "^1.2.0"
      }
    },
    "watchpack": {
      "version": "2.4.0",
      "resolved": "https://registry.npmjs.org/watchpack/-/watchpack-2.4.0.tgz",
      "integrity": "sha512-Lcvm7MGST/4fup+ifyKi2hjyIAwcdI4HRgtvTpIUxBRhB+RFtUh8XtDOxUfctVCnhVi+QQj49i91OyvzkJl6cg==",
      "dev": true,
      "requires": {
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.1.2"
      }
    },
    "webpack": {
      "version": "5.74.0",
      "resolved": "https://registry.npmjs.org/webpack/-/webpack-5.74.0.tgz",
      "integrity": "sha512-A2InDwnhhGN4LYctJj6M1JEaGL7Luj6LOmyBHjcI8529cm5p6VXiTIW2sn6ffvEAKmveLzvu4jrihwXtPojlAA==",
      "dev": true,
      "requires": {
        "@types/eslint-scope": "^3.7.3",
        "@types/estree": "^0.0.51",
        "@webassemblyjs/ast": "1.11.1",
        "@webassemblyjs/wasm-edit": "1.11.1",
        "@webassemblyjs/wasm-parser": "1.11.1",
        "acorn": "^8.7.1",
        "acorn-import-assertions": "^1.7.6",
        "browserslist": "^4.14.5",
        "chrome-trace-event": "^1.0.2",
        "enhanced-resolve": "^5.10.0",
        "es-module-lexer": "^0.9.0",
        "eslint-scope": "5.1.1",
        "events": "^3.2.0",
        "glob-to-regexp": "^0.4.1",
        "graceful-fs": "^4.2.9",
        "json-parse-even-better-errors": "^2.3.1",
        "loader-runner": "^4.2.0",
        "mime-types": "^2.1.27",
        "neo-async": "^2.6.2",
        "schema-utils": "^3.1.0",
        "tapable": "^2.1.1",
        "terser-webpack-plugin": "^5.1.3",
        "watchpack": "^2.4.0",
        "webpack-sources": "^3.2.3"
      },
      "dependencies": {
        "eslint-scope": {
          "version": "5.1.1",
          "dev": true,
          "requires": {
            "esrecurse": "^4.3.0",
            "estraverse": "^4.1.1"
          }
        },
        "estraverse": {
          "version": "4.3.0",
          "dev": true
        },
        "schema-utils": {
          "version": "3.1.1",
          "dev": true,
          "requires": {
            "@types/json-schema": "^7.0.8",
            "ajv": "^6.12.5",
            "ajv-keywords": "^3.5.2"
          }
        }
      }
    },
    "webpack-cli": {
      "version": "4.10.0",
      "resolved": "https://registry.npmjs.org/webpack-cli/-/webpack-cli-4.10.0.tgz",
      "integrity": "sha512-NLhDfH/h4O6UOy+0LSso42xvYypClINuMNBVVzX4vX98TmTaTUxwRbXdhucbFMd2qLaCTcLq/PdYrvi8onw90w==",
      "dev": true,
      "requires": {
        "@discoveryjs/json-ext": "^0.5.0",
        "@webpack-cli/configtest": "^1.2.0",
        "@webpack-cli/info": "^1.5.0",
        "@webpack-cli/serve": "^1.7.0",
        "colorette": "^2.0.14",
        "commander": "^7.0.0",
        "cross-spawn": "^7.0.3",
        "fastest-levenshtein": "^1.0.12",
        "import-local": "^3.0.2",
        "interpret": "^2.2.0",
        "rechoir": "^0.7.0",
        "webpack-merge": "^5.7.3"
      }
    },
    "webpack-merge": {
      "version": "5.8.0",
      "dev": true,
      "requires": {
        "clone-deep": "^4.0.1",
        "wildcard": "^2.0.0"
      }
    },
    "webpack-remove-empty-scripts": {
      "version": "0.8.4",
      "resolved": "https://registry.npmjs.org/webpack-remove-empty-scripts/-/webpack-remove-empty-scripts-0.8.4.tgz",
      "integrity": "sha512-X9TVQ5mkl00aW33v1EAe4SZVzvz7EEpbXbNNDSUnY6IeePbrnODl7r3HS9Cy2Dq2pvY7FGfqWsL0GO1q2Vq6KA==",
      "dev": true,
      "requires": {
        "ansis": "1.4.0"
      }
    },
    "webpack-sources": {
      "version": "3.2.3",
      "resolved": "https://registry.npmjs.org/webpack-sources/-/webpack-sources-3.2.3.tgz",
      "integrity": "sha512-/DyMEOrDgLKKIG0fmvtz+4dUX/3Ghozwgm6iPp8KRhvn+eQf9+Q7GWxVNMk3+uCPWfdXYC4ExGBckIXdFEfH1w==",
      "dev": true
    },
    "what-input": {
      "version": "5.2.10",
      "resolved": "https://registry.npmjs.org/what-input/-/what-input-5.2.10.tgz",
      "integrity": "sha512-7AQoIMGq7uU8esmKniOtZG3A+pzlwgeyFpkS3f/yzRbxknSL68tvn5gjE6bZ4OMFxCPjpaBd2udUTqlZ0HwrXQ==",
      "peer": true
    },
    "which": {
      "version": "2.0.2",
      "dev": true,
      "requires": {
        "isexe": "^2.0.0"
      }
    },
    "wide-align": {
      "version": "1.1.5",
      "dev": true,
      "requires": {
        "string-width": "^1.0.2 || 2 || 3 || 4"
      }
    },
    "wildcard": {
      "version": "2.0.0",
      "dev": true
    },
    "word-wrap": {
      "version": "1.2.3",
      "dev": true
    },
    "workerpool": {
      "version": "6.2.1",
      "resolved": "https://registry.npmjs.org/workerpool/-/workerpool-6.2.1.tgz",
      "integrity": "sha512-ILEIE97kDZvF9Wb9f6h5aXK4swSlKGUcOEGiIYb2OOu/IrDU9iwj0fD//SsA6E5ibwJxpEvhullJY4Sl4GcpAw==",
      "dev": true
    },
    "wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "dev": true,
      "requires": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "dependencies": {
        "ansi-styles": {
          "version": "4.3.0",
          "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
          "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
          "dev": true,
          "requires": {
            "color-convert": "^2.0.1"
          }
        },
        "color-convert": {
          "version": "2.0.1",
          "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
          "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
          "dev": true,
          "requires": {
            "color-name": "~1.1.4"
          }
        },
        "color-name": {
          "version": "1.1.4",
          "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
          "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
          "dev": true
        }
      }
    },
    "wrappy": {
      "version": "1.0.2",
      "dev": true
    },
    "write-file-atomic": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/write-file-atomic/-/write-file-atomic-4.0.2.tgz",
      "integrity": "sha512-7KxauUdBmSdWnmpaGFg+ppNjKF8uNLry8LyzjauQDOVONfFLNKrKvQOxZ/VuTIcS/gge/YNahf5RIIQWTSarlg==",
      "dev": true,
      "requires": {
        "imurmurhash": "^0.1.4",
        "signal-exit": "^3.0.7"
      }
    },
    "y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "dev": true
    },
    "yallist": {
      "version": "4.0.0",
      "dev": true
    },
    "yaml": {
      "version": "1.10.2",
      "dev": true
    },
    "yargs": {
      "version": "17.6.0",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.6.0.tgz",
      "integrity": "sha512-8H/wTDqlSwoSnScvV2N/JHfLWOKuh5MVla9hqLjK3nsfyy6Y4kDSYSvkU5YCUEPOSnRXfIyx3Sq+B/IWudTo4g==",
      "dev": true,
      "requires": {
        "cliui": "^8.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.0.0"
      },
      "dependencies": {
        "yargs-parser": {
          "version": "21.1.1",
          "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz",
          "integrity": "sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==",
          "dev": true
        }
      }
    },
    "yargs-parser": {
      "version": "20.2.9",
      "dev": true
    },
    "yargs-unparser": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/yargs-unparser/-/yargs-unparser-2.0.0.tgz",
      "integrity": "sha512-7pRTIA9Qc1caZ0bZ6RYRGbHJthJWuakf+WmHK0rVeLkNrrGhfoabBNdue6kdINI6r4if7ocq9aD/n7xwKOdzOA==",
      "dev": true,
      "requires": {
        "camelcase": "^6.0.0",
        "decamelize": "^4.0.0",
        "flat": "^5.0.2",
        "is-plain-obj": "^2.1.0"
      },
      "dependencies": {
        "camelcase": {
          "version": "6.3.0",
          "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
          "integrity": "sha512-Gmy6FhYlCY7uOElZUSbxo2UCDH8owEk996gkbrpsgGtrJLM3J7jGxl9Ic7Qwwj4ivOE5AWZWRMecDdF7hqGjFA==",
          "dev": true
        },
        "decamelize": {
          "version": "4.0.0",
          "resolved": "https://registry.npmjs.org/decamelize/-/decamelize-4.0.0.tgz",
          "integrity": "sha512-9iE1PgSik9HeIIw2JO94IidnE3eBoQrFJ3w7sFuzSX4DpmZ3v5sZpUiV5Swcf6mQEF+Y0ru8Neo+p+nyh2J+hQ==",
          "dev": true
        },
        "is-plain-obj": {
          "version": "2.1.0",
          "resolved": "https://registry.npmjs.org/is-plain-obj/-/is-plain-obj-2.1.0.tgz",
          "integrity": "sha512-YWnfyRwxL/+SsrWYfOpUtz5b3YD+nyfkHvjbcanzk8zgyO4ASD67uVMRt8k5bM4lLMDnXfriRhOpemw+NfT1eA==",
          "dev": true
        }
      }
    },
    "yn": {
      "version": "3.1.1",
      "resolved": "https://registry.npmjs.org/yn/-/yn-3.1.1.tgz",
      "integrity": "sha512-Ux4ygGWsu2c7isFWe8Yu1YluJmqVhxqK2cLXNQA5AcC3QfbGNpM7fu0Y8b/z16pXLnFxZYvWhd3fhBY9DLmC6Q==",
      "dev": true
    },
    "yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "dev": true
    }
  }
}
`
    },
    {
      name: `package.json`, content: `
{
  "name": "shopify-toolbox",
  "version": "1.1.1",
  "description": "",
  "scripts": {
    "start": "concurrently \\"theme watch --env=dev\\" \\"webpack --watch --mode development\\"",
    "build": "webpack --mode production",
    "watch": "concurrently \\"theme watch --env=dev\\" \\"webpack --watch --mode development\\"",
    "lint": "eslint js/**/* && stylelint 'css/**/*.scss'",
    "lint:fix": "eslint js/**/* --fix && stylelint 'css/**/*.scss' --fix",
    "section": "cd ./js && cd ./helpers && node createSection",
    "test": "env TS_NODE_PROJECT=\\"tsconfig.testing.json\\" mocha",
    "themeget": "theme get --env=dev",
    "themedeploy": "theme deploy --env=dev",
    "themeopen": "theme open --env=dev"
  },
  "repository": {
    "type": "git",
    "url": "git+ssh://git@gitlab.com/sounds-good-agency/shopify-toolbox.git"
  },
  "author": "",
  "license": "ISC",
  "bugs": {
    "url": "https://github.com/sounds-good-agency/shopify-toolbox/issues"
  },
  "homepage": "https://github.com/sounds-good-agency/shopify-toolbox#readme",
  "devDependencies": {
    "@babel/core": "^7.19.3",
    "@babel/preset-env": "^7.19.4",
    "@babel/preset-typescript": "^7.18.6",
    "@types/mocha": "^10.0.0",
    "autoprefixer": "^10.4.4",
    "babel-loader": "^8.2.5",
    "concurrently": "^7.1.0",
    "copy-webpack-plugin": "^11.0.0",
    "core-js": "^3.21.1",
    "css-loader": "^6.7.1",
    "cssnano": "^5.1.7",
    "eslint": "^8.12.0",
    "eslint-config-google": "^0.14.0",
    "glob": "^7.2.0",
    "mini-css-extract-plugin": "^2.6.0",
    "mocha": "^10.0.0",
    "normalize.css": "^8.0.1",
    "postcss": "^8.4.12",
    "postcss-css-variables": "^0.18.0",
    "postcss-custom-media": "^8.0.0",
    "postcss-discard-comments": "^5.1.1",
    "postcss-flexbugs-fixes": "^5.0.2",
    "postcss-import": "^14.1.0",
    "postcss-loader": "^6.2.1",
    "postcss-nested": "^5.0.6",
    "postcss-preset-env": "^7.4.3",
    "postcss-scss": "^4.0.3",
    "sass": "^1.49.11",
    "sass-loader": "^13.3.2",
    "string-replace-loader": "^3.1.0",
    "style-loader": "^3.3.1",
    "stylelint": "^14.14.0",
    "stylelint-config-standard": "^29.0.0",
    "stylelint-order": "^5.0.0",
    "stylelint-scss": "^4.2.0",
    "ts-loader": "^9.4.2",
    "ts-node": "^10.9.1",
    "tsconfig-paths-webpack-plugin": "^4.0.1",
    "typescript": "^4.8.4",
    "webpack": "^5.74.0",
    "webpack-cli": "^4.9.2",
    "webpack-remove-empty-scripts": "^0.8.0"
  },
  "dependencies": {
    "@discolabs/custard-js": "^0.1.3",
    "@hotwired/turbo": "^7.3.0",
    "bourbon": "^7.2.0",
    "foundation-sites": "^6.7.4",
    "jquery": "^3.6.4",
    "magnific-popup": "^1.1.0",
    "minimist": "^1.2.8",
    "node-sass": "^9.0.0",
    "normalize-scss": "^7.0.1",
    "qrcode": "^1.5.3",
    "rfs": "^9.0.6",
    "shopify-api-js": "^1.0.6",
    "slick-carousel": "^1.8.1",
    "source-map-loader": "^4.0.1",
    "spayd": "^3.0.3",
    "vue-multiselect": "^2.1.7"
  },
  "main": "postcss.config.js"
}
`
    },
    {
      name: `postcss.config.js`, content: `
module.exports = {
    plugins: {
        'postcss-import': {},
        'postcss-custom-media': {},
        'postcss-nested': {},
        'postcss-discard-comments': { removeAll: true },
        autoprefixer: {},
        'postcss-preset-env': {},
        'postcss-flexbugs-fixes': {},
        cssnano: {
            preset: 'default',
        }
    },
};`
    },
    {
      name: `webpack.config.js`, content: `


const webpack = require('webpack');
const path = require('path');
const glob = require('glob');
var fs = require('fs');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReplaceInFileWebpackPlugin = require("./js/helpers/ReplaceInFileWebpackPluginCustom.js");
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CopyPlugin = require("copy-webpack-plugin");


// needed to enable mediaQueries variables in comp scss
// read '_variables.css'
const str = fs.readFileSync(__dirname + '/css/defs/_variables.css').toString();
var mediaQueriesArray = [];

// regex to match all media queries variables
var regex = /(?<=@custom-media ).+?(?=;)/g;
var result = str.match(regex);

// build search/replace array to use with 'ReplaceInFileWebpackPlugin'
result.forEach(element => {
    let search = [element.split(/ (.*)/s)[0]];
    search = new RegExp(search, 'g');
    let replace = element.split(/ (.*)/s)[1];
    replace = replace.replace(/\\(/g, '').replace(/\\)/g, '')

    mediaQueriesArray.push({
        search: search,
        replace: replace
    })
});

// patternToEntries - function to get all files from folder
const patternToEntries = (pattern, suffix = '') => glob
    .sync(pattern)
    .reduce((acc, val) => ({
        ...acc,
        [path.basename(val, path.extname(val)) + suffix]: val,
    }), {});


// module exports
module.exports = {
    // entries
    entry: {
        bundle: {
            import: './js/theme.js',
            filename: '../assets/[name].js'
        },
        ...patternToEntries('./components/**/*.css', ''),
        ...patternToEntries('./components/**/*.js', ''),
        ...patternToEntries('./components/**/*.ts', ''),
    },
    // output
    output: {
        path: path.resolve(__dirname, './snippets'),
        publicPath: '/',
        filename: '[name].js.liquid',
    },
    // module
    module: {
        rules: [
            // typescript
            {
                test: /\\.tsx?$/,
                loader: 'babel-loader',
            },
            // javascript
            {
                test: /\\.(js)$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            // css
            {
                test: /\\.(css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                        },
                    },
                    'postcss-loader',
                ],
            },
            // sass/scss
            {
                test: /\\.(s(a|c)ss)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass"),
                            sourceMap: true,
                            sassOptions: {
                                outputStyle: "compressed",
                            },
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        // remove empty js files
        new RemoveEmptyScriptsPlugin(),
        // extract css from js files to separate files
        new MiniCssExtractPlugin({
            filename: '../snippets/[name].css.liquid',
        }),
        // replace media queries variables in css files and liquid variables in js&css files
        new ReplaceInFileWebpackPlugin([
            {
                dir: 'snippets',
                test: [/\\.css.liquid$/],
                rules: [
                    // for liquid variables in js&css files
                    {
                        search: /['"]{{/g,
                        replace: '{{',
                    },
                    {
                        search: /}}['"]/g,
                        replace: '}}',
                    },
                    // for media queries variables in css files
                    ...mediaQueriesArray
                ],
            },
        ]),
        // add banner to js files and css files
        new webpack.BannerPlugin('\\n\\n\\tThis file is auto generated by webpack.\\n\\tDo not edit this file directly.\\n\\n'),
        // copy liquid files to sections folder, appends json scheme content, and script and style tags
        new CopyPlugin({
            patterns: [
                {
                    noErrorOnMissing: true,
                    from: "components/**/*.liquid",
                    to: "../sections/[name].liquid",
                    transform(content, url) {

                        // get file name without extension
                        let fileName;
                        if (path.win32 === path) {
                            fileName = url.split('\\\\').pop().split('.').shift();
                        } else if (path.posix === path) {
                            fileName = url.split('/').pop().split('.').shift();
                        }

                        let warning = '\\n\\n<!--\\n\\n\\tThis file is auto generated by webpack.\\n\\tDo not edit this file directly.\\n\\n\\-->\\n\\n';

                        // script tag
                        let tsTag = '\\n\\n<script>{% render "' + fileName + '.js" %}</script>\\n';

                        // style tag
                        let scssTag = '\\n{% style %}{% render "' + fileName + '.css" %}{% endstyle %}\\n';

                        // get the path name of the json file
                        let jsonPath = url.replace('.liquid', '.json');

                        // get the json file content and wrap it with {% schema %} tags
                        let jsonContent = '\\n{% schema %}' + fs.readFileSync(jsonPath, 'utf8') + '\\n{% endschema %}';

                        // return the content of the liquid file with the ts & scss & json scheme content
                        return warning + content + tsTag + scssTag + jsonContent;

                    },
                }
            ],
        }),
    ],
    // resolve
    resolve: {
        // extensions
        extensions: ['.scss', '.css', '.js', '.ts', '.liquid'],
    },
    optimization: {
        minimize: false
    }
};
`
    },
  ];

  if (configYml) {
    filesToCreate = [
      {
        name: `config.yml`, content: `
.env-template:
  password: ${configYml.pass}
  store: ${configYml.url}
  ignores:
  - .shopifyignore
dev:
  password: ${configYml.pass}
  theme_id: "${configYml.id}"
  store: ${configYml.url}
  ignores:
  - .shopifyignore
    ` }
    ]
  }

  filesToCreate.forEach(file => {
    if (!fs.existsSync('./' + file.name)) {
      fs.appendFileSync(file.name, file.content);
      log('[ADDED] - ' + file.name + ' created successfully', 'success');
    }
    else {
      log('[ERROR - SKIP] - ' + file.name + ' already exist', 'error');
    }
  });
}

// create all necessary folders
createFolders = async function () {

  const folders = ['js', 'css', 'css/defs', 'css/partials', 'css/pages', 'css/sections', 'js/partials', 'js/pages', 'js/sections', 'js/helpers'];

  folders.forEach(folder => {
    if (!fs.existsSync('./' + folder)) {
      fs.mkdirSync('./' + folder);
      log(`[ADDED] - '${folder} folder created successfully`, 'success')
    }
    else {
      log('[ERROR - SKIP] - ' + folder + ' folder created already exist', 'error')
    }
  });

}

// create config.yml
createConfigYml = async function () {
  let configData = {};

  configData.url = await question("\nStore URL:\n");
  configData.pass = await question("\n'theme kit' access key:\n");
  configData.id = await question("\nTheme ID:\n");

  await createFiles(configData);
}

// init function for code run
init = async function () {

  (await question("\n(y/n) - Create config.yml? ") == 'y') ? await createConfigYml() : null;

  (await question("\n(y/n) - Create all folders required? ") == 'y') ? await createFolders() : null;

  (await question("\n(y/n) - Create all necessary files for DEV? ") == 'y') ? await createFiles() : null;

  (await question("\n(y/n) - Add 'bundle.js' to theme.liquid? ") == 'y') ? await addJsScriptTagToThemeLiquid('bundle') : null;

  (await question("\n(y/n) - Add 'bundle.css' to theme.liquid? ") == 'y') ? await addJsStyleTagToThemeLiquid('bundle') : null;

  log('\nALL READY', 'warning');
  log(`Please run 'npm install' then 'npm run watch'`, 'info');

  process.exit()

};

init();