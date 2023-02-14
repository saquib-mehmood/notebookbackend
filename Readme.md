install express

npm install express

install nodemon as a dev dependency
nodemon will watch the files in the directory in which nodemon was started, and if any files change, nodemon will automatically restart your node application, i.e. You don't have to restart the server if the changes are made in any file on the directory. Although, browser will still need to be refreshed.

npm install --save-dev nodemon

We can start our application with nodemon like this:

node_modules/.bin/nodemon index.js

However, we can write a script to simplify the above command to run our app with nodemon:

In package.json, add to scripts following:
"dev": "nodemon index.js"

We can now start the server in development mode with the command:

npm run dev

At this point our app looks as under (with notes hard-coded in the index.js file)

const express = require('express');
const app = express();

let notes = [
{
id: 1,
content: "HTML is easy",
important: true
},
{
id: 2,
content: "Browser can execute only JavaScript",
important: false
},
{
id: 3,
content: "GET and POST are the most important methods of HTTP protocol",
important: true
}
]

app.get('/', (req, res) => {
res.send('<h1>Hello World</h1>');
})

app.get('/api/notes', (req, res) => {
res.json(notes);
})

const PORT = 8080;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});

### Defining Parameters for Routes and Fetching a Single Resource

We will expand our application so that it offers a REST interface for operating on individual notes. First, we will create a route for fetching a single resource.

The unique address we will use for an individual note is of the form notes/10, where the number at the end refers to the note's unique id number.

We can define parameters for routes in express by using the colon syntax:

app.get('/api/notes/:id', (request, response) => {
const id = request.params.id
const note = notes.find(note => note.id === id)
response.json(note)
})

Now app.get('/api/notes/:id', ...)will handle all HTTP GET requests that are of the form /api/notes/SOMETHING, where SOMETHING is an arbitrary string.

The id parameter in the route of a request can be accessed through the request object:

const id = request.params.id

We use find method of arrays to find the note with an id that matches the parameter. The note is then returned to the sender of the request.

But if we test our application by going to http://localhost:3001/api/notes/1 in our browser, we notice that it does not appear to work, as the browser displays an empty page. So, we will add some console.log commands to debug.

app.get('/api/notes/:id', (req, res) => {
const id = req.params.id;
const note = notes.find(note => {console.log(note.id, typeof note.id, id, typeof id, note.id === id)
return note.id === id
})
console.log(note);
res.json(note);
})

From the console we get following results:
1 number 1 string false
2 number 1 string false
3 number 1 string false
undefined

So, now it is clear that the id parameter is a string whereas note.id is a number, therefore note.id===id does not work. Also the note being returned with the id param is undefined.

We fix it by changing the string into a number:

const id = Number(request.params.id)

This time it works and the note is fetched on url:
http://localhost:3001/api/notes/1

The console gives following response:
[nodemon] starting `node index.js`
Server running on port 8080
1 number 1 number true
{ id: 1, content: 'HTML is easy', important: true }

The issue of fetching individual resource is fixed, however, there is still one problem. If we search for a note with an id that does not exist, the server responds with:
Status Code: 200, OK
Content Length: 0

The HTTP status code that is returned is 200, which means that the response succeeded. There is no data sent back with the response, since the value of the content-length header is 0, and the same can be verified from the browser.

The reason for this behavior is that the note variable is set to undefined if no matching note is found. The situation needs to be handled on the server in a better way. If no note is found, the server should respond with the status code 404 not found instead of 200.

So, we fix this issue by changing the app as follows:

if (note) {
response.json(note)
} else {
response.status(404).end()
}
})

The if-condition leverages the fact that all JavaScript objects are truthy, meaning that they evaluate to true in a comparison operation. However, undefined is falsy meaning that it will evaluate to false.

### Deleting Resources

We will implement a route for deleting resources. Deletion happens by making an HTTP DELETE request to the URL of the resource.

app.delete('/api/notes/:id', (req, res) => {
const id = Number(req.params.id);
notes = notes.filter(note => note.id !== id)
res.status(204).end();
})

Test deletion using Postman.

### Receiving Data

We will now make it possible to add new notes to the server. Adding a note happens by making an HTTP POST request to the address http://localhost:3001/api/notes, and by sending all the information for the new note in the request body in JSON format.

To access the data easily, we need the help of the express json-parser that is taken to use with command app.use(express.json()).

We activate the json-parser and implement an initial handler for dealing with the HTTP POST requests:

const express = require('express')
const app = express()

app.use(express.json())

//...

app.post('/api/notes', (request, response) => {
const note = request.body
console.log(note)
response.json(note)
})

The event handler function can access the data from the body property of the request object.

Without the json-parser, the body property would be undefined. The json-parser functions so that it takes the JSON data of a request, transforms it into a JavaScript object and then attaches it to the body property of the request object before the route handler is called.

For the time being, the application does not do anything with the received data besides printing it to the console and sending it back in the response.

We will verify with Postman that the data is in fact received by the server. In addition to defining the URL and request type in Postman, we also have to define the data sent in the body.

After testing the functionality of the app, we now have to ensure a unique id for the posted note.

First, we find out the largest id number in the current list and assign it to the maxId variable. The id of the new note is then defined as maxId + 1. We will write a generateId function for it.

const generateId = () => {
const maxId = notes.length > 0
? Math.max(...notes.map(n => n.id))
: 0
return maxId + 1
}

Above, Math.max returns the maximum value of the numbers that are passed to it. However, notes.map(n => n.id) is an array so it can't directly be given as a parameter to Math.max. The array can be transformed into individual numbers by using the "three dot" spread syntax ...

We also have the problem that the HTTP POST request can be used to add objects with arbitrary properties. So, we will improve the application by defining that the content property may not be empty. The important property will be given default value false. All other properties are discarded.

app.post('/api/notes', (request, response) => {
const body = request.body

if (!body.content) {
return response.status(400).json({
error: 'content missing'
})
}

const note = {
content: body.content,
important: body.important || false,
date: new Date(),
id: generateId(),
}

notes = notes.concat(note)

response.json(note)
})

If the received data is missing a value for the content property, the server will respond to the request with the status code 400 bad request.

if (!body.content) {
return response.status(400).json({
error: 'content missing'
})
}

Notice that calling return is crucial because otherwise the code will execute to the very end and the malformed note gets saved to the application.

If the content property has a value, the note will be based on the received data. If the important property is missing, we will default the value to false. If the data saved in the body variable has the important property, the expression will evaluate to its value. If the property does not exist, then the expression will evaluate to false which is defined on the right-hand side of the vertical lines.

important: body.important || false,

Now test with Postman. A POST request with content and important should be concatanated to the array notes with id one more than the max id plus the date property which is automatically assigned.

[{"id":1,"content":"HTML is easy","important":true},{"id":2,"content":"Browser can execute only JavaScript","important":false},{"id":3,"content":"GET and POST are the most important methods of HTTP protocol","important":true},{"content":"Testing with Postman is a very good idea","important":true,"date":"2023-02-10T09:18:25.871Z","id":4}]

An empty request should return:
{"error":"content missing"}

### Middleware

The express json-parser we took into use earlier is a so-called middleware.

Middleware are functions that can be used for handling request and response objects.

The json-parser we used earlier takes the raw data from the requests that are stored in the request object, parses it into a JavaScript object and assigns it to the request object as a new property body.

In practice, we can use several middlewares at the same time. When you have more than one, they're executed one by one in the order that they were taken into use in express.

We will implement our own middleware that prints information about every request that is sent to the server.

Middleware is a function that receives three parameters:

const requestLogger = (request, response, next) => {
console.log('Method:', request.method)
console.log('Path: ', request.path)
console.log('Body: ', request.body)
console.log('---')
next()
}

At the end of the function body, the next function that was passed as a parameter is called. The next function yields control to the next middleware.

Middleware is taken into use like this:

app.use(requestLogger)

Middleware functions are called in the order that they're taken into use with the express server object's use method. Notice that json-parser is taken into use before the requestLogger middleware, because otherwise request.body will not be initialized when the logger is executed!

Middleware functions have to be taken into use before routes if we want them to be executed before the route event handlers are called. There are also situations where we want to define middleware functions after routes. In practice, this means that we are defining middleware functions that are only called if no route handles the HTTP request.

We will add the following middleware after our routes. This middleware will be used for catching requests made to non-existent routes. For these requests, the middleware will return an error message in the JSON format.

Test with Postman.
GET http://localhost:8080/yes

=> 404 Not found
{"error":"unknown endpoint"}

## Deploying Application to the Internet

### Install and Deploy CORS

In order to enable legitimate cross-origin requests (requests to URLs that don't share the same origin) we us a mechanism called CORS(Cross-Origin Resource Sharing).

By default, the JavaScript code of an application that runs in a browser can only communicate with a server in the same origin. Because our server is in localhost port 8080, while our frontend is in localhost port 3000, they do not have the same origin.

We can allow requests from other origins by using Node's cors middleware.

In your backend repository, install cors with the command:

npm install cors

take the middleware to use and allow for requests from all origins:

const cors = require('cors')

app.use(cors())

Aftet this the front-end will be connected to the backend. The react app running in the browser now fetches the data from node/express-server that runs in localhost:8080. But because there is yet not a database connected to the app, the POST and PUT requests cannot be implemented yet.

### Deploying to the Internet

We will consider two services Fly.io and Render that both have a (limited) free plan. There are also some other free options hosting options that work well like Railway, Cyclic, Replit and Code Sandbox.
we need to change the definition of the port our application uses at the bottom of the index.js file like so:

const PORT = process.env.PORT || 8080

Now we are using the port defined in the environment variable PORT or port 8080 if the environment variable PORT is undefined. Fly.io and Render configure the application port based on that environment variable.

Presently, we will deploy the app to Render.

sign in is to be made with a GitHub account.

After signing in, we create a new "web service".

Push the backend code to github and connect the repo to render.

The connecting seem to require that the app reopository is public.

Next we will define the basic configurations. If the app is not at the root of the repository the Root directory needs to be given a proper value. After this, the app starts up in the Render. The dashboard tells us the app state and the url where the app is running.

Every commit to GitHub should redeploy the app. It is also possible to manually redeploy the app. Also the app logs can be seen in the dashboard. We notice now from the logs that the app has been started in the port 10000. The app code gets the right port through the environment variable PORT so it is essential that the file index.js has been updated as such.

### Frontend Production Build

So far we have been running React code in development mode. In development mode the application is configured to give clear error messages, immediately render code changes to the browser, and so on.

When the application is deployed, we must create a production build or a version of the application which is optimized for production.

A production build of applications created with create-react-app can be created with the command:
npm run build

This creates a directory called build (which contains the only HTML file of our application, index.html ) which contains the directory static. Minified version of our application's JavaScript code will be generated in the static directory. Even though the application code is in multiple files, all of the JavaScript will be minified into one file. All of the code from all of the application's dependencies will also be minified into this single file.

### Serving Static Files from the Backend

One option for deploying the frontend is to copy the production build (the build directory) to the root of the backend repository and configure the backend to show the frontend's main page (the file build/index.html) as its main page.

We begin by copying the production build of the frontend to the root of the backend. With a Mac or Linux computer, the copying can be done from the frontend directory with the command:

cp -r build ../notebookbackend

whenever express gets an HTTP GET request it will first check if the build directory contains a file corresponding to the request's address. If a correct file is found, express will return it.

Now HTTP GET requests to the address www.serversaddress.com/index.html or www.serversaddress.com will show the React frontend. GET requests to the address www.serversaddress.com/api/notes will be handled by the backend's code.

Because of our situation, both the frontend and the backend are at the same address, we can declare baseUrl as a relative URL. This means we can leave out the part declaring the server.

In the services/notes.js file change the following:

const baseUrl = '/api/notes'

After the change, we have to create a new production build and copy it to the root of the backend repository.

The application can now be used from the backend address http://localhost:8080:

When we use a browser to go to the address http://localhost:3001, the server returns the index.html file from the build repository.

The file contains instructions to fetch a CSS stylesheet defining the styles of the application, and two script tags that instruct the browser to fetch the JavaScript code of the application - the actual React application.

The React code fetches notes from the server address http://localhost:8080/api/notes and renders them to the screen. The communications between the server and the browser can be seen in the Network tab of the developer console.

Unlike when running the app in a development environment, everything is now in the same node/express-backend that runs in localhost:8080. When the browser goes to the page, the file index.html is rendered. That causes the browser to fetch the product version of the React app. Once it starts to run, it fetches the json-data from the address localhost:8080/api/notes.

### Deploying Complete App

After ensuring that the production version of the application works locally, commit the production build of the frontend to the backend repository, and push the code to GitHub again.

If you are using Render a push to GitHub might be enough. If the automatic deployment does not work, select the "manual deploy" from the Render dashboard.

### Streamlining Frontend

To create a new production build of the frontend without extra manual work, we will add some npm-scripts to the package.json of the backend repository.

In case of render add following scripts:

{
"scripts": {
//...
"build:ui": "rm -rf build && cd ../reactnotebook && npm run build && cp -r build ../notebookbackend",
"deploy:full": "npm run build:ui && git add . && git commit -m uibuild && git push"
}
}

The script npm run build:ui builds the frontend and copies the production version under the backend repository. npm run deploy:full contains also the necessary git commands to update the backend repository.

NB On Windows, npm scripts are executed in cmd.exe as the default shell which does not support bash commands. For the above bash commands to work, you can change the default shell to Bash (in the default Git for Windows installation) as follows:

npm config set script-shell "C:\\Program Files\\Git\\bin\\bash.exe"

Another option is the use of shx.

### Proxy

Changes on the frontend have caused it to no longer work in development mode (when started with command npm start), as the connection to the backend does not work.

This is due to changing the backend address to a relative URL:

const baseUrl = '/api/notes'

Because in development mode the frontend is at the address localhost:3000, the requests to the backend go to the wrong address localhost:3000/api/notes. The backend is at localhost:8080.

If the project was created with create-react-app, this problem is easy to solve. It is enough to add the following declaration to the package.json file of the frontend repository.

"scripts": {
// ...
},
"proxy": "http://localhost:8080"
}

After a restart, the React development environment will work as a proxy. If the React code does an HTTP request to a server address at http://localhost:3000 not managed by the React application itself (i.e. when requests are not about fetching the CSS or JavaScript of the application), the request will be redirected to the server at http://localhost:3001.

Now the frontend is also fine, working with the server both in development- and production mode.

### Connecting Backend to the

To store our saved notes indefinitely, we need a database.
We will use MongoDB which is a so-called document database. The reason for using Mongo as the database is its lower complexity compared to a relational database.
We can install and run MongoDB on our computer. However, the internet is also full of Mongo database services that we can use. Our preferred MongoDB provider is MongoDB Atlas. After creating the cluster and setting IP address to "anywhere" we connect our application. The database generates a URI for connection, which we add to our applicaiton.

We will use the Mongoose library that offers a higher-level API. Mongoose could be described as an object document mapper (ODM), and saving JavaScript objects as Mongo documents is straightforward with this library.

npm install mongoose

In order to check the functionality of the database connection we will create a practice app mongo.js as follows:

const mongoose = require('mongoose');

if (process.argv.length < 3) {
console.log('give password as argument')
process.exit(1)
};

const password = process.argv[2];

const url = `mongodb+srv://saquibmehmood:${password}@cluster0.30blbfb.mongodb.net/noteApp?retryWrites=true&w=majority`

mongoose.set('strictQuery', false);
mongoose.connect(url);

const noteSchema = new mongoose.Schema ({
content: String,
important: Boolean,
date: { type: Date, default: Date.now },
});

const Note = mongoose.model('Note', noteSchema);

const note = new Note({
content: 'Mongoose makes life much easier',
important: true,
});

note.save().then(result => {
console.log('note saved!')
mongoose.connection.close()
})

// Note.find({}).then(result => {
// result.forEach(note => {
// console.log(note)
// })
// mongoose.connection.close()
// })

The code also assumes that it will be passed the password from the credentials we created in MongoDB Atlas, as a command line parameter. We can access the command line parameter like this:

const password = process.argv[2]

When the code is run with the command node mongo.js password, Mongo will add a new document to the database.

Following code fetches objects from the database:

Note.find({}).then(result => {
result.forEach(note => {
console.log(note)
})
mongoose.connection.close()
})

he objects are retrieved from the database with the find method of the Note model. The parameter of the method is an object expressing search conditions. Since the parameter is an empty object{}, we get all of the notes stored in the notes collection.

The search conditions adhere to the Mongo search query syntax.

We could restrict our search to only include important notes like this:

Note.find({ important: true }).then(result => {
// ...
})

We add the following code to the index.js file after setting up the database at Mongo Atlas:

const mongoose = require('mongoose')

// DO NOT SAVE YOUR PASSWORD TO GITHUB!!
const url =
`mongodb+srv://fullstack:${password}@cluster0.o1opl.mongodb.net/?retryWrites=true&w=majority`

mongoose.set('strictQuery',false)
mongoose.connect(url)

const noteSchema = new mongoose.Schema({
content: String,
important: Boolean,
})

const Note = mongoose.model('Note', noteSchema)

We also change the handler for fetching all notes to the following form:
app.get('/api/notes', (request, response) => {
Note.find({}).then(notes => {
response.json(notes)
})
})

We can verify in the browser at localhost:8080/api/notes that the backend works for displaying all of the documents:

[{"_id":"63eab2428002710665a7c413","content":"HTML is easy","important":true,"date":"2023-02-13T21:57:22.209Z","__v":0},{"_id":"63eab26c51801ecc001e25ed","content":"CSS is hard","important":true,"date":"2023-02-13T21:58:04.063Z","__v":0},{"_id":"63eab2989b898e4e306bf4a4","content":"Mongoose makes life much easier","important":true,"date":"2023-02-13T21:58:48.481Z","__v":0}]

However, there are certain problems in the output which we do not want.
The frontend assumes that every object has a unique id string in the id field, which is actually not a string but an object. We also don't want to return the mongo versioning field \_\_v to the frontend.

To format the objects returned by Mongoose we have to modify the toJSON method of the schema, which is used on all instances of the models produced with that schema.
To modify the method we need to change the configurable options of the schema, options can be changed using the set method of the schema.
see https://mongoosejs.com/docs/api.html#transform for more info on the transform function.

noteSchema.set('toJSON', {
transform: (document, returnedObject) => {
returnedObject.id = returnedObject.\_id.toString()
delete returnedObject.\_id
delete returnedObject.\_\_v
}
})

### Configure Database into its Own Module

We will create a new directory for the module called models, and add a file called note.js:

const mongoose = require('mongoose');

// Do not save your password to Github

const url = process.env.MONGODB_URI

// const url = `mongodb+srv://saquibmehmood:${'dl00457799'}@cluster0.30blbfb.mongodb.net/noteApp?retryWrites=true&w=majority`
mongoose.set("strictQuery", false);
mongoose.connect(url)
.then(result => {
console.log("connected to MongoDB")
})
.catch((error) => {
console.log("error connecting to MongoDB: ", error.message)
})

const noteSchema = new mongoose.Schema ({
content: String,
important: Boolean,
date: { type: Date, default: new Date()},
});

// format \_id and **v properties of returned object
noteSchema.set('toJSON', {
transform: (document, returnedObject) => {
returnedObject.id = returnedObject.\_id.toString()
delete returnedObject.\_id
delete returnedObject.**v
}
})

module.exports = mongoose.model('Note', noteSchema);

The public interface of the module is defined by setting a value to the module.exports variable. We will set the value to be the Note model. The other things defined inside of the module, like the variables mongoose and url will not be accessible or visible to users of the module.

Importing the module happens by adding the following line to index.js:
const Note = require('./models/note')

This way the Note variable will be assigned to the same object that the module defines.

It's not a good idea to hardcode the address of the database into the code, so instead the address of the database is passed to the application via the MONGODB_URI environment variable.

The method for establishing the connection is now given functions for dealing with a successful and unsuccessful connection attempt. Both functions just log a message to the console about the success status.

There are many ways to define the value of an environment variable. One way would be to define it when the application is started:

MONGODB_URI=address_here npm run dev

However, we will use the dotenv library. You can install the library with the command:

npm install dotenv;

To use the library, we create a .env file at the root of the project. The environment variables are defined inside of the file, and it can look like this:

MONGODB_URI=mongodb+srv://fullstack:<password>@cluster0.o1opl.mongodb.net/noteApp?retryWrites=true&w=majority
PORT=8080

The .env file should be gitignored right away since we do not want to publish any confidential information publicly online!

The environment variables defined in the .env file can be taken into use with the expression require('dotenv').config() and you can reference them in your code just like you would reference normal environment variables, with the familiar process.env.MONGODB_URI syntax.

Let's change the index.js file in the following way:

require('dotenv').config()
const express = require('express')
const app = express()
const Note = require('./models/note')

// ..

const PORT = process.env.PORT
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`)
})

It's important that dotenv gets imported before the note model is imported. This ensures that the environment variables from the .env file are available globally before the code from the other modules is imported.

When using Render, the database url is given by defining the proper env in the dashboard.

### Using Database in Route Handlers

change the rest of the backend functionality to use the database.

Creating a new note is accomplished like this:

app.post('/api/notes', (request, response) => {
const body = request.body

if (body.content === undefined) {
return response.status(400).json({ error: 'content missing' })
}

const note = new Note({
content: body.content,
important: body.important || false,
})

note.save().then(savedNote => {
response.json(savedNote)
})
})

The note objects are created with the Note constructor function. The response is sent inside of the callback function for the save operation. This ensures that the response is sent only if the operation succeeded.

const note = new Note({
content: body.content,
important: body.important || false,
})

note.save().then(savedNote => {
response.json(savedNote)
})
})

The savedNote parameter in the callback function is the saved and newly created note. The data sent back in the response is the formatted version created automatically with the toJSON method:

response.json(savedNote)

Using Mongoose's findById method, fetching an individual note gets changed into the following:

### Deleting a Note

The easiest way to delete a note from the database is with the findByIdAndRemove method:

app.delete('/api/notes/:id', (request, response, next) => {
Note.findByIdAndRemove(request.params.id)
.then(result => {
response.status(204).end()
})
.catch(error => next(error))
})

In both of the "successful" cases of deleting a resource, the backend responds with the status code 204 no content. The two different cases are deleting a note that exists, and deleting a note that does not exist in the database. The result callback parameter could be used for checking if a resource was actually deleted, and we could use that information for returning different status codes for the two cases if we deemed it necessary. Any exception that occurs is passed onto the error handler.

### Toggling Importance of a Note

The toggling of the importance of a note can be easily accomplished with the findByIdAndUpdate method.

app.put('/api/notes/:id', (request, response, next) => {
const body = request.body

const note = {
content: body.content,
important: body.important,
}

Note.findByIdAndUpdate(request.params.id, note, { new: true })
.then(updatedNote => {
response.json(updatedNote)
})
.catch(error => next(error))
})

n the code above, we also allow the content of the note to be edited.

Notice that the findByIdAndUpdate method receives a regular JavaScript object as its parameter, and not a new note object created with the Note constructor function.

There is one important detail regarding the use of the findByIdAndUpdate method. By default, the updatedNote parameter of the event handler receives the original document without the modifications. We added the optional { new: true }parameter, which will cause our event handler to be called with the new modified document instead of the original.

After testing the backend directly with Postman and the VS Code REST client, we can verify that it seems to work. The frontend also appears to work with the backend using the database.

### Error Handling

If no matching object is found in the database, the value of note will be null and the else block is executed. This results in a response with the status code 404 not found. If a promise returned by the findById method is rejected, the response will have the status code 500 internal server error. The console displays more detailed information about the error.

On top of the non-existing note, there's one more error situation that needs to be handled. In this situation, we are trying to fetch a note with the wrong kind of id, meaning an id that doesn't match the mongo identifier format.

If we make the following request, we will get the error message shown below:

Method: GET
Path: /api/notes/someInvalidId
Body: {}

---

{ CastError: Cast to ObjectId failed for value "someInvalidId" at path "\_id"
at CastError (/Users/mluukkai/opetus/\_fullstack/osa3-muisiinpanot/node_modules/mongoose/lib/error/cast.js:27:11)
at ObjectId.cast (/Users/mluukkai/opetus/\_fullstack/osa3-muisiinpanot/node_modules/mongoose/lib/schema/objectid.js:158:13)
...

Given a malformed id as an argument, the findById method will throw an error causing the returned promise to be rejected. This will cause the callback function defined in the catch block to be called.

Let's make some small adjustments to the response in the catch block:
app.get('/api/notes/:id', (request, response) => {
Note.findById(request.params.id)
.then(note => {
if (note) {
response.json(note)
} else {
response.status(404).end()
}
})
.catch(error => {
console.log(error)
response.status(400).send({ error: 'malformatted id' })
})
})

### Moving Error Handling into Middleware

We have written the code for the error handler among the rest of our code. This can be a reasonable solution at times, but there are cases where it is better to implement all error handling in a single place. This can be particularly useful if we want to report data related to errors to an external error-tracking system like Sentry.

Let's change the handler for the /api/notes/:id route so that it passes the error forward with the next function. The next function is passed to the handler as the third parameter:

app.get('/api/notes/:id', (request, response, next) => {
Note.findById(request.params.id)
.then(note => {
if (note) {
response.json(note)
} else {
response.status(404).end()
}
})
.catch(error => next(error))
})

The error that is passed forwards is given to the next function as a parameter. If next was called without a parameter, then the execution would simply move onto the next route or middleware. If the next function is called with a parameter, then the execution will continue to the error handler middleware.

Express error handlers are middleware that are defined with a function that accepts four parameters. Our error handler looks like this:

const errorHandler = (error, request, response, next) => {
console.error(error.message)

if (error.name === 'CastError') {
return response.status(400).send({ error: 'malformatted id' })
}

next(error)
}

// this has to be the last loaded middleware.
app.use(errorHandler)

The error handler checks if the error is a CastError exception, in which case we know that the error was caused by an invalid object id for Mongo. In this situation, the error handler will send a response to the browser with the response object passed as a parameter. In all other error situations, the middleware passes the error forward to the default Express error handler.

Note that the error-handling middleware has to be the last loaded middleware!

### Order of Middleware Loading

The execution order of middleware is the same as the order that they are loaded into express with the app.use function. For this reason, it is important to be careful when defining middleware.

The correct order is the following:

````app.use(express.static('build'))
app.use(express.json())
app.use(requestLogger)

app.post('/api/notes', (request, response) => {
  const body = request.body
  // ...
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

// handler of requests with unknown endpoint
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  // ...
}

// handler of requests with result to errors
app.use(errorHandler) ```
````

## Validation and ESLint
There are usually constraints that we want to apply to the data that is stored in our application's database. Our application shouldn't accept notes that have a missing or empty content property. The validity of the note is checked in the route handler:

app.post('/api/notes', (request, response) => {
  const body = request.body
  if (body.content === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  // ...
})

If the note does not have the content property, we respond to the request with the status code 400 bad request.

One smarter way of validating the format of the data before it is stored in the database is to use the validation functionality available in Mongoose.

We can define specific validation rules for each field in the schema:

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    minLength: 5,
    required: true
  },
  important: Boolean,
  date: { type: Date, default: new Date()},
})

The minLength and required validators are built-in and provided by Mongoose. The Mongoose custom validator functionality allows us to create new validators if none of the built-in ones cover our needs.