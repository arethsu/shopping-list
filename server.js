
var express = require('express');
var path = require('path');

var client = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/lab';

var app = express();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.static('public'));

app.use((req, res, next) => {
    var paths = ['/save', '/flag', '/getall'];

    if (paths.indexOf(req.path) > -1 && req.method !== 'GET') {
        res.set('Allow', 'GET');
        res.sendStatus(405);
    }

    next();
});

app.use((err, req, res, next) => {
    console.error(err.message);
    console.error(err.stack);

    res.sendStatus(500);
});


//
// Get and respond to routes.
//

var getCollection = (name, func_ret) => client.connect(url, (err, db) => {
    if (err) throw err; else {
        db.collection(name, (err, collection) => {
            if (err) throw err; else func_ret(collection);
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/save', (req, res) => {
    var message = req.query.message;

    if (message == null || message.length === 0 || message.length > 140) {
        res.sendStatus(400);
    } else {
        getCollection('messages', collection => {
            collection.insertOne({ message: message, read: false }, (err, result) => {
                if (err) {
                    throw err;
                } else {
                    res.status(200).send(result.insertedId);
                }
            });
        });
    }
});

app.get('/flag', (req, res) => {
    var id = req.query.id;

    try {
        if (ObjectId.isValid(id) == false) id = null;
    } catch (err) {
        id = null;
    }

    // gör sträng till objectid och kolla om det är ett vald id via det
    if (id == null || id.indexOf(' ') > -1) {
        res.sendStatus(400);
    } else {
        getCollection('messages', collection => {
            collection.findOne({ _id: ObjectId(id) }, (err, doc) => {
                if (err) {
                    throw err;
                } else {
                    collection.update({ _id: ObjectId(id) }, { $set: { read: !doc.read } }, (err, nUpdates) => {
                        if (err) {
                            throw err;
                        } else if (nUpdates === 0) {
                            res.sendStatus(400);
                        } else {
                            res.sendStatus(200);
                        }
                    });
                }
            });
        });
    }
});

app.get('/getall', (req, res) => {
    res.set('Content-Type', 'application/json');

    getCollection('messages', collection => {
        collection.find().toArray((err, docs) => {
            if (err) {
                throw err;
            } else {
                res.status(200).send(docs);
            }
        });
    });
});


//
// Start the server.
//

app.listen(8000);
