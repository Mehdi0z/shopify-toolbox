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
  const liquidContent = `\`component.liquid-contentTemplateVariable\``;

  // scss content
  const scssContent = `\`component.scss-contentTemplateVariable\``;

  // typescript content
  const tsContent = `\`component.ts-contentTemplateVariable\``;

  // scheme content
  const schemeContent = `\`component.json-contentTemplateVariable\``;

  let filesToCreate = [
    {
      name: '.mocharc.json', content: `.mocharc.json-contentTemplateVariable`
    },
    {
      name: '.babelrc', content: `.babelrc-contentTemplateVariable`
    },
    {
      name: 'tsconfig.testing.json', content: `tsconfig.testing.json-contentTemplateVariable`
    },
    {
      name: 'js/helpers/createSection.js', content: `createSection.js-contentTemplateVariable`
    },
    {
      name: `.browserslistrc`, content: `.browserslistrc-contentTemplateVariable`
    },
    {
      name: `js/theme.js`, content: `theme.js-contentTemplateVariable`
    },
    {
      name: `js/libs.js`, content: `libs.js-contentTemplateVariable`
    },
    {
      name: `js/globals.js`, content: `globals.js-contentTemplateVariable`
    },
    {
      name: `js/helpers/ReplaceInFileWebpackPluginCustom.js`, content: `ReplaceInFileWebpackPluginCustom.js-contentTemplateVariable`
    },
    {
      name: `js/helpers/sectionClass.js`, content: `sectionClass.js-contentTemplateVariable`
    },
    {
      name: `js/partials/navigation.js`, content: `navigation.js-contentTemplateVariable`
    },
    {
      name: `css/defs/_variables.css`, content: `_variables.css-contentTemplateVariable`
    },
    {
      name: `css/theme.css`, content: `theme.css-contentTemplateVariable`
    },
    {
      name: `.eslintignore`, content: `.eslintignore-contentTemplateVariable`
    },
    {
      name: `.eslintrc`, content: `.eslintrc-contentTemplateVariable`
    },
    {
      name: `.eslintrc.json`, content: `.eslintrc.json-contentTemplateVariable`
    },
    {
      name: `.gitignore`, content: `.gitignore-contentTemplateVariable`
    },
    {
      name: `.shopifyignore`, content: `.shopifyignore-contentTemplateVariable`
    },
    {
      name: `.stylelintignore`, content: `.stylelintignore-contentTemplateVariable`
    },
    {
      name: `.stylelintrc.json`, content: `.stylelintrc.json-contentTemplateVariable`
    },
    {
      name: `babel.config.json`, content: `babel.config.json-contentTemplateVariable`
    },
    {
      name: `Makefile`, content: `Makefile-contentTemplateVariable`
    },
    {
      name: 'package-lock.json', content: `package-lock.json-contentTemplateVariable`
    },
    {
      name: `package.json`, content: `package.json-contentTemplateVariable`
    },
    {
      name: `postcss.config.js`, content: `postcss.config.js-contentTemplateVariable`
    },
    {
      name: `webpack.config.js`, content: `webpack.config.js-contentTemplateVariable`
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