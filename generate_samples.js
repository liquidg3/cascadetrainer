#!/usr/bin/env node

/**
 * Will setup everything you need do start your haar classifier training.
 *  It needs a directory containing positive & negative images (assumed
 *  beneath this file) and then an output directory.
 */

//dependencies
var prompt  = require('prompt'),
    glob    = require('glob'),
    fs      = require('fs'),
    path    = require('path'),
    exec    = require('execSync'),
    sizeOf  = require('image-size'),
    optimist= require('optimist');

prompt.override = optimist.argv;
prompt.start();

function getUserHome() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

//local vars
var pwd = path.join(process.cwd(), '/../positives'),
    l   = console.log;

//select a tool (which are directories at this level)
var tools = fs.readdirSync(pwd),
    index,
    script = 'opencv_createsamples';


//if (!fs.existsSync(script)) {
    //l('Could not find: ' + script + '. Make sure opencv is installed.');
//}

//create negatives (file actually saved at the end)
var negativesDir    = pwd + '/../negatives',
    trainingCommand,
    index,
    negatives       = fs.readdirSync(negativesDir),
    cleanedNegatives= [];

for(index in negatives) {
    if(negatives[index][0] !== '.') {
        cleanedNegatives.push(path.join('negatives', negatives[index]));
    }
}


negatives = cleanedNegatives;


l('Welcome To The Training Setup');
l('----------------');
for (index in tools) {
    if (tools[index][0] !== '.') {
        l(index + ') ' + tools[index]);
    }
}

//lets select one
prompt.get('scandir', function (err, result) {

    var tool = tools[result.scandir],
        images = fs.readdirSync(pwd + '/' + tool),
        dest = path.join(getUserHome(), 'Desktop/training'),
        cleaned = [];

	//images
    for (index in images) {
        if (images[index][0] !== '.' && images[index].search(/\.dat/) === -1) {
            cleaned.push(images[index]);
        }
    }

    images = cleaned;

    fs.writeFileSync(pwd + '/' + tool + '/positive.dat', images.join("\n"));

    //backgrounds

var bgDir = path.join(pwd, '/../backgrounds'),
    bgs   = fs.readdirSync(bgDir),
    bgFile = path.join(pwd + '/../backgrounds.txt'),
    cleanedBgs = [];

for(index in bgs) {
	if(bgs[index][0] !== '.') {
        cleanedBgs.push(path.join('backgrounds', bgs[index]));
    }
}


fs.writeFileSync(bgFile, cleanedBgs.join("\n"));


    l('Found', images.length, 'images.');

    var trainingSchema = [
        {
            name: 'dest',
            description: 'dest: Where should I setup your training environment',
            default: dest
        },
        {
            name:'num',
            description: 'num: How many samples of each image (' + images.length + ' found) should I generate (should be more than twice negatives (' + negatives.length + ' found))?'
        },
        {
            name: 'show',
            description: 'show: visual mode. show sample window (enter to generate and go to next image. escape to generate remaining samples)'
        },
        {
            name: 'bgcolor',
            description: 'bgcolor: color to be considered transparent, 0-255'
        },
        {
            name: 'bgthresh',
            description: 'bgthresh: transparent pixels are calculated by bgcolor-bgthresh & bgcolor+bgthresh'
        },
        {
            name: 'inv',
            description: 'inv: invert samples'
        },
        {
            name: 'randinv',
            description: 'randinv: randomly invert'
        },
        {
            name: 'maxidev',
            description: 'maxidev: ??'
        },
        {
            name: 'maxxangle',
            description: 'maxxangle: maximum x rotation of samples'
        },
        {
            name: 'maxyangle',
            description: 'maxyangle: maximum y rotation of sample'
        },
        {
            name: 'maxzangle',
            description: 'maxzangle: maximum z rotation of sample'
        },
        {
            name: 'w',
            description: 'w: width of samples (make wider than rotated samples)'
        },
        {
            name: 'h',
            description: 'h: height of samples (higher than rotated samples)'
        }
    ];

    prompt.get(trainingSchema, function (err, result) {

        //store our destination for everyone
        dest = result.dest;

        var vecs = [];


        //build the sampleCommand templaset
//        var sampleCommand   = script + ' -img ' + imagePath + ' -bg ' + bgFile + ' -vec ' + vec + ' -num ' + result.num + ' -w ' + maxW + ' -h ' + maxH;
        var sampleCommand   = script + ' -bg ' + bgFile;

        for(var prop in result) {
            if(result[prop]) {
                if(result[prop] === 'true') {
                    sampleCommand += ' -' + prop;

                } else if(result[prop] !== 'false') {

                    sampleCommand += ' -' + prop + ' ' + result[prop];
                }
            }
        }


        for (index in images) {

            var image           = images[index],
                imagePath       = pwd + '/' + tool + '/' + image;
                vec             = dest + '/' + image + '.vec',
                _command         = sampleCommand;

            _command += ' -img ' + imagePath + ' -vec ' + vec;

            l('generating :', vec);
            l('running', _command);

            var commandResults = exec.run(_command);

            //error occured
            if(commandResults != 0) {
                 console.error('failed to generate', vec);
                fs.unlink(vec);
            } else {
                vecs.push(vec);
            }

        }

        //FINALLY write negatives
        var negativeDest = path.join(pwd,  '/../negatives.txt');
        fs.writeFileSync(negativeDest, negatives.join('\n'));

        //merge vecs
        l('Combining .vecs');


        var allVecs     = path.join(dest, '/all.txt'),
            allVecsDest = path.join(dest, '/all.vec');

        command = './mergevec ' + allVecs + ' ' + allVecsDest;
        fs.writeFileSync(allVecs, vecs.join('\n'));
        l(command);
        exec.run(command);

        var cascadeDestination = dest;

        trainingCommand = 'opencv_traincascade -data ' + cascadeDestination + ' -vec ' + allVecsDest + ' -bg ' + negativeDest + ' -numPos ' + (vecs.length * result.num) + ' -numNeg ' + negatives.length + ' -w ' + result.w + ' -h ' + result.h;

        l('Starting with the following command');
        l(trainingCommand);
        //exec.run(trainingCommand);

    });

});