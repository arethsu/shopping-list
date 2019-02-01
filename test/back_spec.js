
var client = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/lab';

var mocha = require('mocha');
var request = require('superagent');
var equals = require('shallow-equals');

var server = require('./../server');

// I feel like if I'm abusing JS a bit. Is it okay to do this kind of thing?
var getCollection = (name, func_ret) => client.connect(url, (err, db) => {
    if (err) throw err; else {
        db.collection(name, (err, collection) => {
            if (err) throw err; else func_ret(collection);
        });
    }
});

var countMessages = func_ret => getCollection('messages', collection => {
    collection.count().then(n => func_ret(n))
});

var nOccurrences = (key, value, func_ret) => getCollection('messages', collection => {
    collection.count({[key]: {$in: [value]}}).then(n => func_ret(n))
});

var flagOccurrences = func_ret => {
    nOccurrences('read', false, nFalse => nOccurrences('read', true, nTrue => func_ret([nFalse, nTrue])))
};

describe('LAB_02', () => {

    var base = 'http://localhost:8000';

    describe('/save', () => {

        it('saves a message', done => {
            var message = encodeURIComponent('Hello there!');
            var search_regex = /^Hello\sthere$/;

            nOccurrences('message', search_regex, nBefore => {
                request.get(base + '/save?message=' + message).end((err, res) => {
                    if (err) {
                        throw err;
                    } else {
                        nOccurrences('message', search_regex, nAfter => {
                            if (res.status === 200 && nBefore === nAfter) done();
                        });
                    }
                });
            });
        });

        it('errors out when message is empty', done => {
            countMessages(nBefore => {
                request.get(base + '/save?message=').end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 400 && nBefore == nAfter) done();
                    });
                });
            });
        });

        it('errors out when message is longer than 140 characters', done => {
            var message = encodeURIComponent('A' + new Array(150 + 1).join('H') + '!');

            countMessages(nBefore => {
                request.get(base + '/save?message=' + message).end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 400 && nBefore === nAfter) done();
                    });
                });
            });
        });

    });

    describe('/flag', function () {

        it('flags a message', done => {
            getCollection('messages', collection => {
                collection.findOne().then(before_doc => {
                    request.get(base + '/flag?id=' + encodeURIComponent(before_doc._id)).end((err, res) => {
                        collection.findOne(before_doc._id).then(after_doc => {
                            if (res.status === 200 && before_doc.read !== after_doc.read) done();
                        });
                    });
                });
            });
        });

        it("errors out when id isn't defined", done => {
            countMessages(nBefore => {
                request.get(base + '/flag').end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 400 && nBefore === nAfter) done();
                    });
                });
            });
        });

        it('errors out when there are spaces in id', done => {
            countMessages(nBefore => {
                request.get(base + '/flag?id=' + encodeURIComponent('57e 980 5322 7c  c4')).end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 400 && nBefore === nAfter) done();
                    });
                });
            });
        });

        it("errors out id isn't an object id", done => {
            countMessages(nBefore => {
                request.get(base + '/flag?id=' + encodeURIComponent('abc72')).end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 400 && nBefore === nAfter) done();
                    });
                });
            });
        });

    });

    describe('/getall', () => {

        it('gets all messages', done => {
            countMessages(nBefore => {
                request.get(base + '/getall').end((err, res) => {
                    if (err) {
                        throw err;
                    } else {
                        countMessages(nAfter => {
                            if (res.status === 200 && nBefore === nAfter) done();
                        });
                    }
                });
            });
        });

    });

    describe('use of wrong method', () => {

        it('/save with POST', done => {
            countMessages(nBefore => {
                request.post(base + '/save?message=' + 'hello').end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 405 && nBefore === nAfter) done();
                    });
                });
            });
        });

        it('/flag with PUT', done => {
            flagOccurrences(nOccBefore => {
                request.put(base + '/flag?id=' + '57ee57b994829c2298f6956b').end((err, res) => {
                    flagOccurrences(nOccAfter => {
                        if (res.status === 405 && equals(nOccBefore, nOccAfter)) done();
                    });
                });
            });
        });

        it('/getall with DELETE', done => {
            countMessages(nBefore => {
                request.delete(base + '/getall').end((err, res) => {
                    countMessages(nAfter => {
                        if (res.status === 405 && nBefore === nAfter) done();
                    });
                });
            });
        });

    });

});
