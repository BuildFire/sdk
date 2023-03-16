$app.controller('languageSettingsCtrl', ['$scope', '$http', '$routeParams',
    function ($scope, $http, $routeParams) {

        const pluginJson =  $scope.$parent.$parent.$parent.pluginConfig;

        let languageTag = '$$languageSettings';
        if (pluginJson.control.language.tagName) {
            languageTag = pluginJson.control.language.tagName;
        }

        //create datastore api 
        const datastoreAPI = new DatastoreAPI({
            appId: window.appContext.currentApp.appId,
            pluginId: $routeParams.pluginFolder,
            instanceId: window.appContext.currentPlugin.instanceId,
            liveMode: window.appContext.liveMode,
            writeKey: window.appContext.currentApp.keys.datastoreKey,
        });

        //save language settings to datastore
        const saveLanguageSettings = (strings) => {
            const options = {
                tag: languageTag,
                obj:  {
                    strings: strings
                }
            };

            datastoreAPI.save(options, function (err, result) {
                if (err) console.error(err);
                
                const iframe = document.getElementById('widget');
                iframe.src = iframe.src;

            });
        };

        const fetchLanguageJson = () => {
            return new Promise ((resolve, reject) => {
                const relativePath = pluginJson.control.language.languageJsonPath;
                let languageJsonPath;

                if (pluginJson.webpack) {
                    languageJsonPath = `${window.location.origin}/plugins/${$routeParams.pluginFolder}/src/`+ relativePath;
                    
                } else {
                    languageJsonPath = `${window.location.origin}/plugins/${$routeParams.pluginFolder}`+ "/" + relativePath;
                }

                $http.get(languageJsonPath)
                .success((res) => {
                    resolve(res);
                })
                .error((err) => {
                    reject(err);
                });
            });

        };

        const handleWysiwygData = (pluginLanguageJson, sectionKey, labelKey, isFieldRequired) => {
            const wysiwygElement = document.getElementsByName(`${sectionKey}&${labelKey}`);
            if (wysiwygElement && wysiwygElement[0]) {
                if (typeof tinymce == "undefined") { //if tinymce disabled handle it as normal textarea tag.
                    return wysiwygElement[0].value;
                }
                const _tinymce = tinymce.get(wysiwygElement[0].id);
                if (!(_tinymce && _tinymce.getContent)) {
                    return;
                }

                if (!_tinymce.getContent() && isFieldRequired) {
                    pluginLanguageJson.sections[sectionKey].labels[labelKey].wysiwygRequiredEmpty = true;
                    return null;
                }else {
                    delete pluginLanguageJson.sections[sectionKey].labels[labelKey].wysiwygRequiredEmpty
                }

                return _tinymce.getContent();
            }
        };

        const prepareDataObjectToSave = (pluginLanguageJson) => {
            const sections = pluginLanguageJson.sections;
            if (!Object.keys(sections).length) {
                return null;
            }

            let obj = {};
            for (let sectionKey in sections) {
                let section = obj[sectionKey] = {};
                for (let labelKey in sections[sectionKey].labels) {
                    let inputFieldValue = sections[sectionKey].labels[labelKey].defaultValue;
                    const isFieldRequired = sections[sectionKey].labels[labelKey].required;
                    
                    if (sections[sectionKey].labels[labelKey].inputType === 'wysiwyg') {
                        inputFieldValue = handleWysiwygData(pluginLanguageJson, sectionKey, labelKey, isFieldRequired);
                    }

                    if (isFieldRequired && !inputFieldValue) {
                        return null;
                    }
                    const originalFieldValue = $scope.originalPluginLanguageJson[sectionKey][labelKey].defaultValue;
                    if (inputFieldValue != originalFieldValue) {
                        section[labelKey] = {
                            value : inputFieldValue ? inputFieldValue : ""
                        };
                    }
                }
            };
            if (!$scope.$$phase) $scope.$digest();

            return obj;
        };

        const getOriginalPluginLanguageStrings = (pluginLanguageJson) => {
            const sections = pluginLanguageJson.sections;
            if (!Object.keys(sections).length) {
                return null;
            }

            let obj = {};
            for (let sectionKey in sections) {
                let section = obj[sectionKey] = {};
                for (let labelKey in sections[sectionKey].labels) {
                    section[labelKey] = {
                        defaultValue : sections[sectionKey].labels[labelKey].defaultValue
                    };
                }
            };

            return obj;
        };

        //get language from datastore
        const getLanguage = () => {
            return new Promise ((resolve, reject) => {

                const options = {
                    tag: languageTag,
                };
    
                datastoreAPI.get(options, function (err, results) {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (results && results.data && results.data.strings) {
                        resolve(results.data.strings);

                    // handle backward compatibility
                    }else if (results && results.data) {
                        resolve(results.data);
                    }else{
                        resolve({});
                    }
    
                });
            });
        };

        $scope.save = function (formUnTouched) {
            if (formUnTouched) {
                return;
            }
            //prepare data structure to be saved in datastore
            const strings = prepareDataObjectToSave($scope.pluginLanguageJson);
            if (!strings) {
                return;
            }
            saveLanguageSettings(strings);

        };

        $scope.openExpressionsBuilder = (string, sectionKey, labelKey) => {
            const openDialogOptions = {
                templateUrl: 'pages/templates/expressionsBuilder.html',
                controller: 'expressionsBuilderCtrl',
                size: 'lg',
                data: {
                    string: string,
                }
            };

            window.openDialog(openDialogOptions, function (expression) {
                if (expression && sectionKey && labelKey) {
                    $scope.pluginLanguageJson.sections[sectionKey].labels[labelKey].defaultValue = expression;
                }
            });
    
        };
        const mergeStringValues = function (pluginLanguageJson, strings) {
            const sections = pluginLanguageJson.sections;
            // merge values from datastore into pluginLanguageJson
            for (const sectionKey in sections) {
                const dbSection = strings[sectionKey];
                if (!dbSection) {
                    break;
                }
                const defaultSection = sections[sectionKey].labels;
                for (const labelKey in defaultSection) {

                    if (dbSection[labelKey]) {
                        //handle backward compatibility, cuz some plugins has it in "value" and the others in "defaultValue"
                        if (dbSection[labelKey].hasOwnProperty("value")) {
                            defaultSection[labelKey].defaultValue = dbSection[labelKey].value;
                        }else if (dbSection[labelKey].hasOwnProperty("defaultValue")) {
                            defaultSection[labelKey].defaultValue = dbSection[labelKey].defaultValue;
                        }
                    }
                };
                
            };
        };

        const start = function () {

            $scope.strings = {};
            $scope.pluginLanguageJson = null;
            $scope.originalPluginLanguageJson = null;
            $scope.isLoadingDone = false;

            Promise.all([
                fetchLanguageJson(),
                getLanguage()
            ])
            .then(([pluginLanguageJson, strings]) => {

                $scope.isLoadingDone = true;
                // languages json file
                $scope.pluginLanguageJson = pluginLanguageJson;
                $scope.originalPluginLanguageJson = getOriginalPluginLanguageStrings(pluginLanguageJson);
                // language settings
                $scope.strings = strings;
                mergeStringValues($scope.pluginLanguageJson, $scope.strings);

                if (!$scope.$$phase) $scope.$digest();
            })
            .catch((err) => {
                console.error(err);
                $scope.pluginLanguageJson = {};
                $scope.originalPluginLanguageJson = {};
                $scope.isLoadingDone = true;
            });
        };

        start();
       
      }
]);
