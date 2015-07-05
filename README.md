# BuildFire Plugin SDK
This repository provides the framework needed to create a BuildFire Plugin.

Plugins are components that are added to a BuildFire app (http://buildfire.com) to add additional functionality. 
Plugins are written in HTML and JavaScript with a few reistrictions. 

Plugins consists of two major components
1. the Control
2. the Widget

The Control is the part of the code that is added to the App COntrol Panel to help configure your plugin
the control has 3 sections:
1. Content
2. Design
3. Settings


The Widget is the part that is rendered on the device. It consumes the configuration made from teh control and displays the output.

Plugin Structure
1.control
  a.context
  b.design
  c.settings
2.widget
3.plugin.json


plugin.json
