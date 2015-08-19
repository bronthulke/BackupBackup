# BackupBackup
A Node.js script for uploading files (such as backups) to an Azure storage account, and optionally deleting old files.

After cloning the directory, grab the Node.js dependancies by running:

    npm install



You need to set the Azure access key, account and container in the server.js file (not setting this in command line argument, due to potential security vulnerability).

The command line arguments allow for the path to upload.  It also allows to vary the number of days to keep files for (if not specified, no files will be deleted).

Azure containers are single-level, and as such all directories will be flattened out on copy. Currently any duplicate files will be overridden (so beware if you have files of the same name in subdirectories).

##Future plans
If you are trying to upload too many files it will run out of memory.  I'm still wrapping my head around how the Azure Storage SDK for Node.js works, and I believe part of the issue is that the node-dir forEach loop over the files processes each one asyncronously (based on logging of progress) so for now it may have limits in number of files it will handle.  My current use case is only for 7 or so files at a time (to upload the last week's database backups).

##Disclaimer
This is my very first Node.js project, so please feel free to make suggestions for improvements (either via Issues or Pull Requests).  Anyone is welcome to contribute.

This is also my first ever "real world" public Github project, so I'm open to suggestions for this, too.