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
    description: "Uploads a directory of files to Azure. Optionally deletes old files (if daystokeep is specified). Directory structures will be flattened into the target container."
});
var options = cli.parse();

if(options.pathtobackup === undefined) {
	console.log(usage);
	process.exit(0);	
}

var azureAccessKey = 'Mh2Z3k7sXyModjx9MkyfHYI7zcSBgcGQOFdlMrbMuqvPH0eOqMqx42tazF2oDdCMt4k8io+iUa4peIJlf0Np4w==';
var azureStorageAccount = 'angelwebdesigns';
var azureContainerName = 'backups';
console.log("Container: " + azureContainerName);
console.log("Storage Account: " + azureStorageAccount);

var backupDirectory = options.pathtobackup;


function UploadFileToAzure(filename) {

	var filenammeAzure = filename.replace(backupDirectory,""); // todo: use a regex to ensure it gets only from the start

	blobService.createBlockBlobFromLocalFile(azureContainerName, filenammeAzure, filename, function(error, result, response){
	  if(!error){
	  	console.log("File uploaded");
		process.exit(0);
	  }
	  else {
	  	console.log("Uh oh! Failed= to upload - result [" + error + "]");
		process.exit(1);
	  }
	});

}

var doDelete = false;
if(options.daystokeep !== undefined) {
	var  dateOneWeekAgo = moment().subtract(Number(options.daystokeep), "days");
	doDelete = true;
	console.log("Will delete any files in source directory older than " + options.daystokeep + " days (" + dateOneWeekAgo.format() + ")");
}

//create a blob service set explicit credentials
var blobService = azure.createBlobService(azureStorageAccount, azureAccessKey);

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
				UploadFileToAzure(path);
			}
		}));
	})
});

