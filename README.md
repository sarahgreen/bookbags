# BooksBags

Final Group Project
User Interface Design (COMS W4170)
Columbia University

## Group Members

* Lauren Zou 
* Kristie Howard 
* Sarah Green 
* Tom Segarra 

## Development

### Tools

In order to maintain a readable and consistent CSS structure, we are using [LESS](http://lesscss.org/), which allows us to use variables and mixins. We are also using [Autoprefixer](https://github.com/postcss/autoprefixer) to help with cross-browser compatibility. Our development process uses [NodeJS](http://nodejs.org/) to compile our LESS into CSS and prefix the CSS using Autoprefixer. The node packages that we're using are:

* autoprefixer-core
* less
* node-watch
* q

The node-watch package is used for listening for changes in LESS files, and the q package is used for defers in the compile.js code.

We're using Moment.js for easily creating timestamps for the Amazon API. We're using sha2.js to encode the signature.

We're using [Clamp.js](https://github.com/josephschmitt/Clamp.js/) for truncated multiple lines of text.

### Installation

* Install [NodeJS](http://nodejs.org/) if it is not already installed
* Install all the required packages (only need to be done once):
  `npm install q node-watch less autoprefixer-core`
* Run the compile.js in order to start listening for changes in the LESS files:
  `node compile.js`