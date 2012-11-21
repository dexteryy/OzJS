/**
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://ozjs.org for details
 *
 * Copyright (C) 2010-2012, Lifei, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define('mod/mention', [
    'lib/jquery',
    'mod/lang',
    'mod/event',
    'mod/key'
], function($, _, Event, Key){
    // utils
    var utils = {
        selectRangeText: function(target, start, end) {
            if (target.createTextRange) { // for retarded IE
                var range = target.createTextRange();
                range.moveEnd('character', - target.value.length);
                range.moveEnd('character', end);
                range.moveStart('character', start);
                range.select();
            } else {
                target.setSelectionRange(start, end);
            }
        },
        setCaretPosition: function (target, caretPos) {
            utils.selectRangeText(target, caretPos, caretPos);
        },
        getCaretPosition: function(target) {
            if (target.createTextRange) { // for retarded IE
                target.focus();
                var val = target.value,
                    range = document.selection.createRange(),
                    textRange = target.createTextRange(),
                    dupTextRange = textRange.duplicate();

                dupTextRange.moveToBookmark(range.getBookmark());
                textRange.setEndPoint('EndToStart', dupTextRange);
                if (range == null || textRange == null) return val.length;

                var textPart = range.text.replace(/[\r\n]/g, '.'),
                    textWhole = val.replace(/[\r\n]/g, '.');
                return textWhole.indexOf(textPart, textRange.text.length);
            } else {
                return target.selectionStart;
            }
        }
    },
        pre,

        defaultLeaders = ['@', '#'],

        leaderAlias = {
            '#': '＃'
        },

        _mentionInputLib = {};


    var mention = {
        keydownHandler: function(e) {
            var input = e.target;
            if (input.className.indexOf('mention') !== -1) {
                var mentionInput = getMention(input);
                var slices = mentionInput.slices();
                needReshow = true;
                if (slices.tag !== null) { //have tag
                    switch(Key.KEYS_CODE[e.keyCode]) {
                        case 'space':
                        case 'esc':
                            mentionInput.event.fire('quit');
                            needReshow = false;
                            break;
                        case 'return':
                        case 'tab':
                            e.preventDefault();
                            mentionInput.event.fire('pick', [mentionInput]);
                            needReshow = false;
                            break;
                        case 'up':
                            e.preventDefault();
                            mentionInput.event.fire('move', [-1]);
                            needReshow = false;
                            break;
                        case 'down':
                            e.preventDefault();
                            mentionInput.event.fire('move', [1]);
                            needReshow = false;
                            break;
                        default:
                            break;
                    }
                }
            }
        },
        keyupHandler: function(e) {
            var input = e.target;
            if (input.className.indexOf('mention') !== -1) {
                var mentionInput = getMention(input);
                var slices = mentionInput.slices();
                if (!needReshow) return;
                if (slices.tag !== null) {
                    mentionInput.event.fire('show', [mentionInput.slices.accord, slices.tag, mentionInput.cursorPos(slices.beforeCaret), mentionInput]);
                } else {
                    mentionInput.event.fire('quit');
                }
            }
        },

        plugin: function(suggester) {
            this._plugedSuggester = suggester;
        }
    };


    var needReshow = true;

    mention.lib = {
        insertAtCaret: function(input, value) {
            if (document.selection) { // For IE
                input.focus();
                var sel = document.selection.createRange();
                sel.text = value;
                input.focus();
            } else if (input.selectionStart || input.selectionStart == '0') { // For standard
                var startPos = input.selectionStart,
                    endPos = input.selectionEnd,
                    scrollTop = input.scrollTop;

                input.value = input.value.substring(0, startPos) + value + input.value.substring(endPos, input.value.length);
                input.focus();
                input.selectionStart = startPos + value.length;
                input.selectionEnd = startPos + value.length;
                input.scrollTop = scrollTop;
            } else {
                input.value += value;
                input.focus();
            }
        }
    };

    // getMention: a factory that managers all the MentionInput instances
    function getMention(input) {
        var uniqueID,
            suggester = mention._plugedSuggester;

        if (input.id.indexOf('mention') === -1) {
            uniqueID = getUniqueID();
            input.id = 'mention-' + uniqueID;
            _mentionInputLib[uniqueID] = MentionInput(input);
            _mentionInputLib[uniqueID].event.bind('quit', suggester.clear.bind(suggester));
            _mentionInputLib[uniqueID].event.bind('pick', suggester.pick.bind(suggester));
            _mentionInputLib[uniqueID].event.bind('move', suggester.move.bind(suggester));
            _mentionInputLib[uniqueID].event.bind('show', suggester.show.bind(suggester));
            // Gabage Collection
            for (var id in _mentionInputLib) {
                if (!isInDOMTree(_mentionInputLib[id].getDOM())) {
                    _mentionInputLib[id].destroy();
                    delete _mentionInputLib[id];
                }
            }
        } else {
            uniqueID = input.id.match(/\d{6}/);
        }
        return _mentionInputLib[uniqueID];

        function getUniqueID() {
            var ret = '' + Math.floor(Math.random() * 1000000);
            if (ret.length < 6) {
                ret = '000000'.slice(0, 6 - ret.length) + ret;
            }
            if (ret in Object.keys(_mentionInputLib)) {
                return getUniqueID();
            }
            return ret;
        }

        function isInDOMTree(node) {
            while(node.parentNode) {
                node = node.parentNode;
            }
            return !!(node.body);
        }
    } 

    function MentionInput(input) {
        var event = Event(),
            leaders = $(input).data('leaders') || defaultLeaders,
            context = $(input).data('context'),
            $input = $(input),

            inputStyle = {
                width: $input.width(),
                fontFamily: $input.css('font-family'),
                fontSize: $input.css('font-size'),
                lineHeight: $input.css('line-height')
            };

        return {
            context: context,
            event: event,
            destroy: function() {
                event.unbind();
            },
            getDOM: function() {
                return input;
            },
            powerInsert: function(newTag) {
                var slice = slices();
                if (slice.tag !== null) {
                    input.value = slice.beforeLeader + slices.accord +  newTag + ' ' + slice.afterCaret;
                }
                var offset = slice.offset - slice.tag.length + newTag.length + 1;
                utils.setCaretPosition(input, offset);
            },
            slices: slices,
            cursorPos: function(beforeCaret) {
                var inputPos = $input.offset(),
                    inputPaddingTop = $input.css('paddingTop'),
                    inputPaddingLeft = $input.css('paddingLeft'),
                    anchor = $('<em>&nbsp</em>'),
                    inboxOffset;

                if (!pre) {
                    initPre();
                }
                pre.css({
                    width: inputStyle.width,
                    'font-family': inputStyle.fontFamily,
                    'font-size': inputStyle.fontSize,
                    'line-height': inputStyle.lineHeight
                }).text(beforeCaret).append(anchor);
                inboxOffset = anchor.position();
                inboxOffset.top -= input.scrollTop;
                inboxOffset.left -= input.scrollLeft;

                return {
                    top: inputPos.top + inboxOffset.top,
                    left: inputPos.left + inboxOffset.left,
                    marginTop: inputPaddingTop,
                    marginLeft: inputPaddingLeft
                };
            }
        };
        function slices() {
            var value = input.value,
                offset = utils.getCaretPosition(input),
                beforeCaret = value.slice(0, offset),
                afterCaret = value.slice(offset),
                tag = null,
                beforeLeader = null;

            leaders.forEach(function check(leader, index, array, realLeader) {
                var FAKE_INDEX = 0,
                    FAKE_ARRAY = [];
                if (tag === null) { // continue to search for tag
                    var leaderPos = beforeCaret.lastIndexOf(leader);

                    if (realLeader) { // is using alias to check
                        input.value = input.value.replace(leader, realLeader);
                        leader = realLeader;
                    }

                    if (leaderPos !== -1) {
                        beforeLeader = beforeCaret.slice(0, leaderPos);
                        tag = beforeCaret.slice(leaderPos + 1);
                        if (tag.indexOf(' ') !== -1) {
                            tag = null;
                            // try again if leader has alias and it's not checking with alias
                            if (leaderAlias[leader] !== undefined&& !realLeader) {
                                check(leaderAlias[leader], FAKE_INDEX, FAKE_ARRAY, leader);
                            }
                        } else {
                            slices.accord = leader;
                        }
                    } else {
                        // try again if leader has alias and it's not checking with alias
                        if (leaderAlias[leader] !== undefined && !realLeader) {
                            check(leaderAlias[leader], FAKE_INDEX, FAKE_ARRAY, leader);
                        }
                    }
                }
            });

            return {
                value: value,
                beforeLeader: beforeLeader,
                beforeCaret: beforeCaret,
                tag: tag,
                afterCaret: afterCaret,
                offset: offset
            };
        }
    }

    function initPre() {
        pre =  $('<pre></pre>').css({
            position: 'absolute',
            left: -9999,
            // For testing. ( console )
            //top:0,
            //left:0,
            //zIndex: 8888,
            border: '1px',
            'word-wrap': 'break-word'
        }).appendTo('body');
    }

    return mention;
});
