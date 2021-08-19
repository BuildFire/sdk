if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.format) == "undefined") buildfire.format = {};

buildfire.format.textToHTML = function(options, callback) {
    options = options || {};
    let data = {};
    let text = options.text;
    let allHashtags = [];
    text = !options.ignoreAnchors ? text.replace(/(?<URL>https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g, function(URL) { return `<a onclick="buildfire.actionItems.execute({action: 'linkToWeb', url: '${encodeURI(URL)}', openIn: '_system'}, () => {})">${URL}</a>`; }) : text;
    text = !options.ignoreEmails ? text.replace(/(?<EMAIL>([\w\.]+)@([\w\.]+)\.(\w+))/g, `<a onclick="buildfire.actionItems.execute({action: 'sendEmail', email: '$<EMAIL>'}, () => {})">$<EMAIL></a>`) : text;
    text = !options.ignorePhoneNumbers ? text.replace(/(?<PHONENUMBER>(\+?[0-9][0-9-.]{7,}[0-9]))/g,  `<a onclick="buildfire.actionItems.execute({action: 'callNumber', phoneNumber: '$<PHONENUMBER>'}, () => {})">$<PHONENUMBER></a>`) : text;
    if (options.supportedHashtagType) {
        let url;
        let querystring;
        switch(options.supportedHashtagType.toLowerCase()) {
            case 'youtube':
                url = 'https://www.youtube.com/hashtag/';
                break;
            case 'facebook':
                url = 'https://www.facebook.com/hashtag/';
                break;
            case 'twitter':
                url = 'https://twitter.com//hashtag/';
                querystring = '?src=hashtag_click';
                break;
            case 'custom':
                url = 'custom';
        }
        if (url && url !== 'custom') {
            text = text.replace(/(?<SPACES>(^|\s))(#(?<HASHTAG>[a-z\d-]+))/gi,  function(HASHTAG, SPACES) { HASHTAG = HASHTAG.slice(2); allHashtags.push(HASHTAG); return `<a onclick="buildfire.actionItems.execute({action: 'linkToWeb', url: '${url}${encodeURIComponent(HASHTAG)}${querystring ? querystring : ''}', openIn: '_system'}, () => {})">${SPACES}#${HASHTAG}</a>`;});
        } else if (url === 'custom') {
            text = text.replace(/(?<SPACES>(^|\s))(#(?<HASHTAG>[a-z\d-]+))/gi,  function(HASHTAG, SPACES) { HASHTAG = HASHTAG.slice(2); allHashtags.push(HASHTAG); return `<a onclick="buildfire.format.onHashtagClick('${HASHTAG}')">${SPACES}#${HASHTAG}</a>`;});
        }
    }
    data.html = text;
    data.hashtags  = allHashtags;
    callback(null, data);
}
buildfire.format.onHashtagClick = function(hashtag) {
    console.log(`Clicked HASHTAG: ${hashtag}`);
};