/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
'use strict';

const Alexa = require('alexa-sdk');
var http = require('https');

const APP_ID = 'amzn1.ask.skill.REPLACE-WITH-ALEXA-APP-ID'; // TODO replace with your app ID (OPTIONAL).

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'My Auckland Bus',
            WELCOME_MESSAGE: "Welcome to %s. You can ask a question like, what time is my bus? ... Now, what can I help you with?",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
            NEXT_BUS_MESSAGE: 'You next bus is tomorrow',
            HELP_MESSAGE: "You can ask questions such as, when is my next bus, or, you can say exit...Now, what can I help you with?",
            HELP_REPROMPT: "You can say things like, when is my next bus, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Goodbye!',
            BUS_REPEAT_MESSAGE: 'Say it again'
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');
        this.emit('BusTimeIntent');
    },
    'BusTimeIntent': function () {
        var that = this;
        makeNextBusRequest(REPLACE-WITH-BUS-STOP-ID, function nextBusRequestCallback(err, nextBusResponse) {
            var speechOutput;

            if (err) {
                speechOutput = "Sorry, the My Bus service is experiencing a problem. Please try again later";
            } else {
                speechOutput =  nextBusResponse;
            }

            that.attributes.speechOutput = speechOutput;
            that.emit(':tell', that.attributes.speechOutput);
        });


    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};


function makeNextBusRequest(stopCode, nextBusRequestCallback) {

   var aucklandTransportDevKey = 'REPLACE-WITH-DEV-KEY';

   const options = {
      hostname: 'api.at.govt.nz',
      path: '/v2/gtfs/stops/stopinfo/' + stopCode,
      headers: {
        'Ocp-Apim-Subscription-Key': aucklandTransportDevKey
      }
    };

    http.get(options, function (res) {
        var nextBusResponseString = '';

        res.on('data', function (data) {
            nextBusResponseString += data;
        });

        res.on('end', function () {

            var resultParsed = JSON.parse('' + nextBusResponseString);

            if (resultParsed.status != "OK") {
                console.log("MyBus error: " + nextBusResponseString);
                nextBusRequestCallback(new Error(nextBusResponseString));
            } else {
                nextBusRequestCallback(null, processResponse(resultParsed.response));
            }
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        nextBusRequestCallback(new Error(e.message));
    });
}

function processResponse (response) {
    var result = '<say-as interpret-as="interjection">okey dokey</say-as><s>Your buses are</s>';
    for (var i = 0, len = response.length; i < len; i++) {

        var departureTime = response[i].departure_time;
        var routeName = response[i].route_short_name;

        result += '<p><emphasis level="moderate">' + routeName + '</emphasis>';
        result += "<break time='50ms'/><emphasis level='reduced'>at</emphasis><break time='100ms'/>";
        result += '<emphasis level="moderate">'
                    + departureTime.substr(0, departureTime.lastIndexOf(":"))
                    + '</emphasis>';
        result += '</p>';
    }
    return result;
}
