$app.controller('pluginLayoutsCtrl', ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {


        let siteConfigScope = 'cp';
        if (window.siteConfig &&
            window.siteConfig.endPoints &&
            window.siteConfig.endPoints.appHost && window.siteConfig.scope == "sdk") {
            siteConfigScope = 'sdk';
        }

        let pluginJson;
        $scope.siteConfigScope = siteConfigScope;
        if(siteConfigScope == "cp"){
            pluginJson = $scope.$parent.config;
        }else if (siteConfigScope === 'sdk') {
            pluginJson = $scope.$parent.$parent.$parent.pluginConfig;
        }

        

        let activeLayoutTag = '$$activeLayout';
        if (pluginJson.control.cssInjection.activeLayoutTag) {
            activeLayoutTag = pluginJson.control.cssInjection.activeLayoutTag;
        };

        let customLayoutsTag = '$$customLayouts';
        if (pluginJson.control.cssInjection.customLayoutsTag) {
            customLayoutsTag = pluginJson.control.cssInjection.customLayoutsTag;
        };

        //this hash map to store all fetched css files for predefined layouts
        const cssMap = new Map();

        let pluginId;
        if(siteConfigScope == "cp"){
            pluginId = window.appContext.currentPlugin.pluginId;
        }else if (siteConfigScope === 'sdk') {
            pluginId = $routeParams.pluginFolder;
        }
        //create datastore api 
        const datastoreAPI = new DatastoreAPI({
            appId: window.appContext.currentApp.appId,
            pluginId: pluginId,
            instanceId: window.appContext.currentPlugin.instanceId,
            liveMode: window.appContext.liveMode,
            writeKey: window.appContext.currentApp.keys.datastoreKey,
        });

        //get selected layout from datastore
        const getSelectedLayout = function () {
            return new Promise(function (resolve, reject) {
                const options = {
                    tag: activeLayoutTag,
                };

                datastoreAPI.get(options, function (err, results) {
                    if (err) return reject(err);
                    results = results && results.data ? results.data : {};
                    return resolve(results);

                });
            });

        };

        const onSelectedLayoutReceived = function (result) {
            let activeLayout;
            //   check if nothing saved as selected layout, so save the default one
            if (!Object.keys(result).length) {
                activeLayout = $scope.defaultLayout;
            } else {
                //this to handle old instances to make it backwards compatible. the old data saved inside `design` property.
                if (result.design && result.design.selectedLayout) {
                    activeLayout = result.design.selectedLayout;
                    $scope.selectedLayoutInDesign = result;
                } else if (result.selectedLayout) {
                    activeLayout = result.selectedLayout;
                }
            }
            if (!$scope.$$phase) $scope.$digest();

            if (activeLayout) {
                $scope.selectLayout(activeLayout,false);
            };
        };

        //get custom layouts from datastore
        const getCustomLayouts = function () {
            return new Promise(function (resolve, reject) {
                const options = {
                    tag: customLayoutsTag,
                };


                datastoreAPI.get(options, function (err, result) {
                    if (err) return reject(err);
                    if (!result) return resolve([]);

                    result = result.data;
                    if (result.customLayouts) {
                        result = result.customLayouts;
                    } else {
                        if (!result.length) {
                            result = [];
                        };
                    };

                    return resolve(result);
                });
            });
        };

        //save custom layouts 
        const saveCustomLayouts = function () {
            const options = {
                tag: customLayoutsTag,
                obj: {
                    customLayouts: $scope.customLayouts
                }
            };

            datastoreAPI.save(options, function (err, result) {
                if (err) return console.error(err);
                $scope.isDeleteLayoutLoading = false;
                $scope.isCloneCustomLayoutLoading = false;

            });
        };

        //save layout to datastore as selected
        const saveSelectedLayout = function (selectedLayout) {
            let saveObj;
            const options = {
                tag: activeLayoutTag,
                obj: {}
            };

            if ($scope.selectedLayoutInDesign) {
                saveObj = $scope.selectedLayoutInDesign;
                saveObj.design.selectedLayout = selectedLayout;
                if (selectedLayout.cssPath) saveObj.design.selectedLayout.css = '';
                options.obj = { '$set': saveObj };
            } else {
                saveObj = {
                    selectedLayout: selectedLayout
                };
                if (selectedLayout.cssPath) saveObj.selectedLayout.css = '';
                options.obj = {'$set': saveObj};
            }
            datastoreAPI.save(options, function (err, result) {
                if (err) {
                    console.error(err);
                    return;
                }
                $scope.isDeleteLayoutLoading = false;

                if (siteConfigScope === 'cp') {
                    emulatorSync.triggerCssInjectionOnUpdate(result);
                }else if(siteConfigScope === 'sdk') {
                    const iframe = document.getElementById('widget');
                    iframe.src = iframe.src;
                }
            });
        };

        //fetch css file per each layout
        const fetchLayout = function (predefinedLayout) {

            return new Promise(function (resolve, reject) {
                const relativePath = predefinedLayout.cssPath.includes('widget/') ? '/' : '/widget/';
                let cssFilePath;
                if (siteConfigScope === 'cp') {
                    cssFilePath = window.siteConfig.endPoints.pluginHost + "/" + $routeParams.folderName + relativePath + predefinedLayout.cssPath;
                } else if (siteConfigScope === 'sdk') {

                    if (pluginJson.webpack) {
                        cssFilePath = `${window.location.origin}/plugins/${$routeParams.pluginFolder}/src`+ relativePath + predefinedLayout.cssPath;
                        
                    } else {
                        cssFilePath = `${window.location.origin}/plugins/${$routeParams.pluginFolder}`+ relativePath + predefinedLayout.cssPath;
                    }
                }
              
                $http.get(cssFilePath)
                    .success(function (res) {

                        cssMap.set(predefinedLayout.name, res);
                        resolve(res);

                    }).error(function (error) {
                        reject(error);
                    });
            });


        };

        $scope.selectLayout = function (layout,autoSave,proceedToSave) {
            // To prevent make a save for the first time we render the layouts
            if ($scope.selectedLayout && $scope.selectedLayout.name === layout.name && !proceedToSave) {
                $scope.isDeleteLayoutLoading = false;
                $scope.isCloneCustomLayoutLoading = false;
                return;
            }

            $scope.isDeleteLayoutLoading = false;
            $scope.isCssLoading = false;

            $scope.selectedLayout = layout;
            $scope.selectedLayoutName = layout.name;
           if(autoSave) saveSelectedLayout(layout);

            loadCssContent(layout);

        };

        const setEditorValue = function (css,turnOffAutoSave) {
            if (!$scope.editor) {
                return;
            };
            $scope.turnOffAutoSave = turnOffAutoSave;
            $scope.editor.setValue(css);

        };

        const loadCssContent = function (layout) {

            const isCustomLayout = !layout.cssPath;
            const cssContent = cssMap.get(layout.name);
            let editorValue;
            if ($scope.editor) {
                editorValue = $scope.editor.getValue();
            }
            //if it is custom layout
            if (isCustomLayout) {
                if (editorValue == layout.css) {
                    $scope.turnOffAutoSave = false;
                    return;
                }
                setEditorValue(layout.css,true);
                return;
            };
            //if it is predefined layout and css content fetched already
            if (!isCustomLayout && cssContent) {
                if (editorValue == cssContent) {
                    $scope.turnOffAutoSave = false;
                    return;
                }
                setEditorValue(cssContent,true);
                return;
            };
            //fetch css content for predefined layouts on first click only.
            if (!isCustomLayout && !cssContent) {
                $scope.isCssLoading = true;
                fetchLayout(layout).then((css) => {
                    setEditorValue(css,true);
                    $scope.isCssLoading = false;
                }).catch((err) => {
                    console.error(err);
                    window.toast("error fetching layout","danger");
                    $scope.isCssLoading = false;
                    setEditorValue('',true);
                });
            };
        }

        const injectEditorFiles = ({ type, src }) => {
            return new Promise((resolve, reject) => {
                if (type === 'js') {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = src;
                    script.addEventListener('load', resolve);
                    script.addEventListener('error', e => reject(e.error));
                    document.querySelector('.layouts-view').appendChild(script);
                } else {
                    const css = document.createElement('link');
                    css.rel = 'stylesheet';
                    css.href = src;
                    css.addEventListener('load', resolve);
                    css.addEventListener('error', e => reject(e.error));
                    document.querySelector('.layouts-view').appendChild(css);
                }
            });
        };

        const initializeEditor = () => {
            let pluginTesterPath='';
            if (siteConfigScope === 'sdk') {
                pluginTesterPath = window.siteConfig.endPoints.appHost;
            }

            const customCSSFiles = [
                { type: "css", src: pluginTesterPath + "/scripts/lib/codeMirror/lib/codemirror.css" },
                { type: "css", src: pluginTesterPath + "/scripts/lib/codeMirror/lint/lint.css" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/lib/codemirror.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/mode/css.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/addons/matchbrackets.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/addons/autorefresh.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/lint/csslint.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/lint/lint.js" },
                { type: "js", src: pluginTesterPath + "/scripts/lib/codeMirror/lint/css-lint.js" }
            ];

            const promises = customCSSFiles.reduce((prevPromise, file) => {
                return prevPromise.then(() => injectEditorFiles(file));
            }, Promise.resolve());

            promises
                .then(() => {
                    const editor = CodeMirror.fromTextArea(
                        document.getElementById("codeEditor"),
                        {
                            lineNumbers: true,
                            mode: "css",
                            lineWrapping: true,
                            matchBrackets: true,
                            gutters: ["CodeMirror-lint-markers"],
                            lint: true,
                            autoRefresh: true,
                            readOnly: false,

                        }
                    );
                    $scope.editor = editor;
                    if ($scope.selectedLayout) {
                        loadCssContent($scope.selectedLayout);
                    }
                    setTimeout(() => {

                        let tmrDelay = null;
                        editor.on("change", () => {

                            clearTimeout(tmrDelay);
                            tmrDelay = setTimeout(() => {

                                if (!$scope.editor.getValue()) {
                                    $scope.isEditorEmpty = true;

                                } else {
                                    $scope.isEditorEmpty = false;
                                }
                                $scope.cssError = null;
                                if (!$scope.turnOffAutoSave) {
                                    $scope.autoSave();
                                }

                                $scope.turnOffAutoSave = false;
                                if (!$scope.$$phase) $scope.$digest();

                            }, 800);
                            
                        });

                        if (!$scope.$$phase) $scope.$digest();
                    }, 0);
                })
                .catch(console.error);
        };

        $scope.getImageSrc = function (layout) {

            const relativePath = layout.imageUrl.includes('resources/') ? '/' : '/resources/';

            let url;
            let resizedUrl;
            if (siteConfigScope === 'cp') {
                url = window.siteConfig.endPoints.pluginHost + "/" + $routeParams.folderName + relativePath + layout.imageUrl;

                resizedUrl = $scope.$parent.tools.resizeImage(url, {
                    width: 144,
                    height: 317
                });

            } else if (siteConfigScope === 'sdk') {
                
                if (pluginJson.webpack) {
                    url = window.location.protocol + '//' + window.location.hostname + ':' + pluginJson.webpack + relativePath + layout.imageUrl;
                    url = `${window.location.origin}/plugins/${$routeParams.pluginFolder}/src`+ relativePath + layout.imageUrl;
                    
                } else {
                    url = `${window.location.origin}/plugins/${$routeParams.pluginFolder}`+ relativePath + layout.imageUrl;
                }
                resizedUrl = url;
            }

            return resizedUrl ? resizedUrl : url;
        };

        $scope.advancedModeSwitch = function () {

            if ($scope.showAdvancedMode) {
                $scope.showAdvancedMode = false;
            } else {
                $scope.showAdvancedMode = true;
            }
            if (!$scope.$$phase) $scope.$digest();
        }

        $scope.autoSave = function () {
            if (!$scope.showAdvancedMode) {
                return;
            }
            const error = CodeMirror.lint.css($scope.editor.getValue()).find(e => e.severity == 'error');
            if (error) {
                $scope.cssError = error.message;
                return;
            } else {
                $scope.cssError = null;
            }

            if ($scope.isEditorEmpty) {
                $scope.cssError = 'CSS content could not be empty!';
                return;
            }else{
                $scope.cssError = null;
            }

            let isDefaultLayout = $scope.selectedLayout.cssPath;
            let layoutName = $scope.selectedLayoutName;
            let content = $scope.editor.getValue();

            if (isDefaultLayout) {
                let copiedLayouts = $scope.allLayouts.filter(l => l.name.includes(layoutName)).length;

                if (copiedLayouts) {
                    layoutName += " copy"
                }
                if (copiedLayouts > 1) {
                    layoutName += " " + String(copiedLayouts)
                }
                cloneLayout($scope.selectedLayout.name, content, layoutName);
            } else {
                let customLayoutIndex = $scope.customLayouts.findIndex(customLayout => customLayout.name === $scope.selectedLayout.name);
                let allLayoutsIndex = $scope.allLayouts.findIndex(layout => layout.name === $scope.selectedLayout.name);
                let nameExists = $scope.allLayouts.filter((l, index) => l.name == layoutName && index !== allLayoutsIndex).length;
                if (nameExists) layoutName += " " + String(nameExists + 1);
                let proceedToSave = true;
                if ($scope.customLayouts[customLayoutIndex].css === content && $scope.selectedLayout.name === layoutName) {
                    return;
                }

                $scope.customLayouts[customLayoutIndex].css = content;
                $scope.customLayouts[customLayoutIndex].name = layoutName;
               
                $scope.allLayouts = [...$scope.predefinedLayouts, ...$scope.customLayouts];
                saveCustomLayouts();
                $scope.selectLayout($scope.customLayouts[customLayoutIndex],true,proceedToSave);
            }
        };

        $scope.layoutNameOnChange = function () {
            $scope.autoSave();
        };

        $scope.resetLayout = function () {

            let defaultLayout;
            if ($scope.selectedLayout.originalLayoutName) {
                defaultLayout = $scope.predefinedLayouts.find(layout => layout.name === $scope.selectedLayout.originalLayoutName);
            } else {
                defaultLayout = $scope.predefinedLayouts.find(layout => layout.name === $scope.selectedLayout.name);
            }
            if (defaultLayout) {
                const cssContent = cssMap.get(defaultLayout.name);
                if (!cssContent) {
                    $scope.isCssLoading = true;
                    fetchLayout(defaultLayout).then((css) => {
                        setEditorValue(css,false);
                        $scope.isCssLoading = false;
                    }).catch((err) => {
                        console.error(err);
                        window.toast("error fetching layout","danger");
                        $scope.isCssLoading = false;
                        setEditorValue('',true);

                    });
                } else {
                    setEditorValue(cssContent,false);
                }
            }

        };

        $scope.deleteCustomLayout = function () {
            $scope.isDeleteLayoutLoading = true;
            let index = $scope.customLayouts.findIndex(layout => layout.name === $scope.selectedLayout.name);
            if (index == -1) return

            let deletedLayout = $scope.customLayouts.splice(index, 1)[0];
            saveCustomLayouts();

            $scope.allLayouts = [...$scope.predefinedLayouts, ...$scope.customLayouts];

            let originalLayoutIndex = $scope.allLayouts.findIndex(layout => layout.name === deletedLayout.originalLayoutName);
            let selectedLayout = $scope.allLayouts[originalLayoutIndex]

            $scope.selectLayout(selectedLayout,true);
        };

        const cloneLayout = function (layoutName, css, newName) {
            let layout = $scope.allLayouts.find(layout => layout.name == layoutName);
            if (!layout) return;

            let clonedLayout = {
                name: newName,
                originalLayoutName: layout.name,
                css: css,
                imageUrl: layout.imageUrl
            }

            $scope.customLayouts.push(clonedLayout);
            $scope.allLayouts.push(clonedLayout);
            const proceedToSave = true;

            saveCustomLayouts();
            $scope.selectLayout(clonedLayout,true,proceedToSave);
        };

        $scope.cloneCustomLayout = function () {
            const error = CodeMirror.lint.css($scope.editor.getValue()).find(e => e.severity == 'error');
            if (error) {
                $scope.cssError = error.message;
                return;
            } else {
                $scope.cssError = null;
            }

            if ($scope.isEditorEmpty) {
                $scope.cssError = 'CSS content could not be empty!';
                return;
            }else{
                $scope.cssError = null;
            }
            let layoutName = $scope.selectedLayoutName;
            let clonedLayouts = $scope.customLayouts.filter(l => l.name.includes(layoutName)).length;

            if (layoutName.includes(' clone')) {
                const [originalCustomLayoutName, cloneNum] = layoutName.split(" clone-");
                layoutName = originalCustomLayoutName + " clone-" + String(Number(cloneNum) + 1);
            }

            if (clonedLayouts && !layoutName.includes(' clone')) {
                layoutName += " clone-1"
            }
            const clonedLayout = {
                originalLayoutName:$scope.selectedLayout.originalLayoutName,
                imageUrl:$scope.selectedLayout.imageUrl,
                css:$scope.selectedLayout.css,
                name: layoutName
            };
            
            $scope.isCloneCustomLayoutLoading = true;
            $scope.customLayouts.push(clonedLayout);
            $scope.allLayouts.push(clonedLayout)
            saveCustomLayouts();
            $scope.selectLayout(clonedLayout, true, true);
        };

        $scope.showCssColorsVariables = function () {
            if (siteConfigScope === 'sdk'){
                return;
            }
            
            window.appearanceHelper.get((err,res)=>{
                if (err) {
                    console.error(err);
                    return;
                }
                if (res && res.data && res.data.colors && Object.keys(res.data.colors).length) {
                    const colorsObj = res.data.colors;
                    const colorsArray = [];
                    for (const [colorName, value] of Object.entries(colorsObj)) {
    
                        const colorObj = {
                            colorName: colorName,
                            colorValue: value
                        };
                        switch(colorName) {
                            case 'primaryTheme':
                                colorObj.cssVariableName = "--bf-theme-primary";
                                colorObj.renderedColorName = "Primary Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'successTheme':
                                colorObj.cssVariableName = "--bf-theme-success";
                                colorObj.renderedColorName = "Success Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'warningTheme':
                                colorObj.cssVariableName = "--bf-theme-warning";
                                colorObj.renderedColorName = "Warning Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'infoTheme':
                                colorObj.cssVariableName = "--bf-theme-info";
                                colorObj.renderedColorName = "Info Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'defaultTheme':
                                colorObj.cssVariableName = "--bf-theme-default";
                                colorObj.renderedColorName = "Default Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'dangerTheme':
                                colorObj.cssVariableName = "--bf-theme-danger";
                                colorObj.renderedColorName = "Danger Links & Buttons";
                                colorsArray.push(colorObj);
                              break;
                            case 'backgroundColor':
                                colorObj.cssVariableName = "--bf-theme-background";
                                colorObj.renderedColorName = "Background Color";
                                colorsArray.push(colorObj);
                              break;
                            case 'bodyText':
                                colorObj.cssVariableName = "--bf-theme-body-text";
                                colorObj.renderedColorName = "Body Text";
                                colorsArray.push(colorObj);
                              break;
                            case 'footerMenuBackgroundColor':
                                colorObj.cssVariableName = "--bf-theme-footer-background";
                                colorObj.renderedColorName = "Navbar Background";
                                colorsArray.push(colorObj);
                              break;
                            case 'footerMenuIconColor':
                                colorObj.cssVariableName = "--bf-theme-footer-icon";
                                colorObj.renderedColorName = "Navbar Icon Color";
                                colorsArray.push(colorObj);
                              break;
                            case 'headerText':
                                colorObj.cssVariableName = "--bf-theme-header-text";
                                colorObj.renderedColorName = "Header Text";
                                colorsArray.push(colorObj);
                              break;
                            case 'icons':
                                colorObj.cssVariableName = "--bf-theme-icons";
                                colorObj.renderedColorName = "Icons";
                                colorsArray.push(colorObj);
                              break;
                            case 'titleBar':
                                colorObj.cssVariableName = "--bf-theme-title-bar";
                                colorObj.renderedColorName = "Title Bar";
                                colorsArray.push(colorObj);
                              break;
                            case 'titleBarTextAndIcons':
                                colorObj.cssVariableName = "--bf-theme-text-icons";
                                colorObj.renderedColorName = "Title Bar Text & Icons";
                                colorsArray.push(colorObj);
                              break;
                            default:
                          }
                        }
    
                    const colorsList = `<ul class="padding-left-fifteen padding-top-ten">
                    ${colorsArray.reduce((acc, elem) => acc +=`<div class="colors-list-grid_css-injection">
                    <span class="border-grey border-radius-two" style="width:17px; height:17px; background-color:${elem.colorValue}; margin: auto 0; "></span>
                    <span style="margin: auto 0;">${elem.renderedColorName}</span>
                    <span style="margin: auto 0;">var(${elem.cssVariableName})</span>
                    <span style="text-align: right; margin: auto 0 !important; margin-right: 10px !important; scale: 1.4;">
                    <a class="icon icon-copy copy-icon margin-zero" onclick="(function(){
                        const copyElement = document.createElement('textarea');
                        copyElement.style.position = 'fixed';
                        copyElement.style.opacity = '0';
                        copyElement.textContent = 'var(${elem.cssVariableName})';
                        const body = document.getElementsByTagName('body')[0];
                        body.appendChild(copyElement);
                        copyElement.select();
                        document.execCommand('copy');
                        body.removeChild(copyElement);
                        window.toast('Copied!');
                    })()"></a>
                    </span>
                    </div> \n`, '')}
                    </ul>
                    <hr/>
                    <div class="text-bold">Copy color from the list and paste it in the CSS code like here:</div>
                    <div style="background-color: #F2F2F2">.list-item-title { color: <span class="text-bold">var(--bf-theme-header-text)</span>; }</div>
                    `;
                    window.PopupLibAPI.showDialog({
                        title: "CSS Color Variables",
                        message: colorsList,
                        buttons: [
                            { text: "Close", type: "default", key: "close" }
                        ],
                        size: 'md'
                    }, (err, result) => {
                       
                    });
                }
            });
        };

        const start = function () {

            $scope.allLayouts = [];
            $scope.customLayouts = [];
            $scope.defaultLayout = pluginJson.control.cssInjection.layouts[0];
            $scope.selectedLayout = null;
            $scope.selectedLayoutName = '';
            $scope.selectedLayoutInDesign = null;
            $scope.showAdvancedMode = false;
            $scope.editor = null;
            $scope.cssError = null;
            $scope.isLoadingDone = false;
            $scope.predefinedLayouts = pluginJson.control.cssInjection.layouts;
            $scope.isDeleteLayoutLoading = false;
            $scope.isCssLoading = false;
            $scope.isEditorEmpty = false;
            $scope.isCloneCustomLayoutLoading = false;
            

            Promise
                .all([

                    getCustomLayouts(),
                    getSelectedLayout()
                ])
                .then(([customLayouts, selectedLayout]) => {
                    //custom layouts
                    if (customLayouts) {
                        $scope.customLayouts = customLayouts;
                        $scope.allLayouts = [...$scope.predefinedLayouts, ...$scope.customLayouts];
                    }

                    //selected layout
                    if (selectedLayout) {
                        onSelectedLayoutReceived(selectedLayout);
                    }

                    $scope.isLoadingDone = true;
                })
                .catch((error) => {
                    console.error(error);
                });

            //initialize Editor;
            initializeEditor();
        };

        start();

    }
]);
