
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

init();