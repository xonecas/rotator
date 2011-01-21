/*
 * Author: Sean Caetano Martin
 * Description: script that reads all the files in a directory and
 * sets them as a random wallpaper. If you intend to use this, please
 * make sure you only have IMAGE files in the specified directory.
 * once the script is started you can set the walpaper to the rotator.png
 * that was just created in the pictures folder
 *
 * USAGE: node rotator.js ['/path/to/pictures_folder'] [interval=30]
 *
 * The path is relative to the root (/).
 * If you don't supply a folder, it will look for:
 *    cwd + '/Pictures' (default)
 * If you don't supply an interval it will default to 30 min
 */

// dependencies
var fs = require('fs'),
   http = require('http'),
   xml2js = require('xml2js'),
   url = require('url'),
   exec = require('child_process').exec;

// locals
var args = process.argv, folder, interval, web;

// parse command line args
if (args.length > 2) 
   folder = args[2];
else // default folder
   folder = process.cwd() +'/Pictures';

if (args.length > 3 && args[3] !== 0)
   interval = args[3];
else  // default interval
   interval = 30;

function rotate () {
   // locals
   var file = '', index = 0;

   // update the file directory
   fs.readdir(folder, function (err, files) {
      // validate the folder throw errors
      if (err || files.length === 0) { 
         if (files.length === 0) {
            console.log('Bad folder, no files. Next try in '+interval+'min(s)');
            return ;
         }
         else
            throw err;
      }

      do { // any picture but rotator.png or 
         // generate random number to choose next wallpaper
         index = Math.floor(Math.random() * files.length)
      } while (files[index] === 'rotator.png' || files[index] === file);

      // save the file so that we don't repeat it
      file = files[index];

      // declare link function
      function link () {
         fs.link(folder +'/'+files[index], folder +'/rotator.png')
         exec('touch '+ folder +'/rotator.png'); // needed to force gnome to refresh

         console.log('Linked new file '+files[index]+' '+new Date().toString());
      }

      // remove existing link (if there is one)
      fs.lstat(folder +'/rotator.png', function (err, stats) {
         if (stats && stats.isFile())
            fs.unlink(folder +'/rotator.png', link);
         else
            link();
      });
   });
}

// web version (i hope)
// uses www.simpledesktops.com rss feed
// it should be too hard to adapt it to other feeds
function rss_rotate () {
   // locals
   var parser = {}, xml = '',items = [], item = {},
      title = '', link = '', index = 0;

   // GET request wrapper
   // params: host path callback(body)
   function get (host, path, callback) {
      var client = {}, req = {}, body = '';

      client = http.createClient(80, host);
      req = client.request(path, { 'host': host });
      req.end();

      req.on('response', function (res) {
         res.on('data', function (chunk) {
            body += chunk; 
         });
         res.on('end', function () { 
            callback(body)
         });
      });
   }

   function get_write (host, path, dir) {
      var client = {}, req = {}, body = '', stream = {};

      stream = fs.createWriteStream(dir, { 'flags': 'w' });
      stream.on('open', function (fd) {

         client = http.createClient(80, host);
         req = client.request(path, { 'host': host });
         req.end();

         req.on('response', function (res) {
            res.on('data', function (chunk) {
               stream.write(chunk);
            });
         });
      });
   }

   // fetch the feed
   get('feeds.feedburner.com', '/simpledesktops', function (xml) {
      // parse the xml
      parser = new xml2js.Parser();
      parser.addListener('end', function (xml_js) {
         // save it
         items = xml_js.channel.item;
         index = Math.floor(Math.random() * items.length)
         item = xml_js.channel.item[index];

         // set it if its new
         if (item.title !== title) {
            title = item.title;

            // this would be easier if the 
            // rss feed linked to the static file
            link = item.description.split(' ')[2];
            link = link.substring(5, link.indexOf('.png') + 4);
            link = url.parse(link);

            // save the file to the disk
            get_write(link.hostname, link.pathname, folder +'/rotator.png');
            console.log('Linked '+ link.hostname + link.pathname +' '+ new Date().toString());
         }
      });
      parser.parseString(xml);
   });
}

// self executing recursive function
(function action () {
   try {
      rss_rotate();
   }
   catch (err) {
      console.log('error: '+ err +'\nfalling back to local images');
      rotate();
   }

   setTimeout(action, interval * 60 * 1000);
}) ();
