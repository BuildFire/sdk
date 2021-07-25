let buttonAndLinksStyles = ['primary', 'success', 'info', 'warning', 'default', 'danger'];
let dialogData = {buttonStyle : 'primary', type: 'button'};

if (window.parent.document.getElementById('bfWidgetTheme')) {
    let stylesClone = window.parent.document.getElementById('bfWidgetTheme').cloneNode(true);
    document.head.appendChild(stylesClone);
}

function render() {
    function createElements(type) {
        let container = document.getElementById(type === 'buttons' ? 'buttonsContainer' : 'linksContainer');
        buttonAndLinksStyles.forEach((style, index) => {
            let columnDiv = document.createElement('div');
            let buttonOrLinkDiv = document.createElement('div');
            columnDiv.className = 'col-xs-6 pull-left margin-top-20';
            buttonOrLinkDiv.className = index === 0 ? 'bf-border-primary active' : '';
            let buttonOrLink = document.createElement('a');
            buttonOrLink.className = type === 'buttons' ? `bf-btn bf-btn-${style} btns-width` : `bf-text-${style}`;
            let itemToClick = type === 'buttons' ? buttonOrLink : buttonOrLinkDiv;
            itemToClick.onclick = () => {
                selectButtonType(style, type === 'buttons' ? 'button' : 'link');
                resetBorder(type === 'buttons' ? 'button' : 'link');
                buttonOrLinkDiv.classList.add(`bf-border-${style}`, 'active');
            }
            buttonOrLink.innerText = `${style} ${type === 'buttons' ? 'button' : 'link'}`;
            buttonOrLinkDiv.appendChild(buttonOrLink);
            columnDiv.appendChild(buttonOrLinkDiv);
            container.appendChild(columnDiv);
        });
    }
    createElements('buttons');
    createElements('links');
    document.getElementById('main').style.display = 'block';
}

render();
document.querySelector('#buttonsContainer').style.display = 'block';
document.querySelector('#buttonsContainer').classList.add('showDiv');
const resetBorder = (type) => {
    if (type === 'button') {
        document.querySelector('#buttonsContainer .active').className = '';
    } else {
        document.querySelector('#linksContainer .active').className = '';
    }
}
const selectButtonType = (buttonStyle, type) =>  {
    dialogData = {buttonStyle, type};
}
window.validate = (options, callback) => {
    callback(null, dialogData !== undefined ? dialogData : null);
}
document.getElementsByName('buttonsTypes').forEach((button) => {
    button.onclick = (e) => {
        if(e.target.value === 'links') {
            dialogData = {buttonStyle : 'primary', type: 'link'};
            document.querySelector('#buttonsContainer').style.display = 'none';
            document.querySelector('#linksContainer').style.display = 'block';
            buttonsContainer.classList.remove('showDiv');
            linksContainer.classList.add('showDiv');
        } else if (e.target.value === 'buttons') {
            dialogData = {buttonStyle : 'primary', type: 'button'};
            document.querySelector('#linksContainer').style.display = 'none';
            document.querySelector('#buttonsContainer').style.display = 'block';
            buttonsContainer.classList.add('showDiv');
            linksContainer.classList.remove('showDiv');
        }
    }
})