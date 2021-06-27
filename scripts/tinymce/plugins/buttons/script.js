const params = new URLSearchParams(window.location.search);
var styleHref = params.get('appThemeUrl') + '&liveMode=' + params.get('liveMode');
document.write(`<link href=${styleHref} rel='stylesheet' onload='render()'> </link>`);

let buttonAndLinksStyles = ['primary', 'success', 'info', 'warning', 'danger', 'default'];
window.dialogData = {buttonStyle : 'primary', type: 'button'};
let dialogData = {};
function render() {
    function createElements(type) {
        let container = document.getElementById(type === 'buttons' ? 'buttonsContainer' : 'linksContainer');
        buttonAndLinksStyles.forEach((style, index) => {
            let buttonOrLinkDiv = document.createElement('div');
            buttonOrLinkDiv.className = 'col-xs-6 pull-left margin-top-20';
            buttonOrLinkDiv.className = index === 0 ? buttonOrLinkDiv.className + ' border-primary' : buttonOrLinkDiv.className;
            let buttonOrLink = document.createElement('a');
            buttonOrLink.className = type === 'buttons' ? `btn btn-${style} stretch` : `text-${style}`;
            let itemToClick = type === 'buttons' ? buttonOrLink : buttonOrLinkDiv;
            itemToClick.onclick = () => {
                selectButtonType(style, type === 'buttons' ? 'button' : 'link');
                resetBorder(type === 'buttons' ? 'button' : 'link');
                buttonOrLinkDiv.classList.add('border-primary');
            }
            buttonOrLink.innerText = `${style} ${type === 'buttons' ? 'button' : 'link'}`;
            buttonOrLinkDiv.appendChild(buttonOrLink);
            container.appendChild(buttonOrLinkDiv);
        });
    }
    createElements('buttons');
    createElements('links');
    document.getElementById('main').style.display = 'block';
}

const resetBorder = (type) => {
    if(type === 'button') {
        document.querySelector('#buttonsContainer .border-primary').classList.remove('border-primary');
    } else {
        document.querySelector('#linksContainer .border-primary').classList.remove('border-primary');
    }
}
const selectButtonType = (buttonStyle, type) =>  {
    // window.dialogData = {buttonStyle, type};
    dialogData = {buttonStyle, type};
}
window.validate = (options, callback) => {
    callback(null, dialogData !== undefined ? dialogData : null);
}
document.getElementsByName('buttonsTypes').forEach((button) => {
    button.onclick = (e) => {
        if(e.target.value === 'links') {
            window.dialogData = {buttonStyle : 'primary', type: 'link'};
            buttonsContainer.style.display = 'none';
            linksContainer.style.display = 'block';
        } else if (e.target.value === 'buttons') {
            window.dialogData = {buttonStyle : 'primary', type: 'button'};
            buttonsContainer.style.display = 'block';
            linksContainer.style.display = 'none';
        }
    }
})