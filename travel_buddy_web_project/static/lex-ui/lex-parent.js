var loaderOpts = {
    baseUrl: '/static/lex-ui/',
    iframeSrcPath: '/lexbot#/?lexWebUiEmbed=true',
    shouldLoadConfigFromEvent: true,
    shouldLoadMinDeps: true,
};

var iframeLoader = new ChatBotUiLoader.IframeLoader(loaderOpts);
var chatbotUiconfig = {
    ui: {
        // origin of the parent site where you are including the chatbot UI
        parentOrigin: window.location.origin
    },
    iframe: {
        // origin hosting the HTML file that will be embedded in the iframe
        iframeOrigin: window.location.origin,
        iframeSrcPath: '/lexbot#/?lexWebUiEmbed=true',
    },
    cognito: {
        "poolId": "us-east-1:9e9429c5-d8ee-40bc-941c-0cb680720fe4"
    },
    lex: {
        "botName": "TravelBuddy"
    }

};

// load the iframe
iframeLoader.load(chatbotUiconfig)
    .then(function () {
        iframeLoader.api.ping();
        $('#send-intent').prop('disabled', false);

    })
    .catch(function (error) {
        console.error('chatbot UI failed to load', error);
    });

function sendUtterance(utterance) {
    function isBotMinimized() {
        var elementId = iframeLoader.options.elementId;
        var minimizedClass = 'lex-web-ui-iframe--minimize';
        return $('#' + elementId).hasClass(minimizedClass);
    }

    return Promise.resolve()
        .then(function () {
            return !isBotMinimized() || iframeLoader.api.toggleMinimizeUi();
        })
        .then(function () {
            return iframeLoader.api.postText(utterance);
        })
        .then(function () { console.log('message succesfully sent'); })
        .catch(function (err) { console.error('error sending message ', err); });
}
$(document).ready(function chatbotHandler() {
    $(document).one('receivelexconfig', function onReceiveLexConfig() {
        var localTimeZone;
        try {
            localTimeZone = JSON.stringify(
                Intl.DateTimeFormat().resolvedOptions().timeZone
            );
        } catch (err) {
            localTimeZone = JSON.stringify(
                new Date().getTimezoneOffset()
            )
        }

        // sample config passing the local timezone in a sessionAttribute
        var config = {
            lex: {
                sessionAttributes: {
                    localTimeZone: JSON.stringify(
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                    )
                }
            }
        };
        var event = new CustomEvent('loadlexconfig', { detail: { config: config } });
        document.dispatchEvent(event);
    });

    $(document).on('lexWebUiReady', function onUpdateLexState(evt) {
        var event = new CustomEvent(
            'lexWebUiMessage',
            { detail: { message: { event: 'ping' } } }
        );
        document.dispatchEvent(event);
    });

    // setup Send button handler
    $('#send-intent').on('click', function (event) {
        event.preventDefault();
        sendUtterance('Book a Hotel');
    });


    $(document).on('updatelexstate', function onUpdateLexState(evt) {
        var slots = {};
        var dialogState = {};
        var intentName = '';
        var sessionAttributes = {};
        var responseCard = {};

        if (evt && ('detail' in evt) && evt.detail && ('state' in evt.detail)) {
            slots = evt.detail.state.slots;
            dialogState = evt.detail.state.dialogState;
            intentName = evt.detail.state.intentName || intentName;
            sessionAttributes = evt.detail.state.sessionAttributes || sessionAttributes;
            responseCard = evt.detail.state.responseCard || responseCard;
        }
        if (!slots || !dialogState) {
            console.warn('updatelexstate event is missing slot or dialogState field');
            return;
        }
        $('#dialog-state').text(dialogState);
        $('#intent-name').text(intentName);
        $('#session-attributes').text(JSON.stringify(sessionAttributes, null, 2));
        $('#response-card').text(JSON.stringify(responseCard, null, 2));

        var $slotsContainerReplacement = $('<div>', { id: 'slots' });
        Object.keys(slots).forEach(function updateOrder(slotName, index) {
            var slotValue = JSON.stringify(slots[slotName]);
            var $slotDiv = $('<div>', { id: 'slot-' + index });
            var $slotName = $('<strong>').text(slotName + ': ');
            var $slotValue = $('<span>').text(slotValue);

            $slotDiv.append($slotName);
            $slotDiv.append($slotValue);
            $slotsContainerReplacement.append($slotDiv);
        });

        $('#slots').replaceWith($slotsContainerReplacement);
    });
});