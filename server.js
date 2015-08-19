var config = require('./config');
var azure = require('azure-storage');
var fs = require('fs');
var dir = require('node-dir');
var moment = require('moment');
var commandLineArgs = require("command-line-args");
 
var cli = commandLineArgs([
    { name: "pathtobackup", alias: "p", type: String },
    { name: "daystokeep", alias: "d", type: Number }
]);

var usage = cli.getUsage({
	title: "BackupBackup",
    description: "Uploads a directory of files to Azure. Optionally deletes old files (if daystokeep is specified)."
});
var options = cli.parse();

if(options.pathtobackup === undefined) {
	console.log(usage);
	process.exit(1);	
}

console.log("********** BackupBackup! **********");
console.log("Container: " + config.azureContainerName);
console.log("Storage Account: " + config.azureStorageAccount);
console.log();

//create a blob service set explicit credentials
var blobService = azure.createBlobService(config.azureStorageAccount, config.azureAccessKey);

var backupDirectory = options.pathtobackup;

var doDelete = false;
if(options.daystokeep !== undefined) {
	var  dateOneWeekAgo = moment().subtract(Number(options.daystokeep), "days");
	doDelete = true;
	console.log("Will delete any files in source directory older than " + options.daystokeep + " days (" + dateOneWeekAgo.format() + ")");
}

dir.files(backupDirectory, function(err, files) {
	if (err) throw err;

	//we have an array of files now, so now we'll iterate that array
	files.forEach(function(path) {
		// if older than 1 week delete (assume it's already gone to Azure)
		if(fs.stat(path, function(err, stats) {
			if (err) throw err;
			var dateLastModified = moment(stats.mtime)
			if(doDelete && (dateLastModified < dateOneWeekAgo)) {
				console.log("Deleting old file [" + path + "]");
				fs.unlink(path);
			}
			else {
				console.log("Uploading to Azure [" + path + "]");
				UploadFileToAzure(path, backupDirectory);
			}
		}));
	})
});

function UploadFileToAzure(filename, backupDir) {

	// Remove the backup directory (preserving any subdirectories), and trailing slashes
	var filenammeAzure = filename.replace(backupDir.replace("/", "\\"),"").replace(/^[\/\\]|[\/\\]$/g, '');
	blobService.createBlockBlobFromLocalFile(config.azureContainerName, filenammeAzure, filename, function(error, result, response){
	  if(!error){
	  	console.log("File uploaded [" + filenammeAzure + "]");
	  }
	  else {
	  	console.log("Uh oh! Failed to upload [" + filenammeAzure + "] - result [" + error + "]");
	  }
	});

}
