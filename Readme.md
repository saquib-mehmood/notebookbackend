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
