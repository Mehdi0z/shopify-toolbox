// a node script that take 'toolbox.config.js' file and replace all template variables with actual files content
// then copy the file to 'dist' folder


// Import the filesystem module
const fs = require('fs');

// files array for template replacement on toolbox.js
var filesArray = [];

// read recursively all files from folder
readFilesFromFolder = async function (folder) {
  fs.readdirSync(folder, { withFileTypes: true }).forEach(file => {
    const isDirectory = file.isDirectory();
    if (isDirectory) {
      // recursive
      readFilesFromFolder(folder + file.name + '/');
    }
    else {
      addFileToFileArray(folder, file.name);
    }
  });
};

// add files to array
addFileToFileArray = async function (folder, fileName) {
  var content = fs.readFileSync(folder + fileName, 'utf-8');

  // if fileName is package.json or webpack.config.js => escape the content
  if (fileName == "package.json" || fileName == "webpack.config.js") {
    content = content.replace(/\\/g, "\\\\");
  }

  // if component files - replace comp name with call for var compName + escape character '\'
  if (fileName == "component.liquid" || fileName == "component.scss" || fileName == "component.ts" || fileName == "component.json") {
    content = content.replace(/compName/g, '\\\${name}');
    content = content.replace(/compFormattedName/g, '\\\${formattedName}');
  }

  filesArray.push({
    name: fileName,
    content: content
  });
}

// replace template variables in toolbox.js with ACTUAL files content
replaceTemplatesVariableWithContent = async function () {
  var toolboxContent = fs.readFileSync('dist/toolbox.js', 'utf-8');

  filesArray.forEach(file => {
    toolboxContent = toolboxContent.replace(file.name + '-contentTemplateVariable', "\n" + file.content);
  });

  fs.writeFileSync("dist/toolbox.js", toolboxContent);
};

// copy and change name - toolbox.config.js to dist/toolbox.js
copyToolboxToDist = async function () {

  // create 'dist' folder if does not exist
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  // copy toolbox.config.js => dist/toolbox.js
  fs.copyFileSync("toolbox.config.js", "dist/toolbox.js");

  replaceTemplatesVariableWithContent();
};

// init function to run the code
init = async function () {

  const foldersArray = './src/';
  await readFilesFromFolder(foldersArray);

  await copyToolboxToDist();

  await replaceTemplatesVariableWithContent();

};

init();