# BuildFire Plugin SDK ![](https://api.travis-ci.org/BuildFire/sdk.svg)
This repository provides the framework needed to create a BuildFire Plugin.
Plugins are components that are added to a BuildFire app (http://buildfire.com) to add additional functionality to the platform. 

## Video Tutorials
Here is a playlist on how to develop on the plugins using buildfire.js
https://www.youtube.com/playlist?list=PLnq_waykAGlgsERwxHmGNokE6WIeVeH0I

## Dev Environment
If you havent setup your environment just yet click here https://github.com/BuildFire/sdk/wiki/How-to-setup-your-development-environment to get started

[Video Tutorial Here](https://www.youtube.com/watch?v=IZcvBZT-zjY&list=PLnq_waykAGlgsERwxHmGNokE6WIeVeH0I&index=1)

## iOS & Android Guidelines
See https://github.com/BuildFire/sdk/wiki/iOS-&-Android-Guidelines

## Plugins
Plugins are written in HTML and JavaScript with a few restrictions:
* Plugin files must be written within the __required folder structure__, so that the system can identify and import it correctly
* Plugin HTML files must be styled with __bootstrap__ (http://getbootstrap.com) so that your pages will be styled with theme that the app owner has chosen
* Plugin HTML files must import __buildfire.js in the header__ of the document in order to access the platform, context and device

### Plugin Structure
![file system](https://s3-us-west-2.amazonaws.com/pluginserver/docResources/structure.png?q=7)

Plugins consists of three major components:
* the Config (plugin.json)
* the Control
  * Context
  * Design
  * Settings
* the Widget
* **The Resources** 
  * **Note** :This folder is only meant for plugin configuration resource like default widget icon, widget hero image and media files.** You can replace those two files if you need by overriding the default hero image and default icon image and **you can add extra images to showcase you plugin in the control panel market place and attract new users by filling the images paths and types in the `media` property in  `plugin.json`**.


#### the Config (plugin.json)
The configuration of each plugin is placed in a file on the root of the plugin called __plugin.json__. This JSON file consists of all the settings the plugin requires

#### the Control (folder)
The Control is the part of the code that is added to the App Control Panel to help configure your plugin
the control has 3 sections/__sub folder__ *each of which have their own index.html start page*:
* content
* design
* settings

#### the Widget (folder)
The Widget is the part that is rendered on the device. It consumes the configuration made from the control and displays the output.


![Control Panel](https://s3-us-west-2.amazonaws.com/pluginserver/docResources/Control+Panel.png?v=1)


#### the Resources (folder)
The Resources is the default images which will be used for your widget .
* image.png : this image file will be used as a default image for your widget which will appear when App Owners installed your plugin in their plugin Manager .

* icon.png : this image file will be used as a default icon for your widget which will appear as an icon for the widget on the emulator and the actual device .

* **Note** :This folder is only meant for plugin configuration resource like default widget icon, widget hero image and media files.** You can replace those two files if you need by overriding the default hero image and default icon image and **you can add extra images to showcase you plugin in the control panel market place and attract new users by filling the images paths and types in the `media` property in  `plugin.json`**.

[Video Tutorial Here](https://www.youtube.com/watch?v=4qh4S-BwLJM&list=PLnq_waykAGlgsERwxHmGNokE6WIeVeH0I&index=2)

### for full documentation on how to develop a plugin [click here to see the wiki](https://github.com/BuildFire/sdk/wiki)
