const defReq = require('rest/interceptor/defaultRequest');
const md5 = require('md5');
const mine = require('rest/interceptor/mime');
const R = require('ramda');
const rest = require('rest');

const MARVEL_PUBLIC_KEY = require('./marvel-public-key');
const MARVEL_PRIVATE_KEY = require('./marvel-private-key');
const MARVEL_CHAR_ENDPOINT = 'http://gateway.marvel.com/v1/public/characters';

// get marvel md5 hash of timestamp + private key + public key
// takes timestamp
const getMarvelHash = (ts) => md5(ts + MARVEL_PRIVATE_KEY + MARVEL_PUBLIC_KEY);

// show me the money!
const logger = (data) => {
    console.log(data);
    return data;
}

// make an request
const makeReq = (type, params) => {
    const restParams = R.omit(['path'], params);
    const client = rest.wrap(defReq, { method: type, params: restParams });
    return client({ path: params.path });
}

// make a get request
// takes a params object
const getReq = R.curry(makeReq)('GET');

// need an api key, hash and timestamp to make a request to the marvel api
const now = Date.now();
const defaultMarvelParams = {
    apikey: MARVEL_PUBLIC_KEY,
    hash: getMarvelHash(now),
    ts: now
};

// mixin any passed-in marvel params with the default params
const getMarvelParams = R.partial(R.merge, [defaultMarvelParams]);

// ick, gotta massage that data
// takes a marvel get response object
const getMarvelLogger = R.compose(
    logger,
    R.curry(JSON.stringify)(R.__, null, 4),
    R.prop('results'),
    R.prop('data'),
    JSON.parse,
    R.prop(['entity'])
);

// make a marvel get request and then log it
// need to use composeP because getReq returns a promise
// takes a param object
const getMarvelReqWithLogger = R.composeP(getMarvelLogger, getReq);

// make a marvel get request
// takes a params object
const getMarvelReq = R.compose(getMarvelReqWithLogger, getMarvelParams);

// need the specifc endpoint
const defaultMarvelCharParams = {
    path: MARVEL_CHAR_ENDPOINT
};

// mixin any passed-in marvel params with the default characters params
const getMarvelCharParams = R.partial(R.merge, [defaultMarvelCharParams]);

// make a marvel get request to the /characters endpoint
// takes a params object
const getMarvelCharReq = R.compose(getMarvelReq, getMarvelCharParams);

// make a marvel get request to the /characters endpoint by name
// takes a params object
const getMarvelCharByNameReq = (name) => getMarvelCharReq({ name: name });

// who you lookin' at, bub
getMarvelCharByNameReq('Wolverine');
