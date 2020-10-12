# glut-js

An interpreter and simulator for GLUT written in JavaScript.

## A word of warning: Hindsight is always 20/20

This was originally written [a long time ago](https://github.com/zthomae/glut/blob/33651d06219b6b08bdf1228ced8e7328f9f01f69/glut-js/karma.conf.js#L2).
At the time, I had no professional experience, be it with JavaScript or otherwise.
It was also written without using a frontend framework.
At the time, this was because I wanted to experiment with implementing it multiple times over to learn how different frameworks worked.
However, as we can see, this didn't happen.
At the time of this writing (October 2020), I've become interested in rewriting it to meet the standards I would follow today.
This will include using a modern JavaScript dialect, modern development dependencies, and React, which is currently my frontend framework of choice.
I don't expect that the code will ever be "good" -- and I especially don't want to spend too much time digging into the handcrafted parser -- but I at least want to be relatively comfortable with the code being online and in my name.

## What is this?

This is a web app similar to the
[Brainf**k visualizer](http://fatiherikli.github.io/brainfuck-visualizer/).
It will interpret glut programs in a debugging environment, where the user
can view and change the contents of the global table, step through the code
or run with breakpoints, change the current instruction, etc.

## How do you run it?

Right now there isn't much to run. You can run the test suite by running
the command `npm test`. You can build the code using `npm run build`, and then
opening `index.html` in a web browser.

## License

This project is licensed under the MIT license.
