if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.aiStateSeeder = {
	request: function(options, callback) {
		let requestResult = { isReady: false };
		buildfire.lazyLoadScript({relativeScriptsUrl: "buildfire/services/ai/ai.js", scriptId: "ai" }, function(){
			if(!document.body) throw new Error("Cannot find body element");
			const packet = new Packet(null, 'ai.showSeederPrompt', { userMessage: options.userMessage });
			buildfire._sendPacket(packet, function(err, result) {

				options.userMessage = result.userMessage;

				buildfire.components.aiStateSeeder._startAIAnimation({emptyStateElement: options.emptyStateElement});
				// show toast asap
				setTimeout(function() {
					buildfire.dialog.toast({
						hideDismissButton: true,
						duration: 15000,
						message: "Loading data ....",
					});
				}, 2000);

				let conversation = new buildfire.ai.conversation();
				conversation.systemSays(options.systemMessage);
				conversation.userSays(options.userMessage);

				conversation.fetchJsonResponse({jsonTemplate: options.jsonTemplate }, (err, res) => {

					requestResult.complete = function() {
						if (options.emptyStateElement) {
							options.emptyStateElement.style.display = "none";
						}
						buildfire.components.aiStateSeeder._stopAIAnimation({emptyStateElement: options.emptyStateElement});
						// show toast asap
						buildfire.dialog.toast({
							hideDismissButton: false,
							duration: 60000,
							type: "success",
							message: "Loaded Successfully",
							actionButton: {
								text: "Regenerate",
								action: () => {
									options.emptyStateElement.style.display = "block";
									buildfire.components.aiStateSeeder.request(options, callback);
								},
							},
						});
					};


					if(callback) callback(null, {response: {"data":{"locations":[{"lat":"40.7128","lng":"-74.0060","title":"New York City, USA"},
										{"lat":"34.0522","lng":"-118.2437","title":"Los Angeles, USA"},
										{"lat":"51.5074","lng":"-0.1278","title":"London, UK"},
										{"lat":"48.8566","lng":"2.3522","title":"Paris, France"},
										{"lat":"41.9028","lng":"12.4964","title":"Rome, Italy"},
										{"lat":"35.6895","lng":"139.6917","title":"Tokyo, Japan"},
										{"lat":"55.7558","lng":"37.6176","title":"Moscow, Russia"},
										{"lat":"37.7749","lng":"-122.4194","title":"San Francisco, USA"},
										{"lat":"-33.8651","lng":"151.2099","title":"Sydney, Australia"},
										{"lat":"-22.9068","lng":"-43.1729","title":"Rio de Janeiro, Brazil"}]}},"responseType":"object"});
				});
			});
		});

		return requestResult;
	},
	buildEmptyStateElement: function(options, callback) {
		let emptyStateResult = { };
		let emptyStateElement =  document.createElement("div");
		emptyStateElement.classList.add("well");
		emptyStateElement.classList.add("ai-empty-state");

		emptyStateElement.innerHTML = `<div class="ai-empty-state-content"
					<p>You haven’t added anything yet.</p>
					<p>Add sample data to preview this feature.</p>
					<p><button class="btn btn-primary">Generate AI Data</button></p>
				</div>`;
		// in future, we can generate multiple buttons for each seeder
		// if the plugin developer passes a certain request or specifies certain seeder we show only one
		emptyStateElement.querySelector("button").onclick = function() {
			if (!options.userMessage) {
				if (!window.pluginJson) {
					throw new Error("No plugin.json");
				}
				if (options.seederName) {
					if (!window.pluginJson.seeders) {
						throw new Error("No seeders found in plugin.json");
					}
					let seeders  = window.pluginJson.seeders.filter(seeder => seeder.name === options.seederName);
					if (!seeders.length) {
						throw new Error(`No seeder found with the name ${options.seederName} in plugin.json`)
					}
					options.userMessage = seeders[0].userMessage;
				} else {
					let seeders  = window.pluginJson.seeders;
					if (!seeders || !seeders.length) {
						throw new Error(`No seeders found in plugin.json`)
					}
					options.userMessage = window.pluginJson.seeders[0].userMessage;
				}
			}
			options.emptyStateElement = emptyStateElement;
			emptyStateResult.requestResult = buildfire.components.aiStateSeeder.request(options, function(err, result) {
				if (callback) callback(err, result);
			}) ;
		};
		emptyStateResult.emptyStateElement = emptyStateElement;
		return emptyStateResult;
	},
	_startAIAnimation: function(options) {
		if (options && options.emptyStateElement) {
			let animationElement =  buildfire.components.aiStateSeeder._createAIAnimationElement();
			options.emptyStateElement.insertBefore( animationElement, options.emptyStateElement.querySelector('.ai-empty-state-content'));
		} else {
			let animationElement =  buildfire.components.aiStateSeeder._createAIAnimationElement();
			animationElement.classList.add("ai-progress-overlay");
			document.body.append(animationElement);
		}
	},
	_createAIAnimationElement: function() {
		let animationElement =  document.createElement("div");
		animationElement.classList.add("well");
		animationElement.classList.add("ai-progress");
		animationElement.innerHTML = `<div class="ai-animation">
						<div class="blob"></div>
						<div class="blob1"></div>
						<div class="blob2"></div>
						<div class="blob3">
						</div>
					</div>`;
		return animationElement;
	},
	_stopAIAnimation: function(options) {
		if (options && options.emptyStateElement) {
			let progressElement = options.emptyStateElement.querySelector(".ai-progress");
			progressElement.parentElement.removeChild(progressElement);
		} else {
			let progressElement = document.querySelector(".ai-progress-overlay");
			progressElement.parentElement.removeChild(progressElement);
		}
	}
};
