const express = require('express');
//const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require("cors");
var corsOptions = {
  origin: "http://localhost:4200"
};

// Use MongoDB
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
// The database variable
var database;

// The sentences collection
var SENTENCES_COLLECTION = "sentences";
var USER_COLLECTION = "users";

// Create new instance of the express server
const app = express();

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
var distDir = __dirname + "/dist/";
app.use(express.static(distDir));

//const db = mongoose.connect('mongodb://localhost/sentenceAPI');
const LOCAL_DATABASE = "mongodb://localhost:27017/sentenceAPI";
// Local port.
const LOCAL_PORT = 8989;
const sentenceRouter = express.Router();
const port = process.env.PORT || 3200;

//sentence model
const Sentence = require('./models/sentenceModel');

// Init the server
mongodb.MongoClient.connect(process.env.MONGODB_URI || LOCAL_DATABASE,
  {
    useUnifiedTopology: true,
    useNewUrlParser: true,
  }, function (error, client) {

    // Check if there are any problems with the connection to MongoDB database.
    if (error) {
      console.log(error);
      process.exit(1);
    }

    // Save database object from the callback for reuse.
    database = client.db();
    console.log("Database connection done.");

    // Initialize the app.
    var server = app.listen(process.env.PORT || LOCAL_PORT, function () {
      var port = server.address().port;
      console.log("App now running on port", port);
    });
  });

// @route   GET /api/sentences/
// @desc    Get all sentences
// @access  Public
/*sentenceRouter.get('/sentences', async (req, res) => {
  try {
    const sentences = await Sentence.find({});
    res.send({ sentences })
  } catch (err) {
    res.status(400).send({ error: err });
  }
});*/
sentenceRouter.get("/sentences", function (req, res) {
  database.collection(SENTENCES_COLLECTION).find({}).toArray(function (error, data) {
    if (error) {
      manageError(res, err.message, "Failed to get sentences.");
    } else {
      res.status(200).json(data);
    }
  });
});

sentenceRouter.get('/sentences/user/:createdBy', function (req, res) {
  console.log("Body:"+req.params.createdBy);
  database.collection(SENTENCES_COLLECTION).find({ createdBy: req.params.createdBy }).toArray(function (error, data) {
    if (error) {
      manageError(res, err.message, "Failed to get sentences.");
    } else {
      res.status(200).json(data);
    }
  });
});

// @route   GET /api/sentences/:id
// @desc    Get a specific sentence
// @access  Public
sentenceRouter.get('/sentences/:id', function (req, res) {
  database.collection(SENTENCES_COLLECTION).find({ _id: new ObjectID(req.params.id) }).toArray(function (error, data) {
    if (error) {
      manageError(res, err.message, "Failed to get sentences.");
    } else {
      res.status(200).json(data);
    }
  });
});

sentenceRouter.post("/sentences", function (req, res) {
  console.log(req.body);
  var product = req.body;

  if (!product.sentence) {
    manageError(res, "Invalid sentence input", "Sentence is mandatory.", 400);
  } else {
    database.collection(SENTENCES_COLLECTION).insertOne(product, function (err, doc) {
      if (err) {
        manageError(res, err.message, "Failed to create new product.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
  }
});

sentenceRouter.post("/users", function (req, res) {
  console.log(req.body);
  var user = req.body;

  if (!user.name) {
    manageError(res, "Invalid product input", "Your name is mandatory.", 400);
  } else if (!user.password) {
    manageError(res, "Invalid product input", "Password is mandatory.", 400);
  } else if (!user.email) {
    manageError(res, "Invalid product input", "Your Email is mandatory.", 400);
  } else {
    database.collection(USER_COLLECTION).insertOne(user, function (err, doc) {
      if (err) {
        manageError(res, err.message, "Failed to create new user.");
      } else {
        res.status(201).json(doc.ops[0]);
      }
    });
  }
});

sentenceRouter.get('/user/:email', function (req, res) {
  console.log(req.params);
  database.collection(USER_COLLECTION).find({ email: req.params.email }).toArray(function (error, data) {
    if (error) {
      manageError(res, err.message, "Failed to get user.");
    } else {
      res.status(200).json(data);
    }
  });
});

// @route   PUT /api/sentences/:id
// @desc    Update a sentence
// @access  Public
sentenceRouter.put('/sentences/:id', async (req, res) => {
  try {
    const updatedSentence = await Sentence.findByIdAndUpdate(req.params.id, req.body);
    res.send({ message: 'The Sentence was updated' });
  } catch (err) {
    res.status(400).send({ error: err });
  }
});

// @route   DELETE /api/sentences/:id
// @desc    Delete a sentence
// @access  Public
/*sentenceRouter.delete('/sentences/:id', async (req, res) => {
  try {
    const removeSentence = await Sentence.findByIdAndRemove(req.params.id);
    res.send({ message: 'The Sentence was removed' });
  } catch (err) {
    res.status(400).send({ error: err });
  }
});*/

sentenceRouter.delete("/sentences/:id", function (req, res) {
  if (req.params.id.length > 24 || req.params.id.length < 24) {
    manageError(res, "Invalid sentence id", "ID must be a single String of 12 bytes or a string of 24 hex characters.", 400);
  } else {
    database.collection(SENTENCES_COLLECTION).deleteOne({ _id: new ObjectID(req.params.id) }, function (err, result) {
      if (err) {
        manageError(res, err.message, "Failed to delete sentence.");
      } else {
        res.status(200).json(req.params.id);
      }
    });
  }
});

// Errors handler.
function manageError(res, reason, message, code) {
  console.log("Error: " + reason);
  res.status(code || 500).json({ "error": message });
}

app.use('/api', sentenceRouter);


app.listen(port, () => {
  console.log(`connected to the server ${port}`);

});
