(function() {
    var tabs = document.querySelectorAll('.tab');
    var tabPanels = document.querySelectorAll('.tab-panel');
    
    var sourceInput = document.getElementById('videoSource');
    var widthInput = document.getElementById('videoWidth');
    var heightInput = document.getElementById('videoHeight');
    var embedInput = document.getElementById('embedCode');
    var altSourceInput = document.getElementById('altSource');
    var posterInput = document.getElementById('posterImage');
    var qualityInput = document.getElementById('videoQuality');
    var atSecondInput = document.getElementById('atSecond');
    
    // Tab switching
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var targetTab = this.getAttribute('data-tab');
            
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tabPanels.forEach(function(p) { p.classList.remove('active'); });
            
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    
    // Listen for messages from parent window
    window.addEventListener('message', function(event) {
        if (event.data.action === 'setInitialData') {
            var data = event.data.data;
            sourceInput.value = data.source || '';
            widthInput.value = data.width || '560';
            heightInput.value = data.height || '314';
            embedInput.value = data.embed || '';
            altSourceInput.value = data.altsource || '';
            posterInput.value = data.poster || '';
            qualityInput.value = data.quality || '';
            atSecondInput.value = data.atSecond || '';
        } else if (event.data.action === 'getVideoData') {
            var videoData = {
                source: sourceInput.value.trim(),
                width: widthInput.value || '560',
                height: heightInput.value || '314',
                embed: embedInput.value.trim(),
                altsource: altSourceInput.value.trim(),
                poster: posterInput.value.trim(),
                quality: qualityInput.value.trim(),
                atSecond: atSecondInput.value.trim()
            };

            if (videoData.source || videoData.embed) {
                console.log('!!!!!!!!!Getting video data123', videoData.source, videoData.embed);
                parent.postMessage({
                    mceAction: 'insertVideo',
                    data: videoData
                }, origin);
            }
        }
    });
    
    // Maintain aspect ratio when width changes
    var aspectRatio = 16/9;
    widthInput.addEventListener('input', function() {
        var width = parseInt(this.value);
        if (width && !isNaN(width)) {
            heightInput.value = Math.round(width / aspectRatio);
        }
    });
    
    // Browse image button functionality
    var browseImageBtn = document.getElementById('browseImageBtn');
    if (browseImageBtn) {
        browseImageBtn.addEventListener('click', function() {
            var options = {
                showIcons: false,
                multiSelection: false
            };
            
            if (typeof window.parent.buildfire !== 'undefined' && window.parent.buildfire.imageLib) {
                window.parent.buildfire.imageLib.showDialog(options, function(err, results) {
                    if (err) return console.error(err);
                    
                    var imageUrl = results.selectedFiles[0];
                    if (imageUrl && imageUrl.length) {
                        posterInput.value = imageUrl;
                    }
                });
            }
        });
    }
    
    // Focus on source input when dialog opens
    setTimeout(function() {
        sourceInput.focus();
    }, 100);
})();