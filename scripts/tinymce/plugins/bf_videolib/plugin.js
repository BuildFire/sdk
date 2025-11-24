tinymce.PluginManager.add('bf_videolib', function (editor, url) {
  
  function showVideoDialog() {
    var selectedNode = editor.selection.getNode();
    var isEditing = selectedNode && (selectedNode.getAttribute('data-mce-object') || selectedNode.tagName === 'IFRAME' || selectedNode.tagName === 'VIDEO');
    
    var initialData = {
      source: '',
      width: '560',
      height: '314',
      embed: '',
      altsource: '',
      poster: ''
    };
    
    if (isEditing) {
      if (selectedNode.tagName === 'IFRAME') {
        initialData.source = selectedNode.src || '';
        initialData.width = selectedNode.width || '560';
        initialData.height = selectedNode.height || '314';
      } else if (selectedNode.tagName === 'VIDEO') {
        initialData.source = selectedNode.src || '';
        initialData.width = selectedNode.width || '560';
        initialData.height = selectedNode.height || '314';
        initialData.poster = selectedNode.poster || '';
      }
    }
    
    editor.windowManager.openUrl({
      title: 'Insert/Edit Video',
      url: url + '/dialog.html',
      width: 500,
      height: 400,
      buttons: [
        {
          type: 'cancel',
          name: 'cancel',
          text: 'Cancel'
        },
        {
          type: 'custom',
          name: 'save',
          text: 'Save',
          primary: true
        }
      ],
      onAction: function (dialogApi, details) {
        if (details.name === 'save') {
          dialogApi.sendMessage({ action: 'getVideoData' });
        }
      },
      onMessage: function (dialogApi, message) {
        if (message.action === 'insertVideo' && message.data) {
          var videoHtml = createVideoHtml(message.data);
          if (videoHtml) {
            editor.insertContent(videoHtml);
          }
          dialogApi.close();
        }
      },
      onClose: function () {
        editor.focus();
      }
    });
    
    setTimeout(function() {
      var windows = editor.windowManager.getWindows();
      if (windows.length > 0) {
        windows[0].sendMessage({
          action: 'setInitialData',
          data: initialData
        });
      }
    }, 100);
  }
  
  function createVideoHtml(data) {
    var source = data.source;
    var width = data.width || '560';
    var height = data.height || '314';
    var embed = data.embed;
    
    if (embed && embed.trim()) {
      return embed;
    }
    
    if (!source) {
      return '';
    }
    
    var youtubeMatch = source.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\\w\\-_]+)/);
    if (youtubeMatch) {
      var videoId = youtubeMatch[1];
      return '<iframe src="https://www.youtube.com/embed/' + videoId + '" width="' + width + '" height="' + height + '" allowfullscreen></iframe>';
    }
    
    var vimeoMatch = source.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      var videoId = vimeoMatch[1];
      return '<iframe src="https://player.vimeo.com/video/' + videoId + '" width="' + width + '" height="' + height + '" allowfullscreen></iframe>';
    }
    
    if (source.match(/\.(mp4|webm|ogg)$/i)) {
      var videoHtml = '<video width="' + width + '" height="' + height + '" controls>';
      videoHtml += '<source src="' + source + '" type="video/' + source.split('.').pop().toLowerCase() + '">';
      if (data.altsource) {
        videoHtml += '<source src="' + data.altsource + '" type="video/' + data.altsource.split('.').pop().toLowerCase() + '">';
      }
      videoHtml += '</video>';
      return videoHtml;
    }
    
    return '<iframe src="' + source + '" width="' + width + '" height="' + height + '" allowfullscreen></iframe>';
  }
  
  editor.ui.registry.addButton('bf_videolib', {
    icon: 'embed',
    tooltip: 'Insert/edit video',
    onAction: function () {
      showVideoDialog();
    }
  });
  
  editor.ui.registry.addMenuItem('bf_videolib', {
    icon: 'embed',
    text: 'Insert/edit video',
    onAction: function () {
      showVideoDialog();
    }
  });
  
  editor.addCommand('mceBfVideolib', function () {
    showVideoDialog();
  });
  
  return {
    getMetadata: function () {
      return {
        name: 'BuildFire Video Library plugin',
        url: 'https://github.com/BuildFire/sdk'
      };
    }
  };
});