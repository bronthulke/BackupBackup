var config = require('./config');
var azure = require('@azure/storage-blob');
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

if (options.pathtobackup === undefined) {
	console.log(usage);
	process.exit(1);
}

console.log("********** BackupBackup! **********");
console.log("Container: " + config.azureContainerName);
console.log();

//create a blob service set explicit credentials
const blobService = azure.BlobServiceClient.fromConnectionString(config.azureStorageConnectionString);

var backupDirectory = options.pathtobackup;

var doDelete = false;
if (options.daystokeep !== undefined) {
	var deleteThresholdDate = moment().subtract(Number(options.daystokeep), "days");
	doDelete = true;
	console.log("Will delete any files in source directory older than " + options.daystokeep + " days (" + deleteThresholdDate.format() + ")");
}

dir.files(backupDirectory, function (err, files) {
	if (err) throw err;

	//we have an array of files now, so now we'll iterate that array
	files.forEach(function (path) {
		// if older than 1 week delete (assume it's already gone to Azure)
		if (fs.stat(path, function (err, stats) {
			if (err) throw err;
			var dateLastModified = moment(stats.mtime)
			if (doDelete && (dateLastModified < deleteThresholdDate)) {
				console.log("Deleting old file [" + path + "]");
				fs.unlink(path);
			}
			else {
				UploadFileToAzure(path, backupDirectory);
			}
		}));
	})
});

async function UploadFileToAzure(filename, backupDir) {

	// Remove the backup directory (preserving any subdirectories), and trailing slashes
	var filenameAzure = filename.replace(backupDir.replace("/", "\\"), "").replace(/^[\/\\]|[\/\\]$/g, '');

	const containerClient = blobService.getContainerClient(config.azureContainerName);

	const blockBlobClient = containerClient.getBlockBlobClient(filenameAzure);

	// Note: since upgrading to the latest Azure Storage Blob library, the "exists" check isn't working, need to work out how
	// to do that and fix it.
	if (await blockBlobClient.exists()) {
		console.log("File  [" + filenameAzure + "] already exists in directory...");
	}
	else {
		console.log("\nFile [" + filenameAzure + "] does not exist, uploading to Azure [" + filename + "]");

	 	const uploadBlobResponse = await blockBlobClient.uploadFile(filename);
	}
}
