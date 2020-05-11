$app.controller('userProfileCtrl', [
	'Upload',
	'$scope',
	function (Upload, $scope) {
		$scope._appRoot = window._appRoot;
		window.authAPI.userProfileCtrlScope = $scope;
		$scope.editingProfile = false;
		$scope.uploadProfileImage = null;

		var appId = window.appContext.currentApp.appId;

		$scope.appData = new AppDatastoreAPI(appId);

		var searchOptions = {
			sort: { rank: 1 },
		};

		$scope.appData.search({ tag: '$$badges', obj: searchOptions }, (error, results) => {
			if (error) return console.error(error);
			$scope.badges = results;
		});

		var getUserBadges = function (user) {
			const userTags = user.tags ? user.tags[appId] : [];

			if (!userTags.length) return [];

			const userBadges = [];

			$scope.badges.forEach(function (badge) {
				var match = userTags.find(function (userTag) {
					var hasTag = userTag.tagName === badge.data.tag;

					return hasTag && userTag.appliedCount >= badge.data.tagCount;
				});

				if (match) {
					var appliedCount = Math.floor(match.appliedCount / badge.data.tagCount);
					badge.data.appliedCount = appliedCount;
					userBadges.push(badge.data);
				}
			});

			return userBadges;
		};

		function reset() {
			$scope.user = null;
			$scope.tempUser = null;

			$scope.userProfile = null;
			$scope.tempUserProfile = null;

			$scope.editingProfile = false;
			$scope.uploadProfileImage = null;
			$scope.uploadBackgroundImage = null;

			$scope.errors = {};
		}

		reset();

		var getUserProfileImage = function () {
			if (!$scope.user.imageUrl) {
				var data = {
					id: 1,
					method: 'users/getUserImage',
					params: { userId: $scope.user._id, externalAppId: window.currentAppId },
				};

				var url = window.siteConfig.endPoints.authHost + '/src/server.js?data=' + encodeURIComponent(JSON.stringify(data));

				$scope.user.imageUrl = url;
			} else {
				$scope.user.imageUrl = imageTools.cropImage($scope.user.imageUrl, {
					size: 's',
					aspect: '1:1',
				});
			}
			return $scope.user.imageUrl;
		};

		$scope.getUserProfile = function () {
			let data = {
				id: 1,
				method: 'users/getUserProfile',
				params: { userId: $scope.user._id },
			};

			let url = window.siteConfig.endPoints.socialHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(JSON.stringify(data));

			window.bfUtils.http
				.jsonp(url, { bypassInterceptorForStatus: 404 })
				.success(function (result) {
					if (result && result.result) {
						// stop using social email
						result.result.email = $scope.user.email;
						$scope.userProfile = result.result;
						if (result.result.backgroundImage) {
							if (window.location.indexOf('localhost') > -1) return;
							var cropped = imageTools.cropImage(result.result.backgroundImage, {
								size: 'full_width',
								aspect: '16:9',
							});
							result.result.backgroundImage = cropped || result.result.backgroundImage;
						}
					}
				})
				.error(function (data, status, headers, config) {
					$scope.invalidCredentials = true;

					console.error(data);
				});
		};

		$scope.close = function () {
			reset();
		};

		$scope.openProfile = function () {
			window.location.hash = '/editUserProfile';
			return false;
		};

		$scope.openUrl = function (url) {
			if (url) {
				if (url.toLowerCase().indexOf('http') < 0) url = 'https://' + url;
				window.open(url, '_blank', 'location=yes,enableViewportScale=yes');
			}
			return false;
		};

		var getPublicUser = function (userId, callback) {
			var data = {
				id: 1,
				method: 'users/getPublicUser',
				params: { userId: userId, externalAppId: window.currentAppId },
			};

			var url = window.siteConfig.endPoints.authHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(JSON.stringify(data));

			window.bfUtils.http
				.jsonp(url, { bypassInterceptorForStatus: 404 })
				.success(function (result) {
					result.result.badges = getUserBadges(result.result);
					callback(null, result);
				})
				.error(function (data, status, headers, config) {
					console.error(data);
					callback(data, null);
				});
		};

		var getPrivateUser = function (accessToken, callback) {
			let data = {
				id: 1,
				method: 'users/getUserByAccessToken',
				params: {
					accessToken: accessToken,
					externalAppId: window.currentAppId,
				},
			};

			let url = window.siteConfig.endPoints.authHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(JSON.stringify(data));

			window.bfUtils.http
				.jsonp(url, { bypassInterceptorForStatus: 404 })
				.success(function (result) {
					if (result && result.error) {
						if (result.error.code === 1311) {
							// invalid access token error; could be a stale or bad token
							var options = {
								data: {
									title: 'Login Required',
									body: 'Please login again',
									disableCancel: true,
								},
							};

							window.openDialog(options, function () {
								authAPI.logout();
							});
						} else if (result.error.code === 1309) {
							// user is no longer active
							authAPI.logout();
						} else {
							console.error(result.error);
							callback(result.error, null);
						}
					} else {
						result.result.badges = getUserBadges(result.result);
						callback(null, result);
					}
				})
				.error(function (data, status, headers, config) {
					console.error(data);
					callback(data, null);
				});
		};

		var userId = null;
		var currentUser = null;

		$scope.open = function (id) {
			userId = id;
			currentUser = authAPI.getCurrentUser();

			if (!userId) {
				if (currentUser && currentUser._id) {
					userId = currentUser._id;
				}
			}

			if (userId) {
				let getCustomRegistrationSettings = function () {
					let tagName = 'appearance',
						context = {
							appId: window.appContext.currentApp.appId,
							pluginId: tagName,
							instanceId: tagName,
						};

					let dsAppearance = new window.DatastoreAPI(context);

					dsAppearance.get({ tag: tagName, withDynamicData: true }, function (err, result) {
						if (err) {
							console.error(err);
							callback(err);
							return;
						}
						if (result && result.data && result.data.customRegistration && result.data.customRegistration.active && window.appContext.currentApp.config.type === 'enterprise') {
							$scope.showCustomUserProfile = true;
							if (currentUser && currentUser._id == userId) {
								// get profile with private fields
								getPrivateUser(currentUser.accessToken, function (err, data) {
									if (data) {
										$scope.user = data.result;
										if (currentUser && currentUser._id == $scope.user._id) {
											$scope.user.userToken = currentUser.userToken;
										}
										getUserProfileImage();
										buildCustomRegistration(result.data.customRegistration, data.result);
										$scope.customUserProfile = data.result;
										$scope.getUserProfile();
									}
								});
							} else {
								getPublicUser(userId, function (err, data) {
									if (data) {
										$scope.user = data.result;
										getUserProfileImage();
										buildCustomRegistration(result.data.customRegistration, data.result);
										$scope.customUserProfile = data.result;
										$scope.getUserProfile();
									}
								});
							}
						} else {
							getPublicUser(userId, function (err, data) {
								if (data) {
									$scope.user = data.result;
									if (currentUser && currentUser._id == $scope.user._id) {
										$scope.user.userToken = currentUser.userToken;
									}
									getUserProfileImage();
									$scope.getUserProfile();
								}
							});
						}
					});
				};

				getCustomRegistrationSettings();
			}
		};

		let buildCustomRegistration = function (customRegistrationSettings, defaults) {
			customRegistration.getFields(
				{
					defaults: defaults,
					isProfileMode: true,
					customRegistrationSettings: customRegistrationSettings,
					refreshUI: function () {
						if (!$scope.$$phase) $scope.$apply();
					},
				},
				function (err, result) {
					if (result) {
						$scope.customRegistrationFields = result.fields;
						$scope.customRegistrationFields = $scope.customRegistrationFields.filter(function (field) {
							return field.type !== 'email';
						});
						$scope.customRegistration = result;
						$scope.initCustomRegistration = function () {
							result.initializers.forEach(function (initializer) {
								initializer();
							});
						};
						if (!$scope.$$phase) $scope.$apply();
					}
				}
			);
		};

		authAPI.onLogout(function () {
			if ($scope.user) delete $scope.user.userToken;
			$scope.close();
		});

		/////////// EDIT USER PROFILE CONTROL ///////////
		$scope.tempUser = null;
		$scope.tempUserProfile = null;

		$scope.cancelEdit = function () {
			$scope.tempUser = null;
			$scope.tempUserProfile = null;
			$scope.editingProfile = null;
			$scope.uploadBackgroundImage = null;
			$scope.uploadProfileImage = null;

			if (!$scope.$$phase) {
				$scope.$apply();
			}
			return false;
		};

		var _updateUser = function (user, callback) {
			var data = {
				id: 1,
				method: 'users/update',
				params: user,
			};
			var url = window.siteConfig.endPoints.authHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(angular.toJson(data));

			window.bfUtils.http
				.jsonp(url)
				.success(function (result) {
					$scope.tempUser.lastUpdated = new Date().toISOString();
					if ($scope.currentUserEmail !== user.email) {
						StringResource.getData().then(function (languageSettings) {
							var options = {
								data: {
									title: ' ',
									body: languageSettings['confirmEmailChange'] || 'Are you sure you want to change your email?',
								},
							};

							window.openDialog(options, function (dialogResult) {
								if (dialogResult) {
									var data = {
										id: 1,
										method: 'users/updateEmail',
										params: {
											email: user.email,
											accessToken: currentUser.accessToken,
											externalAppId: window.appContext.currentApp.appId,
										},
									};
									var url = window.siteConfig.endPoints.authHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(angular.toJson(data));

									window.bfUtils.http
										.jsonp(url)
										.success(function (result) {
											if (result && result.error) {
												let message = result.error.message;
												if (result.error.code === 1301) {
													// email exists
													message = languageSettings['emailChangeAlreadyInUse'] || message;
												}

												var options = {
													data: {
														title: ' ',
														body: message,
														disableCancel: true,
													},
												};

												user.email = $scope.currentUserEmail;
												$scope.user.email = $scope.currentUserEmail;
												window.openDialog(options, function () {});
												console.warn(result.error);
												callback(result.error, null);
											} else {
												userTags.setRegistrationTags(user.userProfile, false, function (err, result) {
													if (err) console.log(err);
												});
												callback(null, result);
											}
										})
										.error(function (data, status, headers, config) {
											console.error(data);
											user.email = $scope.currentUserEmail;
											$scope.tempUser.email = $scope.currentUserEmail;
											callback(data, null);
										});
								} else {
									user.email = $scope.currentUserEmail;
									$scope.tempUser.email = $scope.currentUserEmail;
									callback(null, result);
								}
							});
						});
					} else {
						userTags.setRegistrationTags(user.userProfile, false, function (err, result) {
							if (err) console.log(err);
						});
						callback(null, result);
					}
				})
				.error(function (data, status, headers, config) {
					console.error(data);
					callback(data, null);
				});
		};

		var updateUser = function (callback) {
			if ($scope.customRegistration) {
				$scope.customRegistration.fetch(
					{
						validateFields: true,
						validateLinks: false,
					},
					function (err, registration) {
						if (!err) {
							for (let property in registration.user) {
								if (registration.user.hasOwnProperty(property)) {
									$scope.tempUser[property] = registration.user[property];
								}
							}
							let setItems = registration.user;
							setItems._id = $scope.tempUser._id;
							setItems.userToken = $scope.tempUser.userToken;
							setItems.imageUrl = $scope.tempUser.imageUrl;
							setItems.externalAppId = window.appContext.currentApp.appId;
							_updateUser(setItems, callback);
						}
					}
				);
			} else {
				let setItems = {};
				setItems._id = $scope.tempUser._id;
				setItems.email = $scope.tempUser.email;
				setItems.userToken = $scope.tempUser.userToken;
				setItems.firstName = $scope.tempUser.firstName;
				setItems.lastName = $scope.tempUser.lastName;
				setItems.displayName = $scope.tempUser.displayName;
				setItems.imageUrl = $scope.tempUser.imageUrl;
				setItems.externalAppId = window.appContext.currentApp.appId;
				_updateUser(setItems, callback);
			}
		};

		var updateUserProfile = function (callback) {
			var userProfile = JSON.parse(JSON.stringify($scope.tempUserProfile));
			if (!userProfile) userProfile = {};
			userProfile.userId = $scope.tempUser._id;
			userProfile.userToken = $scope.tempUser.userToken;
			userProfile.email = $scope.tempUser.email;
			userProfile.firstName = $scope.tempUser.firstName;
			userProfile.lastName = $scope.tempUser.lastName;
			userProfile.displayName = $scope.tempUser.displayName;

			var data = {
				id: 1,
				method: 'users/saveUserProfile',
				params: userProfile,
			};

			var url = window.siteConfig.endPoints.socialHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(JSON.stringify(data));

			window.bfUtils.http
				.jsonp(url, { bypassInterceptorForStatus: 404 })
				.success(function (result) {
					callback(null, result);
				})
				.error(function (data, status, headers, config) {
					console.error(data);
					callback(data, null);
				});
		};

		$scope.update = function () {
			if (!$scope.tempUserProfile) $scope.tempUserProfile = {};

			$scope.tempUser.displayName = $scope.tempUser.firstName + ' ' + $scope.tempUser.lastName;
			$scope.uploadImage($scope.uploadProfileImage, function (err, data) {
				if (data) $scope.tempUser.imageUrl = data.result;
				$scope.uploadImage($scope.uploadBackgroundImage, function (err, data) {
					if (data) {
						$scope.tempUserProfile.backgroundImage = data.result;
					}
					//update userProfile
					updateUser(function () {
						//update user
						updateUserProfile(function () {
							$scope.user = $scope.tempUser;
							$scope.tempUser = null;

							$scope.userProfile = $scope.tempUserProfile;
							$scope.tempUserProfile = null;

							$scope.uploadBackgroundImage = null;
							$scope.uploadProfileImage = null;

							authAPI._setCurrentUser($scope.user);
							authAPI.triggerOnUpdate();

							$scope.editingProfile = false;
						});
					});
				});
			});
		};

		$scope.uploadImage = function (file, callback) {
			if (!file) {
				callback(null, null);
				return;
			}
			var url = window.siteConfig.endPoints.authHost + '/src/server.js?method=users/uploadImage';

			window.spinner.show();
			Upload.upload({
				url: url,
				data: { file: file, userToken: $scope.user.userToken, externalAppId: window.currentAppId },
			})
				.progress(function (evt) {
					$scope.progressMessage = true;
					var progressPercentage = parseInt((100.0 * evt.loaded) / evt.total);
					console.log('progress: ' + progressPercentage + '%');
				})
				.success(function (data, status, headers, config) {
					console.log('file uploaded.');

					if (callback) callback(null, data);
				})
				.error(function (err) {
					if (callback) callback(err, null);
				})
				.finally(function () {
					window.spinner.hide();
				});
		};

		var getCustomProfile = function (accessToken, callback) {
			let data = {
				id: 1,
				method: 'users/getUserByAccessToken',
				params: {
					accessToken: accessToken,
					externalAppId: window.currentAppId,
				},
			};

			let url = window.siteConfig.endPoints.authHost + '/src/server.js?callback=JSON_CALLBACK&data=' + encodeURIComponent(JSON.stringify(data));

			window.bfUtils.http
				.jsonp(url, { bypassInterceptorForStatus: 404 })
				.success(function (result) {
					callback(null, result);
				})
				.error(function (data, status, headers, config) {
					console.error(data);
					callback(data, null);
				});
		};

		$scope.editProfile = function () {
			if (currentUser != null && currentUser._id) {
				$scope.tempUser = currentUser;
				$scope.currentUserEmail = currentUser.email;
				$scope.tempUserProfile = $scope.userProfile;
				$scope.editingProfile = true;

				if (!$scope.$$phase) {
					$scope.$apply();
				}

				authAPI.onLogout(function () {
					// window.history.back(); // back to profile
					// setTimeout(function () {
					// 	window.history.back(); // exit profile
					// });
				});
			}
		};
	},
]);
