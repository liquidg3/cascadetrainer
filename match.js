#!/usr/bin/env node


var cv      = require('../lib/opencv'),
    prompt  = require('prompt'),
    path    = require('path');


prompt.start();

prompt.get(['image', 'cascade'], function(err, result) {

    cv.readImage(result.image, function (err,img) {

        if(err) {
            throw new Error(err);
        }

        img.detectObject(result.cascade, {}, function (err, matches) {

            for(var k = 0; k < matches.length; k++) {

                var match = matches[k];
                img.rectangle([match.x, match.y], [match.x + match.width, match.y + match.height], [0, 255, 0], 2);
            }

            img.save(path.basename(result.image) + '/match.png');

        });

    });

});