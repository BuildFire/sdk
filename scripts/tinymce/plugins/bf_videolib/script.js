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
// CDN toggle handler
var cdnToggle = document.getElementById('cdnToggle');
var cdnToggleWrapper = document.querySelector('.cdn-toggle');
var cdnProperties = document.querySelectorAll('.cdn-properties');
// Read initial data from query string
var urlParams = new URLSearchParams(window.location.search);
var dataParam = urlParams.get('data');
if (dataParam) {
    try {
        var initialData = JSON.parse(decodeURIComponent(dataParam));
        // Decode base64 encoded embed HTML
        if (initialData.embed) {
            try {
                embedInput.value = decodeURIComponent(atob(initialData.embed));
                triggerUpdateEmbed(embedInput);
            } catch (e) {
                embedInput.value = initialData.embed;
                triggerUpdateEmbed(embedInput);
            }
        }
        qualityInput.value = initialData.quality || '';
        atSecondInput.value = initialData.atSecond || '';
        
        // Set CDN toggle based on useCdn flag
        if (initialData.useCdn) {
            cdnToggle.checked = true;
        }
    } catch (e) {
        console.error('Error parsing initial data:', e);
    }
}

// Tab switching
function checkScroll() {
    var tabContent = document.querySelector('.tab-content');
    var activePanel = document.querySelector('.tab-panel.active');
    if (tabContent.scrollHeight > tabContent.clientHeight) {
        if (activePanel) activePanel.classList.add('scrollable');
    } else {
        if (activePanel) activePanel.classList.remove('scrollable');
    }
}
tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
        var targetTab = this.getAttribute('data-tab');
        
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tabPanels.forEach(function(p) { p.classList.remove('active'); });
        
        this.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
        setTimeout(checkScroll, 0);
        setTimeout(updateOverflowState, 0);
    });
});
checkScroll();

// Listen for messages from parent window
var loaderTimeout;
window.addEventListener('message', function(event) {
    if (event.data.action === 'getVideoData') {
        var videoData = {
            source: sourceInput.value.trim(),
            width: widthInput.value || '',
            height: heightInput.value || '',
            embed: embedInput.value.trim(),
            altSource: altSourceInput.value.trim(),
            poster: posterInput.value.trim(),
            quality: qualityInput.value.trim(),
            atSecond: atSecondInput.value.trim(),
            useCdn: cdnToggle.checked
        };
        parent.postMessage({
            mceAction: 'insertVideo',
            data: videoData
        }, origin);
    } else if (event.data.action === 'showLoader') {
        document.getElementById('loaderOverlay').style.display = 'flex';
        document.getElementById('loaderFirstMessage').style.display = 'block';
        document.getElementById('loaderSecondMessage').style.display = 'none';
        loaderTimeout = setTimeout(function() {
            document.getElementById('loaderFirstMessage').style.display = 'none';
            document.getElementById('loaderSecondMessage').style.display = 'block';
        }, 10000);
    } else if (event.data.action === 'hideLoader') {
        document.getElementById('loaderOverlay').style.display = 'none';
        document.getElementById('loaderFirstMessage').style.display = 'block';
        document.getElementById('loaderSecondMessage').style.display = 'none';
        if (loaderTimeout) {
            clearTimeout(loaderTimeout);
        }
    }
});

// Update embed when dimensions change
function updateEmbedFromSource() {
    setTimeout(function() {
        embedInput.value = generateEmbedFromUrl();
    }, 0);
}
widthInput.addEventListener('input', updateEmbedFromSource);
heightInput.addEventListener('input', updateEmbedFromSource);

// Parse embed code using SaxParser (TinyMCE pattern)
function parseEmbed(embedCode) {
    var data = {};
    if (!embedCode || !window.parent.tinymce) return data;
    
    var SaxParser = window.parent.tinymce.html.SaxParser;
    SaxParser({
        validate: false,
        allow_conditional_comments: true,
        start: function(name, attrs) {
            if (!data.source) {
                if (name === 'iframe' || name === 'embed' || name === 'video' || name === 'audio') {
                    data.type = name;
                    data.source = attrs.map.src || attrs.map.data || '';
                    data.width = attrs.map.width || '';
                    data.height = attrs.map.height || '';
                    data.poster = attrs.map.poster || '';
                    
                    // Parse data-bf-video attribute
                    if (attrs.map['data-bf-video']) {
                        try {
                            var bfVideoData = JSON.parse(unescape(attrs.map['data-bf-video']));
                            data.quality = bfVideoData.quality || '';
                            data.atSecond = bfVideoData.atSecond || '';
                            data.useCdn = bfVideoData.useCdn || false;
                        } catch (e) {
                            console.error('Error parsing data-bf-video:', e);
                        }
                    }
                }
            }
            if (name === 'source' && !data.source) {
                data.source = attrs.map.src || '';
            } else if (name === 'source' && data.source && !data.altSource) {
                data.altSource = attrs.map.src || '';
            }
        }
    }).parse(embedCode);
    
    return data;
}

// URL patterns (TinyMCE pattern)
var urlPatterns = [
    {regex: /youtu\.be\/([\w\-_\?&=.]+)/i, type: 'iframe', w: 560, h: 314, url: 'www.youtube.com/embed/$1'},
    {regex: /youtube\.com(.+)v=([^&]+)(&([a-z0-9&=\-_]+))?/i, type: 'iframe', w: 560, h: 314, url: 'www.youtube.com/embed/$2?$4'},
    {regex: /youtube.com\/embed\/([a-z0-9\?&=\-_]+)/i, type: 'iframe', w: 560, h: 314, url: 'www.youtube.com/embed/$1'},
    {regex: /vimeo\.com\/([0-9]+)/, type: 'iframe', w: 425, h: 350, url: 'player.vimeo.com/video/$1?title=0&byline=0&portrait=0&color=8dc7dc'},
    {regex: /vimeo\.com\/(.*)\/([0-9]+)/, type: 'iframe', w: 425, h: 350, url: 'player.vimeo.com/video/$2?title=0&byline=0'},
    {regex: /dailymotion\.com\/video\/([^_]+)/, type: 'iframe', w: 480, h: 270, url: 'www.dailymotion.com/embed/video/$1'},
    {regex: /dai\.ly\/([^_]+)/, type: 'iframe', w: 480, h: 270, url: 'www.dailymotion.com/embed/video/$1'}
];

function getMimeType(url) {
    var mimeTypes = {
        mp3: 'audio/mpeg',
        m4a: 'audio/x-m4a',
        wav: 'audio/wav',
        flac: 'audio/flac',
        aac: 'audio/aac',
        mp4: 'video/mp4',
        webm: 'video/webm',
        ogg: 'video/ogg'
    };
    var ext = url.toLowerCase().split('.').pop().split('?')[0];
    return mimeTypes[ext] || '';
}

function matchUrlPattern(url) {
    for (var i = 0; i < urlPatterns.length; i++) {
        var pattern = urlPatterns[i];
        if (pattern.regex.test(url)) {
            var matches = pattern.regex.exec(url);
            var protocol = url.match(/^(https?:\/\/|www\.)(.+)$/i);
            var prefix = protocol && protocol.length > 1 && protocol[1] !== 'www.' ? protocol[1] : 'https://';
            var transformedUrl = prefix + pattern.url;
            
            for (var j = 0; j < matches.length; j++) {
                transformedUrl = transformedUrl.replace('$' + j, matches[j] || '');
            }
            
            return {
                type: pattern.type,
                url: transformedUrl.replace(/\?$/, ''),
                width: pattern.w,
                height: pattern.h
            };
        }
    }
    return null;
}

function generateEmbedFromUrl() {
    var url = sourceInput.value.trim();
    var matched = matchUrlPattern(url);
    var width, height;
    var poster = posterInput.value.trim();
    var quality = qualityInput.value.trim();
    var atSecond = atSecondInput.value.trim();
    var altSource = altSourceInput.value.trim();
    var useCdn = cdnToggle.checked;
    if (matched) {
        width = widthInput.value || String(matched.width);
        height = heightInput.value || String(matched.height);
        var videoProperties = {
            originalSrc: url,
            altSource: altSource,
            poster: poster,
            quality: quality,
            atSecond: atSecond,
            width: width,
            height: height,
            useCdn: useCdn
        };
        return '<iframe src="' + matched.url + '" width="' + width + '" height="' + height + '" data-bf-video="' + escape(JSON.stringify(videoProperties)) + '" allowFullscreen="1"></iframe>';
    }
    
    var mime = getMimeType(url);
    if (mime && mime.indexOf('video') !== -1) {
        width = widthInput.value || '300';
        height = heightInput.value || '150';
        
        if (useCdn && !quality) {
            quality = '75';
        }
        
        var html = '<video width="' + width + '" height="' + height + '"';
        
        // Build video properties first
        var videoProperties = {
            originalSrc: url,
            altSource: altSource,
            poster: poster,
            quality: quality,
            atSecond: atSecond,
            width: width,
            height: height,
            useCdn: useCdn
        };
        html += ' data-bf-video="' + escape(JSON.stringify(videoProperties)) + '"';
        
        // Handle poster - always use custom poster if provided
        if (poster) {
            // Crop poster image to match video dimensions
            var croppedPoster = poster;
            if (typeof window.parent.buildfire !== 'undefined' && window.parent.buildfire.imageLib && window.parent.buildfire.imageLib.cropImage) {
                croppedPoster = window.parent.buildfire.imageLib.cropImage(poster, { width: parseInt(width), height: parseInt(height) });
            }
            html += ' poster="' + croppedPoster + '"';
        } else if (useCdn) {
            // Only generate CDN thumbnail if no custom poster and CDN is enabled
            var escapedVideoUrl = url.replace(/(?<!\\\\)'/g, "\\\\'");
            var thumbnailParams = '{ videoUrl: \'' + escapedVideoUrl + '\'';
            if (atSecond) {
                thumbnailParams += ', atSecond: \'' + atSecond + '\'';
            }
            if (quality) {
                thumbnailParams += ', quality: \'' + quality + '\'';
            }
            thumbnailParams += ' }';
            var posterExpr = '${buildfire.videoLib.toThumbnailCdnUrl(' + thumbnailParams + ')}';
            html += ' expr-poster="' + posterExpr + '"';
        } else {
            console.log('No poster - CDN is off and no custom poster provided');
        }
        
        html += ' controls="controls">\n';
        
        // Main source
        if (useCdn) {
            var escapedVideoUrl = url.replace(/(?<!\\\\)'/g, "\\\\'");
            var cdnParams = '{ videoUrl: \'' + escapedVideoUrl + '\'';
            if (quality) {
                cdnParams += ', quality: \'' + quality + '\'';
            }
            cdnParams += ' }';
            var videoSrcExpr = '${buildfire.videoLib.toCdnUrl(' + cdnParams + ')}';
            html += '<source expr-src="' + videoSrcExpr + '" src="' + url + '"';
        } else {
            html += '<source src="' + url + '"';
        }
        if (mime) html += ' type="' + mime + '"';
        html += ' />\n';
        
        // Alternative source
        if (altSource) {
            var altMime = getMimeType(altSource);
            if (useCdn) {
                var escapedAltVideoUrl = altSource.replace(/(?<!\\\\)'/g, "\\\\'");
                var altCdnParams = '{ videoUrl: \'' + escapedAltVideoUrl + '\'';
                if (quality) {
                    altCdnParams += ', quality: \'' + quality + '\'';
                }
                altCdnParams += ' }';
                var altVideoSrcExpr = '${buildfire.videoLib.toCdnUrl(' + altCdnParams + ')}';
                html += '<source expr-src="' + altVideoSrcExpr + '" src="' + altSource + '"';
            } else {
                html += '<source src="' + altSource + '"';
            }
            if (altMime) html += ' type="' + altMime + '"';
            html += ' />\n';
        }
        html += '</video>';
        return html;
    }
    
    if (mime && mime.indexOf('audio') !== -1) {
        var altSource = altSourceInput.value.trim();
        var html = '<audio controls="controls">\n';
        html += '<source src="' + url + '"';
        if (mime) html += ' type="' + mime + '"';
        html += ' />\n';
        if (altSource) {
            var altMime = getMimeType(altSource);
            html += '<source src="' + altSource + '"';
            if (altMime) html += ' type="' + altMime + '"';
            html += ' />\n';
        }
        html += '</audio>';
        return html;
    }
    
    width = widthInput.value || '560';
    height = heightInput.value || '314';
    return '<iframe src="' + url + '" width="' + width + '" height="' + height + '" allowfullscreen="1"></iframe>';
}

// TinyMCE pattern: onChange handlers
sourceInput.addEventListener('input', function() {
    var url = this.value.trim();
    if (url) {
        var matched = matchUrlPattern(url);
        if (matched && !widthInput.value && !heightInput.value) {
            widthInput.value = String(matched.width);
            heightInput.value = String(matched.height);
            if (isLocked && widthInput.value && heightInput.value) {
                aspectRatio = parseFloat(widthInput.value) / parseFloat(heightInput.value);
            }
        } else if (!matched && !widthInput.value && !heightInput.value) {
            var mime = getMimeType(url);
            if (mime && mime.indexOf('video') !== -1) {
                widthInput.value = '300';
                heightInput.value = '150';
            } else if (mime && mime.indexOf('audio') !== -1) {
                widthInput.value = '';
                heightInput.value = '';
            } else {
                widthInput.value = '560';
                heightInput.value = '314';
            }
            if (isLocked && widthInput.value && heightInput.value) {
                aspectRatio = parseFloat(widthInput.value) / parseFloat(heightInput.value);
            }
        }
        embedInput.value = generateEmbedFromUrl();
    }
    updateCdnToggleState();
});

function updateOverflowState() {
    var tabContent = document.querySelector('.tab-content');
    if (!cdnToggle.checked && tabContent.offsetHeight > 320) {
        tabContent.style.overflowY = 'unset';
    } else {
        tabContent.style.overflowY = 'auto';
    }
}

function updateCdnToggleState() {
    if (!sourceInput.value.trim()) {
        cdnToggle.checked = false;
        cdnToggleWrapper.classList.add('disabled');
        cdnProperties.forEach(function(el) {
            el.style.display = 'none';
        });
    } else {
        cdnToggleWrapper.classList.remove('disabled');
        cdnProperties.forEach(function(el) {
            el.style.display = cdnToggle.checked ? 'block' : 'none';
        });
    }
    updateOverflowState();
}
updateCdnToggleState();

cdnToggle.addEventListener('change', function() {
    if (!cdnToggleWrapper.classList.contains('disabled')) {
        cdnProperties.forEach(function(el) {
            el.style.display = cdnToggle.checked ? 'block' : 'none';
        });
        // Regenerate embed code when CDN toggle changes
        embedInput.value = generateEmbedFromUrl();
        setTimeout(checkScroll, 0);
        updateOverflowState();
    }
});

embedInput.addEventListener('change', function() {
   triggerUpdateEmbed(this);
});

function triggerUpdateEmbed(embedInputElement) {
    var embedCode = embedInputElement? embedInputElement.value.trim() : this.value.trim();
    if (embedCode) {
        var parsed = parseEmbed(embedCode);
        if (parsed.source) {
            sourceInput.value = parsed.source;
            if (parsed.width) widthInput.value = parsed.width;
            if (parsed.height) heightInput.value = parsed.height;
            if (parsed.poster) {
                posterInput.value = parsed.poster;
                // Show thumbnail preview if poster URL is provided
                setTimeout(() => {
                    if (thumbnailPreview.style.display !== 'flex') {
                        showThumbnailPreview(parsed.poster);
                    }
                }, 0);
            }
            if (parsed.altSource) altSourceInput.value = parsed.altSource;
        }
    }
}

posterInput.addEventListener('input', function() {
    embedInput.value = generateEmbedFromUrl();
    updateThumbnailCaptureState();
});

function updateThumbnailCaptureState() {
    atSecondInput.disabled = posterInput.value.trim() !== '';
}
updateThumbnailCaptureState();

altSourceInput.addEventListener('input', function() {
    embedInput.value = generateEmbedFromUrl();
});

qualityInput.addEventListener('input', function() {
    embedInput.value = generateEmbedFromUrl();
});

atSecondInput.addEventListener('input', function() {
    embedInput.value = generateEmbedFromUrl();
});

// Browse image button functionality
var browseImageBtn = document.getElementById('browseImageBtn');
var thumbnailPreview = document.getElementById('thumbnailPreview');
var thumbnailImage = document.getElementById('thumbnailImage');
var thumbnailRemoveBtn = document.getElementById('thumbnailRemoveBtn');

function showThumbnailPreview(imageUrl) {
    thumbnailImage.src = imageUrl;
    browseImageBtn.style.display = 'none';
    thumbnailPreview.style.display = 'flex';
    posterInput.disabled = true;
}

function hideThumbnailPreview() {
    thumbnailImage.src = '';
    browseImageBtn.style.display = 'block';
    thumbnailPreview.style.display = 'none';
    posterInput.disabled = false;
    posterInput.value = '';
    // Regenerate embed code without poster
    embedInput.value = generateEmbedFromUrl();
    updateThumbnailCaptureState();
}

browseImageBtn?.addEventListener('click', function() {
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
                var croppedUrl = imageUrl;
                if (widthInput.value && heightInput.value) {
                    croppedUrl = window.parent.buildfire.imageLib.cropImage(imageUrl, { width: parseInt(widthInput.value), height: parseInt(heightInput.value) });
                }
                showThumbnailPreview(croppedUrl);
                // Regenerate embed code with new poster
                embedInput.value = generateEmbedFromUrl();
                updateThumbnailCaptureState();
            }
        });
    }
});

thumbnailRemoveBtn.addEventListener('click', function() {
    hideThumbnailPreview();
});

// Aspect ratio lock functionality
var lockButton = document.getElementById('lockAspectRatio');
var aspectRatio = null;
var isLocked = true;
lockButton.addEventListener('click', function() {
    isLocked = !isLocked;
    if (isLocked) {
        lockButton.classList.add('tox-locked');
        lockButton.setAttribute('aria-pressed', 'true');
        // Calculate and store current aspect ratio
        if (widthInput.value && heightInput.value) {
            aspectRatio = parseFloat(widthInput.value) / parseFloat(heightInput.value);
        }
    } else {
        lockButton.classList.remove('tox-locked');
        lockButton.setAttribute('aria-pressed', 'false');
        aspectRatio = null;
    }
});
// Update height when width changes (if locked)
widthInput.addEventListener('input', function() {
    if (isLocked && aspectRatio && this.value) {
        var newHeight = Math.round(parseFloat(this.value) / aspectRatio);
        if (newHeight > 0) {
            heightInput.value = newHeight;
        }
    }
});
// Update width when height changes (if locked)
heightInput.addEventListener('input', function() {
    if (isLocked && aspectRatio && this.value) {
        var newWidth = Math.round(parseFloat(this.value) * aspectRatio);
        if (newWidth > 0) {
            widthInput.value = newWidth;
        }
    }
});
// Initialize aspect ratio when dimensions are loaded
if (widthInput.value && heightInput.value) {
    aspectRatio = parseFloat(widthInput.value) / parseFloat(heightInput.value);
}
