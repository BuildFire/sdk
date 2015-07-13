# BuildFire Plugin SDK
This repository provides the framework needed to create a BuildFire Plugin.
Plugins are components that are added to a BuildFire app (http://buildfire.com) to add additional functionality to the platform. 
## Plugins
Plugins are written in HTML and JavaScript with a few restrictions. 
1. Plugin files must be written within the *required folder structure*, so that the system can identify and import it correctly
2. Plugin HTML files must be styled with *bootstrap* (http://getbootstrap.com) so that your pages will be styled with theme that the app owner has chosen
3. Plugin HTML files must import *buildfire.js* in the header of the document in order to access the platform, context and device

### Plugin Structure
Plugins consists of three major components
1. the Control
  * Context
  * Design
  * Settings
2. the Widget
3. the Config

#### the Config (plugin.json)
The configuration of each plugin is placed in a file on the root of the plugin called *plugin.json*. This JSON file consists of all the settings the plugin requires

#### the Control (folder)
The Control is the part of the code that is added to the App Control Panel to help configure your plugin
the control has 3 sections:
1. content
2. design
3. settings

#### the Widget (folder)
The Widget is the part that is rendered on the device. It consumes the configuration made from the control and displays the output.
