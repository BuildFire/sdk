if (typeof AppDatasourcesAPI == 'undefined') {
	window.AppDatasourcesAPI = function (context) {
	};
}

AppDatasourcesAPI.prototype.showDialog = function (data, callback) {
	const openDialogOptions = {
		templateUrl: 'pages/templates/datasources.html',
		controller: 'datasourcesDialogCtrl',
		size: 'lg',
		data: {
			isDailog: true,
			...data,
		},
	};

	window.openDialog(openDialogOptions, function (result) {
		if (callback) callback(null, result);
	});
};

class AppDatasource {
	constructor() {
		this.ds = new DatastoreAPI(
			window.appContext.currentApp.appId,
			'globalSettings',
			'globalSettings',
			window.appContext.liveMode
		);
	}

	getGlobalSettings() {
		return new Promise((resolve, reject) => {
			this.ds.get(
				{
					tag: 'globalSettings',
				},
				(err, result) => {
					if (err) {
						reject(err);
						return;
					}
					resolve(result);
				}
			);
		});
	}

	get() {
		return new Promise((resolve, reject) => {
			this.ds.get(
				{
					tag: 'globalSettings',
				},
				(err, result) => {
					if (err) {
						reject(err);
						return;
					}

					if (!result || !Object.keys(result.data).length) {
						this.ds.save(
							{
								tag: 'globalSettings',
								obj: {
									appDatasources: [],
								},
							},
							(err, result) => {
								console.log(result);
							}
						);
					}

					result =
						result && result.data && result.data.appDatasources
							? result.data.appDatasources
							: [];
					for (const datasource of result) {
						datasource.configuration =
							typeof datasource.configuration !== 'string'
								? datasource.configuration
								: this.decrypteBase64(datasource.configuration);
					}
					resolve(result);
				}
			);
		});
	}

	insert(datasource) {
		return new Promise((resolve, reject) => {
			datasource.configuration = this.encrypteBase64(datasource.configuration);
			this.ds.save(
				{
					tag: 'globalSettings',
					obj: {
						$push: {
							appDatasources: datasource,
						},
					},
				},
				(err, res) => {
					if (err) {
						reject(err);
						return;
					}

					resolve(res);
				}
			);
		});
	}

	update(appDatasources) {
		return new Promise((resolve, reject) => {
			for (const datasource of appDatasources) {
				datasource.configuration = this.encrypteBase64(datasource.configuration);
			}
			this.ds.save(
				{
					tag: 'globalSettings',
					obj: {
						$set: {
							appDatasources: appDatasources,
						},
					},
				},
				(err, res) => {
					if (err) {
						reject(err);
						return;
					}

					resolve(res);
				}
			);
		});
	}

	delete(id) {
		return new Promise((resolve, reject) => {
			this.ds.save(
				{
					tag: 'globalSettings',
					obj: {
						$pull: {
							appDatasources: {
								_id: id,
							},
						},
					},
				},
				(err, res) => {
					if (err) {
						reject(err);
						return;
					}

					resolve(res);
				}
			);
		});
	}

	encrypteBase64(data) {
		data = JSON.stringify(data);
		const base64String = btoa(data);
		return base64String;
	}

	decrypteBase64(base64String) {
		const decodedString = atob(base64String);
		const decodedObj = JSON.parse(decodedString);
		return decodedObj;
	}
}

$app.controller('datasourcesCtrl', [
	'$scope',
	'$http',
	function ($scope) {
		const appDatasource = new AppDatasource();

		let initializedCodeEditor = false;
		let editors = {};
		let fetchAlreadyTriggered = false;

		$scope.dialogOptions =
			$scope.$parent && $scope.$parent.dialogOptions ? $scope.$parent.dialogOptions : {};

		$scope.addNewDatasource = (type) => {
			$scope.action = 'add';
			$scope.selectedDatasourceType = type;

			if (type === $scope.DATASOURCE_TYPE.webApi.key) {
				$scope.newDatasource = {
					configuration: {
						method: 'GET',
					},
				};
			} else {
				$scope.newDatasource = {
					configuration: {},
				};
			}

			initializeCodeEditors();
		};

		$scope.cancel = () => {
			$scope.action = '';
			$scope.fetchDataSuccessfully = false;
			$scope.newDatasource = {};
			$scope.selectedDatasourceType = '';
			$scope.fetchResult = '';
			$scope.fetchError = '';
			$scope.fetchStatusCode = '';
			$scope.errors = {};
			editors['results'].setValue('');
			fetchAlreadyTriggered = false;
		};

		$scope.openExpresionBuild = (key) => {
			const openDialogOptions = {
				templateUrl: 'pages/share/expressionsBuilder.html',
				controller: 'expressionsBuilderCtrl',
				size: 'lg',
				data: {
					options: {
						string: $scope.newDatasource.configuration[key]
							? $scope.newDatasource.configuration[key]
							: '',
						disableDatasource: true,
					},
				},
			};

			window.openDialog(openDialogOptions, function (result) {
				console.log(result);
				if (result) {
					$scope.newDatasource.configuration[key] = result;
				}
			});
		};

		const checkIfNameUnique = (datasource) => {
			const isNameExists = $scope.datasources.find(
				(elem) => elem.id === datasource.id && elem._id !== datasource._id
			);
			return !isNameExists;
		};

		const prepareGoogleSheetUrl = (config) => {
			const sheetBaseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

			return `${sheetBaseUrl}/${encodeURIComponent(
				config.sheetId
			)}/values/${encodeURIComponent(config.sheetName)}?key=${encodeURIComponent(
				config.apiKey
			)}`;
		};

		const setDatasourceObj = (datasource) => {
			if ($scope.action === 'add') {
				datasource._id = datasource._id ? datasource._id : window.crypto.randomUUID();
				datasource.type = 'api';
				datasource.subType =
					$scope.selectedDatasourceType === $scope.DATASOURCE_TYPE.googleSheet.key
						? $scope.DATASOURCE_TYPE.googleSheet.key
						: null;
			}

			if ($scope.selectedDatasourceType === $scope.DATASOURCE_TYPE.googleSheet.key) {
				datasource.configuration.url = prepareGoogleSheetUrl(datasource.configuration);
			}
			return datasource;
		};

		const validate = (datasource) => {
			let isValid = true;

			if (!datasource.id) {
				isValid = false;
			}

			if ($scope.selectedDatasourceType === $scope.DATASOURCE_TYPE.webApi.key) {
				if (!datasource.configuration.method) {
					isValid = false;
				}

				if (!datasource.configuration.url) {
					isValid = false;
				}

				if (datasource.configuration.headers) {
					try {
						const data = JSON.parse(datasource.configuration.headers);
					} catch (error) {
						isValid = false;
						$scope.errors.headers = true;
					}
				}

				if (datasource.configuration.body) {
					try {
						const data = JSON.parse(datasource.configuration.body);
					} catch (error) {
						isValid = false;
						$scope.errors.body = true;
					}
				}

				if (datasource.configuration.params) {
					try {
						const data = JSON.parse(datasource.configuration.params);
					} catch (error) {
						isValid = false;
						$scope.errors.params = true;
					}
				}
			} else {
				if (!datasource.configuration.sheetId) {
					isValid = false;
				}

				if (!datasource.configuration.sheetName) {
					isValid = false;
				}

				if (!datasource.configuration.apiKey) {
					isValid = false;
				}
			}

			if (!$scope.$$phase) {
				$scope.$digest();
			}
			return isValid;
		};

		function formatJSON(editor) {
			var code = editor.getValue();
			try {
				let parsedCode = JSON.parse(code);
				let formattedCode = JSON.stringify(parsedCode, null, 2);
				editor.setValue(formattedCode);
			} catch (e) {
				console.error(e);
			}
		}

		$scope.fetchData = function (form) {
			 //Expression Service not implemented yet in plugin tester to be used.
			const dialogAPI = new DialogAPI({});
			dialogAPI.alert({
				message: "Datasources not available yet in Plugin Tester.",
			}, ()=>{});
			return;

			if (!dynamicEngine || !dynamicEngine.expressions || !dynamicEngine.expressions.evaluate) {
				$scope.error = "Dynamic Expressions Service not defined!";
				window.toast($scope.error, 'danger');
				return;
        	}


			$scope.errors = {};
			if (form.$invalid || !validate($scope.newDatasource)) {
				return;
			}

			$scope.fetchDataSuccessfully = false;
			$scope.fetchResult = '';
			$scope.fetchError = '';
			editors['results'].setValue('');
			$scope.fetchStatusCode = '';

			const datasource = setDatasourceObj($scope.newDatasource);

			const copyDatasource = copyObj(datasource);
			copyDatasource.configuration = appDatasource.encrypteBase64(
				copyDatasource.configuration
			);
			$scope.fetching = true;
			dynamicEngineService.datasources.fetchDatasource(
				{ datasource: copyDatasource },
				(err, res) => {
					$scope.fetching = false;
					fetchAlreadyTriggered = true;
					if (err) {
						$scope.fetchError = JSON.stringify(err);
						$scope.fetchDataSuccessfully = true;

						if (editors['results']) {
							editors['results'].setValue(JSON.stringify(err));
							formatJSON(editors['results']);
						}

						// if (err.status) {
						//     $scope.fetchStatusCode = err.status;
						// }

						if (!$scope.$$phase) {
							$scope.$digest();
						}
						return;
					}

					$scope.fetchResult = JSON.stringify(res);
					$scope.fetchStatusCode = '200';

					if (editors['results']) {
						editors['results'].setValue(
							JSON.stringify({
								status: 200,
								response: res,
							})
						);
						formatJSON(editors['results']);
					}

					$scope.fetchDataSuccessfully = true;
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				}
			);
		};

		const getDatasources = () => {
			$scope.loading = true;
			appDatasource
				.get()
				.then((datasources) => {
					$scope.datasources = datasources;
					$scope.loading = false;
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				})
				.catch((error) => {
					console.error(error);
					$scope.loading = false;
				});
		};

		const triggerGlobalSettingsOnUpdate = () => {
			appDatasource
				.getGlobalSettings()
				.then((res) => {
					emulatorSync.triggerGlobalSettingsOnUpdate(res);
				})
				.catch(console.error);
		};

		$scope.save = () => {
			if (!checkIfNameUnique($scope.newDatasource)) {
				$scope.errors.uniqueID = true;
				return;
			} else {
				$scope.errors.uniqueID = false;
			}

			if (!$scope.fetchDataSuccessfully && $scope.action === 'add') {
				return;
			}

			const datasource = copyObj($scope.newDatasource);
			if ($scope.action === 'edit') {
				update(datasource);
			} else {
				insert(datasource);
			}
		};

		const update = (datasource) => {
			datasource.lastUpdatedOn = new Date();
			$scope.datasources.forEach((elem, index) => {
				if (elem._id === datasource._id) {
					$scope.datasources[index] = datasource;
				}
			});
			$scope.saving = true;
			appDatasource
				.update($scope.datasources)
				.then(() => {
					$scope.saving = false;
					getDatasources();
					triggerGlobalSettingsOnUpdate();
					$scope.cancel();
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				})
				.catch((err) => {
					console.error(err);
					$scope.saving = false;
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				});
		};

		const insert = (datasource) => {
			$scope.saving = true;
			datasource.createdOn = new Date();
			datasource.lastUpdatedOn = new Date();
			appDatasource
				.insert(datasource)
				.then(() => {
					getDatasources();
					triggerGlobalSettingsOnUpdate();
					$scope.saving = false;
					$scope.cancel();
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				})
				.catch((err) => {
					console.error(err);
					$scope.saving = false;
					if (!$scope.$$phase) {
						$scope.$digest();
					}
				});
		};

		const copyObj = (data) => {
			return JSON.parse(JSON.stringify(data));
		};

		$scope.updateDatasource = (datasource) => {
			$scope.action = 'edit';
			$scope.selectedDatasourceType = datasource.subType
				? datasource.subType
				: $scope.DATASOURCE_TYPE.webApi.key;
			$scope.newDatasource = copyObj(datasource);
			initializeCodeEditors();
		};

		$scope.deleteDatasource = (datasource) => {
			const dialogOptions = {
				templateUrl: '/pages/common/confirmationDialog.html',
				controller: 'confirmationDialogCtrl',
				size: 'sm',
				data: {
					dialogOptions: {
						title: 'Delete Datasource',
						titleColor: 'danger',
						message: `Are you sure you want to delete the ${datasource.id} datasource?`,
						confirmBtnName: 'Delete',
						cancelBtnName: 'Cancel',
					},
				},
			};

			window.openDialog(dialogOptions, function (action) {
				if (action === 'yes') {
					appDatasource
						.delete(datasource._id)
						.then(() => {
							$scope.datasources = $scope.datasources.filter(
								(elem) => datasource._id !== elem._id
							);
							triggerGlobalSettingsOnUpdate();
						})
						.catch((err) => {
							console.error(err);
						});
				}
			});
		};

		let tmrDelay = null;
		const fetchDataWithDelay = () => {
			clearTimeout(tmrDelay);
			tmrDelay = setTimeout(() => {
				$scope.fetchData({});
			}, 500);
		};

		const watchObj = () => {
			$scope.$watch(
				'newDatasource',
				function (newVal, oldVal) {
					if (
						JSON.stringify(newVal.configuration) !==
						JSON.stringify(oldVal.configuration)
					) {
						setDatasourceObj(newVal);
						$scope.fetchDataSuccessfully = false;
						$scope.errors = {};
						if (fetchAlreadyTriggered) {
							if (
								$scope.selectedDatasourceType ===
									$scope.DATASOURCE_TYPE.googleSheet.key &&
								newVal.configuration.url !== oldVal.configuration.url
							) {
								fetchDataWithDelay();
							} else if (
								$scope.selectedDatasourceType === $scope.DATASOURCE_TYPE.webApi.key
							) {
								fetchDataWithDelay();
							}
						}
					}
				},
				true
			);
		};

		const injectEditorFiles = ({ type, src }) => {
			return new Promise((resolve, reject) => {
				if (type === 'js') {
					const script = document.createElement('script');
					script.type = 'text/javascript';
					script.src = src;
					script.addEventListener('load', resolve);
					script.addEventListener('error', (e) => reject(e.error));
					document.querySelector('#appDatasources').appendChild(script);
				} else {
					const css = document.createElement('link');
					css.rel = 'stylesheet';
					css.href = src;
					css.addEventListener('load', resolve);
					css.addEventListener('error', (e) => reject(e.error));
					document.querySelector('#appDatasources').appendChild(css);
				}
			});
		};

		const initializeEditorScripts = () => {
			 let pluginTesterPath = window.siteConfig.endPoints.appHost;
			const customCSSFiles = [
				{ type: 'css', src: pluginTesterPath + '/scripts/lib/codeMirror/lib/codemirror.css' },
				{ type: 'js', src: pluginTesterPath + '/scripts/lib/codeMirror/lib/codemirror.js' },
				// { type: 'js', src: pluginTesterPath + '/scripts/lib/codeMirror/mode/javascript.js' },
				{ type: 'js', src: pluginTesterPath + '/scripts/lib/codeMirror/addons/matchbrackets.js' },
				{ type: 'js', src: pluginTesterPath + '/scripts/lib/codeMirror/addons/autorefresh.js' },
				{ type: 'js', src: pluginTesterPath + '/scripts/lib/codeMirror/lint/lint.js' },
			];

			if (!initializedCodeEditor) {
				const promises = customCSSFiles.reduce((prevPromise, file) => {
					return prevPromise.then(() => injectEditorFiles(file));
				}, Promise.resolve());

				return promises
					.then(() => {
						initializedCodeEditor = true;
						return true;
					})
					.catch(console.error);
			} else {
				return Promise.resolve();
			}
		};

		const initCodeEditor = (key) => {
			initializeEditorScripts().then(() => {
				editors[key] = CodeMirror.fromTextArea(
					document.getElementById(`codeEditor_${key}`),
					{
						lineNumbers: key === 'results' ? false : true,
						mode: 'application/json',
						lineWrapping: true,
						matchBrackets: true,
						gutters: ['CodeMirror-lint-markers'],
						lint: true,
						autoRefresh: key === 'results' ? false : true,
						readOnly: key === 'results' ? 'nocursor' : false,
					}
				);

				if ($scope.newDatasource.configuration[key]) {
					editors[key].setValue($scope.newDatasource.configuration[key]);
				} else {
					editors[key].setValue('');
				}
				if (key !== 'results') {
					let tmrDelay = null;
					editors[key].on('change', () => {
						const isEmpty = !editors[key].getValue().replace(/\s/g, '');
						$scope.newDatasource.configuration[key] = isEmpty
							? ''
							: editors[key].getValue().trim();
						if (!$scope.$$phase) $scope.$digest();
					});
				}
			});
		};

		const initializeCodeEditors = () => {
			if ($scope.selectedDatasourceType === $scope.DATASOURCE_TYPE.webApi.key) {
				initCodeEditor('headers');
				initCodeEditor('body');
				initCodeEditor('params');
			}

			initCodeEditor('results');
		};

		const init = () => {
			$scope.DATASOURCE_TYPE = {
				webApi: {
					key: 'webApi',
					alias: 'Web API',
				},
				googleSheet: {
					key: 'googleSheet',
					alias: 'Google Sheet',
				},
			};
			$scope.REG_JSON_FORMAT = '[],:{}s]*$|^"([^\\"]|\\["\\/bfnrt]|\\u[da-fA-F]{4})*"$';

			$scope.loading = true;
			$scope.fetching = false;
			$scope.saving = false;
			$scope.fetchDataSuccessfully = false;
			$scope.datasources = [];
			$scope.action = '';
			$scope.selectedDatasourceType = '';
			$scope.fetchResult = '';
			$scope.fetchStatusCode = '';
			$scope.newDatasource = {};
			$scope.errors = {};

			getDatasources();
			watchObj();
		};

		init();
	},
]);

$app.controller('datasourcesDialogCtrl', [
	'$scope',
	'$data',
	'$dialog',
	function ($scope, $data, $dialog) {
		$scope.dialogOptions = $data ? $data : {};

		$scope.close = function () {
			$dialog.close(null);
		};
	},
]);
