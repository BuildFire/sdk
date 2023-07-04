if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined') buildfire.components = {};

buildfire.components.aiStateSeeder = {
	request: function(options, callback) {
		buildfire.lazyLoadScript({relativeScriptsUrl: "buildfire/services/ai/ai.js", scriptId: "ai" }, function(){
			if(!document.body) throw new Error("Cannot find body element");
			const packet = new Packet(null, 'ai.showSeederPrompt', { requestMessage: options.requestMessage });
			buildfire._sendPacket(packet, function(err, result) {
				buildfire.components.aiStateSeeder._startAIAnimation({emptyStateElement: options.emptyStateElement});
				// show toast asap
				setTimeout(function() {
					buildfire.dialog.toast({
						hideDismissButton: true,
						duration: 15000,
						message: "Loading data ....",
					});
				}, 2000);
				setTimeout(function() {
					if(callback) callback(null, {data: options.jsonTemplate, ready: function() {
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
					}} );
				}, 5000);
			});
		});
	},
	buildEmptyStateElement: function(options, callback) {
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
			if (!options.requestMessage) {
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
					options.requestMessage = seeders[0].requestMessage;
				} else {
					let seeders  = window.pluginJson.seeders;
					if (!seeders || !seeders.length) {
						throw new Error(`No seeders found in plugin.json`)
					}
					options.requestMessage = window.pluginJson.seeders[0].requestMessage;
				}
			}
			options.emptyStateElement = emptyStateElement;
			buildfire.components.aiStateSeeder.request(options, function(err, result) {
				if (callback) callback(err, result);
			}) ;
		};

		return emptyStateElement;
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
