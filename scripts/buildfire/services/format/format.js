if (typeof (buildfire) == "undefined") throw ("please add buildfire.js first to use BuildFire services");

if (typeof (buildfire.format) == "undefined") buildfire.format = {};

buildfire.format.textToHTML = function(text, options) {
    options = options || {};
    text = !options.ignoreAnchors ? text.replace(/(?<URL>https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/g, function(URL) { return `<a onclick="buildfire.actionItems.execute({action: 'linkToWeb', url: '${encodeURI(URL)}', openIn: '_system'}, () => {})">${URL}</a>`; }) : text;
    text = !options.ignoreEmails ? text.replace(/(?<EMAIL>([\w\.]+)@([\w\.]+)\.(\w+))/g, `<a onclick="buildfire.actionItems.execute({action: 'sendEmail', email: '$<EMAIL>'}, () => {})">$<EMAIL></a>`) : text;
    text = !options.ignoreHashtags ? text.replace(/(?<SPACES>(^|\s))(#(?<HASHTAG>[a-z\d-]+))/gi,  function(HASHTAG, SPACES) { HASHTAG = HASHTAG.slice(2); return `<a onclick="buildfire.actionItems.execute({action: 'linkToWeb', url: 'https://www.youtube.com/hashtag/${encodeURIComponent(HASHTAG)}', openIn: '_system'}, () => {})">${SPACES}#${HASHTAG}</a>`; }) : text;
    text = !options.ignorePhoneNumbers ? text.replace(/(?<PHONENUMBER>(\+?[0-9][0-9-.]{7,}[0-9]))/g,  `<a onclick="buildfire.actionItems.execute({action: 'callNumber', phoneNumber: '$<PHONENUMBER>'}, () => {})">$<PHONENUMBER></a>`) : text;
    return text;
}