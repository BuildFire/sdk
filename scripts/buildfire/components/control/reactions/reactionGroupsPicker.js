if (typeof buildfire == 'undefined') throw 'please add buildfire.js first to use buildfire components';
if (typeof buildfire.components == 'undefined' || typeof buildfire.components.reactions == 'undefined') throw 'please add reactions.js first to use reactionGroupsInput components';
if (typeof buildfire.components.control == 'undefined') buildfire.components.control = {};
if (typeof buildfire.components.control.tagsInput == 'undefined') {
    document.write('<script src="../../../../scripts/buildfire/components/control/tagsInput/tagsInput.min.js"></script>');
    document.write('<link href="../../../../styles/components/control/tagsInput/tagsInput.min.css" rel="stylesheet"/>');
}

buildfire.components.control.reactionGroupPicker = (()=>{
    class ReactionGroups extends buildfire.components.reactions {
        constructor(selector, data={}){
            super(data);
            
            this.selector = selector || null;
            this.placeholder = data.placeholder || 'Select Reaction Group';
            this.groupName = data.groupName || '';
            
            buildfire.getContext((error, result) => {
                if (error) {
                    this.onError({code:'_ERROR_CODE_', message: error});
                    return console.error(error);
                } else if (result && result.type == "control") {
                    if(this.selector){
                        this._init();
                    }else{
                        this.onError({code:'_ERROR_CODE_', message: 'Invalid selector'});
                        return console.error('Invalid selector');
                    }
                } else {
                    this.onError({code:'_ERROR_CODE_', message: 'reaction dialog should be called in CP-side'});
                    console.error('reaction dialog should be called in CP-side');
                }
            })
        }   
    
        _init() {
            if(this.groupName){
                this._fixGroupName(this.groupName, (err,res)=>{
                    if(err){
                        this.onError({code:'_ERROR_CODE_', message: err});
                    }
                    if(!res.existGroupName){
                        let selectorContainer = document.querySelector(this.selector);
                        let errorSpan = document.createElement('span');
                        errorSpan.className = 'error';
                        errorSpan.innerHTML = 'Group name is not defined';

                        selectorContainer.appendChild(errorSpan);
                        this.onError({code:'_ERROR_CODE_', message: 'group name is not defined'});
                    }
                });
            }
            const customGroupsInput = new buildfire.components.control.tagsInput(this.selector, {
                languageSettings: {
                    placeholder: this.placeholder,
                },
                settings: {
                    sourceType: 'custom',
                    source: ({ }, callback) => {
                        ReactionGroups.openReactionGroupsDialog({selectedGroup: this.groupName}, (err, result) => {
                            if (err) {
                                this.onError({code:'_ERROR_CODE_', message: err});
                                return console.error(err);
                            }
    
                            if (result) {
                                callback(result);
                            }
                        });
                    },
                    allowAutoComplete: false,
                    allowUserInput: false,
                }
            });
            customGroupsInput.onUpdate = (data) => {
                if(data.tags && data.tags.length){
                    this.groupName = data.tags[0].name;
                    // register analytics
                    // this._registerAnalytics();
                    this.onUpdate({name: this.groupName});
                }else{
                    this.onUpdate({});
                    this.groupName = '';
                }
            }
    
            if(this.groupName){
                customGroupsInput.set([{value:this.groupName, name:this.groupName}]);
            }
    
        }   
    
        // options = {reactionGroups}
        static openReactionGroupsDialog(options, callback) {
            let _options = { selectedGroup: options.selectedGroup, loading:true };
            DialogManager.init(_options, callback);
        }
    
        _registerAnalytics(){
            let analyticsEvents = [
                {
                    title: 'react',
                    key: 'react',
                    desc: 'Total reactions'
                },
                {
                    title: 'unReact',
                    key: 'unReact',
                    desc: 'Total deleted reactions'
                },
            ];
    
            analyticsEvents.forEach(event=>buildfire.analytics.registerEvent(event,{ silentNotification: true }));
        }
    
        // CP-event
        onUpdate(event = {/* {name:'group name'} */}) {
            return event;
        }
        onError(event = {/* {code:'', message:''} */}) {
            return event;
        }
    }
    
    class DialogManager {
        static dialogContainer = document.createElement('div');
        // options = {selectedGroup, groups}
        static init(options, callback) {
            if (!callback || typeof callback !== 'function') {
                callback = (err, groupName) => {
                    if (err) return console.error(err);
                    return console.log('selected group changed to ' + groupName);
                }
            }
            let loading = typeof options.loading == 'boolean' ? options.loading : false;
            let groups = options.groups || [];
            let selectedGroup = options.selectedGroup || '';
    
            this.show();
    
            if(loading){
                this.updateContentState('loading');
                buildfire.components.reactions.getReactionGroups((err,groups)=>{
                    if(err) {
                        return console.error(err);
                    }
                    this._printList({ groups, selectedGroup: selectedGroup });
                    this._addListeners(groups, callback);
                })
            }else if (!groups || !groups.length) {
                this.updateContentState('empty');
                this._addListeners(groups, callback);
            } else {
                this._printList({ groups, selectedGroup: selectedGroup });
                this._addListeners(groups, callback);
            }
        }
    
        static show() {
            this.dialogContainer.innerHTML = `
            <div modal-render="true" tabindex="-1" role="dialog" class="modal fade ng-isolate-scope in" uib-modal-animation-class="fade" modal-in-class="in" uib-modal-window="modal-window" window-class="" size="lg" index="0" animate="animate" modal-animation="true" style="z-index: 1050; display: block;background:#00000061;">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content" uib-modal-transclude="" style="height:70vh;">
                        <form class="submit-modal">
                            <div class="tag-search-dialog ng-scope" style="height:70vh;">
                                <div class="header clearfix border-bottom-grey">
                                    <h4 class="margin-zero" style="color:#5f5f5f;">Reactions</h4>
                                    <span class="icon icon-cross2 close-modal" ></span>
                                </div>
                                <div class="padded clearfix" style="height: calc(100% - 7.25rem);overflow: hidden;overflow-y: auto;">
                                    <div class="well no-plugins text-center" id="reactions-dialog-empty-container" style="height: 90%;display: flex;align-items: center;justify-content: center;">
                                        <h4>Loading...</h4>
                                    </div>
                                    <div class="" id="reactions-dialog-list-container">
                                    </div>
                                </div>
                                <div class="bottom border-top-grey clearfix">
                                    <button class="btn btn-success pull-right margin-left-fifteen save-modal hidden" type="submit">
                                        Select
                                    </button>    
                                    <button class="btn btn-default pull-right cancel-modal border-grey">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>`;
    
            document.body.appendChild(this.dialogContainer);
        }
    
        static hide() {
            this.dialogContainer.remove();
        }
    
        static updateContentState(state) {
            let emptyContainer = this.dialogContainer.querySelector('#reactions-dialog-empty-container');
            let listContainer = this.dialogContainer.querySelector('#reactions-dialog-list-container');
            let selectBtn = this.dialogContainer.querySelector('.save-modal');
    
            switch (state) {
                case 'empty':
                    emptyContainer.innerHTML = "<div><h4 style='font-size:16px;'>You haven't added any reactions yet</h4><h4 style='font-size:16px;'>You can add Reactions by including Reaction feature from the Marketplace.</h4></div>";
                    emptyContainer.classList.remove('hidden');
                    listContainer.classList.add('hidden');
                    selectBtn.classList.add('hidden');
                    break;
                case 'loading':
                    emptyContainer.innerHTML = "<h4 style='font-size:16px;'>Loading...</h4>";
                    emptyContainer.classList.remove('hidden');
                    listContainer.classList.add('hidden');
                    selectBtn.classList.add('hidden');
                    break;
                default:
                    emptyContainer.classList.add('hidden');
                    listContainer.classList.remove('hidden');
                    selectBtn.classList.remove('hidden');
                    break;
            }
        }
        // options = {groups, selectedGroup}
        static _printList(options) {
            if (!options || !options.groups || !options.groups.length) {
                return this.updateContentState('empty');
            }
            let listContainer = this.dialogContainer.querySelector('#reactions-dialog-list-container');
    
            let list = '';
            options.groups.forEach((group, idx) => {
                let reactions = '';
                group.reactions.forEach(reaction => {
                    let src = buildfire.imageLib.resizeImage(reaction.selectedUrl, { size: "half_width", aspect: "1:1" })
                    reactions += `<img style="width:24px; height:24px;" class="margin-right-five" src="${src}" />`;
                })
                let checked = false;
                if (options.selectedGroup && group.name.toLowerCase() == options.selectedGroup.toLowerCase()) {
                    checked = true;
                } else if (!options.selectedGroup && idx == 0) {
                    checked = true;
                }
                let li = `<tr style="border: 0.5px solid var(--c-gray3);">
                            <td style="width:0%;" class="padding-bottom-fifteen padding-top-fifteen padding-left-fifteen padding-right-fifteen">
                                <input ${checked ? "checked" : ""} name="selected-reaction-group" type="radio" value="${group.name}" id="${group.name}" style="width:20px;height:20px;" />
                            </td>
                            <td class="col-md-3 padding-bottom-fifteen padding-top-fifteen padding-left-zero padding-right-fifteen" >
                                <label class="margin-zero cursor-pointer" for="${group.name}" style="width:100%">${group.name}</label>
                            </td>
                            <td class="col-md-2 padding-bottom-fifteen padding-top-fifteen padding-left-fifteen padding-right-fifteen" >
                                <label class="margin-zero cursor-pointer" for="${group.name}" style="width:100%">${reactions}</label>
                            </td>
                        </tr>`;
    
                list += li;
            })
    
            listContainer.innerHTML = `<p style="font-weight: 700;color: var(--c-info);margin-left: 50px;">Group Name</p><table style="border: 0.5px solid var(--c-gray3);"><tbody>${list}</tbody></table>`;
            this.updateContentState('list-printed')
        }
    
        static _addListeners(groups, callback) {
            let closeBtn = this.dialogContainer.querySelector('.close-modal');
            let cancelBtn = this.dialogContainer.querySelector('.cancel-modal');
            let submitBtn = this.dialogContainer.querySelector('.submit-modal');
    
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
            cancelBtn.addEventListener('click', () => {
                this.hide();
            });
            submitBtn.addEventListener('submit', (e) => {
                e.preventDefault();
    
                let elements = e.target['selected-reaction-group'];
                if (elements && elements.length) {
                    elements = Array.from(elements);
                } else {
                    elements = [elements];
                }
    
                let selectedRadio = elements.find(el => el.checked);
                let groupName = '', groupData = {};
                if (selectedRadio) {
                    groupName = selectedRadio.value;
                    groupData = groups.find(group => group.name === groupName);
                } else {
                    groupName = groups[0].name;
                    groupData = groups[0].reactions;
                }
    
                groupData.value = groupData.name;
    
                callback(null, groupData);
                this.hide()
            });
        }
    }

    return ReactionGroups;
})()