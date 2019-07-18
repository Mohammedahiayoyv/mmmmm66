const request = require('request-promise');
const url = require("./getURL.js");

/**
 * gets a step for aki by requesting the correct data.
 * @param region the supplied region area.
 * @param session the akinator session
 * @param signature the akinator signature
 * @param step the number of step this is on.
 */
module.exports = async (region, session, signature, step) => {
    const id = url.regionURL(region);

    const opts = {
        method: 'GET',
        json: true,
        //https://srv6.akinator.com:9126/ws/list?&session=323&signature=343571160&step=0&answer=0
        uri: `https://${id}/ws/list?session=${session}&signature=${signature}&step=${step}`,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 6_0 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10A5376e Safari/8536.25'
        },
        gzip: true
    };

    // get the json data, and await it
    const json = await request(opts).catch(console.error);

    if(json == null || !json.completion) {
        throw new Error(`A problem occurred with making the request.\nRequest Value: ${json}`);
    }

    // only using promises now
    if (json.completion === 'OK') {
        return {
            "answers": json.parameters.answers.map(ans => ans.answer) || [],
            "currentStep": step,
            "nextStep": step + 1,
            "guessCount": json.parameters.NbObjetsPertinents // number of guesses akinator holds
        };
    } else if (json.completion === 'KO - SERVER DOWN') {
        throw new Error(`Akinator servers are down for the "${region}" region. Check back later. ` + json.completion);
    } else if (json.completion === 'KO - TECHNICAL ERROR') {
        throw new Error(`Akinator's servers have had a technical error for the "${region}" region. Check back later. ` + json.completion);
    } else if (json.completion === 'KO - INCORRECT PARAMETER') {
        throw new Error(`You inputted a wrong paramater, this could be session, region, or signature. ` + json.completion);
    } else if (json.completion === 'KO - TIMED OUT') {
        throw new Error('Your Akinator session has timed out. ' + json.completion);
    } else {
        throw new Error('Unknown error has occured. Server response: ' + json.completion);
    }
};
